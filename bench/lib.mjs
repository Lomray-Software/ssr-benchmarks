import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, readdir, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { cpus, platform, release, arch, totalmem } from 'node:os';
import { resolve, dirname, relative } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const frameworks = ['boost', 'react-router-framework', 'vike', 'tanstack-start', 'next'];

export const runtimes = [
  'express',
  'node-http',
  'fastify',
  'hono-node',
  'hono-bun',
  'elysia-bun',
  'bun-serve',
];

export const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

export const networkProfile = {
  latencyMs: 150,
  downloadBytesPerSecond: 200000,
  uploadBytesPerSecond: 93750,
  cpuSlowdown: 1,
};

export const sleep = delay;

/** Distinguish direct script execution from harness imports. */
export const isMain = (url) =>
  process.argv[1] && url === pathToFileURL(resolve(process.argv[1])).href;

/** Read a UTF-8 JSON artifact. */
export const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

/** Publish JSON atomically so readers never observe a partial result. */
export async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;

  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
}

/** Parse the existing long-option CLI convention. */
export function options(argv = process.argv.slice(2)) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];

    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);

    result[key.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }

  return result;
}

/** Reject invalid sample counts before starting a measurement. */
export function numberOption(value, fallback, name) {
  const number = value === undefined ? fallback : Number(value);

  if (!Number.isInteger(number) || number < 1) throw new Error(`Invalid ${name}: ${value}`);

  return number;
}

/** Resolve a benchmark target while retaining the framework configuration contract. */
export async function appConfig(name) {
  const runtime = runtimes.includes(name);

  if (!runtime && !frameworks.includes(name)) throw new Error(`Unknown benchmark: ${name}`);

  const dir = resolve(root, runtime ? 'runtimes' : 'apps', name);

  return {
    ...(await readJson(resolve(dir, 'bench.json'))),
    dir,
    section: runtime ? 'runtimes' : 'frameworks',
  };
}

/** Select either matrix, rejecting contradictory section flags. */
export function selectedNames(opts = {}) {
  const {
    runtimes: runtimeMode,
    'runtimes-only': runtimesOnly,
    'frameworks-only': frameworksOnly,
    framework,
    runtime,
  } = opts;

  if (frameworksOnly && (runtimeMode || runtimesOnly || runtime))
    throw new Error('Choose either --frameworks-only or --runtimes-only');

  if (framework && (runtimeMode || runtimesOnly || runtime))
    throw new Error('Use --runtime to select a runtime variant');

  if (runtime) {
    if (!runtimes.includes(String(runtime))) throw new Error(`Unknown runtime: ${runtime}`);

    return [String(runtime)];
  }

  if (framework) {
    if (!frameworks.includes(String(framework))) throw new Error(`Unknown framework: ${framework}`);

    return [String(framework)];
  }

  return runtimeMode || runtimesOnly
    ? runtimes
    : frameworksOnly
      ? frameworks
      : [...frameworks, ...runtimes];
}

/** Prefer an explicitly selected Bun binary or the pinned workspace installation. */
export async function bunExecutable() {
  if (process.env.BUN_BIN) return process.env.BUN_BIN;

  const local = resolve(root, '.bench/bun/bin/bun');

  try {
    await access(local);

    return local;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;

    return 'bun';
  }
}

/** Keep all samples and select the nearest-rank percentile. */
export function percentile(values, p) {
  if (!values.length) throw new Error('No samples');

  const ordered = [...values].sort((a, b) => a - b);

  return ordered[Math.max(0, Math.ceil(p * ordered.length) - 1)];
}

/** Average the middle pair when a sample count is even. */
export function median(values) {
  if (!values.length) throw new Error('No samples');

  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);

  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

/** Report the same three latency quantiles throughout both matrices. */
export const summary = (values) => ({
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
  p99: percentile(values, 0.99),
});

/** Enumerate files deterministically while excluding generated directories. */
export async function filesIn(directory, excluded = []) {
  const output = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (excluded.includes(item.name)) continue;

    const file = resolve(directory, item.name);

    if (item.isDirectory()) output.push(...(await filesIn(file, excluded)));
    else if (item.isFile()) output.push(file);
  }

  return output.sort();
}

