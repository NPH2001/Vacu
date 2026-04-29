'use client';
import { useState } from 'react';
import EmojiPicker from './EmojiPicker';
import ImageUpload from './ImageUpload';

const isImage = (v: string) => /^(\/|https?:)/.test(v);

export default function CategoryIconField({ defaultValue }: { defaultValue?: string }) {
  const initial = defaultValue ?? '';
  const [mode, setMode] = useState<'emoji' | 'image'>(isImage(initial) ? 'image' : 'emoji');
  const [emoji, setEmoji] = useState(isImage(initial) ? '' : initial);
  const [image, setImage] = useState(isImage(initial) ? initial : '');

  const value = mode === 'image' ? image : emoji;

  return (
    <div className="space-y-2">
      <input type="hidden" name="icon" value={value} required />
      <div className="inline-flex rounded-full bg-green-50 border border-green-200 p-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode('emoji')}
          className={`px-3 py-1 rounded-full transition ${mode === 'emoji' ? 'bg-green-700 text-white shadow' : 'text-green-900/70 hover:text-green-900'}`}
        >
          Emoji
        </button>
        <button
          type="button"
          onClick={() => setMode('image')}
          className={`px-3 py-1 rounded-full transition ${mode === 'image' ? 'bg-green-700 text-white shadow' : 'text-green-900/70 hover:text-green-900'}`}
        >
          Ảnh upload
        </button>
      </div>
      {mode === 'emoji' ? (
        <EmojiPicker value={emoji} onChange={setEmoji} />
      ) : (
        <ImageUpload name="" defaultValue={image} onChange={setImage} label="" />
      )}
    </div>
  );
}
