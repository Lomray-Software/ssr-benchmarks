import { serve } from '@hono/node-server';
import { createHono } from '../shared/hono.mjs';

const app = await createHono();

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000), hostname: '127.0.0.1' });
