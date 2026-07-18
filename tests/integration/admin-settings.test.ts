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
  set('statFarmersLabel', 'Nông dân');
  set('statProductsLabel', 'Sản phẩm');
  set('statCustomersLabel', 'Khách hàng');
  set('statYearsLabel', 'Năm');

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
  set('sectionFaqSubtitle', 'Gọi {phone} nhé');

  set('footerTagline', 'Clean rau.');

  // Storefront copy — required in siteInfoSchema.
  set('navbarCta', 'Mua nông sản →');
  set('productsPageTitle', 'Toàn bộ nông sản');
  set('productsPageSubtitle', 'Rau củ, trái cây.');
  set('farmersHeroImage', '/farm/hero.jpg');
  set('farmersHeroEyebrow', 'Hậu phương');
  set('farmersHeroTitle', 'Người trồng rau');
  set('farmersHeroSubtitle', '{count} bà con nông dân.');
  set('newsTitle', 'Chuyện nhà nông');
  set('newsSubtitle', 'Mẹo hay.');
  set('contactTitle', 'Chúng tôi luôn lắng nghe');
  set('contactSubtitle', 'Gửi vài dòng.');
  set('orderSuccessNote', 'Cảm ơn bạn.');

  // Secondary UI copy — required in siteInfoSchema.
  set('sectionCategoriesLinkLabel', 'Tất cả');
  set('sectionFeaturedLinkLabel', 'Xem tất cả');
  set('sectionFarmersLinkLabel', 'Toàn bộ');
  set('listingBadge', 'Chợ nông trại');
  set('grownByLabel', 'Trồng bởi');
  set('productDetailHeading', 'Chi tiết sản phẩm');
  set('relatedProductsHeading', 'Có thể bạn thích');
  set('farmerStoryHeading', 'Câu chuyện nông trại');
  set('farmerProductsHeading', 'Sản phẩm của {name}');
  set('relatedPostsHeading', 'Bài viết khác');
  set('cartEmptyTitle', 'Giỏ trống');
  set('cartEmptyText', 'Chọn rau đi nào.');
  set('ordersEmptyTitle', 'Chưa có đơn nào');
  set('ordersEmptyText', 'Rau đang chờ bạn.');
  set('checkoutSlotNote', 'Rau thu hoạch sáng cùng ngày.');
  set('shippingLabel', 'Miễn phí');

  set('contactDemoTitle', 'Demo');
  set('contactDemoText', 'Demo text');

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
    expect(row.subBoxFeatures).toEqual(['Tự gia hạn', 'Tham quan vườn']);
    // Newly editable hero stat labels + FAQ subtitle round-trip.
    expect(row.statFarmersLabel).toBe('Nông dân');
    expect(row.statCustomersLabel).toBe('Khách hàng');
    expect(row.sectionFaqSubtitle).toBe('Gọi {phone} nhé');
  });

  it('rejects a blank hero stat label', async () => {
    const fd = baseForm();
    fd.set('statFarmersLabel', '');
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    expect((await updateSiteInfo(null, fd))?.error).toBeTruthy();
  });

  it('persists SEO/tracking fields and leaves them empty by default', async () => {
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const { db } = await import('@/db/client');
    const { siteInfo } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Empty by default (optional fields absent from the form).
    expect(await updateSiteInfo(null, baseForm())).toEqual({ ok: true });
    const [blank] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(blank.gaMeasurementId).toBe('');
    expect(blank.verificationGoogle).toBe('');
    expect(blank.siteUrl).toBe('');

    const fd = baseForm();
    fd.set('siteUrl', 'https://vacu.vn');
    fd.set('gaMeasurementId', 'G-ABC12345');
    fd.set('verificationGoogle', 'google-token');
    fd.set('verificationBing', 'bing-token');
    fd.set('verificationFacebook', 'fb-token');
    fd.set('footerBuiltByLabel', 'idflow.vn');
    fd.set('footerBuiltByUrl', 'https://idflow.vn');
    expect(await updateSiteInfo(null, fd)).toEqual({ ok: true });

    const [row] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    expect(row.gaMeasurementId).toBe('G-ABC12345');
    expect(row.verificationGoogle).toBe('google-token');
    expect(row.verificationBing).toBe('bing-token');
    expect(row.verificationFacebook).toBe('fb-token');
    expect(row.siteUrl).toBe('https://vacu.vn');
    expect(row.footerBuiltByUrl).toBe('https://idflow.vn');
  });

  it('rejects blank required storefront copy', async () => {
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const fd = baseForm();
    fd.set('navbarCta', '');
    expect((await updateSiteInfo(null, fd))?.error).toBeTruthy();
  });

  it('rejects a script-injection gaMeasurementId (auto-XSS guard)', async () => {
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const fd = baseForm();
    fd.set('gaMeasurementId', "');alert(document.domain);//");
    expect((await updateSiteInfo(null, fd))?.error).toBeTruthy();
  });

  it('rejects a javascript: social URL and footer URL (stored-XSS guard)', async () => {
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const f1 = baseForm();
    f1.set('socialFacebook', 'javascript:alert(1)');
    expect((await updateSiteInfo(null, f1))?.error).toBeTruthy();
    const f2 = baseForm();
    f2.set('footerBuiltByUrl', 'javascript:alert(1)');
    expect((await updateSiteInfo(null, f2))?.error).toBeTruthy();
  });

  it('rejects invalid email', async () => {
    const fd = baseForm();
    fd.set('email', 'not-an-email');
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('smtpEnabled / bankEnabled truthy checkbox values toggle on; absence → off', async () => {
    const fd = baseForm();
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
    for (let i = 0; i < 9; i++) fd.append('subBoxFeatures', `f${i}`);
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('persists taxCode + businessName (legal footer info)', async () => {
    const fd = baseForm();
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
    fd.set('taxCode', 't'.repeat(41));
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    expect((await updateSiteInfo(null, fd))?.error).toBeTruthy();

    const fd2 = baseForm();
    fd2.set('businessName', 'b'.repeat(201));
    expect((await updateSiteInfo(null, fd2))?.error).toBeTruthy();
  });

  it('rejects smtpPort out of [1,65535]', async () => {
    const fd = baseForm();
    fd.set('smtpEnabled', 'on');
    fd.set('smtpPort', '99999');
    const { updateSiteInfo } = await import('@/app/admin/actions/settings');
    const res = await updateSiteInfo(null, fd);
    expect(res?.error).toBeTruthy();
  });
});
