import { readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from 'parse5';
import { browserPage, assertBrowserErrors, launchBrowser, ready } from './browser.mjs';
import { cliMeasure, filesIn, isMain } from './lib.mjs';

export const gzipBytes = (body) => gzipSync(body, { level: 9 }).length;

export function inlineScripts(html) {
  const scripts = [];

  function visit(node) {
    if (node.tagName === 'script' && !node.attrs.some((attr) => attr.name === 'src')) {
      const type = node.attrs.find((attr) => attr.name === 'type')?.value ?? '';

      if (['', 'module', 'text/javascript', 'application/javascript'].includes(type)) {
        const body = node.childNodes.map((child) => child.value ?? '').join('');

        scripts.push({ bytes: Buffer.byteLength(body), gzipBytes: gzipBytes(body) });
      }
    }

    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(parse(html));

  return scripts;
}

export async function emittedSizes(app) {
  async function measure(directories) {
    const files = [];
    for (const directory of directories) {
      for (const file of await filesIn(resolve(app.dir, directory), app.excludeDirs)) {
        if (!/\.(?:[cm]?js)$/.test(file)) continue;

        const body = await readFile(file);

        files.push({
          file: relative(app.dir, file),
          bytes: body.length,
          gzipBytes: gzipBytes(body),
        });
      }
    }

    return {
      bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
      files,
    };
  }

  return { total: await measure(app.outputDirs), client: await measure(app.clientOutputDirs) };
}

export async function measureSizes(app, server, browser) {
  const routes = {};
  for (const route of app.routes) {
    const { context, page, errors } = await browserPage(browser, { intercept: true });
    const tasks = [];
    const requests = [];

    page.on('response', (response) => {
      const url = new URL(response.url());

      if (
        response.request().resourceType() === 'script' ||
        /javascript/.test(response.headers()['content-type'] ?? '') ||
        /\.m?js$/.test(url.pathname)
      ) {
        tasks.push(
          (async () => {
            if (response.status() !== 200) throw new Error(`JS HTTP ${response.status()}: ${url}`);

            const body = await response.body();

            requests.push({
              url: `${url.pathname}${url.search}`,
              bytes: body.length,
              gzipBytes: gzipBytes(body),
            });
          })().catch((error) => {
            errors.push(error.message);
          }),
        );
      }
    });
    try {
      const response = await page.goto(`${server.baseUrl}${route}`, {
        waitUntil: 'load',
        timeout: 30000,
      });

      if (response.status() !== 200) throw new Error(`HTTP ${response.status()}: ${route}`);

      await ready(page);
      await Promise.all(tasks);
      assertBrowserErrors(errors);

      if (!requests.some((item) => new RegExp(app.clientEntryPattern).test(item.url)))
        throw new Error(`Client entry pattern matched no fetched JavaScript: ${app.name} ${route}`);

      const inline = inlineScripts(await response.text());
      const externalGzipBytes = requests.reduce((sum, item) => sum + item.gzipBytes, 0);
      const inlineGzipBytes = inline.reduce((sum, item) => sum + item.gzipBytes, 0);

      routes[route] = {
        gzipBytes: externalGzipBytes + inlineGzipBytes,
        externalGzipBytes,
        inlineGzipBytes,
        externalBytes: requests.reduce((sum, item) => sum + item.bytes, 0),
        inlineBytes: inline.reduce((sum, item) => sum + item.bytes, 0),
        requests: requests.sort((a, b) => a.url.localeCompare(b.url)),
        inlineScripts: inline,
      };
    } finally {
      await context.close();
    }
  }

  return {
    routes,
    emitted: await emittedSizes(app),
    gzipLevel: 9,
    method:
      'Playwright request interception; fresh contexts; cache and service workers disabled; JS responses plus inline executable scripts; recompressed separately',
  };
}

if (isMain(import.meta.url))
  await cliMeasure(async (app, server) => {
    const browser = await launchBrowser();
    try {
      return { sizes: await measureSizes(app, server, browser) };
    } finally {
      await browser.close();
    }
  });
