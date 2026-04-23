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

function parseStory(fd: FormData): string[] {
  const raw = fd.getAll('aboutStory');
  return raw
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0);
}

function parseCommitments(fd: FormData): Array<{ num: string; title: string; desc: string }> {
  const nums = fd.getAll('aboutCommitmentNum');
  const titles = fd.getAll('aboutCommitmentTitle');
  const descs = fd.getAll('aboutCommitmentDesc');
  const out: Array<{ num: string; title: string; desc: string }> = [];
  for (let i = 0; i < nums.length; i++) {
    const num = typeof nums[i] === 'string' ? (nums[i] as string).trim() : '';
    const title = typeof titles[i] === 'string' ? (titles[i] as string).trim() : '';
    const desc = typeof descs[i] === 'string' ? (descs[i] as string).trim() : '';
    if (num && title && desc) out.push({ num, title, desc });
  }
  return out;
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
    statFarmers: fd.get('statFarmers'),
    statProducts: fd.get('statProducts'),
    statCustomers: fd.get('statCustomers'),
    statYears: fd.get('statYears'),

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

    footerTagline: fd.get('footerTagline'),
    socialFacebook: fd.get('socialFacebook') ?? undefined,
    socialInstagram: fd.get('socialInstagram') ?? undefined,
    socialYoutube: fd.get('socialYoutube') ?? undefined,
    socialTiktok: fd.get('socialTiktok') ?? undefined,

    contactDemoTitle: fd.get('contactDemoTitle'),
    contactDemoText: fd.get('contactDemoText'),

    aboutHeroBadge: fd.get('aboutHeroBadge'),
    aboutHeroTitle: fd.get('aboutHeroTitle'),
    aboutHeroImage: fd.get('aboutHeroImage'),
    aboutStory: parseStory(fd),
    aboutCommitmentsTitle: fd.get('aboutCommitmentsTitle'),
    aboutCommitments: parseCommitments(fd),
    aboutStatsTitle: fd.get('aboutStatsTitle'),
    aboutCtaTitle: fd.get('aboutCtaTitle'),
    aboutCtaSubtitle: fd.get('aboutCtaSubtitle'),
    aboutCtaLabel: fd.get('aboutCtaLabel'),

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
