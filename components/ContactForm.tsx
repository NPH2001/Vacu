'use client';
import { useId, useState, useTransition } from 'react';
import { submitContact } from '@/app/(public)/contact/actions';
import type { ContactTopicRow } from '@/db/schema';

export default function ContactForm({ topics }: { topics: ContactTopicRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const topicId = useId();
  const messageId = useId();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    topic: topics[0]?.label ?? '',
    message: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('name', form.name);
    fd.set('phone', form.phone);
    fd.set('email', form.email);
    fd.set('topic', form.topic);
    fd.set('message', form.message);
    startTransition(async () => {
      const res = await submitContact(fd);
      if (!res.ok) { setError(res.error); return; }
      setSent(true);
      setForm({ name: '', phone: '', email: '', topic: topics[0]?.label ?? '', message: '' });
    });
  }

  if (sent) {
    return (
      <div className="md:col-span-3 bg-green-50 rounded-3xl border border-green-200 p-10 text-center">
        <div className="text-5xl mb-3">✉️</div>
        <h2 className="text-2xl font-bold font-display text-green-950 mb-2">Đã gửi!</h2>
        <p className="text-green-900/80">Chúng tôi sẽ phản hồi qua email trong thời gian sớm nhất.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-5 text-sm text-green-700 hover:underline"
        >
          Gửi tin nhắn khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="md:col-span-3 bg-white rounded-3xl border border-green-100 p-7 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Họ và tên" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nguyễn Văn A" autoComplete="name" required />
        <Field label="Số điện thoại" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0912 xxx xxx" type="tel" autoComplete="tel" required />
      </div>
      <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="ban@example.com" type="email" autoComplete="email" required />
      {topics.length > 0 && (
        <div>
          <label htmlFor={topicId} className="block text-sm font-semibold text-green-950 mb-1.5">Bạn muốn hỏi về</label>
          <select
            id={topicId}
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-500"
          >
            {topics.map((t) => <option key={t.id}>{t.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor={messageId} className="block text-sm font-semibold text-green-950 mb-1.5">Nội dung</label>
        <textarea
          id={messageId}
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Viết gì đó..."
          required
          className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-500"
        />
      </div>
      {error && <p role="alert" aria-live="assertive" className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold px-6 py-3.5 rounded-full transition"
      >
        {pending ? 'Đang gửi…' : 'Gửi tin nhắn'}
      </button>
    </form>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', required, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  type?: string; required?: boolean; autoComplete?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-green-950 mb-1.5">
        {label}{required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-500"
      />
    </div>
  );
}
