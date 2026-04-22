import Link from "next/link";
import { getSiteInfo, getAllFarmers } from "@/lib/data";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default async function AboutPage() {
  const [info, farmers] = await Promise.all([getSiteInfo(), getAllFarmers()]);
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/farm/1625246333195-78d9c38ad449.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/90 to-green-900/60" />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-20 text-white">
          <div className="text-amber-300 text-sm font-bold tracking-widest uppercase mb-2">Câu chuyện của chúng tôi</div>
          <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight">
            Bắt đầu từ một bữa cơm lo sợ
          </h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 text-green-900/90 text-lg leading-relaxed space-y-6">
        <p>
          Năm 2013, chị Mai — người sáng lập {info.name} — phát hiện con gái 3 tuổi bị ngộ độc thực phẩm từ rau xanh mua ở chợ. Không đứa con, không gia đình nào đáng phải đánh đổi bữa cơm bằng sức khoẻ.
        </p>
        <p>
          Chị quyết định về Đà Lạt, sống cùng bà con nông dân, học cách canh tác hữu cơ, và xây dựng một chuỗi cung ứng mà mỗi cọng rau đều có thể truy xuất được nguồn gốc.
        </p>
        <p>
          Sau {info.statYears} năm, {info.name} đã kết nối {info.statFarmers} hộ nông dân tại Đà Lạt, Mộc Châu, Đắk Lắk, Hà Giang, Lương Sơn — và phục vụ {info.statCustomers} gia đình khắp Việt Nam. Chúng tôi trả cho nông dân cao hơn giá chợ 30-40%, không trung gian, không phụ thu.
        </p>
      </section>

      <section className="bg-green-50/60 py-16 texture-paper">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-12">Ba điều chúng tôi cam kết</h2>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Trung thực về nguồn gốc", desc: "Mỗi sản phẩm đều ghi rõ nông dân, nông trại, ngày thu hoạch. Không mập mờ, không 'rau sạch' chung chung." },
              { num: "02", title: "Công bằng với nông dân", desc: "Chúng tôi ký hợp đồng bao tiêu với giá cao hơn giá thị trường, trả trước 50% để bà con an tâm đầu tư." },
              { num: "03", title: "Tôn trọng đất đai", desc: "100% không thuốc trừ sâu hóa học, ưu tiên phân hữu cơ, luân canh bảo vệ đất. Chúng tôi trồng cho con cháu." },
            ].map((v) => (
              <div key={v.num} className="bg-white rounded-3xl p-7 border border-green-100">
                <div className="text-amber-500 text-5xl font-display mb-2">{v.num}</div>
                <h3 className="font-bold text-green-950 font-display text-xl mb-2">{v.title}</h3>
                <p className="text-green-900/70">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-green-950 font-display text-center mb-10">Những con số biết nói</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: info.statFarmers, label: "Hộ nông dân" },
            { value: info.statProducts, label: "Sản phẩm" },
            { value: info.statCustomers, label: "Gia đình tin dùng" },
            { value: info.statYears + " năm", label: "Cùng đồng hành" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-3xl p-8 border border-green-100 text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-800 font-display">{s.value}</div>
              <div className="text-sm text-green-900/60 uppercase tracking-wider mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-green-800 to-green-950 rounded-[2rem] p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Còn {farmers.length} câu chuyện nông dân đang chờ bạn</h2>
          <p className="text-green-100/80 max-w-lg mx-auto mb-8">
            Mỗi nông dân chúng tôi cộng tác có một câu chuyện riêng. Hãy đến gặp họ.
          </p>
          <Link href="/farmers" className="inline-block bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-8 py-3.5 rounded-full transition">
            Gặp bà con nông dân →
          </Link>
        </div>
      </section>
    </div>
  );
}
