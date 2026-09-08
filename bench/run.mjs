import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { launchBrowser } from './browser.mjs';
import { measureColdStart } from './cold-start.mjs';
import { measureInteractive } from './interactive.mjs';
import {
  appConfig,
  build,
  environment,
  frameworks,
  isMain,
  options,
  root,
  runtimes,
  selectedNames,
  start,
  writeJson,
} from './lib.mjs';
import { measureLeak, measureMemory } from './memory.mjs';
import { renderReadme } from './render-readme.mjs';
import { emittedSizes, measureSizes } from './sizes.mjs';
import { measureThroughput, measureTtfb } from './ttfb.mjs';
import {
  httpParity,
  browserParity,
  compareParity,
  runtimeParity,
  compareRuntimeParity,
} from './verify-parity.mjs';

const readmeFile = resolve(root, 'README.md');
const frameworkResultsName = 'latest.json';

/** Preserve the framework measurements and their explicit incomplete-browser status. */
async function runFrameworks(opts = {}) {
  const generatedAt = new Date().toISOString();
  const date = generatedAt.slice(0, 10);
  const directory = resolve(root, String(opts.output ?? 'results'));
  const mode = opts.quick ? 'quick' : 'full';
  const result = {
    schemaVersion: 1,
    generatedAt,
    date,
    mode,
    status: 'complete',
    order: frameworks,
    frameworks: {},
  };
  const renderedTexts = {};
  const stagingDirectory = resolve(root, '.bench', `results-${process.pid}-${Date.now()}`);
  let browserFailure;

  await mkdir(resolve(directory, date), { recursive: true });
  for (const name of frameworks) {
    const app = await appConfig(name);

    if (!opts['skip-build']) await build(app);

    const record = {
      schemaVersion: 1,
      framework: name,
      label: app.label,
      generatedAt,
      mode,
      status: 'complete',
      environment: await environment(app),
      application: {
        streaming: app.streaming,
        notes: app.notes,
        clientEntryPattern: app.clientEntryPattern,
      },
      rawFile: `${date}/${name}.json`,
    };

    console.log(`MEASURE ${name} (${mode})`);
    const server = await start(app);
    try {
      // No Chromium process is running during HTTP or memory measurements.
      record.ttfb = await measureTtfb(app, server, opts);
      record.memory = await measureMemory(server);
      record.httpParity = await httpParity(app, server);
      let browser;

      if (!browserFailure) {
        try {
          browser = await launchBrowser();
        } catch (error) {
          await writeFile(resolve(server.runDirectory, 'browser-error.log'), error.message);
          const diagnostic = error.message.match(
            /Permission denied \(\d+\)|Executable doesn't exist[^\n]*|Host system is missing dependencies[^\n]*/,
          )?.[0];

          browserFailure = [error.message.split('\n')[0], diagnostic].filter(Boolean).join(' — ');
          console.error(`BROWSER UNAVAILABLE: ${browserFailure}`);
        }
      }

      if (browser) {
        try {
          record.environment.chromium = browser.version();
          record.sizes = await measureSizes(app, server, browser);
          record.interactive = await measureInteractive(app, server, opts, browser);
          renderedTexts[name] = await browserParity(app, server, browser);
          record.browserParity = { status: 'passed', routes: renderedTexts[name] };
        } finally {
          await browser.close();
        }
      } else {
        record.status = 'incomplete';
        result.status = 'incomplete';
        record.sizes = {
          routes: null,
          emitted: await emittedSizes(app),
          unavailable: browserFailure,
        };
        record.interactive = { unavailable: browserFailure };
        record.browserParity = { status: 'not-run', reason: browserFailure };
      }
    } finally {
      await server.stop();
    }
    record.coldStart = await measureColdStart(app, opts);
    result.frameworks[name] = record;
    await writeJson(resolve(stagingDirectory, record.rawFile), record);
    console.log(`MEASURED ${name}: ${record.status}`);
  }

  if (Object.keys(renderedTexts).length === frameworks.length) compareParity(renderedTexts);

  const serverTexts = Object.fromEntries(
    Object.entries(result.frameworks).map(([name, record]) => [
      name,
      Object.fromEntries(
        Object.entries(record.httpParity).map(([route, data]) => [route, data.text]),
      ),
    ]),
  );

  compareParity(serverTexts);
  // A failed metric/parity assertion never replaces latest. A browser launch failure is
  // explicitly published as incomplete so missing observations cannot look like zeroes.
  for (const record of Object.values(result.frameworks)) {
    await writeJson(resolve(directory, record.rawFile), record);
  }
  await writeJson(resolve(directory, frameworkResultsName), result);
  await renderReadme({
    resultsFile: resolve(directory, frameworkResultsName),
    outputFile: opts.output ? resolve(directory, 'README.md') : readmeFile,
  });
  console.log(`RESULT ${mode} ${result.status}: ${directory}/latest.json`);

  if (result.status !== 'complete') process.exitCode = 1;

  return result;
}

