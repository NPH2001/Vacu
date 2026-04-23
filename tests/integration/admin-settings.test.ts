import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

vi.mock('next/cache', () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));

let authed = true;
vi.mock('@/lib/session', () => ({
  getCurrentUser: async () => authed ? { id: 'u', email: 'a@b.c', name: 'A', role: 'admin' } : null,
  requireAdmin: async () => {
    if (!authed) throw new Error('unauthorized');
    return { id: 'u', email: 'a@b.c', name: 'A', role: 'admin' };
  },
  requireRole: async () => {
    if (!authed) throw new Error('unauthorized');
    return { id: 'u', email: 'a@b.c', name: 'A', role: 'admin' };
  },
  SESSION_COOKIE: 'x', setSessionCookie: async () => {}, clearSessionCookie: async () => {}, getSession: async () => null,
}));

let ctx: TestDb;

beforeAll(async () => {
  ctx = await bootPg();
  // seed the mandatory site_info row
  const { db } = await import('@/db/client');
  const { siteInfo } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const existing = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  if (existing.length === 0) {
    await db.insert(siteInfo).values({
      id: 1, name: 'Vacu', shortName: 'Vacu', tagline: 't', description: 'd',
      address: 'a', phone: 'p', email: 'admin@vacu.com.vn', hours: 'h',
      statFarmers: '1', statProducts: '1', statCustomers: '1', statYears: '1',
    });
  }
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

beforeEach(() => { authed = true; });

// Build a FormData with every required siteInfoSchema field populated.
function baseForm(): FormData {
  const fd = new FormData();
  const set = (k: string, v: string) => fd.set(k, v);

  set('name', 'Vacu');
  set('shortName', 'Vacu');
  set('tagline', 'Tagline');
  set('description', 'Description');
  set('address', '123 Đà Lạt');
  set('phone', '09xxxxxxxx');
  set('email', 'hello@vacu.com.vn');
  set('hours', '8-17');
  set('statFarmers', '80+');
  set('statProducts', '200+');
  set('statCustomers', '28k+');
  set('statYears', '12');

  set('heroBadge', 'Badge');
  set('heroImage', '/farm/hero.jpg');
  set('heroSubtitle', 'Subtitle');
  set('heroCtaPrimary', 'Go →');
  set('heroCtaSecondary', 'Meet farmers');

  set('subBoxBadge', 'SB');
  set('subBoxTitle', 'Weekly box');
  set('subBoxDescription', 'Fresh veggies');
  set('subBoxCta', 'Subscribe');
  set('subBoxLink', '/products?c=box');
  set('subBoxImage', '/farm/box.jpg');

  set('sectionCategoriesEyebrow', 'Categories');
  set('sectionCategoriesTitle', 'What do you need?');
  set('sectionFeaturedEyebrow', 'Featured');
  set('sectionFeaturedTitle', 'In season');
  set('sectionFarmersEyebrow', 'Meet');
  set('sectionFarmersTitle', 'Farmers');
  set('sectionTestimonialsTitle', 'Testimonials');
  set('sectionFaqTitle', 'FAQ');

  set('footerTagline', 'Clean rau.');

  set('contactDemoTitle', 'Demo');
  set('contactDemoText', 'Demo text');

  set('aboutHeroBadge', 'About');
  set('aboutHeroTitle', 'About title');
  set('aboutHeroImage', '/farm/about.jpg');
  set('aboutCommitmentsTitle', 'Commitments');
  set('aboutStatsTitle', 'Stats');
  set('aboutCtaTitle', 'CTA title');
  set('aboutCtaSubtitle', 'CTA subtitle');
  set('aboutCtaLabel', 'CTA label');

  return fd;
}

describe('updateSiteInfo', () => {
  it('blocks unauth', async () => {
    authed = false;
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    await expect(updateSiteInfo(null, baseForm())).rejects.toThrow();
  });

  it('happy path: full valid payload returns { ok: true } and persists', async () => {
    const fd = baseForm();
    // One story item, one commitment
    fd.append('aboutStory', 'Câu chuyện một.');
    fd.append('aboutStory', 'Câu chuyện hai.');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 'Trung thực');
    fd.append('aboutCommitmentDesc', 'Luôn minh bạch.');
    fd.append('subBoxFeatures', 'Tự gia hạn');
    fd.append('subBoxFeatures', 'Tham quan vườn');

    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res).toEqual({ ok: true });

    const { db } = await import('@/db/client');
    const { siteInfo } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(row.name).toBe('Vacu');
    expect(row.aboutStory).toEqual(['Câu chuyện một.', 'Câu chuyện hai.']);
    expect(row.aboutCommitments).toEqual([{ num: '01', title: 'Trung thực', desc: 'Luôn minh bạch.' }]);
    expect(row.subBoxFeatures).toEqual(['Tự gia hạn', 'Tham quan vườn']);
  });

  it('rejects invalid email', async () => {
    const fd = baseForm();
    fd.set('email', 'not-an-email');
    fd.append('aboutStory', 'x');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('drops blank aboutStory entries and does not count them', async () => {
    const fd = baseForm();
    fd.append('aboutStory', 'Real 1');
    fd.append('aboutStory', '   ');
    fd.append('aboutStory', '');
    fd.append('aboutStory', 'Real 2');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');

    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res).toEqual({ ok: true });
    const { db } = await import('@/db/client');
    const { siteInfo } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(row.aboutStory).toEqual(['Real 1', 'Real 2']);
  });

  it('commitments row is included only when all three fields (num/title/desc) non-empty', async () => {
    const fd = baseForm();
    fd.append('aboutStory', 'x');
    // Row 0: all three set → kept
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 'Title 1');
    fd.append('aboutCommitmentDesc', 'Desc 1');
    // Row 1: desc blank → dropped
    fd.append('aboutCommitmentNum', '02');
    fd.append('aboutCommitmentTitle', 'Title 2');
    fd.append('aboutCommitmentDesc', '');
    // Row 2: all three set → kept
    fd.append('aboutCommitmentNum', '03');
    fd.append('aboutCommitmentTitle', 'Title 3');
    fd.append('aboutCommitmentDesc', 'Desc 3');

    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res).toEqual({ ok: true });
    const { db } = await import('@/db/client');
    const { siteInfo } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(row.aboutCommitments).toEqual([
      { num: '01', title: 'Title 1', desc: 'Desc 1' },
      { num: '03', title: 'Title 3', desc: 'Desc 3' },
    ]);
  });

  it('smtpEnabled / bankEnabled truthy checkbox values toggle on; absence → off', async () => {
    const fd = baseForm();
    fd.append('aboutStory', 'x');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');
    fd.set('smtpEnabled', 'on');
    fd.set('smtpHost', 'smtp.example.com');
    fd.set('smtpPort', '465');
    fd.set('smtpSecure', 'on');
    fd.set('smtpFrom', 'noreply@vacu.com.vn');
    fd.set('bankEnabled', 'on');
    fd.set('bankBin', '970422');
    fd.set('bankName', 'MB');
    fd.set('bankAccountNumber', '123456789');
    fd.set('bankAccountHolder', 'NGUYEN VAN A');

    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    expect(await updateSiteInfo(null, fd)).toEqual({ ok: true });
    const { db } = await import('@/db/client');
    const { siteInfo } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(row.smtpEnabled).toBe(true);
    expect(row.smtpSecure).toBe(true);
    expect(row.smtpPort).toBe(465);
    expect(row.bankEnabled).toBe(true);
    expect(row.bankBin).toBe('970422');

    // Now omit toggles — should flip back to false
    const off = baseForm();
    off.append('aboutStory', 'x');
    off.append('aboutCommitmentNum', '01');
    off.append('aboutCommitmentTitle', 't');
    off.append('aboutCommitmentDesc', 'd');
    // No smtpEnabled / bankEnabled fields at all
    expect(await updateSiteInfo(null, off)).toEqual({ ok: true });
    const [row2] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(row2.smtpEnabled).toBe(false);
    expect(row2.bankEnabled).toBe(false);
    // port defaults to 587
    expect(row2.smtpPort).toBe(587);
  });

  it('rejects subBoxFeatures length > 8', async () => {
    const fd = baseForm();
    fd.append('aboutStory', 'x');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');
    for (let i = 0; i < 9; i++) fd.append('subBoxFeatures', `f${i}`);
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects aboutStory length > 10', async () => {
    const fd = baseForm();
    for (let i = 0; i < 11; i++) fd.append('aboutStory', `p${i}`);
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('persists taxCode + businessName (legal footer info)', async () => {
    const fd = baseForm();
    fd.append('aboutStory', 'x');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');
    fd.set('businessName', 'Hợp tác xã Nông nghiệp OCOP Việt Nam');
    fd.set('taxCode', '0123456789');

    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    expect(await updateSiteInfo(null, fd)).toEqual({ ok: true });

    const { db } = await import('@/db/client');
    const { siteInfo } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(row.businessName).toBe('Hợp tác xã Nông nghiệp OCOP Việt Nam');
    expect(row.taxCode).toBe('0123456789');
  });

  it('taxCode / businessName default to empty when field absent', async () => {
    const fd = baseForm();
    fd.append('aboutStory', 'x');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');
    // intentionally no taxCode / businessName fields

    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    expect(await updateSiteInfo(null, fd)).toEqual({ ok: true });

    const { db } = await import('@/db/client');
    const { siteInfo } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(row.taxCode).toBe('');
    expect(row.businessName).toBe('');
  });

  it('rejects taxCode > 40 chars and businessName > 200 chars', async () => {
    const fd = baseForm();
    fd.append('aboutStory', 'x');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');
    fd.set('taxCode', 't'.repeat(41));
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    expect((await updateSiteInfo(null, fd))?.error).toBeTruthy();

    const fd2 = baseForm();
    fd2.append('aboutStory', 'x');
    fd2.append('aboutCommitmentNum', '01');
    fd2.append('aboutCommitmentTitle', 't');
    fd2.append('aboutCommitmentDesc', 'd');
    fd2.set('businessName', 'b'.repeat(201));
    expect((await updateSiteInfo(null, fd2))?.error).toBeTruthy();
  });

  it('rejects smtpPort out of [1,65535]', async () => {
    const fd = baseForm();
    fd.append('aboutStory', 'x');
    fd.append('aboutCommitmentNum', '01');
    fd.append('aboutCommitmentTitle', 't');
    fd.append('aboutCommitmentDesc', 'd');
    fd.set('smtpEnabled', 'on');
    fd.set('smtpPort', '99999');
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res?.error).toBeTruthy();
  });
});
