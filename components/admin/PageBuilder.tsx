'use client';
import { useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import RichEditor from '@/components/admin/RichEditor';
import GalleryField from '@/components/admin/GalleryField';
import { BLOCK_LABELS, emptyBlock, type Block, type BlockEntry, type BlockType } from '@/lib/blocks';

const TYPES = Object.keys(BLOCK_LABELS) as BlockType[];

let keySeq = 0;
const genKey = () => `blk-${keySeq++}`;

export type PickOption = { id: string; name: string };

/**
 * Blocks are edited entirely client-side and submitted as one JSON payload, so
 * ordering, visibility and content all save together with the page.
 *
 * `categoryOptions`/`productOptions` feed the "products" and "categories" block
 * pickers; the page passes the full lists so an admin can hand-pick items.
 */
export default function PageBuilder({
  name = 'blocks', defaultValue = [], categoryOptions = [], productOptions = [], onDirty,
}: {
  name?: string;
  defaultValue?: BlockEntry[];
  categoryOptions?: PickOption[];
  productOptions?: PickOption[];
  onDirty?: () => void;
}) {
  // Each block carries a stable client key so reordering moves the whole
  // component instance (and its uncontrolled rich-text/image editor state) with
  // it — an index key would leave an open editor bound to the wrong block.
  const [rows, setRows] = useState<{ key: string; entry: BlockEntry }[]>(
    () => defaultValue.map((entry) => ({ key: genKey(), entry })),
  );
  const [open, setOpen] = useState<number | null>(defaultValue.length === 0 ? null : 0);
  const [adding, setAdding] = useState(false);
  const dirty = () => onDirty?.();

  function patch(i: number, data: Block) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, entry: { ...r.entry, data } } : r)));
    dirty();
  }
  function move(i: number, to: number) {
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item);
    setRows(next);
    setOpen(to);
    dirty();
  }
  function add(type: BlockType) {
    setRows((prev) => [...prev, { key: genKey(), entry: { visible: true, data: emptyBlock(type) } }]);
    setOpen(rows.length);
    setAdding(false);
    dirty();
  }
  function toggleVisible(i: number) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, entry: { ...r.entry, visible: !r.entry.visible } } : r)));
    dirty();
  }
  function remove(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    setOpen(null);
    dirty();
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(rows.map((r) => r.entry))} />

      {rows.length === 0 && (
        <div className="admin-panel p-8 text-center">
          <div className="text-4xl mb-2">▤</div>
          <p className="text-sm text-stone-600">
            Trang này chưa có khối nào. Thêm khối đầu tiên bên dưới — thường bắt đầu bằng “Ảnh bìa lớn”.
          </p>
        </div>
      )}

      {rows.map(({ key, entry: b }, i) => {
        const meta = BLOCK_LABELS[b.data.type];
        const isOpen = open === i;
        return (
          <div key={key} className={`admin-panel overflow-hidden ${b.visible ? '' : 'opacity-60'}`}>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50 border-b border-stone-200">
              <span className="text-stone-400 text-sm w-5 text-center">{meta.icon}</span>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)}
                className="flex-1 text-left min-w-0">
                <span className="text-[13.5px] font-medium text-stone-900">{meta.name}</span>
                <span className="block text-[11.5px] text-stone-500 truncate">{summary(b.data)}</span>
              </button>

              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                title="Chuyển lên trên" className="admin-btn-ghost px-2 disabled:opacity-25">↑</button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1}
                title="Chuyển xuống dưới" className="admin-btn-ghost px-2 disabled:opacity-25">↓</button>
              <button type="button"
                onClick={() => toggleVisible(i)}
                title={b.visible ? 'Đang hiện — bấm để ẩn' : 'Đang ẩn — bấm để hiện'}
                className={`text-[11.5px] px-2 py-1 rounded border ${
                  b.visible
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-stone-100 text-stone-500 border-stone-200'
                }`}>
                {b.visible ? 'Hiện' : 'Ẩn'}
              </button>
              <button type="button"
                onClick={() => { if (confirm(`Xóa khối "${meta.name}" khỏi trang?`)) remove(i); }}
                title="Xóa khối này" className="text-red-600 hover:text-red-800 px-2 text-sm">🗑</button>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)}
                className="admin-btn-ghost px-2" title={isOpen ? 'Thu gọn' : 'Mở ra sửa'}>
                {isOpen ? '▲' : '▼'}
              </button>
            </div>

            {isOpen && (
              <div className="p-4">
                <p className="text-[11.5px] text-stone-500 mb-3">{meta.hint}</p>
                <BlockFields block={b.data} onChange={(d) => patch(i, d)}
                  categoryOptions={categoryOptions} productOptions={productOptions} />
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="admin-panel p-3">
          <div className="text-[12.5px] font-medium text-stone-700 mb-2">Chọn loại khối muốn thêm:</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button type="button" key={t} onClick={() => add(t)}
                className="text-left p-2.5 rounded-lg border border-stone-200 hover:border-green-400 hover:bg-green-50/50 transition">
                <div className="text-[13px] font-medium text-stone-900">
                  <span className="text-stone-400 mr-1.5">{BLOCK_LABELS[t].icon}</span>
                  {BLOCK_LABELS[t].name}
                </div>
                <div className="text-[11.5px] text-stone-500 mt-0.5">{BLOCK_LABELS[t].hint}</div>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAdding(false)}
            className="admin-btn-ghost text-[12.5px] mt-2">Hủy</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-stone-300 rounded-xl py-3 text-[13px] font-medium text-stone-600 hover:border-green-400 hover:text-green-800 hover:bg-green-50/40 transition">
          + Thêm khối nội dung
        </button>
      )}
    </div>
  );
}

