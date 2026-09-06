import http from 'node:http';
import { cliMeasure, isMain, numberOption, summary, userAgent } from './lib.mjs';

export function request(url, agent, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.get(url, {
      agent,
      headers: { 'user-agent': userAgent, 'accept-encoding': 'identity', accept: 'text/html' },
    });
    // Absolute timeout includes response body (a trickle cannot keep a failed sample alive forever).
    const timer = setTimeout(() => req.destroy(new Error(`Timeout: ${url}`)), timeoutMs);

    req.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    req.once('response', (res) => {
      // Node calls this when the response headers have arrived, before consuming body chunks.
      const ttfbMs = performance.now() - start;
      let bodyBytes = 0;
      const headerBytes = Buffer.byteLength(
        `HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage}\r\n${res.rawHeaders.reduce((text, entry, index) => text + (index % 2 ? `${entry}\r\n` : `${entry}: `), '')}\r\n`,
      );

      res.on('data', (chunk) => {
        bodyBytes += chunk.length;
      });
      res.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      res.once('end', () => {
        clearTimeout(timer);

        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${url}`));

        resolve({
          ttfbMs,
          fullResponseMs: performance.now() - start,
          bodyBytes,
          headerBytes,
          status: res.statusCode,
        });
      });
    });
  });
}

async function batch(url, count, concurrency, agent) {
  const samples = new Array(count);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(count, concurrency) }, async () => {
      while (next < count) {
        const index = next++;

        samples[index] = await request(url, agent);
      }
    }),
  );

  return samples;
}

export async function measureTtfb(app, server, opts = {}) {
  const quick = Boolean(opts.quick);
  const warmup = numberOption(opts.warmup, quick ? 5 : 100, 'warmup');
  const requests = numberOption(opts.requests, quick ? 30 : 2000, 'requests');
  const concurrency = numberOption(opts.concurrency, 10, 'concurrency');
  const routes = {};
  for (const route of app.routes) {
    const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency });
    try {
      await batch(`${server.baseUrl}${route}`, warmup, concurrency, agent);
      const started = performance.now();
      const samples = await batch(`${server.baseUrl}${route}`, requests, concurrency, agent);
      const elapsedMs = performance.now() - started;

      routes[route] = {
        warmup,
        requests,
        concurrency,
        elapsedMs,
        ttfbMs: summary(samples.map((sample) => sample.ttfbMs)),
        fullResponseMs: summary(samples.map((sample) => sample.fullResponseMs)),
        bodyBytes: {
          total: samples.reduce((sum, sample) => sum + sample.bodyBytes, 0),
          ...summary(samples.map((sample) => sample.bodyBytes)),
        },
        headerBytes: { total: samples.reduce((sum, sample) => sum + sample.headerBytes, 0) },
        samples,
      };
      console.log(
        `TTFB ${app.name} ${route}: ${requests} requests, p50 ${routes[route].ttfbMs.p50.toFixed(2)} ms, full p50 ${routes[route].fullResponseMs.p50.toFixed(2)} ms`,
      );
    } finally {
      agent.destroy();
    }
  }

  return {
    routes,
    protocol: 'HTTP/1.1 keep-alive, identity encoding, headers-received TTFB; no pipelining',
    userAgent,
  };
}

if (isMain(import.meta.url))
  await cliMeasure(async (app, server, opts) => ({ ttfb: await measureTtfb(app, server, opts) }));
