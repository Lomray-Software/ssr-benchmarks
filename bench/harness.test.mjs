import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import {
  median,
  percentile,
  writeJson,
  readJson,
  numberOption,
  selectedNames,
  frameworks,
  runtimes,
  start,
} from './lib.mjs';
import { measureLeak } from './memory.mjs';
import { cpuPerRequest, sampleProcess } from './process-usage.mjs';
import { tables, runtimeTables, replaceSection } from './render-readme.mjs';
import { inlineScripts, gzipBytes } from './sizes.mjs';
import { request, measureTtfb, measureThroughput } from './ttfb.mjs';
import { expectedText, serverText, compareParity, compareRuntimeParity } from './verify-parity.mjs';

/** Run HTTP assertions against an owned ephemeral server. */
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

/** Verify CPU accounting uses successful completions and never silently changes scope. */
test('CPU deltas distinguish process and main-thread work and reject resets', () => {
  const before = {
    pid: 12,
    cpuUsage: { user: 100, system: 50 },
    threadCpuUsage: { user: 80, system: 20 },
  };
  const after = {
    pid: 12,
    cpuUsage: { user: 160, system: 70 },
    threadCpuUsage: { user: 110, system: 30 },
  };
  const result = cpuPerRequest(before, after, 10);

  assert.equal(result.process.usPerRequest, 8);
  assert.equal(result.mainThread.usPerRequest, 4);
  assert.equal(cpuPerRequest({ ...before, threadCpuUsage: null }, after, 10).mainThread, null);
  assert.throws(() => cpuPerRequest(before, after, 0), /completed requests/);
  assert.throws(() => cpuPerRequest(before, { ...after, pid: 13 }, 10), /PID mismatch/);
  assert.throws(() => cpuPerRequest(after, before, 10), /counter delta/);
});

/** Require a real gzip response and count its encoded body rather than decoded bytes. */
test('HTTP encoding negotiation is verified instead of assumed', async () => {
  const body = gzipSync('hello '.repeat(500));

  await fixture(
    /** Return gzip only when explicitly requested. */
    ({ headers }, response) => {
      if (headers['accept-encoding'] === 'gzip') {
        response.setHeader('content-encoding', 'gzip');
        response.end(body);
      } else response.end('identity');
    },

    /** A missing compression header must fail a gzip measurement. */
    async (url) => {
      const result = await request(url, false, 10000, {
        encoding: 'gzip',
        expectedEncoding: 'gzip',
      });

      assert.equal(result.bodyBytes, body.length);
      assert.equal(result.contentEncoding, 'gzip');
      await assert.rejects(
        request(url, false, 10000, { expectedEncoding: 'gzip' }),
        /Expected gzip/,
      );
    },
  );
});

/** Exercise actual 50/100-socket loads and verify the batch-wall-time throughput denominator. */
test('throughput warms each connection count and keeps every measured sample', async () => {
  let requests = 0;
  const sockets = new Set();

  await fixture(
    /** Delay completion enough to exercise every requested connection. */
    ({ socket }, response) => {
      requests++;
      sockets.add(socket);
      setTimeout(() => response.end('ok'), 10);
    },

    /** Warmups affect server counts but cannot enter the measured distributions. */
    async (url) => {
      const result = await measureThroughput(
        { name: 'fixture', routes: ['/'] },
        { baseUrl: url },
        { quick: true },
      );

      assert.equal(requests, 600);
      assert.equal(sockets.size, 150);
      for (const concurrency of [50, 100]) {
        const {
          routes: { '/': route },
        } = result[concurrency];
        const { samples, elapsedMs, requestsPerSecond, fullResponseMs } = route;

        assert.equal(samples.length, 200);
        assert.equal(route.concurrency, concurrency);
        assert.ok(Math.abs(requestsPerSecond - 200000 / elapsedMs) < 1e-9);
        assert.equal(
          fullResponseMs.p99,
          percentile(
            samples.map((sample) => sample.fullResponseMs),
            0.99,
          ),
        );
      }
    },
  );
});

