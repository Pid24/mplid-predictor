"use client";

import { useState } from "react";

type Props = {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  hideOnError?: boolean; // default true
  fallbackSrc?: string; // optional
};

export default function ImageFallback({ src, alt, width, height, className, hideOnError = true, fallbackSrc }: Props) {
  const [error, setError] = useState(false);
  const shownSrc = !error ? src : fallbackSrc;

  if (hideOnError && error && !fallbackSrc) return null;

  // pakai <img> biasa agar simple; kalau mau next/image tinggal ganti
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={shownSrc} alt={alt} width={width} height={height} className={className} onError={() => setError(true)} />;
}
    