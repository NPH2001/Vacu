import { describe, it, expect } from 'vitest';
import { vietQrImageUrl, findBank, VN_BANKS } from '@/lib/banks';

describe('findBank', () => {
  it('finds Vietcombank by BIN', () => {
    const b = findBank('970436');
    expect(b?.name).toBe('Vietcombank');
    expect(b?.short).toBe('VCB');
  });

  it('returns undefined for unknown BIN', () => {
    expect(findBank('000000')).toBeUndefined();
  });

  it('all banks have 6-digit numeric BIN', () => {
    for (const b of VN_BANKS) {
      expect(b.bin).toMatch(/^\d{6}$/);
      expect(b.short.length).toBeGreaterThan(0);
      expect(b.name.length).toBeGreaterThan(0);
    }
  });

  it('no duplicate BINs', () => {
    const set = new Set(VN_BANKS.map((b) => b.bin));
    expect(set.size).toBe(VN_BANKS.length);
  });
});

describe('vietQrImageUrl', () => {
  it('builds URL with compact2 template by default', () => {
    const url = vietQrImageUrl({
      bin: '970436',
      accountNumber: '123456',
      accountHolder: 'NGUYEN VAN A',
      amount: 50000,
      note: 'Thanh toan NTX-1234',
    });
    expect(url.startsWith('https://img.vietqr.io/image/970436-123456-compact2.png?')).toBe(true);
    expect(url).toContain('amount=50000');
    expect(url).toContain('addInfo=Thanh+toan+NTX-1234');
    expect(url).toContain('accountName=NGUYEN+VAN+A');
  });

  it('respects template override', () => {
    const url = vietQrImageUrl({
      bin: '970422',
      accountNumber: '987',
      accountHolder: 'A',
      amount: 1,
      note: 'x',
      template: 'qr_only',
    });
    expect(url).toContain('-qr_only.png');
  });

  it('URL-encodes Vietnamese in accountName', () => {
    const url = vietQrImageUrl({
      bin: '970436',
      accountNumber: '1',
      accountHolder: 'Nguyễn Thị Hiền',
      amount: 1,
      note: 'x',
    });
    // URLSearchParams encodes as percent-UTF8
    expect(url).toContain('accountName=');
    expect(url).toContain(encodeURIComponent('Nguyễn Thị Hiền').replace(/%20/g, '+'));
  });
});
