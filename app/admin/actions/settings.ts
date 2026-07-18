'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { siteInfo } from '@/db/schema';
import { siteInfoSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type SettingsFormState = { error?: string; ok?: boolean } | null;

function parseFeatures(fd: FormData): string[] {
  const raw = fd.getAll('subBoxFeatures');
  return raw
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0);
}

export async function updateSiteInfo(_prev: SettingsFormState, fd: FormData): Promise<SettingsFormState> {
  await requireAdmin();
  const parsed = siteInfoSchema.safeParse({
    name: fd.get('name'),
    shortName: fd.get('shortName'),
    tagline: fd.get('tagline'),
    description: fd.get('description'),
    address: fd.get('address'),
    phone: fd.get('phone'),
    email: fd.get('email'),
    hours: fd.get('hours'),
    taxCode: fd.get('taxCode') ?? '',
    businessName: fd.get('businessName') ?? '',
    statFarmers: fd.get('statFarmers'),
    statProducts: fd.get('statProducts'),
    statCustomers: fd.get('statCustomers'),
    statYears: fd.get('statYears'),
    statFarmersLabel: fd.get('statFarmersLabel'),
    statProductsLabel: fd.get('statProductsLabel'),
    statCustomersLabel: fd.get('statCustomersLabel'),
    statYearsLabel: fd.get('statYearsLabel'),

    heroBadge: fd.get('heroBadge'),
    heroImage: fd.get('heroImage'),
    heroSubtitle: fd.get('heroSubtitle'),
    heroCtaPrimary: fd.get('heroCtaPrimary'),
    heroCtaSecondary: fd.get('heroCtaSecondary'),

    subBoxBadge: fd.get('subBoxBadge'),
    subBoxTitle: fd.get('subBoxTitle'),
    subBoxDescription: fd.get('subBoxDescription'),
    subBoxFeatures: parseFeatures(fd),
    subBoxCta: fd.get('subBoxCta'),
    subBoxLink: fd.get('subBoxLink'),
    subBoxImage: fd.get('subBoxImage'),

    sectionCategoriesEyebrow: fd.get('sectionCategoriesEyebrow'),
    sectionCategoriesTitle: fd.get('sectionCategoriesTitle'),
    sectionFeaturedEyebrow: fd.get('sectionFeaturedEyebrow'),
    sectionFeaturedTitle: fd.get('sectionFeaturedTitle'),
    sectionFarmersEyebrow: fd.get('sectionFarmersEyebrow'),
    sectionFarmersTitle: fd.get('sectionFarmersTitle'),
    sectionTestimonialsTitle: fd.get('sectionTestimonialsTitle'),
    sectionFaqTitle: fd.get('sectionFaqTitle'),
    sectionFaqSubtitle: fd.get('sectionFaqSubtitle'),

    footerTagline: fd.get('footerTagline'),
    socialFacebook: fd.get('socialFacebook') ?? undefined,
    socialInstagram: fd.get('socialInstagram') ?? undefined,
    socialYoutube: fd.get('socialYoutube') ?? undefined,
    socialTiktok: fd.get('socialTiktok') ?? undefined,

    contactDemoTitle: fd.get('contactDemoTitle'),
    contactDemoText: fd.get('contactDemoText'),

    // About content is edited in the page builder now — see lib/validators.ts.

    bankEnabled: fd.get('bankEnabled') ? true : false,
    bankBin: fd.get('bankBin') ?? '',
    bankName: fd.get('bankName') ?? '',
    bankAccountNumber: fd.get('bankAccountNumber') ?? '',
    bankAccountHolder: fd.get('bankAccountHolder') ?? '',

    logoUrl: fd.get('logoUrl') ?? undefined,
    faviconUrl: fd.get('faviconUrl') ?? undefined,

    smtpEnabled: fd.get('smtpEnabled') ? true : false,
    smtpHost: fd.get('smtpHost') ?? '',
    smtpPort: fd.get('smtpPort') || 587,
    smtpSecure: fd.get('smtpSecure') ? true : false,
    smtpUser: fd.get('smtpUser') ?? '',
    smtpPass: fd.get('smtpPass') ?? '',
    smtpFrom: fd.get('smtpFrom') ?? '',
    smtpFromName: fd.get('smtpFromName') ?? '',
    emailHeaderHtml: fd.get('emailHeaderHtml') ?? '',
    emailFooterHtml: fd.get('emailFooterHtml') ?? '',

    siteUrl: fd.get('siteUrl') ?? '',
    gaMeasurementId: fd.get('gaMeasurementId') ?? '',
    verificationGoogle: fd.get('verificationGoogle') ?? '',
    verificationBing: fd.get('verificationBing') ?? '',
    verificationFacebook: fd.get('verificationFacebook') ?? '',

    navbarCta: fd.get('navbarCta'),
    productsPageTitle: fd.get('productsPageTitle'),
    productsPageSubtitle: fd.get('productsPageSubtitle'),
    farmersHeroImage: fd.get('farmersHeroImage'),
    farmersHeroEyebrow: fd.get('farmersHeroEyebrow'),
    farmersHeroTitle: fd.get('farmersHeroTitle'),
    farmersHeroSubtitle: fd.get('farmersHeroSubtitle'),
    newsTitle: fd.get('newsTitle'),
    newsSubtitle: fd.get('newsSubtitle'),
    contactTitle: fd.get('contactTitle'),
    contactSubtitle: fd.get('contactSubtitle'),
    orderSuccessNote: fd.get('orderSuccessNote'),
    footerBuiltByLabel: fd.get('footerBuiltByLabel') ?? '',
    footerBuiltByUrl: fd.get('footerBuiltByUrl') ?? '',

    sectionCategoriesLinkLabel: fd.get('sectionCategoriesLinkLabel'),
    sectionFeaturedLinkLabel: fd.get('sectionFeaturedLinkLabel'),
    sectionFarmersLinkLabel: fd.get('sectionFarmersLinkLabel'),
    listingBadge: fd.get('listingBadge'),
    grownByLabel: fd.get('grownByLabel'),
    productDetailHeading: fd.get('productDetailHeading'),
    relatedProductsHeading: fd.get('relatedProductsHeading'),
    farmerStoryHeading: fd.get('farmerStoryHeading'),
    farmerProductsHeading: fd.get('farmerProductsHeading'),
    relatedPostsHeading: fd.get('relatedPostsHeading'),
    cartEmptyTitle: fd.get('cartEmptyTitle'),
    cartEmptyText: fd.get('cartEmptyText'),
    ordersEmptyTitle: fd.get('ordersEmptyTitle'),
    ordersEmptyText: fd.get('ordersEmptyText'),
    checkoutSlotNote: fd.get('checkoutSlotNote'),
    shippingLabel: fd.get('shippingLabel'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(siteInfo).set(parsed.data).where(eq(siteInfo.id, 1));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { ok: true };
}
