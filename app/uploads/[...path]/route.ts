// Stream uploaded files from UPLOADS_DIR. The Next.js standalone build
// snapshots the build-time `public/` tree, so files written into the
// runtime-mounted /app/public/uploads volume are not served by the static
// handler. This catch-all route reads them directly off disk.
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

function uploadsDir(): string {
  return process.env.UPLOADS_DIR || './public/uploads';
}

const MIME: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: parts } = await params;
  if (!parts || parts.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  const root = path.resolve(uploadsDir());
  const requested = path.resolve(root, ...parts);
  if (requested !== root && !requested.startsWith(root + path.sep)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const s = await stat(requested);
    if (!s.isFile()) return new Response('Not found', { status: 404 });
    const buf = await readFile(requested);
    const ext = path.extname(requested).slice(1).toLowerCase();
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Content-Length': String(s.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
