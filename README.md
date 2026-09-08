# SSR benchmarks

<img src="https://raw.githubusercontent.com/Lomray-Software/vite-ssr-boost/prod/logo.png" alt="Vite SSR BOOST logo" width="120" height="120" />

A reproducible comparison of one small React application implemented with [vite-ssr-boost](https://lomray-software.github.io/vite-ssr-boost/), React Router Framework mode, Vike, TanStack Start, and Next.js. Maintained by Lomray Software, which also maintains vite-ssr-boost. The application contract is in [SPEC.md](SPEC.md); results describe this workload, not a general ranking of frameworks.

## Frameworks

<!-- BENCHMARK_RESULTS_START -->

Run: 2026-09-07T09:59:06.516Z. Mode: **full**. Status: **complete**.
Compare within this run; shared CI hardware varies between runs.

| [Framework](results/latest.json) | [Cold start ms](results/latest.json) | [RSS MiB](results/latest.json) | [Emitted JS KiB (all / client)](results/latest.json) | [Counter ms](results/latest.json) | [Deferred visible ms](results/latest.json) |
| --- | ---: | ---: | ---: | ---: | ---: |
| [vite-ssr-boost](results/2026-09-07/boost.json) | [398.8](results/2026-09-07/boost.json) | [128.5](results/2026-09-07/boost.json) | [299.2 / 290.7](results/2026-09-07/boost.json) | [827.9](results/2026-09-07/boost.json) | [817.4](results/2026-09-07/boost.json) |
| [React Router Framework](results/2026-09-07/react-router-framework.json) | [394.6](results/2026-09-07/react-router-framework.json) | [110.4](results/2026-09-07/react-router-framework.json) | [328.2 / 313.3](results/2026-09-07/react-router-framework.json) | [927.8](results/2026-09-07/react-router-framework.json) | [805.2](results/2026-09-07/react-router-framework.json) |
| [Vike](results/2026-09-07/vike.json) | [435.9](results/2026-09-07/vike.json) | [121.0](results/2026-09-07/vike.json) | [306.0 / 282.0](results/2026-09-07/vike.json) | [1766.2](results/2026-09-07/vike.json) | [806.8](results/2026-09-07/vike.json) |
| [TanStack Start](results/2026-09-07/tanstack-start.json) | [294.2](results/2026-09-07/tanstack-start.json) | [118.2](results/2026-09-07/tanstack-start.json) | [1300.0 / 312.3](results/2026-09-07/tanstack-start.json) | [1982.8](results/2026-09-07/tanstack-start.json) | [818.0](results/2026-09-07/tanstack-start.json) |
| [Next.js](results/2026-09-07/next.json) | [587.2](results/2026-09-07/next.json) | [229.2](results/2026-09-07/next.json) | [1063.3 / 567.1](results/2026-09-07/next.json) | [1074.2](results/2026-09-07/next.json) | [825.7](results/2026-09-07/next.json) |

| [Framework](results/latest.json) | [Route](results/latest.json) | [Fetched JS gzip KiB (external + inline)](results/latest.json) | [TTFB ms p50 / p95 / p99](results/latest.json) | [Full response ms p50 / p95 / p99](results/latest.json) | [Body bytes p50](results/latest.json) |
| --- | --- | ---: | ---: | ---: | ---: |
| [vite-ssr-boost](results/2026-09-07/boost.json) | [/](results/2026-09-07/boost.json) | [91.0](results/2026-09-07/boost.json) | [7.1 / 13.5 / 18.4](results/2026-09-07/boost.json) | [7.2 / 13.5 / 18.5](results/2026-09-07/boost.json) | [941](results/2026-09-07/boost.json) |
| [vite-ssr-boost](results/2026-09-07/boost.json) | [/items](results/2026-09-07/boost.json) | [91.9](results/2026-09-07/boost.json) | [102.1 / 104.1 / 106.2](results/2026-09-07/boost.json) | [102.2 / 104.2 / 106.3](results/2026-09-07/boost.json) | [6216](results/2026-09-07/boost.json) |
| [vite-ssr-boost](results/2026-09-07/boost.json) | [/items/1](results/2026-09-07/boost.json) | [92.1](results/2026-09-07/boost.json) | [1.0 / 2.3 / 3.9](results/2026-09-07/boost.json) | [801.4 / 803.3 / 805.4](results/2026-09-07/boost.json) | [2542](results/2026-09-07/boost.json) |
| [React Router Framework](results/2026-09-07/react-router-framework.json) | [/](results/2026-09-07/react-router-framework.json) | [102.3](results/2026-09-07/react-router-framework.json) | [12.7 / 18.0 / 22.2](results/2026-09-07/react-router-framework.json) | [12.8 / 18.1 / 22.3](results/2026-09-07/react-router-framework.json) | [5047](results/2026-09-07/react-router-framework.json) |
| [React Router Framework](results/2026-09-07/react-router-framework.json) | [/items](results/2026-09-07/react-router-framework.json) | [103.0](results/2026-09-07/react-router-framework.json) | [112.1 / 115.1 / 117.2](results/2026-09-07/react-router-framework.json) | [112.2 / 115.1 / 117.3](results/2026-09-07/react-router-framework.json) | [10571](results/2026-09-07/react-router-framework.json) |
| [React Router Framework](results/2026-09-07/react-router-framework.json) | [/items/1](results/2026-09-07/react-router-framework.json) | [102.8](results/2026-09-07/react-router-framework.json) | [1.7 / 3.8 / 6.7](results/2026-09-07/react-router-framework.json) | [801.7 / 804.8 / 807.6](results/2026-09-07/react-router-framework.json) | [6572](results/2026-09-07/react-router-framework.json) |
| [Vike](results/2026-09-07/vike.json) | [/](results/2026-09-07/vike.json) | [85.3](results/2026-09-07/vike.json) | [11.6 / 15.5 / 22.4](results/2026-09-07/vike.json) | [11.6 / 15.5 / 22.4](results/2026-09-07/vike.json) | [1521](results/2026-09-07/vike.json) |
| [Vike](results/2026-09-07/vike.json) | [/items](results/2026-09-07/vike.json) | [85.5](results/2026-09-07/vike.json) | [102.4 / 105.0 / 107.0](results/2026-09-07/vike.json) | [102.4 / 105.1 / 107.0](results/2026-09-07/vike.json) | [5796](results/2026-09-07/vike.json) |
| [Vike](results/2026-09-07/vike.json) | [/items/1](results/2026-09-07/vike.json) | [88.7](results/2026-09-07/vike.json) | [1.7 / 3.9 / 7.3](results/2026-09-07/vike.json) | [803.4 / 806.5 / 810.7](results/2026-09-07/vike.json) | [2805](results/2026-09-07/vike.json) |
| [TanStack Start](results/2026-09-07/tanstack-start.json) | [/](results/2026-09-07/tanstack-start.json) | [100.0](results/2026-09-07/tanstack-start.json) | [7.9 / 15.7 / 20.8](results/2026-09-07/tanstack-start.json) | [7.9 / 15.7 / 20.8](results/2026-09-07/tanstack-start.json) | [1712](results/2026-09-07/tanstack-start.json) |
| [TanStack Start](results/2026-09-07/tanstack-start.json) | [/items](results/2026-09-07/tanstack-start.json) | [100.4](results/2026-09-07/tanstack-start.json) | [102.2 / 104.0 / 105.7](results/2026-09-07/tanstack-start.json) | [102.3 / 104.0 / 105.7](results/2026-09-07/tanstack-start.json) | [6044](results/2026-09-07/tanstack-start.json) |
| [TanStack Start](results/2026-09-07/tanstack-start.json) | [/items/1](results/2026-09-07/tanstack-start.json) | [101.0](results/2026-09-07/tanstack-start.json) | [1.4 / 3.1 / 5.1](results/2026-09-07/tanstack-start.json) | [801.7 / 804.2 / 806.7](results/2026-09-07/tanstack-start.json) | [3215](results/2026-09-07/tanstack-start.json) |
| [Next.js](results/2026-09-07/next.json) | [/](results/2026-09-07/next.json) | [131.6](results/2026-09-07/next.json) | [22.4 / 28.7 / 34.7](results/2026-09-07/next.json) | [22.4 / 28.8 / 34.8](results/2026-09-07/next.json) | [6018](results/2026-09-07/next.json) |
| [Next.js](results/2026-09-07/next.json) | [/items](results/2026-09-07/next.json) | [132.1](results/2026-09-07/next.json) | [102.4 / 105.2 / 109.2](results/2026-09-07/next.json) | [102.4 / 105.3 / 109.3](results/2026-09-07/next.json) | [15751](results/2026-09-07/next.json) |
| [Next.js](results/2026-09-07/next.json) | [/items/1](results/2026-09-07/next.json) | [132.3](results/2026-09-07/next.json) | [2.8 / 9.7 / 16.4](results/2026-09-07/next.json) | [802.4 / 805.9 / 810.4](results/2026-09-07/next.json) | [8232](results/2026-09-07/next.json) |

<!-- BENCHMARK_RESULTS_END -->

Each data cell links to its complete raw result, including samples, byte counts, settings, and environment metadata. Milliseconds and bytes are lower-is-less measurements, not scores. `not measured` means no observation was available. An **incomplete** result is not a successful benchmark. Quick runs check the tooling and must not be used to draw performance conclusions.

## Runtimes

<!-- RUNTIME_RESULTS_START -->

Run `npm run bench` to generate results.

<!-- RUNTIME_RESULTS_END -->

All seven variants serve **one production build of `apps/boost`**. Express reuses the managed `ssr-boost start`; the other launchers import the built `App` and routes and use `core/handler`, `loadHtmlShell`, and `createRouteAssetPreparer({ buildDir })`. The shared static-file handler streams built client files with Express's default `Cache-Control: public, max-age=0`. It excludes the private HTML shell and dotfiles. Runtime parity compares complete HTML bytes on all three routes, decoded gzip against identity, all public static-file hashes, cache headers and validators, HEAD/304 responses, and 200/404 statuses. Identity detail responses must deliver the shell at least 600 ms before the deferred field. Browser parity additionally exercises hydration, counter clicks, links, and deferred visibility on every variant.

Each variant runs in **two fresh server processes**, identity then gzip. Each route has 100 completed warmups and 2,000 measured requests at 10 connections, followed by RSS sampling and exactly **10,000 additional `/` requests at 10 connections** for the second RSS sample. Higher-load runs use 50 and 100 connections, each with a fresh 100-request warmup and 2,000 measured requests per route. HTTP/1.1 keep-alive, no pipelining, the same client and User-Agent, absolute 10-second request timeouts, and nearest-rank percentiles apply throughout. Throughput is completed requests divided by measured batch wall time; its p99 is full-response latency. All latency samples, wire body sizes, and actual response encodings are retained. Warmups are excluded. Quick runs use 5 warmups and 30 requests at 10 connections, then 100 warmups and 200 requests at 50/100 connections; they retain the full 10,000-request memory probe and five cold starts. Cold start is a median of five fresh `npm start` processes with identity readiness requests. RSS growth is a point-in-time leak indicator, not a leak diagnosis; GC and allocator retention can increase or decrease it.

CPU is sampled **inside the listening server** on a signal immediately before and after each measured batch, after warmup. `process.cpuUsage()` deltas divided by completed requests report process CPU µs/request, including background threads such as compression workers. `process.threadCpuUsage()` separately reports main-thread CPU where supported; unavailable counters are reported as `not measured`. The resource table weights the three 10-connection routes by completed requests. Loader timer waits are elapsed time, not CPU work. Snapshot serialization, signal delivery, and their small boundary overhead remain in the measurement window; npm, Chromium, and the separate load client are excluded. No per-request instrumentation, forced GC, sampler, or HTTP control endpoint is installed. Node and Bun versions, serving runtime identity, framework and adapter versions, lockfile hash, and source hash are recorded in every runtime result. Bun's Node compatibility version is recorded separately from the Node benchmark-client version.

Compression stays enabled on the server; the client explicitly requests identity or gzip. **Express** uses managed `compression`; **node-http** uses the Boost Node adapter's incremental zlib gzip; **Fastify** uses its Fetch-response send path and `@fastify/compress` with `Z_SYNC_FLUSH` (Boost's Fastify adapter hijacks replies and would bypass that plugin); **Hono on Node and Bun** uses `compress()` and the runtime's `CompressionStream`; **Elysia and Bun.serve** use the same small zlib gzip wrapper with `Z_SYNC_FLUSH`. HTML must actually carry `Content-Encoding: gzip` in gzip runs. Express, Fastify, and Hono retain their default 1 KiB threshold for known-length static assets; the Node adapter and the Elysia/Bun.serve wrapper also compress smaller assets. Hono's native compression buffers decoded HTML until completion on the pinned Node and Bun versions: the raw parity result records decoded shell and deferred timing for gzip separately, and headers-received TTFB must not be mistaken for decoded HTML arrival. Compression bytes can differ while the decoded HTML remains identical.

