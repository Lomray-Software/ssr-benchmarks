import { Elysia } from 'elysia';
import { registerServer } from '../../bench/rss-hook.cjs';
import { gzipHandler } from '../shared/gzip.mjs';
import { createFetchHandler } from '../shared/handler.mjs';

const app = new Elysia()
  .mount(gzipHandler(await createFetchHandler()))
  .listen({ port: Number(process.env.PORT ?? 3000), hostname: '127.0.0.1' });

registerServer(app.server.port);