/** One-line preview so a collapsed block is still identifiable. */
function summary(b: Block): string {
  switch (b.type) {
    case 'hero': return b.title || 'Chưa có tiêu đề';
    case 'richtext': return b.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70) || 'Chưa có nội dung';
    case 'cards': return b.title || `${b.items.length} thẻ`;
    case 'stats': return b.title || `${b.items.length} số liệu`;
    case 'cta': return b.title || b.label || 'Chưa có nội dung';
    case 'gallery': return `${b.images.length} ảnh`;
    case 'products':
      if (b.source === 'category' && !b.categoryId) return `${b.title || 'Sản phẩm'} · ⚠ chưa chọn danh mục`;
      return `${b.title || 'Sản phẩm'} · ${PRODUCT_SOURCE_LABELS[b.source]}${b.source === 'manual' ? ` (${b.productIds.length})` : ` · ${b.limit}`}`;
    case 'categories': return `${b.title || 'Danh mục'} · ${b.source === 'manual' ? `chọn tay (${b.categoryIds.length})` : 'tất cả'}`;
    case 'heroSlider': return 'Slider trang chủ + dải số liệu';
    case 'valueProps': return b.title || 'Điểm giá trị';
    case 'subBox': return 'Hộp rau tuần (Cài đặt → Trang chủ)';
    case 'farmers': return `${b.title || 'Nông dân'} · ${b.limit} người`;
    case 'testimonials': return b.title || 'Cảm nhận khách hàng';
    case 'faq': return b.title || 'Câu hỏi thường gặp';
  }
}

const PRODUCT_SOURCE_LABELS: Record<'featured' | 'category' | 'manual' | 'latest' | 'sale', string> = {
  featured: 'Nổi bật', category: 'Theo danh mục', manual: 'Chọn tay', latest: 'Mới nhất', sale: 'Đang giảm giá',
};

