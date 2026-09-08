import http from 'node:http';
import { cliMeasure, isMain, numberOption, summary, userAgent } from './lib.mjs';
import { cpuPerRequest, sampleProcess } from './process-usage.mjs';

/** Time response headers and completion while counting the actual encoded wire body. */
export function request(
  url,
  agent,
  timeoutMs = 10000,
  { encoding = 'identity', expectedEncoding } = {},
) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.get(url, {
      agent,
      headers: { 'user-agent': userAgent, 'accept-encoding': encoding, accept: 'text/html' },
    });
    /** Bound the entire response even if a broken server keeps trickling bytes. */
    const timer = setTimeout(() => req.destroy(new Error(`Timeout: ${url}`)), timeoutMs);

    /** Reject connection failures without retaining an incomplete sample. */
    req.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    /** Observe headers before body consumption, using Node's operational TTFB boundary. */
    req.once('response', (res) => {
      const { httpVersion, statusCode, statusMessage, rawHeaders, headers } = res;
      const ttfbMs = performance.now() - start;
      let bodyBytes = 0;
      const headerBytes = Buffer.byteLength(
        `HTTP/${httpVersion} ${statusCode} ${statusMessage}\r\n${rawHeaders.reduce((text, entry, index) => text + (index % 2 ? `${entry}\r\n` : `${entry}: `), '')}\r\n`,
      );

      /** Count encoded bytes exactly as received from the transport. */
      res.on('data', (chunk) => {
        bodyBytes += chunk.length;
      });
      /** Reject truncated bodies as failed measurements. */
      res.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      /** Validate status and actual compression before accepting a completed sample. */
      res.once('end', () => {
        clearTimeout(timer);

        if (statusCode !== 200) return reject(new Error(`HTTP ${statusCode}: ${url}`));

        const contentEncoding = headers['content-encoding'] ?? 'identity';

        if (expectedEncoding && contentEncoding !== expectedEncoding)
          return reject(
            new Error(`Expected ${expectedEncoding}, received ${contentEncoding}: ${url}`),
          );

        resolve({
          ttfbMs,
          fullResponseMs: performance.now() - start,
          bodyBytes,
          headerBytes,
          status: statusCode,
          contentEncoding,
        });
      });
    });
  });
}

/** Complete an exact closed-loop request count with bounded keep-alive concurrency. */
export async function batch(url, count, concurrency, agent, requestOptions = {}) {
  const samples = new Array(count);
  let next = 0;

  await Promise.all(
    Array.from(
      { length: Math.min(count, concurrency) },
      /** Each worker starts its next request only after the previous body completes. */
      async () => {
        while (next < count) {
          const index = next++;

          samples[index] = await request(url, agent, 10000, requestOptions);
        }
      },
    ),
  );

  return samples;
}

/** Measure warmed latency, throughput, encoding, and optional in-process CPU cost. */
export async function measureTtfb({ name, routes: appRoutes, section }, server, opts = {}) {
  const {
    quick,
    warmup: warmupOption,
    requests: requestsOption,
    concurrency: concurrencyOption,
    encoding = 'identity',
    cpu = section === 'runtimes',
  } = opts;
  const warmup = numberOption(warmupOption, quick ? 5 : 100, 'warmup');
  const requests = numberOption(requestsOption, quick ? 30 : 2000, 'requests');
  const concurrency = numberOption(concurrencyOption, 10, 'concurrency');
  const requestOptions = {
    encoding,
    expectedEncoding: section === 'runtimes' ? encoding : undefined,
  };
  const routes = {};
  const { baseUrl } = server;
  for (const route of appRoutes) {
    const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency });
    try {
      await batch(`${baseUrl}${route}`, warmup, concurrency, agent, requestOptions);
      const before = cpu ? await sampleProcess(server) : null;
      const started = performance.now();
      const samples = await batch(
        `${baseUrl}${route}`,
        requests,
        concurrency,
        agent,
        requestOptions,
      );
      const elapsedMs = performance.now() - started;
      const after = cpu ? await sampleProcess(server) : null;

      routes[route] = {
        warmup,
        requests,
        concurrency,
        elapsedMs,
        requestsPerSecond: samples.length / (elapsedMs / 1000),
        encoding,
        cpu: cpu ? cpuPerRequest(before, after, samples.length) : null,
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
        `TTFB ${name} ${route} ${encoding} c${concurrency}: ${requests} requests, p50 ${routes[route].ttfbMs.p50.toFixed(2)} ms, full p50 ${routes[route].fullResponseMs.p50.toFixed(2)} ms, ${routes[route].requestsPerSecond.toFixed(2)} req/s`,
      );
    } finally {
      agent.destroy();
    }
  }

  return {
    routes,
    protocol: `HTTP/1.1 keep-alive, ${encoding} encoding, headers-received TTFB; no pipelining`,
    userAgent,
  };
}

/** Exercise both higher connection counts with a fresh warmup for each route and count. */
export async function measureThroughput(app, server, opts = {}) {
  const output = {};
  for (const concurrency of [50, 100]) {
    output[concurrency] = await measureTtfb(app, server, {
      ...opts,
      concurrency,
      warmup: opts.warmup ?? 100,
      requests: opts.requests ?? (opts.quick ? 200 : 2000),
    });
  }

  return output;
}

if (isMain(import.meta.url))
  await cliMeasure(async (app, server, opts) => {
    const ttfb = await measureTtfb(app, server, opts);

    return app.section === 'runtimes'
      ? { ttfb, throughput: await measureThroughput(app, server, opts) }
      : { ttfb };
  });
