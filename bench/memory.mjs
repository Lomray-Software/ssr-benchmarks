import { readFile, rm } from 'node:fs/promises';
import { cliMeasure, isMain, sleep } from './lib.mjs';
import { measureTtfb } from './ttfb.mjs';

export async function measureMemory(server) {
  await rm(server.rssFile, { force: true });
  process.kill(server.pid, 'SIGUSR2');
  const deadline = performance.now() + 5000;
  while (performance.now() < deadline) {
    try {
      const sample = JSON.parse(await readFile(server.rssFile, 'utf8'));

      if (sample.pid !== server.pid) throw new Error('RSS PID mismatch');

      return {
        ...sample,
        method:
          'process.memoryUsage.rss() in the listening Node process, immediately after TTFB; no forced GC',
      };
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
    await sleep(10);
  }
  throw new Error('RSS sample timed out');
}

if (isMain(import.meta.url))
  await cliMeasure(async (app, server, opts) => {
    const ttfb = await measureTtfb(app, server, opts);

    return { ttfb, memory: await measureMemory(server) };
  });
