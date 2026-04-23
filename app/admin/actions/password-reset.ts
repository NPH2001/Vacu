'use server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { randomBytes, createHash } from 'node:crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { users, passwordResetTokens, siteInfo } from '@/db/schema';
import { hashPassword } from '@/lib/auth';
import { sendTemplatedMail } from '@/lib/mail';
import { requestPasswordResetSchema, resetPasswordSchema } from '@/lib/validators';

export type RequestResetState = { ok?: boolean; error?: string } | null;
export type ResetPasswordState = { error?: string } | null;

const TOKEN_TTL_MINUTES = 60;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

async function currentOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _p: RequestResetState,
  fd: FormData,
): Promise<RequestResetState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: fd.get('email') });
  if (!parsed.success) return { error: 'Email không hợp lệ.' };

  // Always respond generic to avoid email enumeration
  const generic = { ok: true };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user) return generic;

  const [info] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  if (!info?.smtpEnabled) {
    return { error: 'Tính năng gửi mail chưa được cấu hình. Liên hệ quản trị viên.' };
  }

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    tokenHash,
    userId: user.id,
    expiresAt,
  });

  const origin = await currentOrigin();
  const resetLink = `${origin}/admin/reset-password?token=${rawToken}`;

  const res = await sendTemplatedMail('forgot_password', user.email, {
    siteName: info.name,
    userName: user.name || user.email,
    resetLink,
    expiresInMinutes: String(TOKEN_TTL_MINUTES),
  });
  if (!res.ok) return { error: `Không gửi được email: ${res.error}` };
  return generic;
}

export async function resetPassword(
  _p: ResetPasswordState,
  fd: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: fd.get('token'),
    password: fd.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const tokenHash = hashToken(parsed.data.token);
  const now = new Date();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, now),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);
  if (!row) return { error: 'Link đã hết hạn hoặc không hợp lệ. Yêu cầu đặt lại mới.' };

  const passwordHash = await hashPassword(parsed.data.password);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, row.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.tokenHash, tokenHash));
  });

  redirect('/admin/login?reset=1');
}
