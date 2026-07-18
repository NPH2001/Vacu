import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from './upload-limits';

/**
 * Browser-side upload used by ImageUpload, MediaPicker and MediaGrid, which
 * each had their own copy of this. The checks here are only to fail fast with a
 * useful message — /api/upload re-validates, since nothing from the browser can
 * be trusted.
 *
 * Throws with a message meant for display; callers show it as-is.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ chấp nhận ảnh (JPG, PNG, WebP).');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" quá lớn (tối đa ${MAX_UPLOAD_LABEL}).`);
  }

  const fd = new FormData();
  fd.set('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });

  let json: { url?: string; error?: string };
  try {
    json = await res.json();
  } catch {
    // A proxy timeout or a 502 returns HTML, not JSON — don't surface a parser
    // error to the admin.
    throw new Error('Tải ảnh lên thất bại. Thử lại giúp nhé.');
  }
  if (!res.ok || !json.url) throw new Error(json.error || 'Tải ảnh lên thất bại.');
  return json.url;
}
