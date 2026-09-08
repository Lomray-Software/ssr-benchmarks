import { Duplex } from 'node:stream';
import { constants, createGzip } from 'node:zlib';

/** Compress a Fetch body incrementally, flushing each chunk while preserving cancellation. */
export function gzipHandler(handler) {
  /** Negotiate the benchmark's explicit gzip and identity modes without buffering HTML. */
  return async (request) => {
    const response = await handler(request);
    const { body, headers, status, statusText } = response;

    if (
      !body ||
      request.method === 'HEAD' ||
      headers.has('content-encoding') ||
      request.headers.get('accept-encoding') !== 'gzip'
    )
      return response;

    const compressedHeaders = new Headers(headers);

    compressedHeaders.delete('content-length');
    compressedHeaders.set('content-encoding', 'gzip');
    compressedHeaders.append('vary', 'Accept-Encoding');

    return new Response(
      body.pipeThrough(Duplex.toWeb(createGzip({ flush: constants.Z_SYNC_FLUSH }))),
      { headers: compressedHeaders, status, statusText },
    );
  };
}
