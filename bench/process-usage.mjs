import { rm } from 'node:fs/promises';
import { readJson, sleep } from './lib.mjs';

/** Ask the listening process for one atomic RSS and CPU snapshot. */
export async function sampleProcess({ rssFile, pid }) {
  await rm(rssFile, { force: true });
  process.kill(pid, 'SIGUSR2');
  const deadline = performance.now() + 5000;
  while (performance.now() < deadline) {
    try {
      const sample = await readJson(rssFile);

      if (sample.pid !== pid) throw new Error('Process sample PID mismatch');

      return sample;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await sleep(10);
  }
  throw new Error('Process sample timed out');
}

/** Divide CPU counter deltas by completed requests, retaining both accounting scopes. */
export function cpuPerRequest(before, after, completedRequests) {
  const { pid: beforePid, cpuUsage: beforeCpu, threadCpuUsage: beforeThread } = before;
  const { pid: afterPid, cpuUsage: afterCpu, threadCpuUsage: afterThread } = after;

  if (beforePid !== afterPid) throw new Error('CPU sample PID mismatch');

  if (!Number.isInteger(completedRequests) || completedRequests < 1)
    throw new Error('CPU measurement requires completed requests');

  /** Reject counter resets instead of reporting negative CPU cost. */
  const delta = (previous, current) => {
    if (!previous || !current) return null;

    const { user: previousUser, system: previousSystem } = previous;
    const { user: currentUser, system: currentSystem } = current;
    const userUs = currentUser - previousUser;
    const systemUs = currentSystem - previousSystem;

    if (![userUs, systemUs].every((value) => Number.isFinite(value) && value >= 0))
      throw new Error('Invalid CPU counter delta');

    return {
      userUs,
      systemUs,
      totalUs: userUs + systemUs,
      usPerRequest: (userUs + systemUs) / completedRequests,
    };
  };

  return {
    completedRequests,
    process: delta(beforeCpu, afterCpu),
    mainThread: delta(beforeThread, afterThread),
    before,
    after,
    method:
      'Signal snapshots around measured requests, after warmup; process.cpuUsage includes background workers; threadCpuUsage isolates the main thread when available',
  };
}
