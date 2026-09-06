# Application specification

The five apps render the components in `shared/ui.tsx` and `shared/counter.tsx`, use the single stylesheet `shared/style.css`, and read `data/items.json` through `shared/data.server.ts`. The dataset contains 50 deterministic records, IDs 1–50. No external data or assets are fetched. All pages have the title `SSR benchmark` and language `en`.

## Common document content

The application is `div#benchmark-app`, containing a header with `nav[aria-label="Main navigation"]`, then `main`. The navigation contains `Home` linking to `/` and `Items` linking to `/items`. All links are ordinary anchors: every navigation requests a document. The shared `data-vike="false"` anchor attribute opts out of Vike's automatic link interception. It is present in every app, so application markup remains identical. Router transitions and prefetching are outside this workload.

- `/`: a section, heading `SSR benchmark`, paragraph `A small React application with server-rendered data.`, and one button displaying `Count: 0`. Each click increments its local React state by one. The counter is the only interactive control beyond navigation.
- `/items`: await a fresh 100 ms server timer for each request, then display a section with heading `Items`, paragraph `50 items, loaded on the server.`, and an unordered list of 50 links, from `Item 01` through `Item 50`. Each link points to `/items/<id>`. Only IDs and names are returned for this list.
- `/items/:id`: display an article with the item's name as its heading, then `Available immediately.`. Start a fresh 800 ms server timer for its description. A Suspense boundary initially displays `Loading details…`, then replaces it with `Details for item NN.`. `/items/1` is the measured detail route. The immediate field must arrive at least 600 ms before the deferred field, and the deferred field must take at least 750 ms from request start in the unthrottled correctness check. The tolerance allows scheduler and transport overhead without treating the timer as a precision clock.

The markers `data-bench-counter`, `data-bench-immediate`, `data-bench-pending`, `data-bench-deferred`, and `data-bench-ready` identify the same elements in every app. They do not signal hydration or alter rendering. Framework document wrappers, bootstrap scripts, serialization, and Suspense transport are allowed to differ. The application elements, visible text, links, and CSS are shared.

## Framework integration

- **Boost:** React Router Data mode route objects with lazy items and detail modules, managed Express server, the documented client/server entries, and default footer hydration. Loader promises are rendered with React Router `Await` and React `Suspense`. The shared ordinary anchors keep loaders on the server; hydration uses the serialized loader result.
- **React Router Framework:** route modules, server loaders, `Await` and `Suspense`, the generated default server entry, and `react-router-serve`.
- **Vike:** `vike-react`, server `+data` for the list and immediate detail, and `react-streaming`'s request-scoped `useAsync` for the deferred field. `stream: true` is enabled on the detail route because Vike defaults to buffered HTML. `useAsync` transfers its SSR result to hydration; no application cache or query library is added. Express serves the built client files and pipes `renderPage().httpResponse`.
- **TanStack Start:** file routes, `createServerFn` for server-only data, a promise in loader data, and `Await`/`Suspense`. The documented Nitro Vite integration supplies the Node server; the exact Nitro adapter release is locked, including its upstream beta designation.
- **Next.js:** App Router with a client counter, server-loaded list and async detail component within Suspense. Root `connection()` opts all pages into request-time SSR so the static-content home and simulated data are not served from the Full Route Cache. No other build or cache settings are changed.

Every framework supports the required streaming workload; no app awaits the deferred field before sending its shell. Compiler, minifier, chunk splitting, compression, and server adapter defaults are retained. The Vike streaming setting and Next request-time rendering opt-in implement the specification, rather than tune performance.

All workspaces pin the same installed `react` and `react-dom` versions (19.2.8). Next also embeds its own React implementation for App Router; its bundled version is recorded as `environment.nextBundledReact`. Identical installed dependencies do not imply identical internal framework renderers. Versions are locked, not updated during a run.

## Correctness

`npm run verify:parity` starts the built apps, compares actual browser-rendered application text against this specification and across all five apps, checks counter clicks and links, and fails on browser errors or a remaining/duplicate deferred field. It also checks the server delays and progressive response chunks over HTTP.

`npm run verify:parity -- --http` checks completed SSR application text, expected content, status codes, and streaming timing without a browser. It reads deferred staging fragments and excludes scripts and temporary fallbacks. This narrower check cannot validate hydration or that a browser inserts and displays a streamed fragment. Its output labels that limitation.
