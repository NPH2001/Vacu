import { NextResponse } from 'next/server';
import { getSiteInfo } from '@/lib/data';

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

// This endpoint is public and cacheable, but the site_info row also holds
// outgoing-mail credentials. Serializing the whole row would hand smtpPass /
// smtpUser / smtpHost to anyone who curls it (full mail-relay takeover), so
// every SMTP field is stripped before it leaves the server. Bank fields stay:
// they are already shown to customers in the payment QR on the orders page.
const SECRET_FIELDS = [
  'smtpEnabled', 'smtpHost', 'smtpPort', 'smtpSecure',
  'smtpUser', 'smtpPass', 'smtpFrom', 'smtpFromName',
] as const;

export async function GET() {
  const row = await getSiteInfo();
  const publicRow = { ...row };
  for (const k of SECRET_FIELDS) delete (publicRow as Record<string, unknown>)[k];
  return NextResponse.json({ data: publicRow }, { headers: { 'Cache-Control': CACHE } });
}
