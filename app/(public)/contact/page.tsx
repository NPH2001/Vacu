export const dynamic = 'force-dynamic';

import { getSiteInfo, getAllContactTopics } from "@/lib/data";
import ContactForm from "@/components/ContactForm";

export default async function ContactPage() {
  const [info, topics] = await Promise.all([getSiteInfo(), getAllContactTopics()]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="text-green-700 text-sm font-bold tracking-widest uppercase mb-2">Liên hệ</div>
        <h1 className="text-4xl md:text-5xl font-bold text-green-950 font-display">Chúng tôi luôn lắng nghe</h1>
        <p className="text-green-900/70 mt-3 max-w-xl mx-auto">
          Có câu hỏi về sản phẩm? Muốn hợp tác? Hay chỉ muốn nói lời cảm ơn? Gửi cho chúng tôi vài dòng.
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

        <ContactForm topics={topics} />
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
