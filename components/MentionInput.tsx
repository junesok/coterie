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

// ─── 단일 라인 (input) ───────────────────────────────────────────────────────
interface SingleLineProps {
  multiline?: false;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onSubmit?: () => void;
}

// ─── 다중 라인 (textarea) ────────────────────────────────────────────────────
interface MultiLineProps {
  multiline: true;
  inputRef?: never;
  onSubmit?: never;
}

type MentionInputProps = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  /** 드롭다운 방향: "up" = 입력창 위, "down" = 입력창 아래 (기본 "up") */
  dropdownDirection?: "up" | "down";
} & (SingleLineProps | MultiLineProps);

// 공통 로직 훅
function useMentionLogic(value: string, onChange: (v: string) => void) {
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  function getMentionAt(text: string, cursor: number): string | null {
    const match = text.slice(0, cursor).match(/@([a-z0-9_]*)$/i);
    return match ? match[1] : null;
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      const cursor = e.target.selectionStart ?? val.length;
      onChange(val);

      const query = getMentionAt(val, cursor);
      if (query === null) {
        setSuggestions([]);
        setMentionQuery(null);
        return;
      }

      setMentionStart(cursor - query.length - 1);
      setMentionQuery(query);
      setActiveIdx(0);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
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

  function selectUser(user: MentionUser) {
    if (!user.username) return;
    const cursor = elRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    onChange(`${before}@${user.username} ${after}`);
    setSuggestions([]);
    setMentionQuery(null);

    requestAnimationFrame(() => {
      const pos = mentionStart + user.username!.length + 2;
      elRef.current?.setSelectionRange(pos, pos);
      elRef.current?.focus();
    });
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    onSubmit?: () => void
  ) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Enter")     { e.preventDefault(); selectUser(suggestions[activeIdx]); return; }
      if (e.key === "Escape")    { setSuggestions([]); setMentionQuery(null); return; }
    }
    // input 전용: Enter로 제출 (textarea는 줄바꿈 허용)
    if (onSubmit && e.key === "Enter" && !e.shiftKey) {
      onSubmit();
    }
  }

  // 바깥 클릭 닫기
  useEffect(() => {
    function onPD(e: PointerEvent) {
      if (!(e.target as Element).closest("[data-mention-dd]")) {
        setSuggestions([]);
        setMentionQuery(null);
      }
    }
    document.addEventListener("pointerdown", onPD);
    return () => document.removeEventListener("pointerdown", onPD);
  }, []);

  return { suggestions, activeIdx, elRef, handleChange, handleKeyDown, selectUser, mentionQuery };
}

// ─── 드롭다운 공통 렌더 ──────────────────────────────────────────────────────
function Dropdown({
  suggestions,
  activeIdx,
  direction,
  onSelect,
}: {
  suggestions: MentionUser[];
  activeIdx: number;
  direction: "up" | "down";
  onSelect: (u: MentionUser) => void;
}) {
  if (suggestions.length === 0) return null;
  const pos = direction === "up"
    ? { bottom: "calc(100% + 4px)" }
    : { top: "calc(100% + 4px)" };

  return (
    <div
      data-mention-dd
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        ...pos,
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
          data-mention-dd
          onPointerDown={(e) => { e.preventDefault(); onSelect(user); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "6px 10px",
            background: idx === activeIdx ? "var(--point)" : "transparent",
            color: idx === activeIdx ? "#fff" : "var(--text-base)",
            border: "none", cursor: "pointer", textAlign: "left",
            fontFamily: "Tahoma, sans-serif", fontSize: 13,
          }}
        >
          <Avatar avatarUrl={user.avatarUrl} username={user.username ?? user.name} size={22} />
          <span style={{ fontWeight: 600 }}>@{user.username}</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>{user.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export function MentionInput(props: MentionInputProps) {
  const {
    value, onChange, placeholder, className,
    dropdownDirection = "up",
  } = props;

  const {
    suggestions, activeIdx, elRef,
    handleChange, handleKeyDown, selectUser,
  } = useMentionLogic(value, onChange);

  // ── textarea 모드 ──
  if (props.multiline) {
    return (
      <div className="relative" data-mention-dd>
        <textarea
          ref={(el) => { elRef.current = el; }}
          className={className ?? "xp-input w-full resize-none min-h-[200px]"}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => handleKeyDown(e, undefined)}
          autoComplete="off"
        />
        <Dropdown
          suggestions={suggestions}
          activeIdx={activeIdx}
          direction={dropdownDirection}
          onSelect={selectUser}
        />
      </div>
    );
  }

  // ── input 모드 ──
  const { inputRef: externalRef, onSubmit } = props;
  const internalRef = useRef<HTMLInputElement>(null);
  // externalRef 가 있으면 함께 연결
  function setRef(el: HTMLInputElement | null) {
    elRef.current = el;
    if (externalRef) (externalRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
  }

  return (
    <div className="relative flex-1" data-mention-dd>
      <input
        ref={setRef}
        className={className ?? "xp-input w-full text-sm"}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => handleKeyDown(e, onSubmit)}
        autoComplete="off"
      />
      <Dropdown
        suggestions={suggestions}
        activeIdx={activeIdx}
        direction={dropdownDirection}
        onSelect={selectUser}
      />
    </div>
  );
}
