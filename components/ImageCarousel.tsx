"use client";

import { useState } from "react";

interface ImageCarouselProps {
  images: { url: string; order: number }[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  function handleTouchStart(e: React.TouchEvent) {
    const startX = e.touches[0].clientX;

    function handleTouchEnd(ev: TouchEvent) {
      const diff = startX - ev.changedTouches[0].clientX;
      if (diff > 50 && current < images.length - 1) setCurrent((c) => c + 1);
      if (diff < -50 && current > 0) setCurrent((c) => c - 1);
      document.removeEventListener("touchend", handleTouchEnd);
    }

    document.addEventListener("touchend", handleTouchEnd);
  }

  return (
    <div className="relative" onTouchStart={handleTouchStart}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[current].url}
        alt={`이미지 ${current + 1}`}
        className="w-full object-cover"
        style={{ maxHeight: "300px" }}
      />

      {/* Dot indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i === current ? "var(--point)" : "rgba(255,255,255,0.6)",
                border: "1px solid rgba(0,0,0,0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
