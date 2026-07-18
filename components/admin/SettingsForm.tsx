'use client';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import type { SettingsFormState } from '@/app/admin/actions/settings';
import type { SiteInfoRow } from '@/db/schema';
import { VN_BANKS } from '@/lib/banks';
import ImageUpload from './ImageUpload';

type TabId = 'brand' | 'contact' | 'home' | 'pages' | 'copy' | 'footer' | 'about' | 'seo' | 'bank' | 'smtp';
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'brand',   label: 'Thương hiệu',     icon: '🌱' },
  { id: 'contact', label: 'Liên hệ',         icon: '📞' },
  { id: 'home',    label: 'Trang chủ',       icon: '🏠' },
  { id: 'pages',   label: 'Trang phụ',       icon: '📄' },
  { id: 'copy',    label: 'Nội dung khác',   icon: '💬' },
  { id: 'footer',  label: 'Footer & Social', icon: '🔗' },
  { id: 'about',   label: 'Trang Câu chuyện', icon: '📖' },
  { id: 'seo',     label: 'SEO & Theo dõi',  icon: '📈' },
  { id: 'bank',    label: 'Thanh toán',      icon: '🏦' },
  { id: 'smtp',    label: 'Email (SMTP)',    icon: '📧' },
];

export default function SettingsForm({
  action, defaults,
}: {
  action: (prev: SettingsFormState, fd: FormData) => Promise<SettingsFormState>;
  defaults: SiteInfoRow;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(action, null);
  const d = defaults;
  const [tab, setTab] = useState<TabId>('brand');
  const [features, setFeatures] = useState<string[]>(d.subBoxFeatures ?? []);

  // Warn before leaving with unsaved changes — this is the biggest, most
  // tab-heavy form in the admin, so a misclick losing everything is costly.
  // (Same beforeunload guard the product/post editors use.)
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty || pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, pending]);

  const addFeature = () => setFeatures((xs) => [...xs, '']);
  const updateFeature = (i: number, v: string) => setFeatures((xs) => xs.map((x, idx) => (idx === i ? v : x)));
  const removeFeature = (i: number) => setFeatures((xs) => xs.filter((_, idx) => idx !== i));

  // Required fields are spread across the tab panels, which hide inactive ones
  // with the `hidden` attribute. The browser can't focus a required control
  // inside a hidden panel, so submitting from the wrong tab aborts with no
  // feedback. Catch the invalid event (capture — it doesn't bubble), reveal the
  // panel the offender lives in (data-tab), and focus it.
  const revealInvalid = (e: React.FormEvent) => {
    const el = e.target as HTMLElement;
    const panelTab = el.closest<HTMLElement>('[data-tab]')?.dataset.tab as TabId | undefined;
    if (panelTab) setTab(panelTab);
    requestAnimationFrame(() => { if (el.isConnected) (el as HTMLInputElement).focus?.(); });
  };

  return (
    <form action={formAction} onInvalidCapture={revealInvalid} onChange={() => setDirty(true)}
      className="bg-white rounded-2xl border border-green-100 overflow-hidden">
      <nav className="flex gap-1 p-2 border-b border-green-100 bg-green-50/50 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-white text-green-800 shadow-sm border border-green-200'
                : 'text-green-900/70 hover:text-green-900 hover:bg-white/60'
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      <div className="p-6 space-y-6">
        {/* ============ BRAND ============ */}
        <div data-tab="brand" hidden={tab !== 'brand'} className="space-y-6">
          <section>
            <SectionHead title="Thương hiệu" hint="Tên hiển thị, mô tả chính, tagline hero." />
            <div className="mb-5 p-4 bg-green-50/40 border border-green-100 rounded-xl space-y-5">
              <div>
                <ImageUpload
                  name="logoUrl"
                  defaultValue={d.logoUrl ?? ''}
                  label="Logo"
                />
                <p className="text-xs text-green-900/60 mt-2">
                  Ảnh vuông, nền trong suốt (PNG) là đẹp nhất. Dùng trong Navbar, Footer, và email header.
                  Để trống sẽ dùng emoji 🌱 mặc định.
                </p>
              </div>
              <div className="border-t border-green-100 pt-5">
                <ImageUpload
                  name="faviconUrl"
                  defaultValue={d.faviconUrl ?? ''}
                  label="Favicon"
                />
                <p className="text-xs text-green-900/60 mt-2">
                  Hiển thị trên tab trình duyệt và bookmark. Dùng PNG vuông tối thiểu 256×256, nền trong suốt.
                  Để trống sẽ dùng favicon mặc định Next.js.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Tên đầy đủ" required><input name="name" defaultValue={d.name} required className={inputCls} /></L>
              <L label="Tên ngắn" required><input name="shortName" defaultValue={d.shortName} required className={inputCls} /></L>
              <L label="Tagline (tiêu đề Hero)" required><input name="tagline" defaultValue={d.tagline} required className={inputCls} /></L>
            </div>
            <div className="mt-4">
              <L label="Mô tả" required>
                <textarea name="description" defaultValue={d.description} required rows={3} className={inputCls} />
              </L>
            </div>
          </section>

          <section>
            <SectionHead title="Số liệu hiển thị" hint="Bốn ô số ở hero trang chủ. Cột trái là con số, cột phải là chữ ghi dưới số." />
            <div className="grid md:grid-cols-2 gap-4">
              <StatPair valueName="statFarmers" valueDefault={d.statFarmers} labelName="statFarmersLabel" labelDefault={d.statFarmersLabel} inputCls={inputCls} />
              <StatPair valueName="statProducts" valueDefault={d.statProducts} labelName="statProductsLabel" labelDefault={d.statProductsLabel} inputCls={inputCls} />
              <StatPair valueName="statCustomers" valueDefault={d.statCustomers} labelName="statCustomersLabel" labelDefault={d.statCustomersLabel} inputCls={inputCls} />
              <StatPair valueName="statYears" valueDefault={d.statYears} labelName="statYearsLabel" labelDefault={d.statYearsLabel} inputCls={inputCls} />
            </div>
          </section>
        </div>

        {/* ============ CONTACT ============ */}
        <div data-tab="contact" hidden={tab !== 'contact'} className="space-y-6">
          <section>
            <SectionHead title="Thông tin liên hệ" hint="Hiện ở Footer và trang /contact." />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Địa chỉ" required><input name="address" defaultValue={d.address} required className={inputCls} /></L>
              <L label="Điện thoại" required><input name="phone" defaultValue={d.phone} required className={inputCls} /></L>
              <L label="Email" required><input name="email" type="email" defaultValue={d.email} required className={inputCls} /></L>
              <L label="Giờ mở cửa" required><input name="hours" defaultValue={d.hours} required className={inputCls} /></L>
            </div>
          </section>

          <section>
            <SectionHead
              title="Thông tin pháp lý"
              hint="Theo Nghị định 52/2013/NĐ-CP — website thương mại hiển thị MST và tên pháp nhân ở footer."
            />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Tên pháp nhân (doanh nghiệp/HTX)">
                <input name="businessName" defaultValue={d.businessName} className={inputCls} placeholder="VD: Hợp tác xã Nông nghiệp OCOP Việt Nam" />
              </L>
              <L label="Mã số thuế">
                <input name="taxCode" defaultValue={d.taxCode} className={inputCls} placeholder="VD: 0123456789" />
              </L>
            </div>
          </section>

          <section>
            <SectionHead title="Tiêu đề trang Liên hệ" hint="Phần chữ lớn trên cùng trang /contact." />
            <div className="grid gap-4">
              <L label="Tiêu đề" required><input name="contactTitle" defaultValue={d.contactTitle} required className={inputCls} /></L>
              <L label="Mô tả ngắn" required>
                <textarea name="contactSubtitle" defaultValue={d.contactSubtitle} required rows={2} className={inputCls} />
              </L>
            </div>
          </section>

          <section>
            <SectionHead title='Khối "Trang trại demo" ở trang liên hệ' />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Tiêu đề khối" required><input name="contactDemoTitle" defaultValue={d.contactDemoTitle} required className={inputCls} /></L>
            </div>
            <div className="mt-4">
              <L label="Mô tả" required>
                <textarea name="contactDemoText" defaultValue={d.contactDemoText} required rows={2} className={inputCls} />
              </L>
            </div>
          </section>
        </div>

        {/* ============ HOME ============ */}
        <div data-tab="home" hidden={tab !== 'home'} className="space-y-6">
          <section>
            <SectionHead title="Hero trang chủ" hint="Ảnh nền, badge, CTA phía trên." />
            <div className="mb-4">
              <ImageUpload name="heroImage" defaultValue={d.heroImage} label="Ảnh nền hero" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Badge" required><input name="heroBadge" defaultValue={d.heroBadge} required className={inputCls} /></L>
              <L label="CTA chính" required><input name="heroCtaPrimary" defaultValue={d.heroCtaPrimary} required className={inputCls} /></L>
              <L label="CTA phụ" required><input name="heroCtaSecondary" defaultValue={d.heroCtaSecondary} required className={inputCls} /></L>
            </div>
            <div className="mt-4">
              <L label="Mô tả dưới tiêu đề" required>
                <textarea name="heroSubtitle" defaultValue={d.heroSubtitle} required rows={2} className={inputCls} />
              </L>
            </div>
          </section>

          <section>
            <SectionHead title="Hộp rau tuần (Subscription box)" />
            <div className="mb-4">
              <ImageUpload name="subBoxImage" defaultValue={d.subBoxImage} label="Ảnh khối" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Badge" required><input name="subBoxBadge" defaultValue={d.subBoxBadge} required className={inputCls} /></L>
              <L label="Tiêu đề" required><input name="subBoxTitle" defaultValue={d.subBoxTitle} required className={inputCls} /></L>
              <L label="CTA" required><input name="subBoxCta" defaultValue={d.subBoxCta} required className={inputCls} /></L>
              <L label="Link khi click CTA" required><input name="subBoxLink" defaultValue={d.subBoxLink} required className={inputCls} /></L>
            </div>
            <div className="mt-4">
              <L label="Mô tả" required>
                <textarea name="subBoxDescription" defaultValue={d.subBoxDescription} required rows={2} className={inputCls} />
              </L>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-green-950 mb-2">Danh sách lợi ích (checklist)</div>
              <div className="space-y-2">
                {features.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      name="subBoxFeatures"
                      value={f}
                      onChange={(e) => updateFeature(i, e.target.value)}
                      className={inputCls}
                      placeholder="VD: Tự động gia hạn, hủy bất cứ lúc nào"
                    />
                    <button type="button" onClick={() => removeFeature(i)}
                      className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">Xoá</button>
                  </div>
                ))}
                <button type="button" onClick={addFeature} className="text-sm text-green-700 font-semibold hover:underline">
                  + Thêm dòng
                </button>
              </div>
            </div>
          </section>

          <section>
            <SectionHead title="Tiêu đề các section trang chủ" />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Danh mục — eyebrow" required><input name="sectionCategoriesEyebrow" defaultValue={d.sectionCategoriesEyebrow} required className={inputCls} /></L>
              <L label="Danh mục — tiêu đề" required><input name="sectionCategoriesTitle" defaultValue={d.sectionCategoriesTitle} required className={inputCls} /></L>
              <L label="Nổi bật — eyebrow" required><input name="sectionFeaturedEyebrow" defaultValue={d.sectionFeaturedEyebrow} required className={inputCls} /></L>
              <L label="Nổi bật — tiêu đề" required><input name="sectionFeaturedTitle" defaultValue={d.sectionFeaturedTitle} required className={inputCls} /></L>
              <L label="Nông dân — eyebrow" required><input name="sectionFarmersEyebrow" defaultValue={d.sectionFarmersEyebrow} required className={inputCls} /></L>
              <L label="Nông dân — tiêu đề" required><input name="sectionFarmersTitle" defaultValue={d.sectionFarmersTitle} required className={inputCls} /></L>
              <L label="Cảm nhận — tiêu đề" required><input name="sectionTestimonialsTitle" defaultValue={d.sectionTestimonialsTitle} required className={inputCls} /></L>
              <L label="FAQ — tiêu đề" required><input name="sectionFaqTitle" defaultValue={d.sectionFaqTitle} required className={inputCls} /></L>
            </div>
            <div className="mt-4">
              <L label="FAQ — câu dưới tiêu đề" required
                hint="Gõ {phone} để tự động chèn số điện thoại (đổi số ở tab Liên hệ là câu này cũng đổi theo).">
                <input name="sectionFaqSubtitle" defaultValue={d.sectionFaqSubtitle} required className={inputCls} />
              </L>
            </div>
          </section>
        </div>

        {/* ============ FOOTER ============ */}
        <div data-tab="footer" hidden={tab !== 'footer'} className="space-y-6">
          <section>
            <SectionHead title="Footer & Mạng xã hội" hint="Để trống social nào không dùng → tự ẩn khỏi footer." />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Footer tagline" required><input name="footerTagline" defaultValue={d.footerTagline} required className={inputCls} /></L>
              <L label="Facebook URL"><input name="socialFacebook" defaultValue={d.socialFacebook ?? ''} className={inputCls} placeholder="https://facebook.com/..." /></L>
              <L label="Instagram URL"><input name="socialInstagram" defaultValue={d.socialInstagram ?? ''} className={inputCls} placeholder="https://instagram.com/..." /></L>
              <L label="YouTube URL"><input name="socialYoutube" defaultValue={d.socialYoutube ?? ''} className={inputCls} placeholder="https://youtube.com/@..." /></L>
              <L label="TikTok URL"><input name="socialTiktok" defaultValue={d.socialTiktok ?? ''} className={inputCls} placeholder="https://tiktok.com/@..." /></L>
            </div>
          </section>

          <section>
            <SectionHead title='Dòng "Xây dựng bởi" cuối trang' hint="Để trống tên → ẩn hẳn dòng này khỏi footer." />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Tên đơn vị"><input name="footerBuiltByLabel" defaultValue={d.footerBuiltByLabel} className={inputCls} placeholder="idflow.vn" /></L>
              <L label="Liên kết (URL)"><input name="footerBuiltByUrl" defaultValue={d.footerBuiltByUrl} className={inputCls} placeholder="https://idflow.vn" /></L>
            </div>
          </section>
        </div>

        {/* ============ ABOUT ============ */}
        <div data-tab="about" hidden={tab !== 'about'} className="space-y-6">
          <section>
            <SectionHead
              title="Trang Câu chuyện đã chuyển sang mục Trang"
              hint="Nội dung trang này giờ xếp theo khối, sửa được thứ tự và ẩn/hiện từng phần."
            />
            <div className="rounded-xl border border-green-200 bg-green-50/60 p-5">
              <p className="text-sm text-green-950 mb-3">
                Trước đây trang Câu chuyện sửa ở đây. Giờ nó là một trang bình thường trong mục{' '}
                <b>Trang</b>, nên bạn sửa được cả bố cục chứ không chỉ chữ.
              </p>
              <Link href="/admin/pages/about" className="admin-btn-primary inline-flex">
                Mở trang Câu chuyện →
              </Link>
            </div>
          </section>
        </div>

        {/* ============ SMTP ============ */}
        <div data-tab="smtp" hidden={tab !== 'smtp'} className="space-y-6">
          <section>
            <SectionHead
              title="Cấu hình Email (SMTP)"
              hint="Ứng dụng gửi mail qua SMTP (forgot-password, form liên hệ, …). Gmail: dùng App Password, host smtp.gmail.com port 587. SendGrid/Brevo/MailerSend đều OK."
            />
            <label className="inline-flex items-center gap-2 mb-4">
              <input type="checkbox" name="smtpEnabled" defaultChecked={d.smtpEnabled} />
              <span className="text-sm font-medium">Bật gửi email qua SMTP</span>
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <L label="SMTP Host">
                <input name="smtpHost" defaultValue={d.smtpHost} className={inputCls} placeholder="smtp.gmail.com" />
              </L>
              <L label="Port">
                <input name="smtpPort" type="number" defaultValue={d.smtpPort} className={inputCls} placeholder="587" />
              </L>
              <L label="Username">
                <input name="smtpUser" defaultValue={d.smtpUser} className={inputCls} placeholder="user@gmail.com" autoComplete="off" />
              </L>
              <L label="Password / App Password">
                <input name="smtpPass" type="password" defaultValue={d.smtpPass} className={inputCls} autoComplete="new-password" />
              </L>
              <L label="From email (địa chỉ người gửi)">
                <input name="smtpFrom" type="email" defaultValue={d.smtpFrom} className={inputCls} placeholder="no-reply@vacu.com.vn" />
              </L>
              <L label="From name (tên người gửi)">
                <input name="smtpFromName" defaultValue={d.smtpFromName} className={inputCls} placeholder="Vacu" />
              </L>
            </div>
            <label className="inline-flex items-center gap-2 mt-3">
              <input type="checkbox" name="smtpSecure" defaultChecked={d.smtpSecure} />
              <span className="text-sm">
                Kết nối SSL (bật cho port <strong>465</strong>, tắt cho port <strong>587</strong> dùng STARTTLS)
              </span>
            </label>
          </section>

          <section>
            <SectionHead
              title="Header &amp; Footer email"
              hint="HTML dùng chung cho tất cả email (bao ngoài nội dung từng mẫu). Biến: {{siteName}}, {{siteEmail}}, {{sitePhone}}, {{siteAddress}}, {{logoUrl}}, {{year}}."
            />
            <p className="text-xs text-green-900/60 mb-3">
              💡 Muốn dùng logo ảnh trong header? Upload ở tab <strong>🌱 Thương hiệu</strong>, rồi dán biến{' '}
              <code className="bg-green-50 px-1 rounded">{'{{logoUrl}}'}</code> vào <code className="bg-green-50 px-1 rounded">{'<img src="{{logoUrl}}">'}</code> trong Header HTML.
              Lưu ý: nếu logoUrl là đường dẫn tương đối (VD: <code>/uploads/...</code>), email client sẽ không hiển thị — cần URL đầy đủ <code>https://...</code>.
            </p>
            <div className="space-y-4">
              <L label="Header HTML">
                <textarea
                  name="emailHeaderHtml"
                  defaultValue={d.emailHeaderHtml}
                  rows={6}
                  className="w-full border border-green-200 rounded px-3 py-2 font-mono text-xs"
                  placeholder='<div style="background:#1f6b3a;color:#fff;padding:18px 28px;font-size:20px;font-weight:700">🌱 {{siteName}}</div>'
                />
              </L>
              <L label="Footer HTML">
                <textarea
                  name="emailFooterHtml"
                  defaultValue={d.emailFooterHtml}
                  rows={8}
                  className="w-full border border-green-200 rounded px-3 py-2 font-mono text-xs"
                  placeholder='<div style="background:#f0f4e8;padding:18px 28px;font-size:12px;color:#556;border-top:1px solid #e5ead8"><strong>{{siteName}}</strong><br>{{siteAddress}}<br>{{siteEmail}} · {{sitePhone}}<br><span style="color:#888">© {{year}} {{siteName}}</span></div>'
                />
              </L>
            </div>
          </section>

          <TestMailBox />
        </div>

        {/* ============ PAGES (Trang phụ) ============ */}
        <div data-tab="pages" hidden={tab !== 'pages'} className="space-y-6">
          <section>
            <SectionHead title="Thanh điều hướng" />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Nút mua hàng trên đầu trang" required hint="Nút xanh góc phải navbar.">
                <input name="navbarCta" defaultValue={d.navbarCta} required className={inputCls} />
              </L>
            </div>
          </section>

          <section>
            <SectionHead title="Trang Nông sản (danh sách sản phẩm)" hint="Tiêu đề khi khách xem /products." />
            <div className="grid gap-4">
              <L label="Tiêu đề" required><input name="productsPageTitle" defaultValue={d.productsPageTitle} required className={inputCls} /></L>
              <L label="Mô tả ngắn" required>
                <textarea name="productsPageSubtitle" defaultValue={d.productsPageSubtitle} required rows={2} className={inputCls} />
              </L>
            </div>
          </section>

          <section>
            <SectionHead title="Trang Nông dân" hint="Phần đầu trang /farmers." />
            <div className="mb-4">
              <ImageUpload name="farmersHeroImage" defaultValue={d.farmersHeroImage} label="Ảnh nền" />
            </div>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <L label="Chữ nhỏ phía trên (eyebrow)" required><input name="farmersHeroEyebrow" defaultValue={d.farmersHeroEyebrow} required className={inputCls} /></L>
                <L label="Tiêu đề" required><input name="farmersHeroTitle" defaultValue={d.farmersHeroTitle} required className={inputCls} /></L>
              </div>
              <L label="Mô tả ngắn" required hint="Gõ {count} để tự chèn số nông dân.">
                <textarea name="farmersHeroSubtitle" defaultValue={d.farmersHeroSubtitle} required rows={2} className={inputCls} />
              </L>
            </div>
          </section>

          <section>
            <SectionHead title="Trang Tin tức" hint="Tiêu đề mặc định của /tin-tuc (khi không lọc chuyên mục)." />
            <div className="grid gap-4">
              <L label="Tiêu đề" required><input name="newsTitle" defaultValue={d.newsTitle} required className={inputCls} /></L>
              <L label="Mô tả ngắn" required>
                <textarea name="newsSubtitle" defaultValue={d.newsSubtitle} required rows={2} className={inputCls} />
              </L>
            </div>
          </section>

          <section>
            <SectionHead title="Sau khi đặt hàng" hint="Câu hiện trong khung 'Đặt hàng thành công'." />
            <div className="grid gap-4">
              <L label="Lời nhắn cảm ơn" required>
                <textarea name="orderSuccessNote" defaultValue={d.orderSuccessNote} required rows={2} className={inputCls} />
              </L>
            </div>
          </section>
        </div>

        {/* ============ COPY (Nội dung khác) ============ */}
        <div data-tab="copy" hidden={tab !== 'copy'} className="space-y-6">
          <section>
            <SectionHead title="Nút 'xem tất cả' trên trang chủ" />
            <div className="grid md:grid-cols-3 gap-4">
              <L label="Mục Danh mục" required><input name="sectionCategoriesLinkLabel" defaultValue={d.sectionCategoriesLinkLabel} required className={inputCls} /></L>
              <L label="Mục Nổi bật" required><input name="sectionFeaturedLinkLabel" defaultValue={d.sectionFeaturedLinkLabel} required className={inputCls} /></L>
              <L label="Mục Nông dân" required><input name="sectionFarmersLinkLabel" defaultValue={d.sectionFarmersLinkLabel} required className={inputCls} /></L>
            </div>
          </section>

          <section>
            <SectionHead title="Tiêu đề các mục" hint="Chữ tiêu đề hiện ở trang chi tiết sản phẩm, nông dân, tin tức." />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Badge trên trang Nông sản" required><input name="listingBadge" defaultValue={d.listingBadge} required className={inputCls} /></L>
              <L label="Nhãn 'Trồng bởi' (dưới ảnh sản phẩm)" required><input name="grownByLabel" defaultValue={d.grownByLabel} required className={inputCls} /></L>
              <L label="Mục chi tiết sản phẩm" required><input name="productDetailHeading" defaultValue={d.productDetailHeading} required className={inputCls} /></L>
              <L label="Mục sản phẩm liên quan" required><input name="relatedProductsHeading" defaultValue={d.relatedProductsHeading} required className={inputCls} /></L>
              <L label="Mục câu chuyện nông trại" required><input name="farmerStoryHeading" defaultValue={d.farmerStoryHeading} required className={inputCls} /></L>
              <L label="Mục sản phẩm của nông dân" required hint="Gõ {name} để chèn tên nông dân."><input name="farmerProductsHeading" defaultValue={d.farmerProductsHeading} required className={inputCls} /></L>
              <L label="Mục bài viết liên quan" required><input name="relatedPostsHeading" defaultValue={d.relatedPostsHeading} required className={inputCls} /></L>
            </div>
          </section>

          <section>
            <SectionHead title="Khi giỏ hàng / đơn hàng trống" />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Giỏ trống — tiêu đề" required><input name="cartEmptyTitle" defaultValue={d.cartEmptyTitle} required className={inputCls} /></L>
              <L label="Giỏ trống — mô tả" required><input name="cartEmptyText" defaultValue={d.cartEmptyText} required className={inputCls} /></L>
              <L label="Chưa có đơn — tiêu đề" required><input name="ordersEmptyTitle" defaultValue={d.ordersEmptyTitle} required className={inputCls} /></L>
              <L label="Chưa có đơn — mô tả" required><input name="ordersEmptyText" defaultValue={d.ordersEmptyText} required className={inputCls} /></L>
            </div>
          </section>

          <section>
            <SectionHead title="Trang thanh toán" />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Ghi chú dưới khung giờ giao" required><input name="checkoutSlotNote" defaultValue={d.checkoutSlotNote} required className={inputCls} /></L>
              <L label="Nhãn phí giao hàng" required hint="VD: Miễn phí, hoặc 15.000đ."><input name="shippingLabel" defaultValue={d.shippingLabel} required className={inputCls} /></L>
            </div>
            <p className="text-xs text-green-900/60 mt-2">
              Nhãn phương thức thanh toán (Tiền mặt / Chuyển khoản) sửa ở mục{' '}
              <Link href="/admin/payment-methods" className="text-green-700 hover:underline">Thanh toán</Link>.
            </p>
          </section>
        </div>

        {/* ============ SEO & TRACKING ============ */}
        <div data-tab="seo" hidden={tab !== 'seo'} className="space-y-6">
          <section>
            <SectionHead title="Địa chỉ website" hint="URL công khai của trang, ví dụ https://vacu.vn. Dùng cho ảnh chia sẻ mạng xã hội và Google. Để trống cũng được." />
            <div className="grid gap-4">
              <L label="Địa chỉ website"><input name="siteUrl" defaultValue={d.siteUrl} className={inputCls} placeholder="https://vacu.vn" /></L>
            </div>
          </section>

          <section>
            <SectionHead title="Google Analytics" hint="Dán mã đo lường GA4 (dạng G-XXXXXXX). Để trống thì không chạy theo dõi." />
            <div className="grid gap-4">
              <L label="Mã đo lường (Measurement ID)"><input name="gaMeasurementId" defaultValue={d.gaMeasurementId} className={inputCls} placeholder="G-XXXXXXXXXX" /></L>
            </div>
          </section>

          <section>
            <SectionHead title="Xác minh quyền sở hữu website"
              hint="Mỗi nền tảng cấp một mã xác minh. Dán CHỈ phần mã (không dán cả thẻ meta). Để trống nền tảng nào không dùng." />
            <div className="grid gap-4">
              <L label="Google Search Console" hint='Trong thẻ họ đưa: content="ABC123" → chỉ dán ABC123.'>
                <input name="verificationGoogle" defaultValue={d.verificationGoogle} className={inputCls} />
              </L>
              <L label="Bing Webmaster (msvalidate.01)">
                <input name="verificationBing" defaultValue={d.verificationBing} className={inputCls} />
              </L>
              <L label="Facebook Domain Verification">
                <input name="verificationFacebook" defaultValue={d.verificationFacebook} className={inputCls} />
              </L>
            </div>
          </section>
        </div>

        {/* ============ BANK ============ */}
        <div data-tab="bank" hidden={tab !== 'bank'} className="space-y-6">
          <section>
            <SectionHead
              title="Thanh toán chuyển khoản (VietQR)"
              hint="QR sinh qua VietQR.io (miễn phí). Admin phải tự kiểm biến động số dư ngân hàng rồi vào đơn bấm 'Xác nhận đã nhận tiền'."
            />
            <label className="inline-flex items-center gap-2 mb-4">
              <input type="checkbox" name="bankEnabled" defaultChecked={d.bankEnabled} />
              <span className="text-sm font-medium">Cho phép chuyển khoản (hiện QR ở trang đặt hàng)</span>
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Ngân hàng">
                <select name="bankBin" defaultValue={d.bankBin} className={inputCls}>
                  <option value="">— Chưa chọn —</option>
                  {VN_BANKS.map((b) => (
                    <option key={b.bin} value={b.bin}>{b.name} ({b.short})</option>
                  ))}
                </select>
              </L>
              <L label="Tên hiển thị (tuỳ chọn)">
                <input name="bankName" defaultValue={d.bankName} className={inputCls} placeholder="VD: Vietcombank — CN Tân Bình" />
              </L>
              <L label="Số tài khoản">
                <input name="bankAccountNumber" defaultValue={d.bankAccountNumber} className={inputCls} placeholder="VD: 0123456789" />
              </L>
              <L label="Chủ tài khoản (IN HOA, không dấu)">
                <input name="bankAccountHolder" defaultValue={d.bankAccountHolder} className={inputCls} placeholder="VD: NGUYEN VAN A" />
              </L>
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-green-100 sticky bottom-0 bg-white">
        <span className="text-xs text-green-900/60">
          Lưu áp dụng cho <strong>tất cả</strong> tab — không cần đổi tab nếu bạn sửa ở nhiều chỗ.
        </span>
        <div className="flex items-center gap-3">
          {state?.ok && <span className="text-sm text-green-700">Đã lưu ✓</span>}
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
          <button type="submit" disabled={pending}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
            {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputCls = 'w-full border border-green-200 rounded px-3 py-2';

function L({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
      {hint && <span className="block text-xs text-green-900/60 mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-bold text-green-950">{title}</h2>
      {hint && <p className="text-xs text-green-900/60 mt-0.5">{hint}</p>}
    </div>
  );
}

/** One hero stat: the number and the label under it, side by side. */
function StatPair({
  valueName, valueDefault, labelName, labelDefault, inputCls,
}: {
  valueName: string; valueDefault: string;
  labelName: string; labelDefault: string;
  inputCls: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_1.4fr] gap-2 items-end">
      <label className="block">
        <span className="text-xs text-green-900/60">Số</span>
        <input name={valueName} defaultValue={valueDefault} required className={`${inputCls} mt-1`} />
      </label>
      <label className="block">
        <span className="text-xs text-green-900/60">Nhãn</span>
        <input name={labelName} defaultValue={labelDefault} required className={`${inputCls} mt-1`} />
      </label>
    </div>
  );
}

function TestMailBox() {
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function send() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch('/api/admin/test-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });
      const json = await res.json();
      if (!res.ok) setResult({ ok: false, msg: json.error || 'Gửi thất bại' });
      else setResult({ ok: true, msg: `Đã gửi tới ${json.to}. Kiểm tra hộp thư (cả spam).` });
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
      <h3 className="font-semibold text-green-950 mb-2">Gửi thử</h3>
      <p className="text-xs text-green-900/70 mb-3">
        <strong>Lưu cấu hình trước</strong> rồi mới gửi thử. Để trống email sẽ gửi về tài khoản đang đăng nhập.
      </p>
      <div className="flex gap-2 flex-wrap">
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="email nhận thử (để trống = email của bạn)"
          className="flex-1 min-w-[14rem] border border-green-200 rounded px-3 py-2 text-sm bg-white"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded text-sm"
        >
          {busy ? 'Đang gửi…' : 'Gửi thử'}
        </button>
      </div>
      {result && (
        <p className={`mt-2 text-sm ${result.ok ? 'text-green-700' : 'text-red-600'}`}>
          {result.ok ? '✓ ' : '✗ '}{result.msg}
        </p>
      )}
    </div>
  );
}
