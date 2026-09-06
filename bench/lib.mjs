import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { cpus, platform, release, arch, totalmem } from 'node:os';
import { resolve, dirname, relative } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const frameworks = ['boost', 'react-router-framework', 'vike', 'tanstack-start', 'next'];

export const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

export const networkProfile = {
  latencyMs: 150,
  downloadBytesPerSecond: 200000,
  uploadBytesPerSecond: 93750,
  cpuSlowdown: 1,
};

export const sleep = delay;

export const isMain = (url) =>
  process.argv[1] && url === pathToFileURL(resolve(process.argv[1])).href;

export const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

export async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;

  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
}

export function options(argv = process.argv.slice(2)) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];

    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);

    result[key.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }

  return result;
}

export function numberOption(value, fallback, name) {
  const number = value === undefined ? fallback : Number(value);

  if (!Number.isInteger(number) || number < 1) throw new Error(`Invalid ${name}: ${value}`);

  return number;
}

export async function appConfig(name) {
  if (!frameworks.includes(name)) throw new Error(`Unknown framework: ${name}`);

  return {
    ...(await readJson(resolve(root, 'apps', name, 'bench.json'))),
    dir: resolve(root, 'apps', name),
  };
}

export function percentile(values, p) {
  if (!values.length) throw new Error('No samples');

  const ordered = [...values].sort((a, b) => a - b);

  return ordered[Math.max(0, Math.ceil(p * ordered.length) - 1)];
}

export function median(values) {
  if (!values.length) throw new Error('No samples');

  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);

  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

export const summary = (values) => ({
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
  p99: percentile(values, 0.99),
});

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

export async function environment(app) {
  const require = createRequire(resolve(app.dir, 'package.json'));
  const versions = {};
  for (const name of [...app.packages, 'react', 'react-dom', 'playwright']) {
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
  for (const directory of ['apps', 'shared', 'data', 'bench']) {
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
    npm: process.env.npm_config_user_agent ?? null,
    cpu: { model: cpus()[0]?.model ?? 'unknown', logicalCores: cpus().length },
    os: { platform: platform(), release: release(), arch: arch() },
    totalMemoryBytes: totalmem(),
    versions,
    nextBundledReact: app.name === 'next' ? require('next/dist/compiled/react').version : null,
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

export function cleanEnv(extra = {}) {
  const env = { ...process.env, ...extra };

  delete env.NO_COLOR;

  return env;
}

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

export async function build(app) {
  console.log(`BUILD ${app.name}`);
  await command('npm', ['run', 'build'], { cwd: app.dir });
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

export async function start(app, { port = 0, timeoutMs = 30000 } = {}) {
  if (process.platform === 'win32')
    throw new Error('The process-group runner supports Linux and macOS.');

  port = await availablePort(port);
  const token = `${app.name}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const runDirectory = resolve(root, '.bench', token);

  await mkdir(runDirectory, { recursive: true });
  const pidFile = resolve(runDirectory, 'pid.json');
  const rssFile = resolve(runDirectory, 'rss.json');
  const logFile = resolve(runDirectory, 'server.log');
  const baseUrl = `http://127.0.0.1:${port}`;
  const hook = resolve(root, 'bench/rss-hook.cjs');
  const started = performance.now();
  const child = spawn('npm', ['run', 'start'], {
    cwd: app.dir,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: cleanEnv({
      NODE_ENV: 'production',
      PORT: String(port),
      HOST: '127.0.0.1',
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
          headers: { 'user-agent': userAgent },
          signal: AbortSignal.timeout(500),
        });

        await response.arrayBuffer();

        if (response.status === 200) {
          server.coldStartMs = performance.now() - started;
          const pid = await readJson(pidFile);

          server.pid = pid.pid;

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

export async function cliMeasure(measure, { needsServer = true, needsBuild = false } = {}) {
  const opts = options();
  const app = await appConfig(opts.framework ?? 'boost');

  if (needsBuild) await build(app);

  const server = needsServer ? await start(app) : null;
  try {
    const result = {
      framework: app.name,
      environment: await environment(app),
      ...(await measure(app, server, opts)),
    };

    if (opts.output) await writeJson(resolve(String(opts.output)), result);

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await server?.stop();
  }
}