/** Measure each runtime in fresh identity and gzip processes using the single Boost build. */
async function runRuntimes(opts = {}) {
  const generatedAt = new Date().toISOString();
  const date = generatedAt.slice(0, 10);
  const directory = resolve(root, String(opts.output ?? 'results'));
  const mode = opts.quick ? 'quick' : 'full';
  const result = {
    schemaVersion: 1,
    generatedAt,
    date,
    mode,
    status: 'complete',
    order: runtimes,
    runtimes: {},
  };
  const parity = {};
  const stagingDirectory = resolve(root, '.bench', `runtimes-${process.pid}-${Date.now()}`);

  if (!opts['skip-build']) await build(await appConfig('boost'));

  for (const name of runtimes) {
    const app = await appConfig(name);
    const { label, runtime, compression } = app;
    const record = {
      schemaVersion: 1,
      runtime: name,
      engine: runtime,
      label,
      generatedAt,
      mode,
      status: 'complete',
      environment: await environment(app),
      application: { build: 'apps/boost/build', compression },
      rawFile: `${date}/runtimes/${name}.json`,
      encodings: {},
    };

    console.log(`MEASURE runtime ${name} (${mode})`);
    for (const encoding of ['identity', 'gzip']) {
      const server = await start(app);
      try {
        const settings = { ...opts, encoding };
        const ttfb = await measureTtfb(app, server, settings);
        const memory = await measureLeak(server, settings);
        const throughput = await measureThroughput(app, server, settings);

        record.encodings[encoding] = { ttfb, memory, throughput };
        record.environment.server = server.runtime;

        if (encoding === 'gzip') record.parity = await runtimeParity(app, server);
      } finally {
        await server.stop();
      }
    }
    record.coldStart = await measureColdStart(app, opts);
    result.runtimes[name] = record;
    parity[name] = record.parity;
    await writeJson(resolve(stagingDirectory, record.rawFile), record);
    console.log(
      `MEASURED runtime ${name}: complete (identity + gzip, ${record.coldStart.runs} cold starts, 10,000 extra requests per encoding)`,
    );
  }
  compareRuntimeParity(parity);
  for (const record of Object.values(result.runtimes))
    await writeJson(resolve(directory, record.rawFile), record);

  await writeJson(resolve(directory, 'latest-runtimes.json'), result);
  await renderReadme({
    resultsFile: resolve(directory, frameworkResultsName),
    outputFile: opts.output ? resolve(directory, 'README.md') : readmeFile,
  });
  console.log(`RESULT runtimes ${mode} complete: ${directory}/latest-runtimes.json`);

  return result;
}

/** Run the requested sections serially, building Boost once when both sections are selected. */
export async function run(opts = {}) {
  const names = selectedNames(opts);
  const includeFrameworks = names.some((name) => frameworks.includes(name));
  const includeRuntimes = names.some((name) => runtimes.includes(name));
  const results = {};

  if (opts.framework || opts.runtime)
    throw new Error(
      'The orchestrator publishes complete sections; select --frameworks-only or --runtimes-only',
    );

  if (includeFrameworks) results.frameworks = await runFrameworks(opts);

  if (includeRuntimes)
    results.runtimes = await runRuntimes({
      ...opts,
      'skip-build': opts['skip-build'] || includeFrameworks,
    });

  return results;
}

if (isMain(import.meta.url)) await run(options());
