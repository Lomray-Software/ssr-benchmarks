import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import createHandler from '@lomray/vite-ssr-boost/core/handler';
import { createRouteAssetPreparer, loadHtmlShell } from '@lomray/vite-ssr-boost/node/production';
import renderToStream from '@lomray/vite-ssr-boost/node/render-to-stream';
import { createElement } from 'react';
import { createStaticHandler } from 'react-router';
import { App, routes } from '../../apps/boost/build/server/server.js';
import { createStaticFiles } from './static.mjs';

const buildDir = fileURLToPath(new URL('../../apps/boost/build/', import.meta.url));

/** Reuse the compiled application with a fresh shell and matched assets for every request. */
export async function createFetchHandler() {
  const clientDir = resolve(buildDir, 'client');
  const staticFiles = await createStaticFiles(clientDir);
  const handler = createHandler(
    {
      /** Supply the same application component used by the managed entry. */
      createApp: (children) => createElement(App, null, children),
      handler: createStaticHandler(routes),
      renderToStream,
    },
    {
      getHtml: await loadHtmlShell({ indexFile: resolve(clientDir, 'index.html') }),
      prepare: createRouteAssetPreparer({ buildDir }),
    },
  );

  /** Serve built assets before handing document requests to the Fetch core. */
  return (request, context) => staticFiles(request) ?? handler(request, context);
}
