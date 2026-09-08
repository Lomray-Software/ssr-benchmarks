import { constants } from 'node:zlib';
import compress from '@fastify/compress';
import Fastify from 'fastify';
import { createFetchHandler } from '../shared/handler.mjs';

const app = Fastify();
const handler = await createFetchHandler();

await app.register(compress, {
  encodings: ['gzip'],
  zlibOptions: { flush: constants.Z_SYNC_FLUSH },
});

/** Keep replies in Fastify's send lifecycle so its compression plugin handles the stream. */
app.all('/*', async ({ url, method, headers }, reply) => {
  const request = new Request(new URL(url, `http://${headers.host}`), { method, headers });

  return reply.send(await handler(request));
});

await app.listen({ port: Number(process.env.PORT ?? 3000), host: '127.0.0.1' });
