"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { Avatar } from "@/components/Avatar";

interface MentionUser {
  id: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
  onSubmit?: () => void;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  inputRef: externalRef,
  className,
  onSubmit,
}: MentionInputProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = externalRef ?? internalRef;

  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null); // null = 비활성
  const [mentionStart, setMentionStart] = useState<number>(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // @뒤 쿼리 추출
  function getMentionAt(text: string, cursor: number): string | null {
    const before = text.slice(0, cursor);
    const match = before.match(/@([a-z0-9_]*)$/i);
    if (!match) return null;
    return match[1]; // @뒤 텍스트 (빈 문자열도 OK)
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const cursor = e.target.selectionStart ?? val.length;
      onChange(val);

      const query = getMentionAt(val, cursor);
      if (query === null) {
        setSuggestions([]);
        setMentionQuery(null);
        return;
      }

      // @ 시작 위치 계산
      const atPos = cursor - query.length - 1; // '@' 위치
      setMentionStart(atPos);
      setMentionQuery(query);
      setActiveIdx(0);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (!query && query !== "") return;
        try {
          const res = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`);
          if (res.data.success) setSuggestions(res.data.users);
        } catch {
          setSuggestions([]);
        }
      }, 150);
    },
    [onChange]
  );

  // 유저 선택 → @username 삽입
  function selectUser(user: MentionUser) {
    if (!user.username) return;
    const cursor = ref.current?.selectionStart ?? value.length;
    const queryLen = (mentionQuery ?? "").length;
    // '@' 포함해서 현재 쿼리 부분을 '@username ' 으로 교체
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor); // cursor = mentionStart + 1 + queryLen
    const newVal = `${before}@${user.username} ${after}`;
    onChange(newVal);
    setSuggestions([]);
    setMentionQuery(null);

    // 커서를 삽입 직후로 이동
    requestAnimationFrame(() => {
      const pos = mentionStart + user.username!.length + 2; // '@' + username + ' '
      ref.current?.setSelectionRange(pos, pos);
      ref.current?.focus();
    });
  }

  // 키보드: ↑↓ 탐색, Enter 선택, Escape 닫기
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        selectUser(suggestions[activeIdx]);
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        setMentionQuery(null);
        return;
      }
    }
    // 드롭다운 없을 때 Enter → 댓글 제출
    if (e.key === "Enter" && !e.shiftKey) {
      onSubmit?.();
    }
  }

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!(e.target as Element).closest("[data-mention-dropdown]")) {
        setSuggestions([]);
        setMentionQuery(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="relative flex-1" data-mention-dropdown>
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        className={className ?? "xp-input w-full text-sm"}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {/* 자동완성 드롭다운 — 입력창 위로 */}
      {suggestions.length > 0 && (
        <div
          data-mention-dropdown
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            boxShadow: "2px 2px 6px rgba(0,0,0,0.18)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {suggestions.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              data-mention-dropdown
              onPointerDown={(e) => {
                e.preventDefault(); // blur 방지
                selectUser(user);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 10px",
                background: idx === activeIdx ? "var(--point)" : "transparent",
                color: idx === activeIdx ? "#fff" : "var(--text-base)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "Tahoma, sans-serif",
                fontSize: 13,
              }}
            >
              <Avatar
                avatarUrl={user.avatarUrl}
                username={user.username ?? user.name}
                size={22}
              />
              <span style={{ fontWeight: 600 }}>@{user.username}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
