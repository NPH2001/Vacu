import 'server-only';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export const MAX_SIZE = 4 * 1024 * 1024;
export const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateUpload(mime: string, size: number) {
  if (!ALLOWED.has(mime)) throw new Error(`Mime không hỗ trợ: ${mime}`);
  if (size > MAX_SIZE) throw new Error('File quá lớn (>4MB)');
}

export async function processImage(buf: Buffer): Promise<Buffer> {
  return sharp(buf).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
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

export async function deleteUploadIfReplaced(
  oldUrl: string | null | undefined,
  newUrl: string | null | undefined,
): Promise<void> {
  if (!oldUrl || oldUrl === newUrl) return;
  await deleteUpload(oldUrl);
}

