import http from 'node:http';
import { cliMeasure, isMain } from './lib.mjs';
import { sampleProcess } from './process-usage.mjs';
import { batch, measureTtfb } from './ttfb.mjs';

/** Read RSS from the actual listening process without forcing garbage collection. */
export async function measureMemory(server) {
  return {
    ...(await sampleProcess(server)),
    method:
      'process.memoryUsage.rss() in the listening process, immediately after TTFB; no forced GC',
  };
}

/** Compare post-load RSS with the same process after exactly 10,000 additional home requests. */
export async function measureLeak(server, { encoding = 'identity' } = {}) {
  const before = await measureMemory(server);
  const requests = 10000;
  const concurrency = 10;
  const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency });
  const started = performance.now();

  try {
    await batch(`${server.baseUrl}/`, requests, concurrency, agent, {
      encoding,
      expectedEncoding: encoding,
    });
  } finally {
    agent.destroy();
  }
  const elapsedMs = performance.now() - started;
  const after = await measureMemory(server);

  return {
    before,
    after,
    deltaBytes: after.rssBytes - before.rssBytes,
    requests,
    concurrency,
    route: '/',
    encoding,
    elapsedMs,
    method:
      'RSS immediately after the 10-connection run and after 10,000 additional / requests at 10 connections; no extra warmup or forced GC; growth is an indicator, not proof of a leak',
  };
}

if (isMain(import.meta.url))
  await cliMeasure(async (app, server, opts) => {
    const ttfb = await measureTtfb(app, server, opts);

    return {
      ttfb,
      memory:
        app.section === 'runtimes' ? await measureLeak(server, opts) : await measureMemory(server),
    };
  });
