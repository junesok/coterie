"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

interface ImageCarouselProps {
  images: { url: string; order: number }[];
  enableLightbox?: boolean;
}

export function ImageCarousel({ images, enableLightbox = false }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const swipedRef = useRef(false);

  // 라이트박스 트리거용 ghost 버튼 refs
  const ghostRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (images.length === 0) return null;

  const total = images.length;

  function prev() { setCurrent((c) => (c > 0 ? c - 1 : c)); }
  function next() { setCurrent((c) => (c < total - 1 ? c + 1 : c)); }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
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
      // 스와이프 직후 click 이벤트가 발생해도 라이트박스가 열리지 않게 방지
      swipedRef.current = true;
      setTimeout(() => { swipedRef.current = false; }, 100);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  function handleCarouselClick() {
    if (enableLightbox && !swipedRef.current && !isDragging.current) {
      ghostRefs.current[current]?.click();
    }
  }

  const carousel = (
    <div
      className="relative select-none"
      style={{
        overflow: "hidden",
        background: "#000",
        touchAction: "pan-y",
        cursor: enableLightbox ? "zoom-in" : "default",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleCarouselClick}
    >
      {/* 슬라이드 트랙 */}
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

      {/* 좌우 화살표 */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            disabled={current === 0}
            aria-label="previous image"
            style={{
              position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
              background: current === 0 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)",
              border: "none", borderRadius: "50%", width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: current === 0 ? "default" : "pointer",
              color: "#fff", transition: "background 150ms",
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
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: current === total - 1 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)",
              border: "none", borderRadius: "50%", width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: current === total - 1 ? "default" : "pointer",
              color: "#fff", transition: "background 150ms",
              opacity: current === total - 1 ? 0.35 : 1,
            }}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>

          {/* 페이지 카운터 */}
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,0.5)", color: "#fff",
            fontSize: 11, fontFamily: "Tahoma, sans-serif",
            borderRadius: 10, padding: "2px 8px", lineHeight: "16px",
          }}>
            {current + 1} / {total}
          </div>

          {/* 도트 인디케이터 */}
          <div style={{
            position: "absolute", bottom: 10, left: "50%",
            transform: "translateX(-50%)", display: "flex", gap: 6, alignItems: "center",
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                aria-label={`go to image ${i + 1}`}
                style={{
                  width: i === current ? 18 : 8, height: 8, borderRadius: 4,
                  background: i === current ? "#fff" : "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.25)",
                  cursor: "pointer", padding: 0,
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

  if (!enableLightbox) return carousel;

  return (
    <PhotoProvider>
      {/* 라이트박스 ghost 트리거 — 시각적으로 숨겨진 버튼들 */}
      {images.map((img, i) => (
        <PhotoView key={i} src={img.url}>
          <button
            ref={(el) => { ghostRefs.current[i] = el; }}
            aria-hidden="true"
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              width: 0,
              height: 0,
              padding: 0,
              border: "none",
              overflow: "hidden",
            }}
          />
        </PhotoView>
      ))}
      {carousel}
    </PhotoProvider>
  );
}