/** Use a real child process to verify signal ownership, CPU sampling, and the full leak count. */
test('process snapshots and leak probe run in the listener and retain 10,000 requests', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'ssr-process-test-'));

  await writeJson(resolve(directory, 'package.json'), {
    scripts: { start: 'node server.mjs' },
    type: 'module',
  });
  await writeFile(
    resolve(directory, 'server.mjs'),
    `import http from 'node:http';
let count = 0;
/** Expose the completed request count for harness verification. */
http.createServer((_request, response) => response.end(String(++count))).listen(Number(process.env.PORT), '127.0.0.1');
`,
  );
  let server;
  try {
    server = await start({ name: 'process-fixture', dir: directory });
    const before = await sampleProcess(server);
    const result = await measureLeak(server);
    const after = await sampleProcess(server);
    const response = await fetch(server.baseUrl);

    assert.notEqual(before.pid, process.pid);
    assert.equal(before.pid, server.pid);
    assert.equal(result.requests, 10000);
    assert.equal(await response.text(), '10002');
    assert.equal(result.deltaBytes, result.after.rssBytes - result.before.rssBytes);
    assert.ok(cpuPerRequest(before, after, 10000).process.usPerRequest > 0);
    assert.ok(result.before.rssBytes > 0 && result.after.rssBytes > 0);
  } finally {
    await server?.stop();
    await rm(directory, { recursive: true, force: true });
  }
});

/** Protect both section selection and marker boundaries against accidental mixed publication. */
test('section flags and README markers preserve the other matrix', () => {
  assert.deepEqual(selectedNames(), [...frameworks, ...runtimes]);
  assert.deepEqual(selectedNames({ 'frameworks-only': true }), frameworks);
  assert.deepEqual(selectedNames({ 'runtimes-only': true }), runtimes);
  assert.deepEqual(selectedNames({ runtime: 'hono-bun' }), ['hono-bun']);
  assert.throws(() => selectedNames({ 'frameworks-only': true, 'runtimes-only': true }));
  assert.throws(() => selectedNames({ runtime: 'missing' }));
  assert.equal(
    replaceSection('before A old B after C preserved D', 'A', 'B', 'new'),
    'before A\n\nnew\n\nB after C preserved D',
  );
  assert.throws(() => replaceSection('B before A', 'A', 'B', 'new'));
  assert.throws(() => replaceSection('A A B', 'A', 'B', 'new'));
});

/** Catch differences outside visible application text, including bootstrap scripts and cache policy. */
test('runtime parity compares entire documents and static metadata', () => {
  const documents = Object.fromEntries(
    ['/', '/items', '/items/1'].map((route) => [route, { html: '<html>same</html>', status: 200 }]),
  );
  const reference = {
    identity: documents,
    gzip: documents,
    assets: { '/asset.js': { cacheControl: 'public, max-age=0', sha256: 'abc' } },
    statuses: { '/missing': 404 },
  };
  const changed = structuredClone(reference);

  changed.identity['/'].html += '<script>different()</script>';
  assert.throws(
    () => compareRuntimeParity({ express: reference, changed }),
    /complete HTML differs/,
  );
  changed.identity['/'].html = reference.identity['/'].html;
  changed.assets['/asset.js'].cacheControl = 'private';
  assert.throws(() => compareRuntimeParity({ express: reference, changed }), /static files differ/);
});

/** Keep missing runtime observations and the two compression modes visible in generated tables. */
test('runtime tables show both encodings and never invent unavailable values', () => {
  const result = runtimeTables({
    generatedAt: 'test',
    mode: 'quick',
    status: 'incomplete',
    runtimes: {
      sample: {
        label: 'Sample',
        rawFile: 'date/runtimes/sample.json',
        encodings: {},
        application: { compression: 'test' },
      },
    },
  });

  assert.match(result, /TTFB p50 \/ p95 \/ p99 off/);
  assert.match(result, /TTFB p50 \/ p95 \/ p99 gzip/);
  assert.match(result, /not measured/);
  assert.doesNotMatch(result, /NaN|undefined/);
  for (const line of result.split('\n').filter((value) => value.startsWith('| [Sample]')))
    for (const cell of line.split('|').slice(1, -1))
      assert.match(cell, /\]\(results\/date\/runtimes\/sample.json\)/);
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
