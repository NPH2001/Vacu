'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useState } from 'react';
import MediaPicker from '@/components/admin/MediaPicker';

type Props = {
  /** Hidden-field name for plain form posts. Pass '' when using onChange
   *  instead — a nameless input is not submitted. */
  name: string;
  defaultValue?: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  minHeight?: number;
  /** For callers that serialize the value themselves (e.g. the page builder). */
  onChange?: (html: string) => void;
};

export default function RichEditor({
  name, defaultValue = '', label, hint, placeholder = 'Bắt đầu viết ở đây…', minHeight = 320, onChange,
}: Props) {
  const [html, setHtml] = useState(defaultValue);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const editor = useEditor({
    // Tiptap renders differently on the server than after hydration; letting it
    // render immediately produces a hydration mismatch in the App Router.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        // Same class the public page uses, so the editor is a true preview.
        class: 'product-prose px-4 py-3',
        style: `min-height:${minHeight}px`,
        role: 'textbox',
        'aria-multiline': 'true',
        // Give the multiline edit region an accessible name.
        'aria-label': label || 'Trình soạn thảo nội dung',
      },
    },
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      setHtml(next);
      onChange?.(next);
    },
  });

  const openLinkEditor = useCallback(() => {
    if (!editor) return;
    setLinkValue(editor.getAttributes('link').href ?? '');
    setLinkOpen(true);
  }, [editor]);

  function applyLink() {
    if (!editor) return;
    const href = linkValue.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link')
        .setLink({ href: /^(https?:|mailto:|tel:|\/)/i.test(href) ? href : `https://${href}` })
        .run();
    }
    setLinkOpen(false);
  }

  if (!editor) {
    return (
      <div className="space-y-1.5">
        {label && <span className="text-sm font-medium text-green-950">{label}</span>}
        <div className="border border-green-200 rounded-xl bg-green-50/30 animate-pulse" style={{ minHeight }} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {label && <span className="block text-sm font-medium text-green-950">{label}</span>}
      {hint && <span className="block text-xs text-green-900/60">{hint}</span>}

      <input type="hidden" name={name} value={html} />

      <div className="border border-green-200 rounded-xl overflow-hidden bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition">
        <div role="toolbar" aria-label="Định dạng văn bản" className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-green-100 bg-green-50/50 sticky top-0 z-10">
          <Btn onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')} title="Chữ đậm (Ctrl+B)">
            <b>B</b>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')} title="Chữ nghiêng (Ctrl+I)">
            <i>I</i>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')} title="Gạch chân (Ctrl+U)">
            <u>U</u>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')} title="Gạch ngang">
            <s>S</s>
          </Btn>

          <Sep />

          <Btn onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive('paragraph')} title="Đoạn văn thường">
            ¶
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })} title="Tiêu đề lớn">
            H2
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })} title="Tiêu đề vừa">
            H3
          </Btn>

          <Sep />

          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')} title="Danh sách gạch đầu dòng">
            •≡
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')} title="Danh sách đánh số">
            1≡
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')} title="Trích dẫn">
            ❝
          </Btn>

          <Sep />

          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })} title="Căn trái">
            ⇤
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })} title="Căn giữa">
            ⇔
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })} title="Căn phải">
            ⇥
          </Btn>

          <Sep />

          <Btn onClick={openLinkEditor} active={editor.isActive('link')} title="Chèn liên kết">
            🔗
          </Btn>
          <Btn onClick={() => setPickerOpen(true)} title="Chèn ảnh từ thư viện">
            🖼
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang">
            ―
          </Btn>

          <Sep />

          <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Xóa định dạng (dùng khi dán từ Word bị lỗi)">
            ⌫ᴀ
          </Btn>

          <div className="flex-1" />

          <Btn onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()} title="Hoàn tác (Ctrl+Z)">
            ↺
          </Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()} title="Làm lại (Ctrl+Y)">
            ↻
          </Btn>
        </div>

        {linkOpen && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200">
            <span className="text-xs font-medium text-green-950 shrink-0">Địa chỉ liên kết:</span>
            <input
              autoFocus
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') setLinkOpen(false);
              }}
              placeholder="vacu.vn/tin-tuc hoặc https://…"
              className="flex-1 border border-green-200 rounded px-2 py-1 text-sm"
            />
            <button type="button" onClick={applyLink}
              className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Áp dụng
            </button>
            <button type="button" onClick={() => setLinkOpen(false)}
              className="text-xs text-green-800 hover:underline px-1">
              Hủy
            </button>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>

      <p className="text-xs text-green-900/50">
        Mẹo: dán nội dung từ Word/Google Docs được giữ định dạng. Nếu chữ bị lỗi font, bôi đen rồi bấm <b>⌫ᴀ</b> để xóa định dạng thừa.
      </p>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiple
        title="Chèn ảnh vào bài viết"
        onSelect={(urls) => {
          const chain = editor.chain().focus();
          for (const src of urls) chain.setImage({ src });
          chain.run();
        }}
      />
    </div>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-green-200 mx-1" aria-hidden />;
}

function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`min-w-8 h-8 px-2 rounded-md text-sm inline-flex items-center justify-center transition disabled:opacity-30 ${
        active ? 'bg-green-700 text-white' : 'text-green-900 hover:bg-green-100'
      }`}
    >
      {children}
    </button>
  );
}