/** Record installed versions and source identity for the selected benchmark target. */
export async function environment({ dir, packages, name: appName, section }) {
  const require = createRequire(resolve(dir, 'package.json'));
  const versions = {};
  for (const name of [...packages, 'react', 'react-dom', 'playwright']) {
    // Read the nearest installed package, including packages without a root export.
    for (const directory of require.resolve.paths(name)) {
      try {
        const pkg = await readJson(resolve(directory, name, 'package.json'));

        if (pkg.name === name) {
          versions[name] = pkg.version;
          break;
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }

    if (!versions[name]) throw new Error(`Cannot find version: ${name}`);
  }
  const hash = createHash('sha256');
  for (const directory of ['apps', 'runtimes', 'shared', 'data', 'bench']) {
    for (const file of await filesIn(resolve(root, directory), [
      'node_modules',
      'build',
      'dist',
      '.next',
      '.output',
      '.nitro',
      '.react-router',
      '.tanstack',
    ])) {
      if (/routeTree\.gen\.ts$|next-env\.d\.ts$|\.tsbuildinfo$/.test(file)) continue;

      hash.update(relative(root, file));
      hash.update(await readFile(file));
    }
  }

  let gitCommit = null;
  try {
    gitCommit = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    // An unpacked source archive or a new repository can have no Git commit.
  }

  return {
    node: process.version,
    bun:
      section === 'runtimes'
        ? execFileSync(await bunExecutable(), ['--version'], {
            env: cleanEnv(),
            encoding: 'utf8',
          }).trim()
        : null,
    npm: process.env.npm_config_user_agent ?? null,
    cpu: { model: cpus()[0]?.model ?? 'unknown', logicalCores: cpus().length },
    os: { platform: platform(), release: release(), arch: arch() },
    totalMemoryBytes: totalmem(),
    versions,
    nextBundledReact: appName === 'next' ? require('next/dist/compiled/react').version : null,
    lockfileSha256: createHash('sha256')
      .update(await readFile(resolve(root, 'package-lock.json')))
      .digest('hex'),
    sourceSha256: hash.digest('hex'),
    gitCommit,
    ci: process.env.CI === 'true',
    runner: process.env.RUNNER_NAME ?? null,
    githubRunUrl: process.env.GITHUB_RUN_ID
      ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
  };
}

/** Keep launcher environment overrides consistent across CLI tools. */
export function cleanEnv(extra = {}) {
  const env = { ...process.env, ...extra };

  delete env.NO_COLOR;

  return env;
}

/** Run a checked command with inherited output. */
export async function command(bin, args, config = {}) {
  const child = spawn(bin, args, { cwd: root, env: cleanEnv(), stdio: 'inherit', ...config });

  await new Promise((resolvePromise, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`${bin} ${args.join(' ')} exited ${code ?? signal}`)),
    );
  });
}

/** Build a runtime's shared Boost application using its existing production build. */
export async function build({ name, dir, section }) {
  console.log(`BUILD ${section === 'runtimes' ? 'boost (shared runtime build)' : name}`);
  await command('npm', ['run', 'build'], {
    cwd: section === 'runtimes' ? resolve(root, 'apps/boost') : dir,
  });
}
const servers = new Set();
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    if (stopping) return;

    stopping = true;
    await Promise.allSettled([...servers].map((server) => server.stop()));
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });
}

/** Reserve an unused local port before spawning a server. */
async function availablePort(port) {
  const probe = createServer();

  await new Promise((resolvePromise, reject) => {
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', resolvePromise);
  });
  const chosen = probe.address().port;

  await new Promise((resolvePromise) => {
    probe.close(resolvePromise);
  });

  return chosen;
}

