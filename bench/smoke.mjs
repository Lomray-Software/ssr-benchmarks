import assert from 'node:assert/strict';
import { launchBrowser } from './browser.mjs';
import { measureColdStart } from './cold-start.mjs';
import { measureInteractive } from './interactive.mjs';
import { appConfig, numberOption, options, selectedNames, start } from './lib.mjs';
import { measureLeak, measureMemory } from './memory.mjs';
import { measureSizes } from './sizes.mjs';
import { measureThroughput, measureTtfb } from './ttfb.mjs';
import { browserParity, httpParity, runtimeParity } from './verify-parity.mjs';

const opts = options();
const seconds = numberOption(opts.seconds, 10, 'seconds');
const names = selectedNames(opts);

/** Repeat complete measurements for at least the requested smoke duration. */
async function smoke(name, fn) {
  const started = performance.now();
  let iterations = 0;
  do {
    await fn();
    iterations++;
  } while (performance.now() - started < seconds * 1000);
  console.log(
    `SMOKE ${name}: PASS (${iterations} iterations, ${((performance.now() - started) / 1000).toFixed(1)} s)`,
  );
}

/** Exercise every runtime metric and encoding without requiring browser-only observations. */
async function smokeRuntime(app) {
  const { name } = app;
  for (const encoding of ['identity', 'gzip']) {
    const server = await start(app);
    const settings = { encoding, warmup: 1, requests: 10, concurrency: 10 };
    try {
      /** Require real CPU deltas and exactly completed latency samples. */
      await smoke(`${name}/${encoding}/ttfb+cpu`, async () => {
        const { routes } = await measureTtfb(app, server, settings);

        assert.equal(routes['/items/1'].samples.length, 10);
        for (const value of Object.values(routes)) assert.ok(value.cpu.process.usPerRequest > 0);
      });

      /** Exercise enough requests and warmups to open both requested connection counts. */
      await smoke(`${name}/${encoding}/throughput`, async () => {
        const value = await measureThroughput(app, server, {
          encoding,
          warmup: 100,
          requests: 100,
        });
        for (const concurrency of [50, 100]) {
          const route = value[concurrency].routes['/items/1'];

          assert.equal(route.concurrency, concurrency);
          assert.equal(route.samples.length, 100);
          assert.ok(route.requestsPerSecond > 0);
          assert.ok(route.fullResponseMs.p99 >= 750);
        }
      });

      /** Keep the full leak workload even in a short smoke run. */
      await smoke(`${name}/${encoding}/memory+leak`, async () => {
        await measureTtfb(app, server, settings);
        const { before, after, requests } = await measureLeak(server, settings);

        assert.equal(requests, 10000);
        assert.ok(before.rssBytes > 0 && after.rssBytes > 0);
      });

      if (encoding === 'gzip') await runtimeParity(app, server);
    } finally {
      await server.stop();
    }
  }

  /** Verify fresh process startup separately from a warm serving process. */
  await smoke(`${name}/cold-start.mjs`, async () => {
    assert.ok((await measureColdStart(app, { runs: 1 })).medianMs > 0);
  });
}

for (const name of names) {
  const app = await appConfig(name);

  if (app.section === 'runtimes') {
    await smokeRuntime(app);
    continue;
  }

  const server = await start(app);
  try {
    await smoke(`${name}/ttfb.mjs`, async () => {
      const value = await measureTtfb(app, server, { warmup: 1, requests: 10, concurrency: 10 });

      assert.equal(value.routes['/items/1'].samples.length, 10);
    });
    await smoke(`${name}/memory.mjs`, async () => {
      await measureTtfb(app, server, { warmup: 1, requests: 10, concurrency: 10 });
      assert.ok((await measureMemory(server)).rssBytes > 0);
    });
    const browser = await launchBrowser();
    try {
      await smoke(`${name}/sizes.mjs`, async () => {
        const value = await measureSizes(app, server, browser);

        assert.ok(value.routes['/'].externalGzipBytes > 0);
      });
      await smoke(`${name}/interactive.mjs`, async () => {
        const value = await measureInteractive(app, server, { runs: 1 }, browser);

        assert.ok(value.counter.medianMs > 0);
        assert.ok(value.deferred.medianMs >= 750);
      });
      await httpParity(app, server);
      await browserParity(app, server, browser);
    } finally {
      await browser.close();
    }
  } finally {
    await server.stop();
  }
  await smoke(`${name}/cold-start.mjs`, async () => {
    assert.ok((await measureColdStart(app, { runs: 1 })).medianMs > 0);
  });
}
