import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { median, percentile, writeJson, readJson, numberOption } from './lib.mjs';
import { tables } from './render-readme.mjs';
import { inlineScripts, gzipBytes } from './sizes.mjs';
import { request, measureTtfb } from './ttfb.mjs';
import { expectedText, serverText, compareParity } from './verify-parity.mjs';

async function fixture(handler, callback) {
  const server = http.createServer(handler);

  await new Promise((resolvePromise) => {
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolvePromise) => {
      server.close(resolvePromise);
    });
  }
}

test('nearest-rank percentiles and conventional median retain slow samples', () => {
  const values = [1000, 2, 3, 1];

  assert.equal(percentile(values, 0.5), 2);
  assert.equal(percentile(values, 0.95), 1000);
  assert.equal(percentile(values, 0.99), 1000);
  assert.equal(median(values), 2.5);
  assert.deepEqual(values, [1000, 2, 3, 1]);
  assert.throws(() => percentile([], 0.5));
  assert.throws(() => numberOption(-2, 1, 'count'));
});

test('HTTP loader distinguishes headers from completed body and counts UTF-8 bytes', async () => {
  await fixture(
    (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.flushHeaders();
      res.write('é');
      setTimeout(() => res.end('done'), 80);
    },
    async (url) => {
      const sample = await request(url, false);

      assert.ok(sample.fullResponseMs - sample.ttfbMs >= 60);
      assert.equal(sample.bodyBytes, 6);
      assert.ok(sample.headerBytes > 0);
    },
  );
});

test('HTTP loader rejects non-200 responses, truncated bodies, and absolute timeouts', async () => {
  await fixture(
    (_req, res) => {
      res.writeHead(503);
      res.end('unavailable');
    },
    async (url) => {
      await assert.rejects(request(url, false), /HTTP 503/);
    },
  );
  await fixture(
    (_req, res) => {
      res.writeHead(200, { 'content-length': 30 });
      res.write('short');
      setTimeout(() => res.destroy(), 10);
    },
    async (url) => {
      await assert.rejects(request(url, false));
    },
  );
  await fixture(
    (_req, res) => {
      res.writeHead(200);
      res.flushHeaders();
      const interval = setInterval(() => res.write('x'), 10);

      res.once('close', () => clearInterval(interval));
    },
    async (url) => {
      await assert.rejects(request(url, false, 50), /Timeout/);
    },
  );
});

test('warmups are excluded and concurrency and request counts are exact', async () => {
  let count = 0;
  let active = 0;
  let peak = 0;

  await fixture(
    (_req, res) => {
      count++;
      active++;
      peak = Math.max(peak, active);
      setTimeout(() => {
        active--;
        res.end('ok');
      }, 10);
    },
    async (url) => {
      const result = await measureTtfb(
        { name: 'fixture', routes: ['/'] },
        { baseUrl: url },
        { warmup: 7, requests: 23, concurrency: 3 },
      );

      assert.equal(count, 30);
      assert.equal(peak, 3);
      assert.equal(result.routes['/'].samples.length, 23);
      assert.equal(result.routes['/'].bodyBytes.total, 46);
    },
  );
});

test('completed SSR parity includes staged detail but rejects missing or duplicate content', async () => {
  const html =
    '<div id="benchmark-app"><nav><a>Home</a><a>Items</a></nav><main><article><h1>Item 01</h1><p>Available immediately.</p><p data-bench-pending>Loading details…</p></article></main></div><div hidden><p data-bench-deferred>Details for item 01.</p></div><script>unrelated text</script>';

  assert.equal(serverText(html), await expectedText('/items/1'));
  assert.throws(() => serverText('<p>empty app</p>'), /Missing/);
  assert.throws(() => serverText(`${html}<p data-bench-deferred>duplicate</p>`), /Duplicate/);
  assert.throws(() => compareParity({ a: { '/': 'correct' }, b: { '/': 'changed' } }), /differs/);
});

test('inline JavaScript size includes executable bootstrap data but excludes JSON and external script tags', () => {
  const result = inlineScripts(
    '<script src="/main.js"></script><script>window.x=1</script><script type="application/json">{"x":1}</script><script type="module">import("/a.js")</script>',
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].bytes, Buffer.byteLength('window.x=1'));
  assert.equal(result[0].gzipBytes, gzipBytes('window.x=1'));
});

test('raw JSON is valid and replacement is complete', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'ssr-json-test-'));
  try {
    const file = resolve(directory, 'result.json');

    await writeFile(file, 'old content');
    await writeJson(file, { status: 'complete', samples: [1, 2] });
    assert.deepEqual(await readJson(file), { status: 'complete', samples: [1, 2] });
    assert.ok((await readFile(file, 'utf8')).endsWith('\n'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rendered tables link each data cell to raw JSON and never turn missing observations into zeroes', () => {
  const result = tables({
    mode: 'quick',
    status: 'incomplete',
    generatedAt: 'test',
    frameworks: {
      sample: {
        label: 'Sample',
        rawFile: '2026-09-05/sample.json',
        coldStart: { medianMs: 123 },
        memory: { rssBytes: 1048576 },
        sizes: { routes: null, emitted: { total: { bytes: 1024 }, client: { bytes: 512 } } },
        interactive: { unavailable: 'no browser' },
        ttfb: {
          routes: {
            '/': {
              ttfbMs: { p50: 1, p95: 2, p99: 3 },
              fullResponseMs: { p50: 8, p95: 9, p99: 10 },
              bodyBytes: { p50: 100 },
            },
          },
        },
      },
    },
  });

  assert.match(result, /not measured/);
  assert.doesNotMatch(result, /NaN|undefined/);
  for (const line of result.split('\n').filter((value) => value.startsWith('| [Sample]'))) {
    for (const cell of line.split('|').slice(1, -1))
      assert.match(cell, /^ \[.+\]\(results\/2026-09-05\/sample\.json\) $/);
  }
});
