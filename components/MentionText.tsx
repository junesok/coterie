"use client";

/**
 * 텍스트 내 @username 패턴을 프로필 링크로 변환해 렌더링합니다.
 * whitespace-pre-wrap 처리도 포함합니다.
 */
export function MentionText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const parts = text.split(/(@[a-z0-9_]+)/gi);

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap", ...style }}>
      {parts.map((part, i) => {
        if (/^@[a-z0-9_]+$/i.test(part)) {
          const username = part.slice(1); // @ 제거
          return (
            <a
              key={i}
              href={`/profile/${username}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                color: "var(--point)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
