import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { Readable } from 'node:stream';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/** Index only files in the built client tree; request paths never become filesystem paths. */
export async function createStaticFiles(clientDir) {
  const files = new Map();

  /** Record metadata without caching file bodies or exposing the private HTML shell. */
  async function collect(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const { name } = entry;

      if (name.startsWith('.')) continue;

      const file = resolve(directory, name);
      const path = `${prefix}/${name}`;

      if (entry.isDirectory()) await collect(file, path);
      else if (entry.isFile() && path !== '/index.html') {
        const { size, mtime } = await stat(file);

        files.set(path, {
          file,
          headers: {
            'cache-control': 'public, max-age=0',
            'content-type': contentTypes[extname(file)] ?? 'application/octet-stream',
            'content-length': String(size),
            'last-modified': mtime.toUTCString(),
            etag: `W/"${size.toString(16)}-${mtime.getTime().toString(16)}"`,
          },
        });
      }
    }
  }

  await collect(clientDir);

  /** Stream the same bytes and cache policy for GET and HEAD across Fetch transports. */
  return ({ url, method, headers: requestHeaders }) => {
    if (method !== 'GET' && method !== 'HEAD') return null;

    const entry = files.get(new URL(url).pathname);

    if (!entry) return null;

    const { file, headers } = entry;
    const validators = requestHeaders.get('if-none-match');
    const modifiedSince = requestHeaders.get('if-modified-since');
    const matches = validators
      ? validators
          .split(',')
          .some(
            (value) =>
              value.trim() === '*' ||
              value.trim().replace(/^W\//, '') === headers.etag.replace(/^W\//, ''),
          )
      : modifiedSince && Date.parse(headers['last-modified']) <= Date.parse(modifiedSince);

    if (matches && !requestHeaders.get('cache-control')?.includes('no-cache'))
      return new Response(null, {
        status: 304,
        headers: {
          etag: headers.etag,
          'cache-control': headers['cache-control'],
          'last-modified': headers['last-modified'],
        },
      });

    return new Response(method === 'HEAD' ? null : Readable.toWeb(createReadStream(file)), {
      headers,
    });
  };
}
