import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { validateUpload, processImage, saveUpload } from '@/lib/uploads';

export async function POST(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Thiếu file' }, { status: 400 });

  try {
    validateUpload(file.type, file.size);
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }

  const inBuf = Buffer.from(await file.arrayBuffer());
  const outBuf = await processImage(inBuf);
  const url = await saveUpload(outBuf);
  return NextResponse.json({ url });
}
