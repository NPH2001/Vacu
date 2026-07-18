"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimateOnScroll({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // When the user asks for reduced motion, skip the fade/slide entirely: show
  // the content immediately with no transition, rather than animating it in on
  // every scroll (vestibular trigger — WCAG 2.3.3).
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Client-only media query (unknown during SSR), so this must run in an
      // effect — the one extra render is intended, as in CartProvider.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReduced(true);
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}
