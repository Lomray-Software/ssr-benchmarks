import { cliMeasure, isMain, median, numberOption, start } from './lib.mjs';

/** Measure fresh production starts with warm filesystem caches and the common process hook. */
export async function measureColdStart(app, opts = {}) {
  const { runs, quick } = opts;
  const count = numberOption(runs, quick && app.section !== 'runtimes' ? 2 : 5, 'runs');
  const samplesMs = [];
  for (let i = 0; i < count; i++) {
    const server = await start(app);
    try {
      samplesMs.push(server.coldStartMs);
    } finally {
      await server.stop();
    }
  }

  return {
    medianMs: median(samplesMs),
    samplesMs,
    runs: count,
    pollIntervalMs: 25,
    method:
      'npm start spawn to first complete HTTP 200 on /; new process, warm filesystem; includes npm launcher and RSS hook',
  };
}

if (isMain(import.meta.url))
  await cliMeasure(
    async (app, _server, opts) => ({ coldStart: await measureColdStart(app, opts) }),
    { needsServer: false },
  );
