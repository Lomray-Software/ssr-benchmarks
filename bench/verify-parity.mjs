import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import http from 'node:http';
import { resolve } from 'node:path';
import { parse } from 'parse5';
import { browserPage, assertBrowserErrors, launchBrowser, ready } from './browser.mjs';
import {
  appConfig,
  build,
  frameworks,
  isMain,
  options,
  readJson,
  root,
  start,
  userAgent,
} from './lib.mjs';

const appSelector = '#benchmark-app';
const normalize = (text) => text.replace(/\s+/g, ' ').trim();

export async function expectedText(route) {
  const nav = 'Home Items ';

  if (route === '/')
    return `${nav}SSR benchmark A small React application with server-rendered data. Count: 0`;

  if (route === '/items') {
    const items = await readJson(resolve(root, 'data/items.json'));

    return `${nav}Items 50 items, loaded on the server. ${items.map((item) => item.name).join(' ')}`;
  }

  return `${nav}Item 01 Available immediately. Details for item 01.`;
}
const attr = (node, name) => node.attrs?.find((entry) => entry.name === name)?.value;

export function serverText(html) {
  const document = parse(html);
  let shell;
  const deferred = [];

  function find(node) {
    if (attr(node, 'id') === 'benchmark-app') shell = node;

    if (attr(node, 'data-bench-deferred') !== undefined) deferred.push(node);

    for (const child of node.childNodes ?? []) find(child);
  }

  function text(node) {
    if (
      ['script', 'style', 'template'].includes(node.tagName) ||
      attr(node, 'data-bench-pending') !== undefined ||
      attr(node, 'data-bench-deferred') !== undefined
    )
      return '';

    if (node.nodeName === '#text') return node.value;

    const content = (node.childNodes ?? []).map(text).join('');

    return ['a', 'p', 'h1', 'li', 'button', 'nav', 'section', 'article'].includes(node.tagName)
      ? `${content} `
      : content;
  }
  find(document);
  assert.ok(shell, 'Missing #benchmark-app');
  assert.ok(deferred.length <= 1, 'Duplicate deferred field');

  // Server-only mode reads completed SSR fragments, including React's staging divs.
  // It does not claim to validate browser insertion, visibility, or hydration.
  return normalize(
    text(shell) + deferred.map((node) => node.childNodes.map(text).join('')).join(' '),
  );
}

export async function httpParity(app, server) {
  const output = {};
  for (const route of app.routes) {
    const started = performance.now();
    const data = await new Promise((resolvePromise, reject) => {
      let html = '';
      let immediateMs = null;
      let deferredMs = null;
      const req = http.get(
        `${server.baseUrl}${route}`,
        { headers: { 'user-agent': userAgent, 'accept-encoding': 'identity' } },
        (res) => {
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            html += chunk;

            if (immediateMs === null && /<p data-bench-immediate=""/.test(html))
              immediateMs = performance.now() - started;

            if (deferredMs === null && /<p data-bench-deferred=""/.test(html))
              deferredMs = performance.now() - started;
          });
          res.once('error', reject);
          res.once('end', () =>
            resolvePromise({
              html,
              status: res.statusCode,
              fullMs: performance.now() - started,
              immediateMs,
              deferredMs,
            }),
          );
        },
      );

      req.setTimeout(10000, () => req.destroy(new Error('Parity request timed out')));
      req.once('error', reject);
    });

    assert.equal(data.status, 200, `${app.name} ${route}: expected HTTP 200`);
    const actual = serverText(data.html);

    assert.equal(
      actual,
      await expectedText(route),
      `${app.name} ${route}: server text differs from SPEC`,
    );

    if (route === '/items') assert.ok(data.fullMs >= 90, `${app.name}: list delay missing`);

    if (route === '/items/1') {
      assert.ok(data.deferredMs >= 750, `${app.name}: deferred delay missing`);

      if (app.streaming)
        assert.ok(
          data.immediateMs !== null && data.deferredMs - data.immediateMs >= 600,
          `${app.name}: detail is not streamed`,
        );
    }

    output[route] = {
      text: actual,
      textSha256: createHash('sha256').update(actual).digest('hex'),
      fullMs: data.fullMs,
      immediateMs: data.immediateMs,
      deferredMs: data.deferredMs,
    };
  }

  return output;
}

export async function browserParity(app, server, browser) {
  const output = {};
  for (const route of app.routes) {
    const { context, page, errors } = await browserPage(browser);
    try {
      const response = await page.goto(`${server.baseUrl}${route}`, { waitUntil: 'load' });

      assert.equal(response.status(), 200);
      await ready(page);
      const text = normalize(await page.locator(appSelector).innerText());

      assert.equal(
        text,
        await expectedText(route),
        `${app.name} ${route}: rendered text differs from SPEC`,
      );
      assert.equal(await page.locator('nav').count(), 1);
      assert.equal(await page.locator('[data-bench-pending]:visible').count(), 0);

      if (route === '/') {
        await page.locator('[data-bench-counter]').click();
        await page.waitForFunction(
          () => document.querySelector('[data-bench-counter]')?.textContent === 'Count: 1',
        );
      }

      if (route === '/items') assert.equal(await page.locator('main li').count(), 50);

      if (route === '/items/1')
        assert.equal(await page.locator('[data-bench-deferred]:visible').count(), 1);

      assertBrowserErrors(errors);
      output[route] = text;
    } finally {
      await context.close();
    }
  }
  // Exercise real links as well as direct loads, using the same document-navigation contract.
  const { context, page, errors } = await browserPage(browser);
  try {
    await page.goto(server.baseUrl);
    await ready(page);
    await page.getByRole('link', { name: 'Items', exact: true }).click();
    await ready(page);
    assert.equal(
      normalize(await page.locator(appSelector).innerText()),
      await expectedText('/items'),
    );
    await page.getByRole('link', { name: 'Item 01', exact: true }).click();
    await ready(page);
    assert.equal(
      normalize(await page.locator(appSelector).innerText()),
      await expectedText('/items/1'),
    );
    assertBrowserErrors(errors);
  } finally {
    await context.close();
  }

  return output;
}

export function compareParity(results) {
  const names = Object.keys(results);

  assert.ok(names.length > 0);
  for (const route of ['/', '/items', '/items/1']) {
    const reference = results[names[0]][route];
    for (const name of names)
      assert.deepEqual(
        results[name][route],
        reference,
        `${name} ${route} differs from ${names[0]}`,
      );
    console.log(`PASS ${route} — identical text across ${names.length} apps`);
  }
}

if (isMain(import.meta.url)) {
  const opts = options();
  const browser = opts.http ? null : await launchBrowser();
  const results = {};
  try {
    for (const name of frameworks) {
      const app = await appConfig(name);

      if (opts.build) await build(app);

      const server = await start(app);
      try {
        const serverResult = await httpParity(app, server);

        results[name] = browser
          ? await browserParity(app, server, browser)
          : Object.fromEntries(
              Object.entries(serverResult).map(([route, entry]) => [route, entry.text]),
            );
      } finally {
        await server.stop();
      }
    }
    console.log(
      opts.http
        ? 'HTTP parity (completed SSR text; browser hydration not checked)'
        : 'Browser parity (rendered text, counter, links, and deferred visibility)',
    );
    compareParity(results);
    console.log(
      'PASS /items: 100 ms delay; /items/1: shell precedes 800 ms deferred field in all 5 apps',
    );
  } finally {
    await browser?.close();
  }
}
