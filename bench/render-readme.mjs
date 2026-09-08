import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { isMain, options, readJson, root } from './lib.mjs';

export const startMarker = '<!-- BENCHMARK_RESULTS_START -->';

export const endMarker = '<!-- BENCHMARK_RESULTS_END -->';

export const runtimeStartMarker = '<!-- RUNTIME_RESULTS_START -->';

export const runtimeEndMarker = '<!-- RUNTIME_RESULTS_END -->';
const unavailable = 'not measured';

/** Keep missing observations explicit instead of formatting them as zero. */
const format = (value, digits = 1) =>
  Number.isFinite(value) ? value.toFixed(digits) : unavailable;

/** Preserve the same three latency quantiles in both result sections. */
const quantiles = (metric) =>
  metric
    ? [metric.p50, metric.p95, metric.p99].map((value) => format(value)).join(' / ')
    : unavailable;

/** Render the existing framework metrics with links to complete raw results. */
export function tables({ frameworks: results, generatedAt, mode, status }, prefix = 'results') {
  const entries = Object.values(results);

  /** Link each cell to the observation that produced it. */
  const link = ({ rawFile }, value) => `[${value}](${prefix}/${rawFile})`;

  /** Format one framework observation consistently. */
  const row = (entry, cells) => `| ${cells.map((value) => link(entry, value)).join(' | ')} |`;
  const lines = [
    `Run: ${generatedAt}. Mode: **${mode}**. Status: **${status}**.`,
    mode === 'quick'
      ? 'Quick samples are a tooling check, not a performance ranking.'
      : 'Compare within this run; shared CI hardware varies between runs.',
    '',
    `| [Framework](${prefix}/latest.json) | [Cold start ms](${prefix}/latest.json) | [RSS MiB](${prefix}/latest.json) | [Emitted JS KiB (all / client)](${prefix}/latest.json) | [Counter ms](${prefix}/latest.json) | [Deferred visible ms](${prefix}/latest.json) |`,
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...entries.map((entry) =>
      row(entry, [
        entry.label,
        format(entry.coldStart?.medianMs),
        format(entry.memory?.rssBytes / 1048576),
        `${format(entry.sizes?.emitted?.total?.bytes / 1024)} / ${format(entry.sizes?.emitted?.client?.bytes / 1024)}`,
        format(entry.interactive?.counter?.medianMs),
        format(entry.interactive?.deferred?.medianMs),
      ]),
    ),
    '',
    `| [Framework](${prefix}/latest.json) | [Route](${prefix}/latest.json) | [Fetched JS gzip KiB (external + inline)](${prefix}/latest.json) | [TTFB ms p50 / p95 / p99](${prefix}/latest.json) | [Full response ms p50 / p95 / p99](${prefix}/latest.json) | [Body bytes p50](${prefix}/latest.json) |`,
    '| --- | --- | ---: | ---: | ---: | ---: |',
  ];
  for (const entry of entries) {
    for (const [route, data] of Object.entries(entry.ttfb.routes)) {
      const gzip = entry.sizes.routes?.[route]?.gzipBytes;

      lines.push(
        row(entry, [
          entry.label,
          route,
          gzip === undefined ? unavailable : format(gzip / 1024),
          quantiles(data.ttfbMs),
          quantiles(data.fullResponseMs),
          format(data.bodyBytes.p50, 0),
        ]),
      );
    }
  }

  return lines.join('\n');
}

