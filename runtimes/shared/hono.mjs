import adapterHono from '@lomray/vite-ssr-boost/adapters/hono';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { createFetchHandler } from './handler.mjs';

/** Keep Hono routing and compression identical on Node and Bun. */
export async function createHono() {
  const app = new Hono();

  app.use(compress({ encoding: 'gzip' }));
  app.all('*', adapterHono(await createFetchHandler()));

  return app;
}
