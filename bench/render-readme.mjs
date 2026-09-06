import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { isMain, options, readJson, root } from './lib.mjs';

export const startMarker = '<!-- BENCHMARK_RESULTS_START -->';

export const endMarker = '<!-- BENCHMARK_RESULTS_END -->';
const unavailable = 'not measured';
const format = (value, digits = 1) =>
  Number.isFinite(value) ? value.toFixed(digits) : unavailable;

export function tables(latest, prefix = 'results') {
  const entries = Object.values(latest.frameworks);
  const link = (entry, value) => `[${value}](${prefix}/${entry.rawFile})`;
  const row = (entry, cells) => `| ${cells.map((value) => link(entry, value)).join(' | ')} |`;
  const lines = [
    `Run: ${latest.generatedAt}. Mode: **${latest.mode}**. Status: **${latest.status}**.`,
    latest.mode === 'quick'
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
  const quantiles = (metric) =>
    metric
      ? [metric.p50, metric.p95, metric.p99].map((value) => format(value)).join(' / ')
      : unavailable;
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

export async function renderReadme({
  resultsFile = resolve(root, 'results/latest.json'),
  outputFile = resolve(root, 'README.md'),
} = {}) {
  const template = await readFile(resolve(root, 'bench/README.template.md'), 'utf8');

  if (template.split(startMarker).length !== 2 || template.split(endMarker).length !== 2)
    throw new Error('README template must contain one marker pair');

  const latest = await readJson(resultsFile);
  const prefix = relative(dirname(outputFile), dirname(resultsFile)).split('\\').join('/') || '.';
  const before = template.slice(0, template.indexOf(startMarker) + startMarker.length);
  const after = template.slice(template.indexOf(endMarker));

  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${before}\n\n${tables(latest, prefix)}\n\n${after}`);
  console.log(`README generated from ${relative(root, resultsFile)}`);
}

if (isMain(import.meta.url)) {
  const opts = options();

  await renderReadme({
    resultsFile: opts.results ? resolve(String(opts.results)) : undefined,
    outputFile: opts.output ? resolve(String(opts.output)) : undefined,
  });
}
