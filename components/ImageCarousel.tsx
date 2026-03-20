"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: { url: string; order: number }[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  if (images.length === 0) return null;

  const total = images.length;

  function prev() {
    setCurrent((c) => (c > 0 ? c - 1 : c));
  }
  function next() {
    setCurrent((c) => (c < total - 1 ? c + 1 : c));
  }

  /* ── 터치 스와이프 ── */
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    // 수평 스와이프가 더 크면 스크롤 방지
    if (dx > dy && dx > 8) {
      isDragging.current = true;
      e.preventDefault();
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  return (
    <div
      className="relative select-none"
      style={{ overflow: "hidden", background: "#000", touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── 슬라이드 트랙 ── */}
      <div
        className="flex"
        style={{
          transform: `translateX(-${current * 100}%)`,
          transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      >
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={img.url}
            alt={`image ${i + 1}`}
            draggable={false}
            className="object-contain shrink-0"
            style={{
              width: "100%",
              minWidth: "100%",
              maxHeight: 340,
              display: "block",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      {/* ── 좌우 화살표 (2장 이상일 때) ── */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            disabled={current === 0}
            aria-label="previous image"
            style={{
              position: "absolute",
              left: 6,
              top: "50%",
              transform: "translateY(-50%)",
              background: current === 0 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: current === 0 ? "default" : "pointer",
              color: "#fff",
              transition: "background 150ms",
              opacity: current === 0 ? 0.35 : 1,
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            disabled={current === total - 1}
            aria-label="next image"
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              background: current === total - 1 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: current === total - 1 ? "default" : "pointer",
              color: "#fff",
              transition: "background 150ms",
              opacity: current === total - 1 ? 0.35 : 1,
            }}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>

          {/* ── 페이지 카운터 (우상단) ── */}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: 11,
              fontFamily: "Tahoma, sans-serif",
              borderRadius: 10,
              padding: "2px 8px",
              lineHeight: "16px",
              letterSpacing: "0.02em",
            }}
          >
            {current + 1} / {total}
          </div>

          {/* ── 도트 인디케이터 (하단) ── */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                aria-label={`go to image ${i + 1}`}
                style={{
                  width: i === current ? 18 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === current ? "#fff" : "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.25)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 200ms ease, background 150ms",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
