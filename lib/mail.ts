import 'server-only';
import nodemailer from 'nodemailer';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { siteInfo, emailTemplates } from '@/db/schema';

export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
};

async function getMailConfig(): Promise<MailConfig | null> {
  const rows = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  const r = rows[0];
  if (!r || !r.smtpEnabled) return null;
  if (!r.smtpHost || !r.smtpFrom) return null;
  return {
    host: r.smtpHost,
    port: r.smtpPort,
    secure: r.smtpSecure,
    user: r.smtpUser,
    pass: r.smtpPass,
    from: r.smtpFrom,
    fromName: r.smtpFromName || '',
  };
}

export type SendMailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

export type SendMailResult = { ok: true; messageId: string } | { ok: false; error: string };

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const cfg = await getMailConfig();
  if (!cfg) return { ok: false, error: 'SMTP chưa bật hoặc chưa cấu hình' };

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });

  try {
    const info = await transporter.sendMail({
      from: cfg.fromName ? `"${cfg.fromName}" <${cfg.from}>` : cfg.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c),
  );
}

export function renderTemplate(
  tpl: string,
  vars: Record<string, string>,
  rawKeys: string[] = [],
): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k] ?? '';
    return rawKeys.includes(k) ? v : escapeHtml(v);
  });
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function wrapWithShell({
  body, subject, header, footer,
}: { body: string; subject: string; header: string; footer: string }): string {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:20px;background:#f5f7f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a2e1a">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5ead8;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
      ${header ? `<tr><td>${header}</td></tr>` : ''}
      <tr><td style="padding:28px 28px 8px 28px">${body}</td></tr>
      ${footer ? `<tr><td>${footer}</td></tr>` : ''}
    </table>
  </td></tr></table>
</body>
</html>`;
}

async function getShellContext(): Promise<{
  header: string;
  footer: string;
  vars: Record<string, string>;
}> {
  const [info] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  const vars: Record<string, string> = {};
  if (info) {
    vars.siteName = info.name;
    vars.siteEmail = info.email;
    vars.sitePhone = info.phone;
    vars.siteAddress = info.address;
    vars.logoUrl = info.logoUrl ?? '';
    vars.year = String(new Date().getFullYear());
  }
  const headerTpl = info?.emailHeaderHtml || '';
  const footerTpl = info?.emailFooterHtml || '';
  return {
    header: headerTpl ? renderTemplate(headerTpl, vars, ['logoUrl']) : '',
    footer: footerTpl ? renderTemplate(footerTpl, vars) : '',
    vars,
  };
}

export async function sendTemplatedMail(
  key: string,
  to: string,
  vars: Record<string, string>,
  rawKeys: string[] = [],
  replyTo?: string,
): Promise<SendMailResult> {
  const [tpl] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, key)).limit(1);
  if (!tpl) return { ok: false, error: `Template "${key}" không tồn tại` };
  if (!tpl.enabled) return { ok: false, error: `Template "${key}" đang tắt` };

  const shell = await getShellContext();
  const mergedVars = { ...shell.vars, ...vars };
  const subject = renderTemplate(tpl.subject, mergedVars);
  const body = renderTemplate(tpl.bodyHtml, mergedVars, rawKeys);
  const html = wrapWithShell({ body, subject, header: shell.header, footer: shell.footer });
  const text = htmlToText(html);
  return sendMail({ to, subject, html, text, replyTo });
}

export async function verifyMailConfig(): Promise<SendMailResult> {
  const cfg = await getMailConfig();
  if (!cfg) return { ok: false, error: 'SMTP chưa bật hoặc chưa cấu hình' };
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  try {
    await transporter.verify();
    return { ok: true, messageId: 'verified' };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
