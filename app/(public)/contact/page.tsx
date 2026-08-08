export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { getSiteInfo, getAllContactTopics } from "@/lib/data";
import { seoMeta } from "@/lib/seo";
import ContactForm from "@/components/ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfo();
  return seoMeta({
    title: `${info.contactTitle || 'Liên hệ'} — ${info.name}`,
    description: info.contactSubtitle,
    canonical: '/contact',
  });
}

export default async function ContactPage() {
  const [info, topics] = await Promise.all([getSiteInfo(), getAllContactTopics()]);
  const contactFormAvailable = Boolean(info.smtpEnabled && info.smtpHost && info.smtpFrom);
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="text-green-700 text-sm font-bold tracking-widest uppercase mb-2">Liên hệ</div>
        <h1 className="text-4xl md:text-5xl font-bold text-green-950 font-display wrap-anywhere">{info.contactTitle}</h1>
        <p className="text-green-900/70 mt-3 max-w-xl mx-auto wrap-anywhere">
          {info.contactSubtitle}
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2 bg-white rounded-3xl border border-green-100 p-7 space-y-5">
          <Info icon="📍" title="Địa chỉ" value={info.address} />
          <Info icon="📞" title="Điện thoại" value={info.phone} />
          <Info icon="✉️" title="Email" value={info.email} />
          <Info icon="🕒" title="Giờ làm việc" value={info.hours} />
          <div className="pt-4 border-t border-green-100">
            <div className="font-bold text-green-950 font-display mb-2">{info.contactDemoTitle}</div>
            <p className="text-sm text-green-900/70">
              {info.contactDemoText}
            </p>
          </div>
        </div>

        {contactFormAvailable ? (
          <ContactForm topics={topics} />
        ) : (
          <div role="status" className="md:col-span-3 rounded-3xl border border-amber-200 bg-amber-50 p-7">
            <h2 className="text-2xl font-bold font-display text-green-950">Gửi tin nhắn đang tạm dừng</h2>
            <p className="mt-3 text-store-muted">
              Kênh gửi trực tuyến chưa sẵn sàng. Bạn vẫn có thể liên hệ trực tiếp qua email hoặc điện thoại.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={`mailto:${info.email}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900">
                Gửi email
              </a>
              <a href={`tel:${info.phone.replace(/\D/g, '')}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-green-300 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50">
                Gọi {info.phone}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-lg shrink-0">{icon}</div>
      <div>
        <div className="text-xs text-green-900/60 uppercase tracking-wider">{title}</div>
        <div className="font-semibold text-green-950">{value}</div>
      </div>
    </div>
  );
}
