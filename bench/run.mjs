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
  start,
  writeJson,
} from './lib.mjs';
import { measureMemory } from './memory.mjs';
import { renderReadme } from './render-readme.mjs';
import { emittedSizes, measureSizes } from './sizes.mjs';
import { measureTtfb } from './ttfb.mjs';
import { httpParity, browserParity, compareParity } from './verify-parity.mjs';

export async function run(opts = {}) {
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
  await writeJson(resolve(directory, 'latest.json'), result);
  await renderReadme({
    resultsFile: resolve(directory, 'latest.json'),
    outputFile: opts.output ? resolve(directory, 'README.md') : resolve(root, 'README.md'),
  });
  console.log(`RESULT ${mode} ${result.status}: ${directory}/latest.json`);

  if (result.status !== 'complete') process.exitCode = 1;

  return result;
}

if (isMain(import.meta.url)) await run(options());
