// Loaded into each Node start process. Record the actual listening process, not npm's RSS.
// No per-request hooks, sampling loop, or HTTP endpoint is added to the application.
const fs = require('node:fs');
const net = require('node:net');

const originalListen = net.Server.prototype.listen;

net.Server.prototype.listen = function (...args) {
  this.once('listening', () => {
    const address = this.address();

    if (!address || address.port !== Number(process.env.BENCH_PORT)) return;

    fs.writeFileSync(process.env.BENCH_PID_FILE, JSON.stringify({ pid: process.pid }));
    process.on('SIGUSR2', () => {
      fs.writeFileSync(
        process.env.BENCH_RSS_FILE,
        JSON.stringify({
          pid: process.pid,
          rssBytes: process.memoryUsage.rss(),
          measuredAt: new Date().toISOString(),
        }),
      );
    });
  });

  return originalListen.apply(this, args);
};