function BlockFields({ block, onChange, categoryOptions, productOptions }: {
  block: Block;
  onChange: (b: Block) => void;
  categoryOptions: PickOption[];
  productOptions: PickOption[];
}) {
  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <Text label="Chữ nhỏ phía trên" value={block.badge}
            onChange={(v) => onChange({ ...block, badge: v })} placeholder="Câu chuyện của chúng tôi" />
          <Text label="Tiêu đề lớn" value={block.title}
            onChange={(v) => onChange({ ...block, title: v })} />
          <Area label="Mô tả ngắn" value={block.subtitle}
            onChange={(v) => onChange({ ...block, subtitle: v })} />
          <div>
            <span className="text-[13px] font-medium text-stone-900">Ảnh nền</span>
            <span className="block text-[11.5px] text-stone-500 mb-1">
              Có ảnh thì chữ hiện màu trắng đè lên ảnh. Không có ảnh thì nền trắng, chữ xanh.
            </span>
            <ImageUploadBridge value={block.image} onChange={(v) => onChange({ ...block, image: v })} />
          </div>
        </div>
      );

    case 'richtext':
      return (
        <RichEditor name="" defaultValue={block.html} minHeight={240}
          placeholder="Nhập nội dung…"
          onChange={(html) => onChange({ ...block, html })} />
      );

    case 'cards':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <Repeater
            items={block.items}
            onChange={(items) => onChange({ ...block, items })}
            blank={{ num: '', title: '', desc: '' }}
            max={9}
            addLabel="+ Thêm thẻ"
            render={(item, set) => (
              <div className="grid gap-2">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <Text label="Số" value={item.num} onChange={(v) => set({ ...item, num: v })} placeholder="01" />
                  <Text label="Tiêu đề thẻ" value={item.title} onChange={(v) => set({ ...item, title: v })} />
                </div>
                <Area label="Nội dung" value={item.desc} onChange={(v) => set({ ...item, desc: v })} />
              </div>
            )}
          />
        </div>
      );

    case 'stats':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <Repeater
            items={block.items}
            onChange={(items) => onChange({ ...block, items })}
            blank={{ value: '', label: '' }}
            max={8}
            addLabel="+ Thêm số liệu"
            render={(item, set) => (
              <div className="grid grid-cols-2 gap-2">
                <Text label="Con số" value={item.value} onChange={(v) => set({ ...item, value: v })} placeholder="120+" />
                <Text label="Nhãn" value={item.label} onChange={(v) => set({ ...item, label: v })} placeholder="Hộ nông dân" />
              </div>
            )}
          />
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <Area label="Mô tả" value={block.subtitle} onChange={(v) => onChange({ ...block, subtitle: v })} />
          <div className="grid md:grid-cols-2 gap-2">
            <Text label="Chữ trên nút" value={block.label}
              onChange={(v) => onChange({ ...block, label: v })} placeholder="Gặp bà con nông dân →" />
            <Text label="Nút dẫn tới đâu" value={block.href}
              onChange={(v) => onChange({ ...block, href: v })} placeholder="/farmers" />
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <GalleryField
            value={block.images}
            onChange={(images) => onChange({ ...block, images })}
            pickerTitle="Chọn ảnh cho bộ ảnh"
            emptyTitle="Thêm ảnh vào bộ ảnh"
            emptyHint="Các ảnh sẽ xếp thành lưới trên trang"
          />
        </div>
      );

    case 'products':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <HeaderFields eyebrow={block.eyebrow} linkLabel={block.linkLabel} linkHref={block.linkHref}
            set={(p) => onChange({ ...block, ...p })} />
          <ToneField value={block.tone} onChange={(v) => onChange({ ...block, tone: v })} />
          <Select label="Lấy sản phẩm từ đâu" value={block.source}
            onChange={(v) => onChange({ ...block, source: v as typeof block.source })}
            options={[
              ['featured', 'Sản phẩm nổi bật (đã tick “Nổi bật”)'],
              ['category', 'Theo danh mục'],
              ['manual', 'Chọn tay từng sản phẩm'],
              ['latest', 'Mới nhất'],
              ['sale', 'Đang giảm giá'],
            ]} />

          {block.source === 'category' && (
            <>
              <Select label="Danh mục" value={block.categoryId}
                onChange={(v) => onChange({ ...block, categoryId: v })}
                options={[['', '— Chọn danh mục —'], ...categoryOptions.map((c) => [c.id, c.name] as [string, string])]} />
              {!block.categoryId && (
                <p className="text-[11.5px] text-amber-700">Chưa chọn danh mục — khối này sẽ không hiện gì trên trang.</p>
              )}
            </>
          )}

          {block.source === 'manual' ? (
            <MultiPick label="Chọn sản phẩm (kéo ↑ ↓ để đổi thứ tự)" options={productOptions}
              selected={block.productIds} onChange={(ids) => onChange({ ...block, productIds: ids })}
              max={12} searchable emptyHint="Chưa chọn sản phẩm nào" />
          ) : (
            <NumberField label="Hiện bao nhiêu sản phẩm" min={1} max={12} value={block.limit}
              onChange={(n) => onChange({ ...block, limit: n })} />
          )}
        </div>
      );

    case 'categories':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <HeaderFields eyebrow={block.eyebrow} linkLabel={block.linkLabel} linkHref={block.linkHref}
            set={(p) => onChange({ ...block, ...p })} />
          <ToneField value={block.tone} onChange={(v) => onChange({ ...block, tone: v })} />
          <Select label="Hiện danh mục nào" value={block.source}
            onChange={(v) => onChange({ ...block, source: v as typeof block.source })}
            options={[['all', 'Tất cả danh mục gốc'], ['manual', 'Chọn tay từng danh mục']]} />
          {block.source === 'manual' ? (
            <MultiPick label="Chọn danh mục (kéo ↑ ↓ để đổi thứ tự)" options={categoryOptions}
              selected={block.categoryIds} onChange={(ids) => onChange({ ...block, categoryIds: ids })}
              max={24} emptyHint="Chưa chọn danh mục nào" />
          ) : (
            <NumberField label="Giới hạn số lượng (0 = hiện tất cả)" min={0} max={24} value={block.limit}
              onChange={(n) => onChange({ ...block, limit: n })} />
          )}
        </div>
      );

    case 'heroSlider':
      return (
        <p className="text-[12.5px] text-stone-600">
          Ảnh bìa lấy từ mục <b>Slider trang chủ</b> (các slide đang bật) và dải số liệu trong
          <b> Cài đặt → Trang chủ</b>. Không có slide nào thì tự dùng ảnh bìa tĩnh. Khối này không cần cấu hình thêm.
        </p>
      );

    case 'subBox':
      return (
        <p className="text-[12.5px] text-stone-600">
          Nội dung hộp (huy hiệu, tiêu đề, mô tả, danh sách, ảnh, nút) sửa ở <b>Cài đặt → Trang chủ</b>.
          Khối này không cần cấu hình thêm.
        </p>
      );

    case 'valueProps':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục (bỏ trống nếu không cần)" value={block.title}
            onChange={(v) => onChange({ ...block, title: v })} />
          <ToneField value={block.tone} onChange={(v) => onChange({ ...block, tone: v })} />
          <NumberField label="Giới hạn số lượng (0 = hiện tất cả)" min={0} max={12} value={block.limit}
            onChange={(n) => onChange({ ...block, limit: n })} />
          <p className="text-[11.5px] text-stone-500">Nội dung sửa ở mục <b>Điểm giá trị</b>.</p>
        </div>
      );

    case 'farmers':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <HeaderFields eyebrow={block.eyebrow} linkLabel={block.linkLabel} linkHref={block.linkHref}
            set={(p) => onChange({ ...block, ...p })} />
          <ToneField value={block.tone} onChange={(v) => onChange({ ...block, tone: v })} />
          <NumberField label="Hiện bao nhiêu nông dân (0 = tất cả)" min={0} max={24} value={block.limit}
            onChange={(n) => onChange({ ...block, limit: n })} />
          <p className="text-[11.5px] text-stone-500">Nội dung sửa ở mục <b>Nông dân</b>.</p>
        </div>
      );

    case 'testimonials':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <ToneField value={block.tone} onChange={(v) => onChange({ ...block, tone: v })} />
          <NumberField label="Giới hạn số lượng (0 = hiện tất cả)" min={0} max={24} value={block.limit}
            onChange={(n) => onChange({ ...block, limit: n })} />
          <p className="text-[11.5px] text-stone-500">Nội dung sửa ở mục <b>Cảm nhận</b>.</p>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-3">
          <Text label="Tiêu đề mục" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <Area label="Mô tả ngắn (dùng {phone} để chèn số điện thoại)" value={block.subtitle}
            onChange={(v) => onChange({ ...block, subtitle: v })} />
          <ToneField value={block.tone} onChange={(v) => onChange({ ...block, tone: v })} />
          <p className="text-[11.5px] text-stone-500">Danh sách hỏi–đáp sửa ở mục <b>Câu hỏi</b>.</p>
        </div>
      );
  }
}

