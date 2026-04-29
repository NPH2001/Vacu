import type { CSSProperties } from 'react';

const isImage = (v: string) => /^(\/|https?:)/.test(v);

export default function CategoryIcon({
  value, className = '', alt = '', style,
}: {
  value: string;
  className?: string;
  alt?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden leading-none align-middle ${className}`}
      style={style}
    >
      {isImage(value) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden>{value}</span>
      )}
    </span>
  );
}
