import { createServer } from 'node:http';
import adapterNode from '@lomray/vite-ssr-boost/adapters/node';
import { createFetchHandler } from '../shared/handler.mjs';

createServer(adapterNode(await createFetchHandler(), { compression: 'gzip' })).listen(
  Number(process.env.PORT ?? 3000),
  '127.0.0.1',
);
