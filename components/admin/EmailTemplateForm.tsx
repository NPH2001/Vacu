'use client';
import Link from 'next/link';
import { useActionState, useState, useMemo } from 'react';
import type { EmailTemplateFormState } from '@/app/admin/actions/email-templates';
import type { EmailTemplateRow } from '@/db/schema';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c),
  );
}

function renderTpl(tpl: string, vars: Record<string, string>, rawKeys: string[] = []): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k] ?? '';
    return rawKeys.includes(k) ? v : escapeHtml(v);
  });
}

function wrapShell(opts: { body: string; subject: string; header: string; footer: string }): string {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8" /><title>${escapeHtml(opts.subject)}</title></head>
<body style="margin:0;padding:20px;background:#f5f7f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a2e1a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5ead8;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
${opts.header ? `<tr><td>${opts.header}</td></tr>` : ''}
<tr><td style="padding:28px 28px 8px 28px">${opts.body}</td></tr>
${opts.footer ? `<tr><td>${opts.footer}</td></tr>` : ''}
</table>
</td></tr></table>
</body></html>`;
}

export default function EmailTemplateForm({
  action, defaults, variables, headerHtml, footerHtml, sampleVars, rawKeys = [],
}: {
  action: (prev: EmailTemplateFormState, fd: FormData) => Promise<EmailTemplateFormState>;
  defaults: EmailTemplateRow;
  variables: Array<{ name: string; hint: string }>;
  headerHtml: string;
  footerHtml: string;
  sampleVars: Record<string, string>;
  rawKeys?: string[];
}) {
  const [state, formAction, pending] = useActionState<EmailTemplateFormState, FormData>(action, null);
  const [subject, setSubject] = useState(defaults.subject);
  const [body, setBody] = useState(defaults.bodyHtml);

  return (
    <form action={formAction} className="space-y-5 bg-white rounded-2xl border border-green-100 p-6">
      <div className="text-sm text-green-900/70">
        Key: <span className="font-mono bg-green-50 px-2 py-0.5 rounded">{defaults.key}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <L label="Tên mẫu" required>
          <input name="name" defaultValue={defaults.name} required className={inputCls} />
        </L>
        <L label="Trạng thái">
          <label className="inline-flex items-center gap-2 h-[42px]">
            <input type="checkbox" name="enabled" defaultChecked={defaults.enabled} />
            <span className="text-sm">Bật gửi mẫu này</span>
          </label>
        </L>
      </div>

      <L label="Ghi chú nội bộ (tuỳ chọn)">
        <input name="description" defaultValue={defaults.description} className={inputCls}
          placeholder="VD: Gửi cho khách sau khi đặt hàng" />
      </L>

      <L label="Chủ đề email" required>
        <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required
          className={inputCls + ' font-medium'} />
      </L>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-green-950">
            Nội dung HTML <span className="text-red-500">*</span>
          </span>
          <span className="text-xs text-green-900/60">Nội dung nằm giữa Header &amp; Footer chung — không cần lặp wrapper ngoài</span>
        </div>
        <textarea
          name="bodyHtml"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={14}
          className="w-full border border-green-200 rounded px-3 py-2 font-mono text-xs"
        />
      </div>

      {variables.length > 0 && (
        <div className="bg-green-50/60 border border-green-100 rounded-xl p-4">
          <div className="font-semibold text-sm text-green-950 mb-2">Biến có thể dùng trong mẫu này:</div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {variables.map((v) => (
              <div key={v.name} className="flex gap-2">
                <code className="font-mono bg-white border border-green-200 px-1.5 py-0.5 rounded text-green-700 shrink-0">
                  {'{{' + v.name + '}}'}
                </code>
                <span className="text-green-900/70">{v.hint}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-900/60 mt-2">
            Gõ chính xác <code>{'{{tênBiến}}'}</code> — preview phía dưới thay bằng dữ liệu mẫu để bạn thấy kết quả.
          </p>
        </div>
      )}

      <PreviewBlock
        subject={subject}
        body={body}
        headerHtml={headerHtml}
        footerHtml={footerHtml}
        sampleVars={sampleVars}
        rawKeys={rawKeys}
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-3">
        <Link href="/admin/email-templates" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : 'Cập nhật'}
        </button>
      </div>
    </form>
  );
}

function PreviewBlock({
  subject, body, headerHtml, footerHtml, sampleVars, rawKeys,
}: {
  subject: string; body: string;
  headerHtml: string; footerHtml: string;
  sampleVars: Record<string, string>;
  rawKeys: string[];
}) {
  const [show, setShow] = useState(true);
  const rendered = useMemo(() => {
    const renderedSubject = renderTpl(subject, sampleVars);
    const renderedBody = renderTpl(body, sampleVars, rawKeys);
    const renderedHeader = headerHtml ? renderTpl(headerHtml, sampleVars, ['logoUrl']) : '';
    const renderedFooter = footerHtml ? renderTpl(footerHtml, sampleVars) : '';
    return {
      subject: renderedSubject,
      html: wrapShell({
        body: renderedBody,
        subject: renderedSubject,
        header: renderedHeader,
        footer: renderedFooter,
      }),
    };
  }, [subject, body, headerHtml, footerHtml, sampleVars, rawKeys]);

  return (
    <div>
      <button type="button" onClick={() => setShow((v) => !v)}
        className="text-sm text-green-700 font-semibold hover:underline">
        {show ? '× Ẩn preview' : '👁 Xem preview (dữ liệu mẫu)'}
      </button>
      {show && (
        <div className="mt-2 border border-green-200 rounded-xl overflow-hidden">
          <div className="bg-green-50/60 px-4 py-2 border-b border-green-100 text-sm">
            <span className="text-green-900/60">Chủ đề:</span> <strong>{rendered.subject}</strong>
          </div>
          <iframe
            srcDoc={rendered.html}
            className="w-full h-[560px] bg-white"
            sandbox=""
            title="Email preview"
          />
        </div>
      )}
    </div>
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
