'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { guideSectionText, type GuideBlock, type GuideSection } from '@/lib/admin/guide';

/**
 * Bỏ dấu tiếng Việt để "don hang" cũng tìm ra "đơn hàng" — người dùng gõ nhanh
 * thường không bỏ dấu, và một ô tìm kiếm không khớp gì là ô tìm kiếm vô dụng.
 */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/**
 * Chữ đậm trong nội dung được đánh dấu bằng cặp dấu sao. Cắt chuỗi rồi trả về
 * mảng phần tử React — không dựng HTML, nên nội dung không thể tiêm thẻ.
 */
function renderInline(text: string): React.ReactNode[] {
  return text.split('*').map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-stone-900">{part}</strong>
      : <span key={i}>{part}</span>,
  );
}

export default function GuideView({ sections }: { sections: GuideSection[] }) {
  const [q, setQ] = useState('');

  // Chỉ số tìm kiếm dựng một lần: nội dung là hằng, gõ phím không nên bắt trình
  // duyệt duyệt lại toàn bộ hướng dẫn.
  const index = useMemo(
    () => sections.map((s) => ({ section: s, haystack: fold(guideSectionText(s)) })),
    [sections],
  );

  const needle = fold(q.trim());
  const visible = needle === ''
    ? sections
    : index.filter((r) => r.haystack.includes(needle)).map((r) => r.section);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="admin-eyebrow">Trợ giúp</div>
          <h1 className="admin-title text-[28px] mt-1">Hướng dẫn sử dụng</h1>
          <p className="text-sm text-stone-500 mt-1.5 max-w-xl">
            Mọi thứ bạn cần để vận hành website: xử lý đơn, đăng sản phẩm, viết bài, sửa nội dung trang.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="admin-btn-ghost print:hidden">
          In / lưu PDF
        </button>
      </div>

      <div className="print:hidden">
        <label className="block max-w-md">
          <span className="sr-only">Tìm trong hướng dẫn</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm trong hướng dẫn… (ví dụ: chuyển khoản, hẹn giờ, ảnh)"
            className="w-full admin-input"
          />
        </label>
        {needle !== '' && (
          <p className="text-[12.5px] text-stone-500 mt-1.5">
            {visible.length === 0
              ? 'Không có mục nào khớp.'
              : `${visible.length} mục khớp — bấm vào mục lục để nhảy tới.`}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Mục lục — trên điện thoại thu lại, nếu không nó chiếm trọn màn hình
            đầu tiên và người đọc phải cuộn qua nó mới thấy nội dung. */}
        <details className="lg:hidden admin-panel px-3 py-2 print:hidden">
          <summary className="cursor-pointer text-[13px] font-medium text-stone-900 py-1">
            Mục lục ({visible.length} mục)
          </summary>
          <nav aria-label="Mục lục hướng dẫn" className="pt-1.5">
            <TocList sections={visible} />
          </nav>
        </details>

        <nav
          aria-label="Mục lục hướng dẫn"
          className="hidden lg:block lg:sticky lg:top-2 admin-panel p-3 print:hidden">
          <div className="admin-eyebrow px-2 pb-1.5">Mục lục</div>
          {visible.length === 0
            ? <p className="px-2 py-1 text-[12.5px] text-stone-500">—</p>
            : <TocList sections={visible} />}
        </nav>

        {/* Nội dung */}
        <div className="space-y-5 min-w-0">
          {visible.length === 0 ? (
            <div className="admin-panel p-6 text-sm text-stone-500">
              Không tìm thấy nội dung phù hợp. Thử một từ khoá ngắn hơn, ví dụ “đơn” hoặc “ảnh”.
            </div>
          ) : (
            visible.map((s) => <Section key={s.id} section={s} />)
          )}
        </div>
      </div>
    </div>
  );
}

function TocList({ sections }: { sections: GuideSection[] }) {
  return (
    <ol className="space-y-0.5">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors">
            <span className="text-stone-400 tabular-nums text-[11.5px] w-4 shrink-0">{i + 1}</span>
            <span className="truncate">{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function Section({ section }: { section: GuideSection }) {
  return (
    <section id={section.id} className="admin-panel p-5 sm:p-6 scroll-mt-4 space-y-3.5">
      <header className="space-y-1.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-[15px] shrink-0"
            style={{ background: '#f5f5f4', color: '#15803d' }}
            aria-hidden>
            {section.icon}
          </span>
          <h2 className="admin-title text-[19px]">{section.title}</h2>
          {section.adminOnly && (
            <span className="admin-badge" style={{ background: '#ede9fe', color: '#5b21b6', borderColor: '#ddd6fe' }}>
              Chỉ Admin
            </span>
          )}
        </div>
        <p className="text-[13px] text-stone-500">{section.summary}</p>
      </header>

      <div className="space-y-3.5">
        {section.blocks.map((b, i) => <BlockView key={i} block={b} />)}
      </div>

      {section.links && section.links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 print:hidden">
          {section.links.map((l) => (
            <Link key={l.href} href={l.href} className="admin-btn-ghost text-[12.5px]">
              {l.label} <span aria-hidden>→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function BlockView({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'p':
      return <p className="text-[13.5px] leading-relaxed text-stone-700">{renderInline(block.text)}</p>;

    case 'list':
      return (
        <ul className="space-y-1.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-stone-700">
              <span className="text-green-700 shrink-0 mt-[1px]" aria-hidden>·</span>
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        <ol className="space-y-1.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-stone-700">
              <span
                className="h-5 w-5 rounded-full inline-flex items-center justify-center text-[11px] font-semibold shrink-0 tabular-nums"
                style={{ background: '#dcfce7', color: '#166534' }}>
                {i + 1}
              </span>
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ol>
      );

    case 'table':
      return (
        // Bảng rộng cuộn ngang trong khung của nó, không đẩy cả trang trượt ngang.
        <div className="admin-panel-flush overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>{block.head.map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={j === 0 ? 'text-stone-900' : 'text-stone-600'}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'note': {
      const tip = block.tone === 'tip';
      return (
        <div
          className="rounded-xl px-4 py-3 text-[13px] leading-relaxed flex gap-2.5"
          style={
            tip
              ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }
              : { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }
          }>
          <span className="shrink-0 font-semibold" aria-hidden>{tip ? 'Mẹo' : 'Lưu ý'}</span>
          <span>{renderInline(block.text)}</span>
        </div>
      );
    }
  }
}
