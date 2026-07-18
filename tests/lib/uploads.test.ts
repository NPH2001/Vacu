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
    const { buf } = await processImage(pngBuffer);
    const meta = await sharp(buf).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(1200);
  });

  it('reports the dimensions of the processed image, not the source', async () => {
    const wide = await sharp({
      create: { width: 2400, height: 1200, channels: 3, background: { r: 0, g: 128, b: 0 } },
    }).png().toBuffer();

    const out = await processImage(wide);
    const meta = await sharp(out.buf).metadata();

    // The media library stores these to render the grid, so they must describe
    // the resized output rather than the original upload.
    expect(out.width).toBe(1200);
    expect(out.height).toBe(600);
    expect(out.width).toBe(meta.width);
    expect(out.height).toBe(meta.height);
  });
});
