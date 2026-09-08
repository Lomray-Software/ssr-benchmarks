const fs = require('node:fs');
const net = require('node:net');

const originalListen = net.Server.prototype.listen;
let registered = false;

/** Identify the listening process and sample only when the harness signals it. */
function registerServer(port) {
  if (registered || port !== Number(process.env.BENCH_PORT) || !process.env.BENCH_PID_FILE) return;

  registered = true;
  fs.writeFileSync(
    process.env.BENCH_PID_FILE,
    JSON.stringify({ pid: process.pid, node: process.version, bun: process.versions.bun ?? null }),
  );

  /** Take process counters without request hooks, endpoints, or an ongoing sampler. */
  process.on('SIGUSR2', () => {
    const sample = {
      pid: process.pid,
      cpuUsage: process.cpuUsage(),
      threadCpuUsage: process.threadCpuUsage?.() ?? null,
      rssBytes: process.memoryUsage.rss(),
      measuredAt: new Date().toISOString(),
    };
    const file = process.env.BENCH_RSS_FILE;

    fs.writeFileSync(`${file}.tmp`, JSON.stringify(sample));
    fs.renameSync(`${file}.tmp`, file);
  });
}

/** Discover Node servers; native Bun launchers register their returned port explicitly. */
net.Server.prototype.listen = function (...args) {
  /** Ignore processes that do not own the requested benchmark port. */
  this.once('listening', () => registerServer(this.address()?.port));

  return originalListen.apply(this, args);
};

module.exports = { registerServer };
