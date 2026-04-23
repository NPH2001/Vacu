import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

// Auth state the mocks read from:
//   authedUserId: the `id` of the user the session resolves to.
//     null → no session → getCurrentUser returns null, requireRole/requireAdmin throws.
//   authedRole: role reported for the session.
let authedUserId: string | null = null;
let authedRole: 'admin' | 'staff' = 'admin';

async function currentRow() {
  if (!authedUserId) return null;
  const { db } = await import('@/db/client');
  const { users } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const [row] = await db.select().from(users).where(eq(users.id, authedUserId)).limit(1);
  return row ?? null;
}

vi.mock('@/lib/session', () => ({
  getCurrentUser: async () => currentRow(),
  requireAdmin: async () => {
    const u = await currentRow();
    if (!u) throw new Error('unauthorized');
    return u;
  },
  requireRole: async (role: 'admin' | 'staff') => {
    const u = await currentRow();
    if (!u) throw new Error('unauthorized');
    if (u.role !== role) throw new Error('forbidden');
    return u;
  },
  SESSION_COOKIE: 'ntx_session',
  setSessionCookie: async () => {},
  clearSessionCookie: async () => {},
  getSession: async () => null,
}));

let ctx: TestDb;
let adminId: string;
let staffId: string;

beforeAll(async () => {
  ctx = await bootPg();
  const { db } = await import('@/db/client');
  const { users } = await import('@/db/schema');
  const { hashPassword } = await import('@/lib/auth');

  const [a, s] = await db.insert(users).values([
    { email: 'admin-seed@vacu.com.vn', name: 'Admin Seed', role: 'admin',
      passwordHash: await hashPassword('adminpass123') },
    { email: 'staff-seed@vacu.com.vn', name: 'Staff Seed', role: 'staff',
      passwordHash: await hashPassword('staffpass123') },
  ]).returning();
  adminId = a.id;
  staffId = s.id;
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

beforeEach(() => {
  authedUserId = adminId;
  authedRole = 'admin';
});

// =====================================================================
// createUser
// =====================================================================
describe('createUser', () => {
  it('blocks unauthenticated', async () => {
    authedUserId = null;
    const { createUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'new@vacu.com.vn');
    fd.set('name', 'N');
    fd.set('role', 'staff');
    fd.set('password', 'longpassword');
    await expect(createUser(null, fd)).rejects.toThrow();
  });

  it('blocks staff (requireRole admin)', async () => {
    authedUserId = staffId;
    authedRole = 'staff';
    const { createUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'new@vacu.com.vn');
    fd.set('name', 'N');
    fd.set('role', 'staff');
    fd.set('password', 'longpassword');
    await expect(createUser(null, fd)).rejects.toThrow();
  });

  it('rejects invalid email', async () => {
    const { createUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'not-an-email');
    fd.set('name', 'N');
    fd.set('role', 'staff');
    fd.set('password', 'longpassword');
    expect((await createUser(null, fd))?.error).toBeTruthy();
  });

  it('rejects short password (<8)', async () => {
    const { createUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'short@vacu.com.vn');
    fd.set('name', 'N');
    fd.set('role', 'staff');
    fd.set('password', 'short');
    expect((await createUser(null, fd))?.error).toBeTruthy();
  });

  it('rejects invalid role (enum)', async () => {
    const { createUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'roletest@vacu.com.vn');
    fd.set('name', 'N');
    fd.set('role', 'superadmin'); // not in enum
    fd.set('password', 'longpassword');
    expect((await createUser(null, fd))?.error).toBeTruthy();
  });

  it('creates with hashed password (not plaintext)', async () => {
    const { createUser } = await import('@/app/admin/actions/users');
    const { db } = await import('@/db/client');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { verifyPassword } = await import('@/lib/auth');

    const fd = new FormData();
    fd.set('email', 'fresh@vacu.com.vn');
    fd.set('name', 'Fresh');
    fd.set('role', 'staff');
    fd.set('password', 'plaintext-password-1');
    await expect(createUser(null, fd)).rejects.toThrow();

    const [row] = await db.select().from(users).where(eq(users.email, 'fresh@vacu.com.vn'));
    expect(row.passwordHash).not.toBe('plaintext-password-1');
    expect(row.passwordHash).not.toContain('plaintext');
    expect(await verifyPassword('plaintext-password-1', row.passwordHash)).toBe(true);
    expect(row.role).toBe('staff');
  });

  it('returns Vietnamese error on duplicate email', async () => {
    const { createUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'admin-seed@vacu.com.vn'); // already exists
    fd.set('name', 'Dup');
    fd.set('role', 'admin');
    fd.set('password', 'longpassword');
    const res = await createUser(null, fd);
    expect(res?.error).toBe('Email đã tồn tại.');
  });
});

// =====================================================================
// updateUser
// =====================================================================
describe('updateUser', () => {
  it('blocks unauthenticated', async () => {
    authedUserId = null;
    const { updateUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'x@vacu.com.vn');
    fd.set('name', 'N');
    fd.set('role', 'staff');
    await expect(updateUser('some-id', null, fd)).rejects.toThrow();
  });

  it('updates email/name/role without password when password field empty', async () => {
    const { db } = await import('@/db/client');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { hashPassword } = await import('@/lib/auth');

    const [target] = await db.insert(users).values({
      email: 'upd-target@vacu.com.vn', name: 'UT', role: 'staff',
      passwordHash: await hashPassword('original-pw'),
    }).returning();
    const origHash = target.passwordHash;

    const { updateUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'upd-target-new@vacu.com.vn');
    fd.set('name', 'UT New');
    fd.set('role', 'admin');
    // password intentionally not set
    await expect(updateUser(target.id, null, fd)).rejects.toThrow();

    const [after] = await db.select().from(users).where(eq(users.id, target.id));
    expect(after.email).toBe('upd-target-new@vacu.com.vn');
    expect(after.name).toBe('UT New');
    expect(after.role).toBe('admin');
    expect(after.passwordHash).toBe(origHash); // unchanged
  });

  it('hashes new password when provided on update', async () => {
    const { db } = await import('@/db/client');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { hashPassword, verifyPassword } = await import('@/lib/auth');

    const [target] = await db.insert(users).values({
      email: 'upd-pw@vacu.com.vn', name: 'P', role: 'staff',
      passwordHash: await hashPassword('old-password-1'),
    }).returning();

    const { updateUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', target.email);
    fd.set('name', target.name);
    fd.set('role', target.role);
    fd.set('password', 'brand-new-password');
    await expect(updateUser(target.id, null, fd)).rejects.toThrow();

    const [after] = await db.select().from(users).where(eq(users.id, target.id));
    expect(await verifyPassword('brand-new-password', after.passwordHash)).toBe(true);
    expect(await verifyPassword('old-password-1', after.passwordHash)).toBe(false);
  });

  it('rejects duplicate email on update', async () => {
    const { db } = await import('@/db/client');
    const { users } = await import('@/db/schema');
    const { hashPassword } = await import('@/lib/auth');
    const [target] = await db.insert(users).values({
      email: 'dup-update-a@vacu.com.vn', name: 'A', role: 'staff',
      passwordHash: await hashPassword('password123'),
    }).returning();

    const { updateUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'admin-seed@vacu.com.vn'); // conflict
    fd.set('name', target.name);
    fd.set('role', target.role);
    const res = await updateUser(target.id, null, fd);
    expect(res?.error).toBe('Email đã tồn tại.');
  });

  it('short password (<8) rejected with error', async () => {
    const { updateUser } = await import('@/app/admin/actions/users');
    const fd = new FormData();
    fd.set('email', 'admin-seed@vacu.com.vn');
    fd.set('name', 'A');
    fd.set('role', 'admin');
    fd.set('password', 'abc');
    const res = await updateUser(adminId, null, fd);
    expect(res?.error).toBeTruthy();
  });
});

// =====================================================================
// deleteUser
// =====================================================================
describe('deleteUser', () => {
  it('blocks unauthenticated', async () => {
    authedUserId = null;
    const { deleteUser } = await import('@/app/admin/actions/users');
    await expect(deleteUser('anything')).rejects.toThrow();
  });

  it('forbids self-delete with Vietnamese message', async () => {
    const { deleteUser } = await import('@/app/admin/actions/users');
    await expect(deleteUser(adminId)).rejects.toThrow(/tự xóa tài khoản/);
  });

  it('deletes another user', async () => {
    const { db } = await import('@/db/client');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { hashPassword } = await import('@/lib/auth');
    const [target] = await db.insert(users).values({
      email: 'to-delete@vacu.com.vn', name: 'X', role: 'staff',
      passwordHash: await hashPassword('password123'),
    }).returning();

    const { deleteUser } = await import('@/app/admin/actions/users');
    await expect(deleteUser(target.id)).rejects.toThrow(); // redirect
    const [gone] = await db.select().from(users).where(eq(users.id, target.id));
    expect(gone).toBeUndefined();
  });
});

// =====================================================================
// account.changeOwnPassword
// =====================================================================
describe('account.changeOwnPassword', () => {
  let userId: string;
  const currentPassword = 'current-pw-1234';

  beforeEach(async () => {
    const { db } = await import('@/db/client');
    const { users } = await import('@/db/schema');
    const { hashPassword } = await import('@/lib/auth');
    const [row] = await db.insert(users).values({
      email: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@vacu.com.vn`,
      name: 'Chg', role: 'admin', passwordHash: await hashPassword(currentPassword),
    }).returning();
    userId = row.id;
    authedUserId = userId;
  });

  it('redirects to /admin/login when no session', async () => {
    authedUserId = null;
    const { changeOwnPassword } = await import('@/app/admin/actions/account');
    const fd = new FormData();
    fd.set('current', currentPassword);
    fd.set('next', 'brand-new-1');
    fd.set('confirm', 'brand-new-1');
    await expect(changeOwnPassword(null, fd)).rejects.toThrow();
  });

  it('rejects when current password is wrong', async () => {
    const { changeOwnPassword } = await import('@/app/admin/actions/account');
    const fd = new FormData();
    fd.set('current', 'WRONG-PASSWORD');
    fd.set('next', 'brand-new-1');
    fd.set('confirm', 'brand-new-1');
    const res = await changeOwnPassword(null, fd);
    expect(res?.error).toBe('Mật khẩu hiện tại không đúng.');
  });

  it('rejects when confirm != next', async () => {
    const { changeOwnPassword } = await import('@/app/admin/actions/account');
    const fd = new FormData();
    fd.set('current', currentPassword);
    fd.set('next', 'brand-new-1');
    fd.set('confirm', 'different-value-1');
    const res = await changeOwnPassword(null, fd);
    expect(res?.error).toBe('Mật khẩu mới không khớp');
  });

  it('rejects when next is shorter than 8 chars', async () => {
    const { changeOwnPassword } = await import('@/app/admin/actions/account');
    const fd = new FormData();
    fd.set('current', currentPassword);
    fd.set('next', 'short');
    fd.set('confirm', 'short');
    const res = await changeOwnPassword(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects when next equals current', async () => {
    const { changeOwnPassword } = await import('@/app/admin/actions/account');
    const fd = new FormData();
    fd.set('current', currentPassword);
    fd.set('next', currentPassword);
    fd.set('confirm', currentPassword);
    const res = await changeOwnPassword(null, fd);
    expect(res?.error).toBe('Mật khẩu mới phải khác mật khẩu cũ.');
  });

  it('happy path: returns ok and hash is re-rolled', async () => {
    const { changeOwnPassword } = await import('@/app/admin/actions/account');
    const { db } = await import('@/db/client');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { verifyPassword } = await import('@/lib/auth');

    const [before] = await db.select().from(users).where(eq(users.id, userId));
    const fd = new FormData();
    fd.set('current', currentPassword);
    fd.set('next', 'rock-solid-new');
    fd.set('confirm', 'rock-solid-new');
    const res = await changeOwnPassword(null, fd);
    expect(res?.ok).toBe(true);

    const [after] = await db.select().from(users).where(eq(users.id, userId));
    expect(after.passwordHash).not.toBe(before.passwordHash);
    expect(await verifyPassword('rock-solid-new', after.passwordHash)).toBe(true);
    expect(await verifyPassword(currentPassword, after.passwordHash)).toBe(false);
    expect(after.updatedAt.getTime()).toBeGreaterThanOrEqual(before.updatedAt.getTime());
  });

  it('rejects when current is empty (min(1))', async () => {
    const { changeOwnPassword } = await import('@/app/admin/actions/account');
    const fd = new FormData();
    fd.set('current', '');
    fd.set('next', 'some-long-password');
    fd.set('confirm', 'some-long-password');
    const res = await changeOwnPassword(null, fd);
    expect(res?.error).toBeTruthy();
  });
});