This is a local, single-process server comparison. **workerd** needs a Worker bundle, bindings and a different asset/CPU accounting environment; **Deno** needs its own launcher and instrumentation. Neither is represented by a Node/Bun proxy or an estimated result. They are outside this matrix. Synthetic loader delays and a closed-loop local client do not establish production capacity.

## Reproduce

Use Node **22.23.2**, Bun **1.4.2**, npm, and Linux or macOS. Close unrelated CPU-intensive work and use an otherwise idle machine. Install Bun 1.4.2 with the [official installer](https://bun.com/docs/installation). An optional workspace installation keeps it in the ignored `.bench/` directory:

```sh
curl -fsSL https://bun.sh/install | BUN_INSTALL="$PWD/.bench/bun" bash -s "bun-v1.4.2"
export PATH="$PWD/.bench/bun/bin:$PATH"
```

The runner discovers `.bench/bun/bin/bun`, `BUN_BIN`, or Bun on PATH. Direct `npm start` commands in Bun variant directories require Bun on PATH. All other tools are workspace dependencies.

```sh
npm ci && npm run bench
```

The runner installs the lockfile's Chromium build using local Playwright if it is missing. Linux needs Playwright's [browser system dependencies](https://playwright.dev/docs/browsers#install-system-dependencies); on a minimal Ubuntu installation, run `npx playwright install --with-deps chromium` once. CI installs these before running the same command. Browser download time is outside the measurements.

The runner processes one application at a time: production build → start → HTTP load → RSS → correctness checks and browser measurements → stop → five fresh process starts. No app servers run concurrently. Chromium runs only after the HTTP and RSS measurements and is closed before cold-start measurement. Applications run with `NODE_ENV=production`. Build time is not a reported metric.

```sh
npm run bench -- --quick        # both sections; reduced samples, see runtime methodology
npm run bench -- --frameworks-only
npm run bench -- --runtimes-only
npm run build                  # five app builds, then runtime launcher syntax checks
npm run verify:parity          # browser text, clicks, links, and streaming correctness
npm run verify:parity -- --http # framework server-only parity check
npm run verify:parity -- --runtimes # exact runtime HTTP parity
npm run verify:parity -- --runtimes --browser # runtime browser checks too
npm run test                   # harness correctness tests
npm run lint
npm run format:check
npm run smoke -- --seconds 10  # both sections, at least 10 seconds per metric
npm run smoke -- --runtimes --seconds 10 # runtime metrics only
```

Framework quick runs use 5 warmups, 30 requests per route, and two browser/cold-start runs. Runtime quick counts are described above.

All scripts can also be invoked directly, for example `node bench/ttfb.mjs --framework vike --quick` or `node bench/sizes.mjs --framework next`. Runtime HTTP, memory, and cold-start scripts accept `--runtimes` for the complete matrix or `--runtime hono-bun` for one variant. For example, `node bench/ttfb.mjs --runtimes --quick` measures both encodings and all three connection counts. Each measurement script starts and stops its own already-built app and can save JSON with `--output /tmp/measurement.json`. `memory.mjs` performs its own TTFB run before reading RSS. `cold-start.mjs` starts fresh processes itself. Each app exposes `npm run build` and `PORT=3000 npm run start` from its directory.

The orchestrator writes `results/<UTC-date>/<framework>.json`, `results/latest.json`, `results/<UTC-date>/runtimes/<name>.json`, `results/latest-runtimes.json`, and the README. With both sections selected, the Boost application is built once and its output is reused by every runtime. A later run on the same date replaces that date's files; Git history and CI artifacts retain earlier committed runs. To keep an independent local run, use `npm run bench -- --output /tmp/my-ssr-results`; its README is written alongside those results. `--skip-build` is for checking existing artifacts and must not be used after editing an app. The CI smoke uses a separate output directory and never publishes its numbers.

## Methodology

**Application and versions.** Three routes share components, text, CSS, and deterministic JSON data: static content and a counter on `/`, a list after a 100 ms server delay on `/items`, and an immediate field plus an 800 ms streamed field on `/items/1`. All apps install React and React DOM 19.2.8. Next's own bundled App Router renderer version is also recorded; replacing it would change the default framework. Framework releases were selected with `npm view <package> version` and are pinned in `package-lock.json`. Weekly CI repeats these versions; updating frameworks requires a reviewed app/lockfile diff.

**JavaScript size (`bench/sizes.mjs`).** Playwright intercepts every request in a fresh Chromium context per route and records actual JavaScript response bodies, including module preloads and dynamically imported chunks. Cache is disabled and service workers are blocked. It waits for final route content and 500 ms of network quiet. Failed requests, browser errors, or an unmatched client entry pattern fail the measurement. The entry pattern in each `bench.json` is a sanity check, never a filter for which chunks count. Each fetched body is gzipped independently at level 9; this is a normalized transfer estimate, not a claim about the server's compression. The table includes external JS plus inline executable scripts from the complete HTML response, including hydration/Flight bootstrap scripts. External and inline subtotals, uncompressed bytes, and every observed request appear in raw JSON. Non-executable JSON and HTML are reflected in response byte counts. Emitted JS totals separately enumerate all `.js`, `.mjs`, and `.cjs` files in the production output (excluding build caches), and the client output subset. Emitted server code, manifests, and bundled dependencies vary with adapter packaging; emitted totals are not the page-load cost or an installed-dependency comparison. Source maps are excluded.

**HTTP (`bench/ttfb.mjs`).** For each route: 100 completed warmup requests, then 2,000 measured requests at concurrency 10 with HTTP/1.1 keep-alive and no pipelining. All samples, including slow ones, are retained. The client is a small Node HTTP loader on the same machine. It uses a fixed browser-like User-Agent to avoid bot-specific buffering, `Accept-Encoding: identity`, and no cookies. TTFB is the time from dispatch to Node's response-header event: it includes local connection acquisition/connect and receipt of headers, and is an operational approximation to first-byte arrival. Full-response time ends when the response body completes. Percentiles use nearest rank (p50/p95/p99). Raw results include per-request status, body bytes, reconstructed HTTP header bytes, and totals; byte counts exclude TCP/TLS and chunked framing. Any non-200, connection failure, or 10-second absolute timeout fails the run; errors are not discarded. The 800 ms delay dominates detail completion time and should not be interpreted as rendering CPU cost. This is a fixed-concurrency, closed-loop workload, not a saturation or open-loop latency test.

**Browser interaction (`bench/interactive.mjs`).** Median of five independent fresh-context runs for each scenario. Chromium DevTools network emulation adds 150 ms latency, 200,000 bytes/s download (1.6 Mbit/s), and 93,750 bytes/s upload (0.75 Mbit/s); no CPU slowdown. Cache and service workers are disabled. Measurements use the page's navigation time origin. On `/`, real mouse clicks begin as soon as the server-rendered button is visible and repeat at approximately 25 ms intervals until an observed count increment. There is no wait for a hydration marker or network idle; retries, browser scheduling, and input overhead bound timing precision. This measures the counter responding to input, not Lighthouse TTI. On `/items/1`, a pre-navigation observer plus animation-frame visibility checks records the final field becoming visible, excluding hidden streamed staging elements. That time includes the deliberate 800 ms delay and network throttling; it is not a hydration metric. Raw results retain all runs and click-attempt counts. HTTP measurements are unthrottled.

**Cold start (`bench/cold-start.mjs`).** Median of five fresh production processes from spawning `npm run start` until the first complete HTTP 200 on `/`. Readiness is polled every 25 ms. This includes npm launcher, module loading, framework startup, and first request work. OS filesystem caches stay warm; it is not serverless provisioning, a cold disk, a container pull, or a fresh VM. An unused port and a unique PID record prevent an unrelated server from satisfying readiness.

**Framework memory (`bench/memory.mjs`).** RSS in bytes from `process.memoryUsage.rss()` in the actual Node process listening on the app port, immediately after the last route's TTFB load and before browser work. A common startup-only preload identifies that PID and adds a signal handler to take the one sample. It adds no HTTP endpoint or per-request instrumentation. No forced GC, heap limit, or ongoing sampler is used. npm's launcher, the benchmark client, Chromium, and build workers are excluded. These Node adapters each run a single serving process. RSS is a point-in-time measurement, not peak memory or heap size. The same small preload is included in cold-start timing for every app. Server processes are tracked and stopped as owned process groups.

**Environment and variation.** Every framework result includes Node, npm when invoked through npm, CPU model/core count, OS/architecture, system memory, installed framework/React/Playwright versions, Chromium version when available, lockfile and source hashes, and CI commit/run identifiers when present. Apps run in the declared order in raw JSON. The order is fixed and disclosed; thermal drift and shared-host noise remain possible. Repeat complete runs and compare the raw distributions rather than treating tiny differences or weekly changes as causal. Full and quick results are explicitly distinguished.

## Scope and fairness

The Frameworks section uses production compiler, minification, code splitting, compression, and adapter defaults. Runtime transport and compression choices are disclosed above. The app contract requires only two rendering opt-ins: Vike streaming for the detail route, and Next `connection()` for request-time rendering instead of prerendered/cached pages. Ordinary anchors prevent prefetching and client-navigation caches from changing a fresh page-load workload. No application response/data cache, CDN, remote API, or optional performance tuning is added. Dataset JSON is loaded as a server module in every app; the simulated timers run again on every request. Browser cache is disabled regardless of default static-asset cache headers.

This does not compare CDN delivery, caching strategies, ISR, RSC-only features, Server Actions, client route transitions, database access, production traffic capacity, build speed, image/font optimization, or deployment platforms. Next uses native server/client boundaries and its normal RSC transport because App Router requires them; that transport contributes to the measured payload and is not removed. Different routers and runtime adapters remain part of their respective frameworks. Synthetic delays and this small UI cannot represent every application's workload.

## Automation and challenges

[Weekly CI](.github/workflows/bench.yml) runs Monday at 05:00 UTC and on manual dispatch, on `ubuntu-latest` with the pinned Node and Bun versions. It uploads `results/` and commits successful full results and the generated README to `prod` using the default token. Set `prod` as the default branch for scheduled triggers and allow the default token to write contents; branch protection must permit the bot's result commit. A failed or incomplete run uploads available results but does not commit them. [PR checks](.github/workflows/check.yml) build all apps, run harness tests and parity, and smoke every metric for at least 10 seconds per app (an in-flight iteration is allowed to finish). They also run the quick orchestrator and README renderer with separate output.

To challenge a number, [open an issue](https://github.com/Lomray-Software/ssr-benchmarks/issues/new) with the raw JSON, environment, command, and **app diff** that reproduces the concern. Changes that make an implementation more idiomatic while preserving [SPEC.md](SPEC.md) are welcome from any framework's maintainers. Include before/after results on the same machine and disclose changed defaults. Do not compare values from different quick/full modes or hardware as if they were one experiment.

The README is generated from [bench/README.template.md](bench/README.template.md); `bench/render-readme.mjs` replaces both marker-delimited sections using `results/latest.json` and `results/latest-runtimes.json`. Edit methodology in the template and run `npm run readme`.

## Official setup references

- [Boost Fetch core and runtime adapters](https://lomray-software.github.io/vite-ssr-boost/guide/runtime-adapters), [production helpers](https://lomray-software.github.io/vite-ssr-boost/api/node-production), and [deployment/compression](https://lomray-software.github.io/vite-ssr-boost/guide/deployment).
- [Fastify Fetch replies](https://fastify.dev/docs/latest/Reference/Reply/#response), [Fastify compression](https://github.com/fastify/fastify-compress), [Hono compression](https://hono.dev/docs/middleware/builtin/compress), [Hono Node server](https://github.com/honojs/node-server), [Elysia mount](https://elysiajs.com/patterns/mount), and [Bun HTTP server](https://bun.com/docs/runtime/http/server).
- [Node CPU counters](https://nodejs.org/docs/latest-v22.x/api/process.html#processcpuusagepreviousvalue) and [main-thread CPU counters](https://nodejs.org/docs/latest-v22.x/api/process.html#processthreadcpuusagepreviousvalue).
- [Boost getting started](https://lomray-software.github.io/vite-ssr-boost/guide/getting-started), [loader streaming](https://lomray-software.github.io/vite-ssr-boost/guide/data-streaming), and the [`example/minimal` template](https://github.com/Lomray-Software/vite-template/tree/example/minimal). Package README: `npm view @lomray/vite-ssr-boost readme`.
- [React Router Framework installation](https://reactrouter.com/start/framework/installation) and [streaming with Suspense](https://reactrouter.com/how-to/suspense).
- [Vike getting started](https://vike.dev/new), [manual integration](https://vike.dev/add), [stream](https://vike.dev/stream), and [`react-streaming` useAsync](https://github.com/brillout/react-streaming#useasync).
- [TanStack Start getting started](https://tanstack.com/start/latest/docs/framework/react/getting-started), [build from scratch](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch), [deferred data](https://tanstack.com/router/latest/docs/guide/deferred-data-loading), and [Node/Nitro hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).
- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation) and [`connection()`](https://nextjs.org/docs/app/api-reference/functions/connection).

## License

[MIT](LICENSE), Copyright © 2026 Lomray Software.