/** Eyebrow + "see all" link fields shared by section-style blocks. */
function HeaderFields({
  eyebrow, linkLabel, linkHref, set,
}: {
  eyebrow: string; linkLabel: string; linkHref: string;
  set: (patch: { eyebrow?: string; linkLabel?: string; linkHref?: string }) => void;
}) {
  return (
    <>
      <Text label="Chữ nhỏ phía trên" value={eyebrow} onChange={(v) => set({ eyebrow: v })} placeholder="Danh mục" />
      <div className="grid grid-cols-2 gap-2">
        <Text label="Chữ trên link “xem tất cả”" value={linkLabel} onChange={(v) => set({ linkLabel: v })} placeholder="Xem tất cả" />
        <Text label="Link tới đâu" value={linkHref} onChange={(v) => set({ linkHref: v })} placeholder="/products" />
      </div>
    </>
  );
}

/** Section background: white (default) or the soft green band. */
function ToneField({ value, onChange }: { value: 'default' | 'muted'; onChange: (v: 'default' | 'muted') => void }) {
  return (
    <Select label="Nền section" value={value} onChange={(v) => onChange(v as 'default' | 'muted')}
      options={[['default', 'Trắng (mặc định)'], ['muted', 'Xanh nhạt']]} />
  );
}

/** A labelled <select>. */
function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-stone-900">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-stone-300 rounded px-3 py-2 text-sm bg-white">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function NumberField({
  label, value, onChange, min, max,
}: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <label className="block max-w-[260px]">
      <span className="text-[13px] font-medium text-stone-900">{label}</span>
      <input type="number" min={min} max={max} value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min);
        }}
        className="mt-1 w-full border border-stone-300 rounded px-3 py-2 text-sm" />
    </label>
  );
}

