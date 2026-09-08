import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import http from 'node:http';
import { relative, resolve } from 'node:path';
import { createGunzip } from 'node:zlib';
import { parse } from 'parse5';
import { browserPage, assertBrowserErrors, launchBrowser, ready } from './browser.mjs';
import {
  appConfig,
  build,
  frameworks,
  filesIn,
  isMain,
  options,
  readJson,
  root,
  runtimes,
  start,
  userAgent,
} from './lib.mjs';

const appSelector = '#benchmark-app';
const cacheControlHeader = 'cache-control';

/** Compare rendered words independently of whitespace introduced by document wrappers. */
const normalize = (text) => text.replace(/\s+/g, ' ').trim();

/** Describe the shared application contract for each measured route. */
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
/** Read a parsed HTML attribute without interpreting script content. */
const attr = (node, name) => node.attrs?.find((entry) => entry.name === name)?.value;

/** Extract completed SSR application text, including deferred staging fragments. */
export function serverText(html) {
  const document = parse(html);
  let shell;
  const deferred = [];

  /** Locate the app shell and any completed deferred field. */
  function find(node) {
    if (attr(node, 'id') === 'benchmark-app') shell = node;

    if (attr(node, 'data-bench-deferred') !== undefined) deferred.push(node);

    for (const child of node.childNodes ?? []) find(child);
  }

  /** Exclude transport scripts and placeholders from the application text. */
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

/** Check complete SSR text and decoded streaming timing, optionally retaining exact HTML. */
export async function httpParity(
  { name, routes, streaming },
  { baseUrl },
  { encoding = 'identity', exact = false, requireStreaming = true } = {},
) {
  const output = {};
  for (const route of routes) {
    const started = performance.now();
    const data = await new Promise((resolvePromise, reject) => {
      let html = '';
      let immediateMs = null;
      let deferredMs = null;
      const req = http.get(
        `${baseUrl}${route}`,
        { headers: { 'user-agent': userAgent, 'accept-encoding': encoding } },
        (res) => {
          const contentEncoding = res.headers['content-encoding'] ?? 'identity';
          const body = contentEncoding === 'gzip' ? res.pipe(createGunzip()) : res;

          body.setEncoding('utf8');

          /** Observe decoded HTML so a gzip header cannot masquerade as a streamed shell. */
          body.on('data', (chunk) => {
            html += chunk;

            if (immediateMs === null && /<p data-bench-immediate=""/.test(html))
              immediateMs = performance.now() - started;

            if (deferredMs === null && /<p data-bench-deferred=""/.test(html))
              deferredMs = performance.now() - started;
          });
          res.once('error', reject);
          body.once('error', reject);

          /** Retain complete document bytes and both streaming milestones. */
          body.once('end', () =>
            resolvePromise({
              html,
              status: res.statusCode,
              fullMs: performance.now() - started,
              immediateMs,
              deferredMs,
              contentEncoding,
            }),
          );
        },
      );

      req.setTimeout(10000, () => req.destroy(new Error('Parity request timed out')));
      req.once('error', reject);
    });

    assert.equal(data.status, 200, `${name} ${route}: expected HTTP 200`);

    if (exact) assert.equal(data.contentEncoding, encoding, `${name}: encoding mismatch`);

    const actual = serverText(data.html);

    assert.equal(
      actual,
      await expectedText(route),
      `${name} ${route}: server text differs from SPEC`,
    );

    if (route === '/items') assert.ok(data.fullMs >= 90, `${name}: list delay missing`);

    if (route === '/items/1') {
      assert.ok(data.deferredMs >= 750, `${name}: deferred delay missing`);

      if (streaming && requireStreaming)
        assert.ok(
          data.immediateMs !== null && data.deferredMs - data.immediateMs >= 600,
          `${name}: detail is not streamed`,
        );
    }

    output[route] = {
      text: actual,
      textSha256: createHash('sha256').update(actual).digest('hex'),
      fullMs: data.fullMs,
      immediateMs: data.immediateMs,
      deferredMs: data.deferredMs,
      ...(exact
        ? {
            html: data.html,
            status: data.status,
            contentEncoding: data.contentEncoding,
            htmlSha256: createHash('sha256').update(data.html).digest('hex'),
          }
        : {}),
    };
  }

  return output;
}

/** Verify both encodings, all built assets, and status codes against the managed reference. */
export async function runtimeParity(app, server) {
  const { name, routes } = app;
  const { baseUrl } = server;
  const identity = await httpParity(app, server, { exact: true });
  const gzip = await httpParity(app, server, {
    exact: true,
    encoding: 'gzip',
    requireStreaming: !['hono-node', 'hono-bun'].includes(name),
  });
  for (const route of routes)
    assert.equal(gzip[route].html, identity[route].html, `${name} ${route}: gzip changes HTML`);

  const clientDir = resolve(root, 'apps/boost/build/client');
  const assets = {};
  for (const file of await filesIn(clientDir, ['.vite'])) {
    const route = `/${relative(clientDir, file).split('\\').join('/')}`;

    if (route === '/index.html') continue;

    const response = await fetch(`${baseUrl}${route}`, {
      headers: { 'accept-encoding': 'identity' },
      signal: AbortSignal.timeout(10000),
    });
    const body = Buffer.from(await response.arrayBuffer());
    const head = await fetch(`${baseUrl}${route}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });

    assert.equal(response.status, 200, `${name} ${route}: missing static file`);
    assert.equal(head.status, 200);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal(response.headers.get(cacheControlHeader), 'public, max-age=0');
    assert.equal(head.headers.get(cacheControlHeader), response.headers.get(cacheControlHeader));
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');

    assert.ok(etag && lastModified, `${name} ${route}: missing cache validators`);
    const cached = await fetch(`${baseUrl}${route}`, {
      headers: { 'if-none-match': etag },
      cache: 'no-cache',
      signal: AbortSignal.timeout(10000),
    });

    assert.equal(cached.status, 304);
    assert.equal((await cached.arrayBuffer()).byteLength, 0);
    assets[route] = {
      status: response.status,
      bytes: body.length,
      sha256: createHash('sha256').update(body).digest('hex'),
      cacheControl: response.headers.get(cacheControlHeader),
      contentType: response.headers.get('content-type'),
      // Weak ETags embed the file mtime, which Bun and Node round differently; compare the size part.
      etag: etag.replace(/-[0-9a-f]+"$/, '"'),
      lastModified,
    };
  }
  const statuses = {};
  for (const route of ['/missing', '/index.html', '/assets/missing.js', '/server/server.js']) {
    const response = await fetch(`${baseUrl}${route}`, {
      signal: AbortSignal.timeout(10000),
    });

    await response.arrayBuffer();
    assert.equal(response.status, 404, `${name} ${route}: expected HTTP 404`);
    statuses[route] = response.status;
  }

  return { identity, gzip, assets, statuses };
}

/** Require byte-for-byte documents and identical asset metadata across the runtime matrix. */
export function compareRuntimeParity(results) {
  const entries = Object.entries(results);
  const reference = results.express ?? entries[0]?.[1];

  assert.ok(reference, 'Missing runtime parity reference');
  for (const [name, value] of entries) {
    for (const route of ['/', '/items', '/items/1']) {
      for (const encoding of ['identity', 'gzip']) {
        assert.equal(
          value[encoding][route].html,
          reference.identity[route].html,
          `${name} ${route} ${encoding}: complete HTML differs from Express`,
        );
        assert.equal(value[encoding][route].status, reference.identity[route].status);
      }
    }
    assert.deepEqual(value.assets, reference.assets, `${name}: built static files differ`);
    assert.deepEqual(value.statuses, reference.statuses, `${name}: status codes differ`);
  }
  console.log(
    `PASS runtimes: byte-identical full HTML on 3 routes (identity and decoded gzip), static files/cache headers, and status codes across ${entries.length} variants`,
  );
  console.log(
    'PASS runtimes: identity /items/1 shell precedes deferred field by at least 600 ms; decoded gzip timing retained separately',
  );
}

/** Exercise hydration, counter input, document links, and actual deferred visibility. */
export async function browserParity({ name, routes }, { baseUrl }, browser) {
  const output = {};
  for (const route of routes) {
    const { context, page, errors } = await browserPage(browser);
    try {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'load' });

      assert.equal(response.status(), 200);
      await ready(page);
      const text = normalize(await page.locator(appSelector).innerText());

      assert.equal(
        text,
        await expectedText(route),
        `${name} ${route}: rendered text differs from SPEC`,
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
    await page.goto(baseUrl);
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

/** Require the same application text across all selected targets. */
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
  const runtimeMode = Boolean(opts.runtimes);
  const browser = opts.http || (runtimeMode && !opts.browser) ? null : await launchBrowser();
  const results = {};
  const runtimeResults = {};
  try {
    if (runtimeMode && opts.build) await build(await appConfig('boost'));

    for (const name of runtimeMode ? runtimes : frameworks) {
      const app = await appConfig(name);

      if (opts.build && !runtimeMode) await build(app);

      const server = await start(app);
      try {
        if (runtimeMode) runtimeResults[name] = await runtimeParity(app, server);

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
      !browser
        ? 'HTTP parity (completed SSR text; browser hydration not checked)'
        : 'Browser parity (rendered text, counter, links, and deferred visibility)',
    );
    compareParity(results);

    if (runtimeMode) compareRuntimeParity(runtimeResults);

    console.log(
      `PASS /items: 100 ms delay; /items/1: shell precedes 800 ms deferred field in all ${runtimeMode ? runtimes.length : frameworks.length} targets`,
    );
  } finally {
    await browser?.close();
  }
}
