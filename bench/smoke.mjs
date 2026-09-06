import assert from 'node:assert/strict';
import { launchBrowser } from './browser.mjs';
import { measureColdStart } from './cold-start.mjs';
import { measureInteractive } from './interactive.mjs';
import { appConfig, frameworks, numberOption, options, start } from './lib.mjs';
import { measureMemory } from './memory.mjs';
import { measureSizes } from './sizes.mjs';
import { measureTtfb } from './ttfb.mjs';
import { browserParity, httpParity } from './verify-parity.mjs';

const opts = options();
const seconds = numberOption(opts.seconds, 10, 'seconds');
const names = opts.framework ? [String(opts.framework)] : frameworks;

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
for (const name of names) {
  const app = await appConfig(name);
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
