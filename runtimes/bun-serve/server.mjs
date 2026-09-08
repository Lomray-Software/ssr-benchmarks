import { registerServer } from '../../bench/rss-hook.cjs';
import { gzipHandler } from '../shared/gzip.mjs';
import { createFetchHandler } from '../shared/handler.mjs';

const server = Bun.serve({
  fetch: gzipHandler(await createFetchHandler()),
  port: Number(process.env.PORT ?? 3000),
  hostname: '127.0.0.1',
});

registerServer(server.port);
