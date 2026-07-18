import 'server-only';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, ALLOWED_MIME } from './upload-limits';

// Single source shared with the browser — see lib/upload-limits.ts.
export const MAX_SIZE = MAX_UPLOAD_BYTES;
export const ALLOWED = new Set<string>(ALLOWED_MIME);

export function validateUpload(mime: string, size: number) {
  if (!ALLOWED.has(mime)) throw new Error(`Mime không hỗ trợ: ${mime}`);
  if (size > MAX_SIZE) throw new Error(`File quá lớn (>${MAX_UPLOAD_LABEL})`);
}

export type ProcessedImage = { buf: Buffer; width: number; height: number };

export async function processImage(buf: Buffer): Promise<ProcessedImage> {
  const { data, info } = await sharp(buf)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { buf: data, width: info.width, height: info.height };
}

function uploadsDir(): string {
  return process.env.UPLOADS_DIR || './public/uploads';
}

export async function saveUpload(buf: Buffer): Promise<string> {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dir = path.join(uploadsDir(), yyyy, mm);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/${yyyy}/${mm}/${filename}`;
}

const URL_PREFIX = '/uploads/';

export async function deleteUpload(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(URL_PREFIX)) return;
  const root = path.resolve(uploadsDir());
  const abs = path.resolve(root, url.slice(URL_PREFIX.length));
  if (abs !== root && !abs.startsWith(root + path.sep)) return;
  await rm(abs, { force: true });
}


