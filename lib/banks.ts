// Vietnamese banks supported by VietQR / NAPAS
// BIN codes per NAPAS standard — used to build VietQR image URL.
export const VN_BANKS = [
  { bin: '970436', short: 'VCB',  name: 'Vietcombank' },
  { bin: '970415', short: 'CTG',  name: 'VietinBank' },
  { bin: '970418', short: 'BIDV', name: 'BIDV' },
  { bin: '970405', short: 'VBA',  name: 'Agribank' },
  { bin: '970407', short: 'TCB',  name: 'Techcombank' },
  { bin: '970422', short: 'MB',   name: 'MB Bank' },
  { bin: '970416', short: 'ACB',  name: 'ACB' },
  { bin: '970432', short: 'VPB',  name: 'VPBank' },
  { bin: '970423', short: 'TPB',  name: 'TPBank' },
  { bin: '970403', short: 'STB',  name: 'Sacombank' },
  { bin: '970437', short: 'HDB',  name: 'HDBank' },
  { bin: '970443', short: 'SHB',  name: 'SHB' },
  { bin: '970448', short: 'OCB',  name: 'OCB' },
  { bin: '970431', short: 'EIB',  name: 'Eximbank' },
  { bin: '970429', short: 'SCB',  name: 'SCB' },
  { bin: '970440', short: 'SSB',  name: 'SeABank' },
  { bin: '970409', short: 'BAB',  name: 'Bac A Bank' },
  { bin: '970441', short: 'VIB',  name: 'VIB' },
  { bin: '970426', short: 'MSB',  name: 'MSB' },
  { bin: '970449', short: 'LPB',  name: 'LPBank' },
  { bin: '970454', short: 'VCCB', name: 'Viet Capital Bank' },
] as const;

export function findBank(bin: string) {
  return VN_BANKS.find((b) => b.bin === bin);
}

// VietQR image URL — free, no API key required.
// Template options: "compact" | "compact2" | "qr_only" | "print"
export function vietQrImageUrl(opts: {
  bin: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  note: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}) {
  const tpl = opts.template ?? 'compact2';
  const params = new URLSearchParams({
    amount: String(opts.amount),
    addInfo: opts.note,
    accountName: opts.accountHolder,
  });
  return `https://img.vietqr.io/image/${opts.bin}-${opts.accountNumber}-${tpl}.png?${params.toString()}`;
}
