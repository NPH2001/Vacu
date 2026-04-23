'use client';
import { useActionState, useState } from 'react';
import type { SettingsFormState } from '@/app/admin/actions/settings';
import type { SiteInfoRow } from '@/db/schema';
import { VN_BANKS } from '@/lib/banks';
import ImageUpload from './ImageUpload';

type TabId = 'brand' | 'contact' | 'home' | 'footer' | 'about' | 'bank' | 'smtp';
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'brand',   label: 'Thương hiệu',     icon: '🌱' },
  { id: 'contact', label: 'Liên hệ',         icon: '📞' },
  { id: 'home',    label: 'Trang chủ',       icon: '🏠' },
  { id: 'footer',  label: 'Footer & Social', icon: '🔗' },
  { id: 'about',   label: 'Trang About',     icon: '📖' },
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
  const [story, setStory] = useState<string[]>(d.aboutStory ?? []);
  const [commitments, setCommitments] = useState<Array<{ num: string; title: string; desc: string }>>(d.aboutCommitments ?? []);

  const addFeature = () => setFeatures((xs) => [...xs, '']);
  const updateFeature = (i: number, v: string) => setFeatures((xs) => xs.map((x, idx) => (idx === i ? v : x)));
  const removeFeature = (i: number) => setFeatures((xs) => xs.filter((_, idx) => idx !== i));

  const addStory = () => setStory((xs) => [...xs, '']);
  const updateStory = (i: number, v: string) => setStory((xs) => xs.map((x, idx) => (idx === i ? v : x)));
  const removeStory = (i: number) => setStory((xs) => xs.filter((_, idx) => idx !== i));

  const addCommitment = () =>
    setCommitments((xs) => [...xs, { num: String(xs.length + 1).padStart(2, '0'), title: '', desc: '' }]);
  const updateCommitment = (i: number, key: 'num' | 'title' | 'desc', v: string) =>
    setCommitments((xs) => xs.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));
  const removeCommitment = (i: number) => setCommitments((xs) => xs.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-green-100 overflow-hidden">
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
        <div hidden={tab !== 'brand'} className="space-y-6">
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
            <SectionHead title="Số liệu hiển thị" hint="Hiện ở hero & trang About." />
            <div className="grid md:grid-cols-4 gap-4">
              <L label="Nông dân" required><input name="statFarmers" defaultValue={d.statFarmers} required className={inputCls} /></L>
              <L label="Sản phẩm" required><input name="statProducts" defaultValue={d.statProducts} required className={inputCls} /></L>
              <L label="Khách hàng" required><input name="statCustomers" defaultValue={d.statCustomers} required className={inputCls} /></L>
              <L label="Năm hoạt động" required><input name="statYears" defaultValue={d.statYears} required className={inputCls} /></L>
            </div>
          </section>
        </div>

        {/* ============ CONTACT ============ */}
        <div hidden={tab !== 'contact'} className="space-y-6">
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
        <div hidden={tab !== 'home'} className="space-y-6">
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
          </section>
        </div>

        {/* ============ FOOTER ============ */}
        <div hidden={tab !== 'footer'} className="space-y-6">
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
        </div>

        {/* ============ ABOUT ============ */}
        <div hidden={tab !== 'about'} className="space-y-6">
          <section>
            <SectionHead title="Hero trang About" />
            <div className="mb-4">
              <ImageUpload name="aboutHeroImage" defaultValue={d.aboutHeroImage} label="Ảnh nền hero About" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Badge" required><input name="aboutHeroBadge" defaultValue={d.aboutHeroBadge} required className={inputCls} /></L>
              <L label="Tiêu đề" required><input name="aboutHeroTitle" defaultValue={d.aboutHeroTitle} required className={inputCls} /></L>
              <L label="Tiêu đề khối số liệu" required><input name="aboutStatsTitle" defaultValue={d.aboutStatsTitle} required className={inputCls} /></L>
            </div>
          </section>

          <section>
            <SectionHead title="Câu chuyện" hint="Mỗi dòng là 1 đoạn văn." />
            <div className="space-y-2">
              {story.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <textarea name="aboutStory" value={s} onChange={(e) => updateStory(i, e.target.value)} rows={3} className={inputCls} />
                  <button type="button" onClick={() => removeStory(i)}
                    className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 h-fit">Xoá</button>
                </div>
              ))}
              <button type="button" onClick={addStory} className="text-sm text-green-700 font-semibold hover:underline">
                + Thêm đoạn văn
              </button>
            </div>
          </section>

          <section>
            <SectionHead title="Cam kết" hint="Mỗi cam kết gồm số, tiêu đề, mô tả." />
            <L label="Tiêu đề khối cam kết" required>
              <input name="aboutCommitmentsTitle" defaultValue={d.aboutCommitmentsTitle} required className={inputCls} />
            </L>
            <div className="space-y-3 mt-3">
              {commitments.map((c, i) => (
                <div key={i} className="border border-green-100 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <input name="aboutCommitmentNum" value={c.num} onChange={(e) => updateCommitment(i, 'num', e.target.value)}
                      placeholder="01" className="w-20 border border-green-200 rounded px-3 py-2 font-mono text-center" />
                    <input name="aboutCommitmentTitle" value={c.title} onChange={(e) => updateCommitment(i, 'title', e.target.value)}
                      placeholder="Tiêu đề cam kết" className={inputCls} />
                    <button type="button" onClick={() => removeCommitment(i)}
                      className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 h-fit">Xoá</button>
                  </div>
                  <textarea name="aboutCommitmentDesc" value={c.desc} onChange={(e) => updateCommitment(i, 'desc', e.target.value)}
                    rows={2} placeholder="Mô tả ngắn" className={inputCls} />
                </div>
              ))}
              <button type="button" onClick={addCommitment} className="text-sm text-green-700 font-semibold hover:underline">
                + Thêm cam kết
              </button>
            </div>
          </section>

          <section>
            <SectionHead title="CTA cuối trang" />
            <div className="grid md:grid-cols-2 gap-4">
              <L label="Tiêu đề" required><input name="aboutCtaTitle" defaultValue={d.aboutCtaTitle} required className={inputCls} /></L>
              <L label="Nhãn nút" required><input name="aboutCtaLabel" defaultValue={d.aboutCtaLabel} required className={inputCls} /></L>
            </div>
            <div className="mt-4">
              <L label="Mô tả" required>
                <textarea name="aboutCtaSubtitle" defaultValue={d.aboutCtaSubtitle} required rows={2} className={inputCls} />
              </L>
            </div>
          </section>
        </div>

        {/* ============ SMTP ============ */}
        <div hidden={tab !== 'smtp'} className="space-y-6">
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

        {/* ============ BANK ============ */}
        <div hidden={tab !== 'bank'} className="space-y-6">
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

function L({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
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
