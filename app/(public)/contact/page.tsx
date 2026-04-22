import { getSiteInfo } from "@/lib/data";

export default async function ContactPage() {
  const info = await getSiteInfo();
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
            <div className="font-bold text-green-950 font-display mb-2">Trang trại demo</div>
            <p className="text-sm text-green-900/70">
              Chúng tôi tổ chức tour thăm vườn Đà Lạt mỗi tháng. Đăng ký qua email hoặc hotline phía trên.
            </p>
          </div>
        </div>

        <form className="md:col-span-3 bg-white rounded-3xl border border-green-100 p-7 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Họ và tên" placeholder="Nguyễn Văn A" />
            <Field label="Số điện thoại" placeholder="0912 xxx xxx" />
          </div>
          <Field label="Email" placeholder="ban@example.com" type="email" />
          <div>
            <label className="block text-sm font-semibold text-green-950 mb-1.5">Bạn muốn hỏi về</label>
            <select className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-500">
              <option>Sản phẩm</option>
              <option>Hộp rau tuần</option>
              <option>Hợp tác nông dân</option>
              <option>Tour thăm vườn</option>
              <option>Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-green-950 mb-1.5">Nội dung</label>
            <textarea rows={5} placeholder="Viết gì đó..." className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-500" />
          </div>
          <button type="button" className="w-full bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3.5 rounded-full transition">
            Gửi tin nhắn
          </button>
        </form>
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

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-green-950 mb-1.5">{label}</label>
      <input type={type} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-500" />
    </div>
  );
}
