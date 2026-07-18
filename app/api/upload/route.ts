import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { validateUpload, processImage, saveUpload } from '@/lib/uploads';
import { recordMedia } from '@/lib/media';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Cap uploads per user so a logged-in account can't spin the disk / sharp CPU.
  if (!rateLimit(`upload:${user.id}`, { limit: 60, windowMs: 60_000 }).ok) {
    return NextResponse.json({ error: 'Bạn tải ảnh quá nhanh, vui lòng thử lại sau giây lát.' }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Thiếu file' }, { status: 400 });

  try {
    validateUpload(file.type, file.size);
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }

  const inBuf = Buffer.from(await file.arrayBuffer());
  const { buf, width, height } = await processImage(inBuf);
  const url = await saveUpload(buf);

  const row = await recordMedia({
    url,
    filename: file.name || 'anh.webp',
    width,
    height,
    size: buf.byteLength,
    mime: 'image/webp',
    uploadedBy: user.id,
  });

  return NextResponse.json({ url, media: row });
}