/** Render runtime metrics with explicit identity and gzip columns and raw-result links. */
export function runtimeTables(
  { runtimes: results, generatedAt, mode, status },
  prefix = 'results',
) {
  const entries = Object.values(results);

  /** Keep every measurement traceable to its complete result. */
  const row = ({ rawFile }, cells) =>
    `| ${cells.map((value) => `[${value}](${prefix}/${rawFile})`).join(' | ')} |`;

  /** Pair throughput with full-response p99 for the same connection count and samples. */
  const throughput = (value) =>
    value
      ? `${format(value.requestsPerSecond)} / ${format(value.fullResponseMs.p99)}`
      : unavailable;

  const lines = [
    `Run: ${generatedAt}. Mode: **${mode}**. Status: **${status}**.`,
    mode === 'quick'
      ? 'Quick samples check tooling; they are not a performance ranking.'
      : 'Compare variants within this run on this machine.',
    '',
    'Gzip off means `Accept-Encoding: identity`; gzip on means `Accept-Encoding: gzip`. Latency is in ms. Throughput cells are requests/s / full-response p99 ms.',
    '',
    '| Runtime | Route | TTFB p50 / p95 / p99 off | TTFB p50 / p95 / p99 gzip | Full p50 / p95 / p99 off | Full p50 / p95 / p99 gzip | 50 connections off | 50 connections gzip | 100 connections off | 100 connections gzip |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const entry of entries) {
    const { label, encodings } = entry;
    const { identity, gzip } = encodings;
    for (const route of ['/', '/items', '/items/1']) {
      lines.push(
        row(entry, [
          label,
          route,
          quantiles(identity?.ttfb?.routes?.[route]?.ttfbMs),
          quantiles(gzip?.ttfb?.routes?.[route]?.ttfbMs),
          quantiles(identity?.ttfb?.routes?.[route]?.fullResponseMs),
          quantiles(gzip?.ttfb?.routes?.[route]?.fullResponseMs),
          ...[50, 100].flatMap((connections) =>
            [identity, gzip].map((value) =>
              throughput(value?.throughput?.[connections]?.routes?.[route]),
            ),
          ),
        ]),
      );
    }
  }
  lines.push(
    '',
    'RSS cells are MiB after the 10-connection load / after 10,000 extra requests / signed delta. CPU cells are process / main-thread µs per completed request, weighted across the three routes at 10 connections. Cold start uses five fresh processes with identity readiness requests.',
    '',
    '| Runtime | Cold start ms | RSS / after / delta off | RSS / after / delta gzip | CPU µs/request off | CPU µs/request gzip | Compression |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
  );

  /** Report memory growth without treating a negative delta as a failed sample. */
  const memory = (value) =>
    value
      ? [value.before.rssBytes, value.after.rssBytes, value.deltaBytes]
          .map((bytes) => format(bytes / 1048576))
          .join(' / ')
      : unavailable;

  /** Weight CPU by completed requests instead of averaging differently sized runs. */
  const cpu = (value) => {
    const routes = Object.values(value?.ttfb?.routes ?? {});

    return ['process', 'mainThread']
      .map((scope) => {
        if (!routes.length || routes.some((route) => !route.cpu?.[scope])) return unavailable;

        return format(
          routes.reduce((sum, route) => sum + route.cpu[scope].totalUs, 0) /
            routes.reduce((sum, route) => sum + route.cpu.completedRequests, 0),
        );
      })
      .join(' / ');
  };
  for (const entry of entries) {
    const {
      label,
      encodings: { identity, gzip },
      coldStart,
      application,
    } = entry;

    lines.push(
      row(entry, [
        label,
        format(coldStart?.medianMs),
        memory(identity?.memory),
        memory(gzip?.memory),
        cpu(identity),
        cpu(gzip),
        application.compression,
      ]),
    );
  }

  return lines.join('\n');
}

/** Replace one verified marker pair without affecting the other benchmark section. */
export function replaceSection(template, start, end, contents) {
  if (
    template.split(start).length !== 2 ||
    template.split(end).length !== 2 ||
    template.indexOf(start) >= template.indexOf(end)
  )
    throw new Error('README template must contain one ordered marker pair per section');

  return `${template.slice(0, template.indexOf(start) + start.length)}\n\n${contents}\n\n${template.slice(template.indexOf(end))}`;
}

/** Render either or both result sets, keeping absent sections explicitly unmeasured. */
export async function renderReadme({
  resultsFile = resolve(root, 'results/latest.json'),
  runtimeResultsFile = resolve(dirname(resultsFile), 'latest-runtimes.json'),
  outputFile = resolve(root, 'README.md'),
} = {}) {
  let template = await readFile(resolve(root, 'bench/README.template.md'), 'utf8');

  for (const [file, start, end, render] of [
    [resultsFile, startMarker, endMarker, tables],
    [runtimeResultsFile, runtimeStartMarker, runtimeEndMarker, runtimeTables],
  ]) {
    let contents = 'Run `npm run bench` to generate results.';
    try {
      const prefix = relative(dirname(outputFile), dirname(file)).split('\\').join('/') || '.';

      contents = render(await readJson(file), prefix);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    template = replaceSection(template, start, end, contents);
  }

  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, template);
  console.log(
    `README generated from ${relative(root, resultsFile)} and ${relative(root, runtimeResultsFile)}`,
  );
}

if (isMain(import.meta.url)) {
  const opts = options();

  await renderReadme({
    resultsFile: opts.results ? resolve(String(opts.results)) : undefined,
    runtimeResultsFile: opts['runtimes-results']
      ? resolve(String(opts['runtimes-results']))
      : undefined,
    outputFile: opts.output ? resolve(String(opts.output)) : undefined,
  });
}
