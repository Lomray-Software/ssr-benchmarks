import { registerServer } from '../../bench/rss-hook.cjs';
import { createHono } from '../shared/hono.mjs';

const app = await createHono();
const server = Bun.serve({
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 3000),
  hostname: '127.0.0.1',
});

registerServer(server.port);
