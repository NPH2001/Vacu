import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { sendMail } from '@/lib/mail';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request): Promise<Response> {
  // Sends to a caller-supplied address using the server's SMTP — a mail-relay
  // primitive, so restrict it to full admins (not any authenticated staff).
  let me;
  try {
    me = await requireRole('admin');
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Throttle so it can't be driven as a relay/quota-abuse loop.
  if (!rateLimit(`test-mail:${me.id}`, { limit: 10, windowMs: 10 * 60_000 }).ok) {
    return NextResponse.json({ error: 'Gửi thử quá nhiều lần. Thử lại sau ít phút.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const to = String(body.to || me.email || '').trim();
  if (!to) return NextResponse.json({ error: 'Nhập email nhận thử nghiệm.' }, { status: 400 });

  const res = await sendMail({
    to,
    subject: '[Vacu] Test email từ admin',
    text: 'Nếu bạn nhận được email này, cấu hình SMTP đang hoạt động đúng.',
    html: `
      <div style="font-family: system-ui, sans-serif; color:#1a2e1a; line-height:1.5">
        <h2 style="color:#1f6b3a">Vacu — Test SMTP</h2>
        <p>Nếu bạn đọc được dòng này, cấu hình SMTP của Vacu đang <strong>hoạt động tốt</strong>.</p>
        <p style="color:#688;font-size:12px;margin-top:30px">Gửi tự động lúc ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    `,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ ok: true, to });
}