/** Start and track only the owned process group, including native Bun servers. */
export async function start({ name, dir, runtime }, { port = 0, timeoutMs = 30000 } = {}) {
  if (process.platform === 'win32')
    throw new Error('The process-group runner supports Linux and macOS.');

  port = await availablePort(port);
  const token = `${name}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const runDirectory = resolve(root, '.bench', token);

  await mkdir(runDirectory, { recursive: true });
  const pidFile = resolve(runDirectory, 'pid.json');
  const rssFile = resolve(runDirectory, 'rss.json');
  const logFile = resolve(runDirectory, 'server.log');
  const baseUrl = `http://127.0.0.1:${port}`;
  const hook = resolve(root, 'bench/rss-hook.cjs');
  const bun = runtime === 'bun' ? await bunExecutable() : null;
  const started = performance.now();
  const child = spawn('npm', ['run', 'start'], {
    cwd: dir,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: cleanEnv({
      NODE_ENV: 'production',
      PORT: String(port),
      HOST: '127.0.0.1',
      PATH: bun && bun !== 'bun' ? `${dirname(bun)}:${process.env.PATH}` : process.env.PATH,
      BENCH_PORT: String(port),
      BENCH_PID_FILE: pidFile,
      BENCH_RSS_FILE: rssFile,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require ${JSON.stringify(hook)}`,
    }),
  });
  let log = '';

  child.stdout.on('data', (chunk) => {
    log += chunk;
  });
  child.stderr.on('data', (chunk) => {
    log += chunk;
  });
  let spawnError;

  child.once('error', (error) => {
    spawnError = error;
  });
  let stopPromise;
  const server = {
    child,
    baseUrl,
    pidFile,
    rssFile,
    logFile,
    runDirectory,

    /** Stop the owned process group and retain its diagnostic log. */
    stop() {
      stopPromise ??= (async () => {
        try {
          process.kill(-child.pid, 'SIGTERM');
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
        const end = performance.now() + 3000;
        while (child.exitCode === null && child.signalCode === null && performance.now() < end)
          await sleep(25);
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
        await writeFile(logFile, log);
        servers.delete(server);
      })();

      return stopPromise;
    },
  };

  servers.add(server);
  try {
    while (performance.now() - started < timeoutMs) {
      if (spawnError) throw spawnError;

      if (child.exitCode !== null || child.signalCode !== null)
        throw new Error(`Server exited: ${log}`);

      try {
        const response = await fetch(baseUrl, {
          headers: { 'user-agent': userAgent, 'accept-encoding': 'identity' },
          signal: AbortSignal.timeout(500),
        });

        await response.arrayBuffer();

        if (response.status === 200) {
          server.coldStartMs = performance.now() - started;
          const pid = await readJson(pidFile);

          server.pid = pid.pid;
          server.runtime = pid;

          return server;
        }
      } catch (error) {
        if (
          error.code !== 'ENOENT' &&
          !(error instanceof TypeError) &&
          error.name !== 'TimeoutError' &&
          error.name !== 'AbortError'
        )
          throw error;
      }
      await sleep(25);
    }
    throw new Error(`No first 200 after ${timeoutMs} ms: ${log}`);
  } catch (error) {
    await server.stop();
    throw error;
  }
}

/** Run the same metric CLI against one framework or every requested runtime. */
export async function cliMeasure(measure, { needsServer = true, needsBuild = false } = {}) {
  const opts = options();
  const names =
    opts.runtimes || opts.runtime || opts['runtimes-only']
      ? selectedNames(opts)
      : [opts.framework ?? 'boost'];
  const results = {};
  for (const name of names) {
    const app = await appConfig(name);
    const { section } = app;

    if (needsBuild) await build(app);

    const result = {
      [section === 'runtimes' ? 'runtime' : 'framework']: name,
      environment: await environment(app),
    };
    const encodings = section === 'runtimes' && needsServer ? ['identity', 'gzip'] : [null];

    if (encodings[0]) result.encodings = {};

    for (const encoding of encodings) {
      const server = needsServer ? await start(app) : null;
      try {
        const value = await measure(app, server, { ...opts, ...(encoding ? { encoding } : {}) });

        if (encoding) result.encodings[encoding] = value;
        else Object.assign(result, value);
      } finally {
        await server?.stop();
      }
    }
    results[name] = result;
  }
  const output = names.length === 1 ? results[names[0]] : results;

  if (opts.output) await writeJson(resolve(String(opts.output)), output);

  console.log(JSON.stringify(output, null, 2));
}
