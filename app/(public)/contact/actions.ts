'use server';
import { z } from 'zod';
import { db } from '@/db/client';
import { siteInfo } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendMail } from '@/lib/mail';
import { rateLimit, clientIp } from '@/lib/rate-limit';

const schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(6).max(20),
  email: z.string().email().max(200),
  topic: z.string().min(1).max(120),
  message: z.string().min(1).max(2000),
});

export type ContactSubmitResult = { ok: true } | { ok: false; error: string };

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c),
  );
}

export async function submitContact(fd: FormData): Promise<ContactSubmitResult> {
  const parsed = schema.safeParse({
    name: fd.get('name'),
    phone: fd.get('phone'),
    email: fd.get('email'),
    topic: fd.get('topic'),
    message: fd.get('message'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  // Unauthenticated and it sends mail, so throttle per IP — otherwise a scripted
  // loop floods the admin inbox and burns the SMTP quota/reputation.
  if (!rateLimit(`contact:ip:${await clientIp()}`, { limit: 5, windowMs: 10 * 60_000 }).ok) {
    return { ok: false, error: 'Bạn gửi quá nhiều lần. Vui lòng thử lại sau ít phút.' };
  }

  const [info] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  if (!info) return { ok: false, error: 'Site chưa khởi tạo.' };
  if (!info.smtpEnabled) return { ok: false, error: 'Chưa cấu hình gửi mail. Admin vui lòng kiểm tra.' };

  const { name, phone, email, topic, message } = parsed.data;
  const html = `
    <div style="font-family: system-ui, sans-serif; color:#1a2e1a; line-height:1.5">
      <h2 style="color:#1f6b3a">Liên hệ mới từ website Vacu</h2>
      <p><strong>Chủ đề:</strong> ${esc(topic)}</p>
      <p><strong>Họ tên:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
      <p><strong>Điện thoại:</strong> ${esc(phone)}</p>
      <hr />
      <p style="white-space:pre-wrap">${esc(message)}</p>
      <p style="color:#688;font-size:12px;margin-top:30px">Gửi lúc ${new Date().toLocaleString('vi-VN')}</p>
    </div>
  `;

  const res = await sendMail({
    to: info.email,
    replyTo: email,
    subject: `[Vacu liên hệ] ${topic} — ${name}`,
    html,
    text: `Chủ đề: ${topic}\nHọ tên: ${name}\nEmail: ${email}\nĐiện thoại: ${phone}\n\n${message}`,
  });

  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}
