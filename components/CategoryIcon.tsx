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
  if (isImage(value)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value} alt={alt} className={`inline-block object-cover ${className}`} style={style} />;
  }
  return <span className={className} style={style}>{value}</span>;
}
