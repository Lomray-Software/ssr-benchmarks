# SSR benchmarks

<img src="https://raw.githubusercontent.com/Lomray-Software/vite-ssr-boost/prod/logo.png" alt="Vite SSR BOOST logo" width="120" height="120" />

A reproducible comparison of one small React application implemented with [vite-ssr-boost](https://lomray-software.github.io/vite-ssr-boost/), React Router Framework mode, Vike, TanStack Start, and Next.js. Maintained by Lomray Software, which also maintains vite-ssr-boost. The application contract is in [SPEC.md](SPEC.md); results describe this workload, not a general ranking of frameworks.

## Results

<!-- BENCHMARK_RESULTS_START -->

Run: 2026-09-06T20:30:52.946Z. Mode: **full**. Status: **complete**.
Compare within this run; shared CI hardware varies between runs.

| [Framework](results/latest.json) | [Cold start ms](results/latest.json) | [RSS MiB](results/latest.json) | [Emitted JS KiB (all / client)](results/latest.json) | [Counter ms](results/latest.json) | [Deferred visible ms](results/latest.json) |
| --- | ---: | ---: | ---: | ---: | ---: |
| [vite-ssr-boost](results/2026-09-06/boost.json) | [394.6](results/2026-09-06/boost.json) | [126.8](results/2026-09-06/boost.json) | [299.2 / 290.7](results/2026-09-06/boost.json) | [824.4](results/2026-09-06/boost.json) | [807.1](results/2026-09-06/boost.json) |
| [React Router Framework](results/2026-09-06/react-router-framework.json) | [369.6](results/2026-09-06/react-router-framework.json) | [123.1](results/2026-09-06/react-router-framework.json) | [328.2 / 313.3](results/2026-09-06/react-router-framework.json) | [926.1](results/2026-09-06/react-router-framework.json) | [804.5](results/2026-09-06/react-router-framework.json) |
| [Vike](results/2026-09-06/vike.json) | [434.0](results/2026-09-06/vike.json) | [124.0](results/2026-09-06/vike.json) | [306.0 / 282.0](results/2026-09-06/vike.json) | [1764.1](results/2026-09-06/vike.json) | [805.7](results/2026-09-06/vike.json) |
| [TanStack Start](results/2026-09-06/tanstack-start.json) | [272.4](results/2026-09-06/tanstack-start.json) | [111.7](results/2026-09-06/tanstack-start.json) | [1300.0 / 312.3](results/2026-09-06/tanstack-start.json) | [1983.1](results/2026-09-06/tanstack-start.json) | [817.4](results/2026-09-06/tanstack-start.json) |
| [Next.js](results/2026-09-06/next.json) | [567.7](results/2026-09-06/next.json) | [235.7](results/2026-09-06/next.json) | [1063.3 / 567.1](results/2026-09-06/next.json) | [1073.5](results/2026-09-06/next.json) | [825.0](results/2026-09-06/next.json) |

| [Framework](results/latest.json) | [Route](results/latest.json) | [Fetched JS gzip KiB (external + inline)](results/latest.json) | [TTFB ms p50 / p95 / p99](results/latest.json) | [Full response ms p50 / p95 / p99](results/latest.json) | [Body bytes p50](results/latest.json) |
| --- | --- | ---: | ---: | ---: | ---: |
| [vite-ssr-boost](results/2026-09-06/boost.json) | [/](results/2026-09-06/boost.json) | [91.0](results/2026-09-06/boost.json) | [6.8 / 13.1 / 17.8](results/2026-09-06/boost.json) | [6.9 / 13.2 / 17.9](results/2026-09-06/boost.json) | [941](results/2026-09-06/boost.json) |
| [vite-ssr-boost](results/2026-09-06/boost.json) | [/items](results/2026-09-06/boost.json) | [91.9](results/2026-09-06/boost.json) | [102.1 / 103.5 / 104.6](results/2026-09-06/boost.json) | [102.1 / 103.5 / 104.6](results/2026-09-06/boost.json) | [6216](results/2026-09-06/boost.json) |
| [vite-ssr-boost](results/2026-09-06/boost.json) | [/items/1](results/2026-09-06/boost.json) | [92.1](results/2026-09-06/boost.json) | [0.9 / 1.9 / 3.3](results/2026-09-06/boost.json) | [801.1 / 802.5 / 803.9](results/2026-09-06/boost.json) | [2542](results/2026-09-06/boost.json) |
| [React Router Framework](results/2026-09-06/react-router-framework.json) | [/](results/2026-09-06/react-router-framework.json) | [102.3](results/2026-09-06/react-router-framework.json) | [12.3 / 17.9 / 20.6](results/2026-09-06/react-router-framework.json) | [12.4 / 18.0 / 20.7](results/2026-09-06/react-router-framework.json) | [5047](results/2026-09-06/react-router-framework.json) |
| [React Router Framework](results/2026-09-06/react-router-framework.json) | [/items](results/2026-09-06/react-router-framework.json) | [103.0](results/2026-09-06/react-router-framework.json) | [111.2 / 115.0 / 119.1](results/2026-09-06/react-router-framework.json) | [111.3 / 115.0 / 119.2](results/2026-09-06/react-router-framework.json) | [10571](results/2026-09-06/react-router-framework.json) |
| [React Router Framework](results/2026-09-06/react-router-framework.json) | [/items/1](results/2026-09-06/react-router-framework.json) | [102.8](results/2026-09-06/react-router-framework.json) | [1.3 / 2.9 / 6.0](results/2026-09-06/react-router-framework.json) | [801.4 / 803.3 / 806.0](results/2026-09-06/react-router-framework.json) | [6572](results/2026-09-06/react-router-framework.json) |
| [Vike](results/2026-09-06/vike.json) | [/](results/2026-09-06/vike.json) | [85.3](results/2026-09-06/vike.json) | [11.7 / 16.3 / 22.9](results/2026-09-06/vike.json) | [11.7 / 16.4 / 22.9](results/2026-09-06/vike.json) | [1521](results/2026-09-06/vike.json) |
| [Vike](results/2026-09-06/vike.json) | [/items](results/2026-09-06/vike.json) | [85.5](results/2026-09-06/vike.json) | [102.5 / 104.7 / 106.9](results/2026-09-06/vike.json) | [102.5 / 104.8 / 106.9](results/2026-09-06/vike.json) | [5796](results/2026-09-06/vike.json) |
| [Vike](results/2026-09-06/vike.json) | [/items/1](results/2026-09-06/vike.json) | [88.7](results/2026-09-06/vike.json) | [1.3 / 2.8 / 5.8](results/2026-09-06/vike.json) | [802.5 / 804.9 / 808.0](results/2026-09-06/vike.json) | [2805](results/2026-09-06/vike.json) |
| [TanStack Start](results/2026-09-06/tanstack-start.json) | [/](results/2026-09-06/tanstack-start.json) | [100.0](results/2026-09-06/tanstack-start.json) | [8.0 / 15.0 / 21.2](results/2026-09-06/tanstack-start.json) | [8.0 / 15.0 / 21.3](results/2026-09-06/tanstack-start.json) | [1712](results/2026-09-06/tanstack-start.json) |
| [TanStack Start](results/2026-09-06/tanstack-start.json) | [/items](results/2026-09-06/tanstack-start.json) | [100.4](results/2026-09-06/tanstack-start.json) | [101.9 / 103.9 / 106.6](results/2026-09-06/tanstack-start.json) | [101.9 / 103.9 / 106.7](results/2026-09-06/tanstack-start.json) | [6044](results/2026-09-06/tanstack-start.json) |
| [TanStack Start](results/2026-09-06/tanstack-start.json) | [/items/1](results/2026-09-06/tanstack-start.json) | [101.0](results/2026-09-06/tanstack-start.json) | [1.1 / 2.1 / 3.5](results/2026-09-06/tanstack-start.json) | [801.1 / 802.6 / 804.7](results/2026-09-06/tanstack-start.json) | [3215](results/2026-09-06/tanstack-start.json) |
| [Next.js](results/2026-09-06/next.json) | [/](results/2026-09-06/next.json) | [131.6](results/2026-09-06/next.json) | [22.2 / 29.1 / 32.5](results/2026-09-06/next.json) | [22.2 / 29.2 / 32.8](results/2026-09-06/next.json) | [6018](results/2026-09-06/next.json) |
| [Next.js](results/2026-09-06/next.json) | [/items](results/2026-09-06/next.json) | [132.1](results/2026-09-06/next.json) | [102.3 / 104.5 / 107.1](results/2026-09-06/next.json) | [102.3 / 104.5 / 107.1](results/2026-09-06/next.json) | [15751](results/2026-09-06/next.json) |
| [Next.js](results/2026-09-06/next.json) | [/items/1](results/2026-09-06/next.json) | [132.3](results/2026-09-06/next.json) | [2.3 / 5.5 / 11.8](results/2026-09-06/next.json) | [801.8 / 803.7 / 807.8](results/2026-09-06/next.json) | [8232](results/2026-09-06/next.json) |

<!-- BENCHMARK_RESULTS_END -->

Each data cell links to its complete raw result, including samples, byte counts, settings, and environment metadata. Milliseconds and bytes are lower-is-less measurements, not scores. `not measured` means no observation was available. An **incomplete** result is not a successful benchmark. Quick runs check the tooling and must not be used to draw performance conclusions.

## Reproduce

Use Node **22.23.2**, npm, and Linux or macOS. Close unrelated CPU-intensive work and use an otherwise idle machine. No globally installed JavaScript tools are needed.

```sh
npm ci && npm run bench
```

The runner installs the lockfile's Chromium build using local Playwright if it is missing. Linux needs Playwright's [browser system dependencies](https://playwright.dev/docs/browsers#install-system-dependencies); on a minimal Ubuntu installation, run `npx playwright install --with-deps chromium` once. CI installs these before running the same command. Browser download time is outside the measurements.

The runner processes one application at a time: production build → start → HTTP load → RSS → correctness checks and browser measurements → stop → five fresh process starts. No app servers run concurrently. Chromium runs only after the HTTP and RSS measurements and is closed before cold-start measurement. Applications run with `NODE_ENV=production`. Build time is not a reported metric.

```sh
npm run bench -- --quick        # 5 warmups, 30 requests/route, 2 browser/cold-start runs
npm run build                  # all five production builds
npm run verify:parity          # browser text, clicks, links, and streaming correctness
npm run verify:parity -- --http # narrower server-only parity check
npm run test                   # harness correctness tests
npm run lint
npm run format:check
npm run smoke -- --seconds 10  # at least 10 seconds per metric per app
```

All scripts can also be invoked directly, for example `node bench/ttfb.mjs --framework vike --quick` or `node bench/sizes.mjs --framework next`. Each measurement script starts and stops its own already-built app and can save JSON with `--output /tmp/measurement.json`. `memory.mjs` performs its own TTFB run before reading RSS. `cold-start.mjs` starts fresh processes itself. Each app exposes `npm run build` and `PORT=3000 npm run start` from its directory.

The orchestrator writes `results/<UTC-date>/<framework>.json`, `results/latest.json`, and the README. A later run on the same date replaces that date's files; Git history and CI artifacts retain earlier committed runs. To keep an independent local run, use `npm run bench -- --output /tmp/my-ssr-results`; its README is written alongside those results. `--skip-build` is for checking existing artifacts and must not be used after editing an app. The CI smoke uses a separate output directory and never publishes its numbers.

## Methodology

**Application and versions.** Three routes share components, text, CSS, and deterministic JSON data: static content and a counter on `/`, a list after a 100 ms server delay on `/items`, and an immediate field plus an 800 ms streamed field on `/items/1`. All apps install React and React DOM 19.2.8. Next's own bundled App Router renderer version is also recorded; replacing it would change the default framework. Framework releases were selected with `npm view <package> version` and are pinned in `package-lock.json`. Weekly CI repeats these versions; updating frameworks requires a reviewed app/lockfile diff.

**JavaScript size (`bench/sizes.mjs`).** Playwright intercepts every request in a fresh Chromium context per route and records actual JavaScript response bodies, including module preloads and dynamically imported chunks. Cache is disabled and service workers are blocked. It waits for final route content and 500 ms of network quiet. Failed requests, browser errors, or an unmatched client entry pattern fail the measurement. The entry pattern in each `bench.json` is a sanity check, never a filter for which chunks count. Each fetched body is gzipped independently at level 9; this is a normalized transfer estimate, not a claim about the server's compression. The table includes external JS plus inline executable scripts from the complete HTML response, including hydration/Flight bootstrap scripts. External and inline subtotals, uncompressed bytes, and every observed request appear in raw JSON. Non-executable JSON and HTML are reflected in response byte counts. Emitted JS totals separately enumerate all `.js`, `.mjs`, and `.cjs` files in the production output (excluding build caches), and the client output subset. Emitted server code, manifests, and bundled dependencies vary with adapter packaging; emitted totals are not the page-load cost or an installed-dependency comparison. Source maps are excluded.

**HTTP (`bench/ttfb.mjs`).** For each route: 100 completed warmup requests, then 2,000 measured requests at concurrency 10 with HTTP/1.1 keep-alive and no pipelining. All samples, including slow ones, are retained. The client is a small Node HTTP loader on the same machine. It uses a fixed browser-like User-Agent to avoid bot-specific buffering, `Accept-Encoding: identity`, and no cookies. TTFB is the time from dispatch to Node's response-header event: it includes local connection acquisition/connect and receipt of headers, and is an operational approximation to first-byte arrival. Full-response time ends when the response body completes. Percentiles use nearest rank (p50/p95/p99). Raw results include per-request status, body bytes, reconstructed HTTP header bytes, and totals; byte counts exclude TCP/TLS and chunked framing. Any non-200, connection failure, or 10-second absolute timeout fails the run; errors are not discarded. The 800 ms delay dominates detail completion time and should not be interpreted as rendering CPU cost. This is a fixed-concurrency, closed-loop workload, not a saturation or open-loop latency test.

**Browser interaction (`bench/interactive.mjs`).** Median of five independent fresh-context runs for each scenario. Chromium DevTools network emulation adds 150 ms latency, 200,000 bytes/s download (1.6 Mbit/s), and 93,750 bytes/s upload (0.75 Mbit/s); no CPU slowdown. Cache and service workers are disabled. Measurements use the page's navigation time origin. On `/`, real mouse clicks begin as soon as the server-rendered button is visible and repeat at approximately 25 ms intervals until an observed count increment. There is no wait for a hydration marker or network idle; retries, browser scheduling, and input overhead bound timing precision. This measures the counter responding to input, not Lighthouse TTI. On `/items/1`, a pre-navigation observer plus animation-frame visibility checks records the final field becoming visible, excluding hidden streamed staging elements. That time includes the deliberate 800 ms delay and network throttling; it is not a hydration metric. Raw results retain all runs and click-attempt counts. HTTP measurements are unthrottled.

**Cold start (`bench/cold-start.mjs`).** Median of five fresh production processes from spawning `npm run start` until the first complete HTTP 200 on `/`. Readiness is polled every 25 ms. This includes npm launcher, module loading, framework startup, and first request work. OS filesystem caches stay warm; it is not serverless provisioning, a cold disk, a container pull, or a fresh VM. An unused port and a unique PID record prevent an unrelated server from satisfying readiness.

**Memory (`bench/memory.mjs`).** RSS in bytes from `process.memoryUsage.rss()` in the actual Node process listening on the app port, immediately after the last route's TTFB load and before browser work. A common startup-only preload identifies that PID and adds a signal handler to take the one sample. It adds no HTTP endpoint or per-request instrumentation. No forced GC, heap limit, or ongoing sampler is used. npm's launcher, the benchmark client, Chromium, and build workers are excluded. These Node adapters each run a single serving process. RSS is a point-in-time measurement, not peak memory or heap size. The same small preload is included in cold-start timing for every app. Server processes are tracked and stopped as owned process groups.

**Environment and variation.** Every framework result includes Node, npm when invoked through npm, CPU model/core count, OS/architecture, system memory, installed framework/React/Playwright versions, Chromium version when available, lockfile and source hashes, and CI commit/run identifiers when present. Apps run in the declared order in raw JSON. The order is fixed and disclosed; thermal drift and shared-host noise remain possible. Repeat complete runs and compare the raw distributions rather than treating tiny differences or weekly changes as causal. Full and quick results are explicitly distinguished.

## Scope and fairness

Production compilers, minification, code splitting, compression, and adapter settings use their defaults. The app contract requires only two rendering opt-ins: Vike streaming for the detail route, and Next `connection()` for request-time rendering instead of prerendered/cached pages. Ordinary anchors prevent prefetching and client-navigation caches from changing a fresh page-load workload. No application response/data cache, CDN, remote API, or optional performance tuning is added. Dataset JSON is loaded as a server module in every app; the simulated timers run again on every request. Browser cache is disabled regardless of default static-asset cache headers.

This does not compare CDN delivery, caching strategies, ISR, RSC-only features, Server Actions, client route transitions, database access, production traffic capacity, build speed, image/font optimization, or deployment platforms. Next uses native server/client boundaries and its normal RSC transport because App Router requires them; that transport contributes to the measured payload and is not removed. Different routers and runtime adapters remain part of their respective frameworks. Synthetic delays and this small UI cannot represent every application's workload.

## Automation and challenges

[Weekly CI](.github/workflows/bench.yml) runs Monday at 05:00 UTC and on manual dispatch, on `ubuntu-latest` with the pinned Node version. It uploads `results/` and commits successful full results and the generated README to `prod` using the default token. Set `prod` as the default branch for scheduled triggers and allow the default token to write contents; branch protection must permit the bot's result commit. A failed or incomplete run uploads available results but does not commit them. [PR checks](.github/workflows/check.yml) build all apps, run harness tests and parity, and smoke every metric for at least 10 seconds per app (an in-flight iteration is allowed to finish). They also run the quick orchestrator and README renderer with separate output.

To challenge a number, [open an issue](https://github.com/Lomray-Software/ssr-benchmarks/issues/new) with the raw JSON, environment, command, and **app diff** that reproduces the concern. Changes that make an implementation more idiomatic while preserving [SPEC.md](SPEC.md) are welcome from any framework's maintainers. Include before/after results on the same machine and disclose changed defaults. Do not compare values from different quick/full modes or hardware as if they were one experiment.

The README is generated from [bench/README.template.md](bench/README.template.md); `bench/render-readme.mjs` replaces the marker-delimited results section using `results/latest.json`. Edit methodology in the template and run `npm run readme`.

## Official setup references

- [Boost getting started](https://lomray-software.github.io/vite-ssr-boost/guide/getting-started), [loader streaming](https://lomray-software.github.io/vite-ssr-boost/guide/data-streaming), and the [`example/minimal` template](https://github.com/Lomray-Software/vite-template/tree/example/minimal). Package README: `npm view @lomray/vite-ssr-boost readme`.
- [React Router Framework installation](https://reactrouter.com/start/framework/installation) and [streaming with Suspense](https://reactrouter.com/how-to/suspense).
- [Vike getting started](https://vike.dev/new), [manual integration](https://vike.dev/add), [stream](https://vike.dev/stream), and [`react-streaming` useAsync](https://github.com/brillout/react-streaming#useasync).
- [TanStack Start getting started](https://tanstack.com/start/latest/docs/framework/react/getting-started), [build from scratch](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch), [deferred data](https://tanstack.com/router/latest/docs/guide/deferred-data-loading), and [Node/Nitro hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).
- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation) and [`connection()`](https://nextjs.org/docs/app/api-reference/functions/connection).

## License

[MIT](LICENSE), Copyright © 2026 Lomray Software.
