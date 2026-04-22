import { describe, it, expect, beforeAll } from 'vitest';
import { validateUpload, processImage } from '@/lib/uploads';
import sharp from 'sharp';

let pngBuffer: Buffer;

beforeAll(async () => {
  pngBuffer = await sharp({
    create: { width: 200, height: 150, channels: 3, background: { r: 0, g: 128, b: 0 } },
  }).png().toBuffer();
});

describe('uploads', () => {
  it('rejects wrong mime', () => {
    expect(() => validateUpload('application/pdf', 100)).toThrow(/mime/i);
  });
  it('rejects too large', () => {
    expect(() => validateUpload('image/png', 10 * 1024 * 1024)).toThrow(/lớn/i);
  });
  it('accepts good input', () => {
    expect(() => validateUpload('image/png', 1024)).not.toThrow();
  });
  it('processImage returns webp under 1200w', async () => {
    const out = await processImage(pngBuffer);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(1200);
  });
});