/**
 * Ordered multi-select. Chosen items sit at the top with reorder/remove
 * controls; the rest are added from a (optionally searchable) list below.
 */
function MultiPick({
  label, options, selected, onChange, max, searchable = false, emptyHint,
}: {
  label: string;
  options: PickOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  max: number;
  searchable?: boolean;
  emptyHint: string;
}) {
  const [q, setQ] = useState('');
  const byId = new Map(options.map((o) => [o.id, o]));
  const chosen = selected.filter((id) => byId.has(id));
  const needle = q.trim().toLowerCase();
  const avail = options.filter(
    (o) => !selected.includes(o.id) && (!needle || o.name.toLowerCase().includes(needle)),
  );
  const move = (i: number, to: number) => {
    if (to < 0 || to >= chosen.length) return;
    const next = [...chosen];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <div>
      <span className="text-[13px] font-medium text-stone-900">{label}</span>
      {chosen.length === 0 ? (
        <p className="text-[11.5px] text-stone-500 mt-1 mb-1">{emptyHint}</p>
      ) : (
        <ul className="mt-1 mb-2 space-y-1">
          {chosen.map((id, i) => (
            <li key={id} className="flex items-center gap-1.5 bg-green-50/60 border border-green-200 rounded px-2 py-1">
              <span className="flex-1 truncate text-[13px] text-stone-800">{byId.get(id)?.name}</span>
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                className="admin-btn-ghost px-1.5 disabled:opacity-25 text-xs" title="Lên">↑</button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === chosen.length - 1}
                className="admin-btn-ghost px-1.5 disabled:opacity-25 text-xs" title="Xuống">↓</button>
              <button type="button" onClick={() => onChange(chosen.filter((x) => x !== id))}
                className="text-red-600 hover:text-red-800 px-1.5 text-xs" title="Bỏ">✕</button>
            </li>
          ))}
        </ul>
      )}

      {chosen.length < max ? (
        <div className="rounded border border-stone-200">
          {searchable && (
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên…"
              className="w-full border-b border-stone-200 px-2.5 py-1.5 text-sm rounded-t" />
          )}
          <div className="max-h-44 overflow-y-auto">
            {avail.length === 0 ? (
              <p className="text-[12px] text-stone-400 px-2.5 py-2">Không còn mục nào.</p>
            ) : (
              avail.slice(0, 60).map((o) => (
                <button type="button" key={o.id} onClick={() => onChange([...chosen, o.id])}
                  className="block w-full text-left px-2.5 py-1.5 text-[13px] text-stone-700 hover:bg-green-50 border-b border-stone-100 last:border-0">
                  <span className="text-green-700 mr-1">+</span>{o.name}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <p className="text-[11.5px] text-stone-500">Đã đạt tối đa {max} mục.</p>
      )}
    </div>
  );
}

/** ImageUpload posts through a hidden field; blocks need a callback instead. */
function ImageUploadBridge({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <ImageUpload name="" defaultValue={value} label="" onChange={onChange} />;
}

function Repeater<T>({
  items, onChange, blank, render, max, addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  render: (item: T, set: (v: T) => void) => React.ReactNode;
  max: number;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-stone-200 p-3 relative">
          <div className="flex items-center gap-1 absolute right-2 top-2">
            <button type="button" disabled={i === 0} title="Lên"
              onClick={() => {
                const next = [...items];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                onChange(next);
              }}
              className="admin-btn-ghost px-1.5 disabled:opacity-25 text-xs">↑</button>
            <button type="button" disabled={i === items.length - 1} title="Xuống"
              onClick={() => {
                const next = [...items];
                [next[i + 1], next[i]] = [next[i], next[i + 1]];
                onChange(next);
              }}
              className="admin-btn-ghost px-1.5 disabled:opacity-25 text-xs">↓</button>
            <button type="button" title="Xóa" onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-red-600 hover:text-red-800 px-1.5 text-xs">✕</button>
          </div>
          {render(item, (v) => onChange(items.map((x, idx) => (idx === i ? v : x))))}
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, blank])}
          className="text-[12.5px] text-green-700 hover:text-green-900 font-medium underline underline-offset-2">
          {addLabel}
        </button>
      )}
    </div>
  );
}

function Text({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-stone-900">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full border border-stone-300 rounded px-3 py-2 text-sm" />
    </label>
  );
}

function Area({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-stone-900">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
        className="mt-1 w-full border border-stone-300 rounded px-3 py-2 text-sm" />
    </label>
  );
}
