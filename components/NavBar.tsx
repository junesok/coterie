"use client";

import { ChevronLeft, Settings, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavBarProps {
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

export function NavBar({ title = "coterie", showBack = false, rightSlot }: NavBarProps) {
  const router = useRouter();

  return (
    <div>
      <div className="xp-titlebar flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => router.back()} className="xp-btn p-1 flex items-center gap-1 text-white" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
          )}
          <span className="font-bold text-sm text-white">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {rightSlot}
        </div>
      </div>
      <hr className="xp-hr" />
    </div>
  );
}

export function SettingsIcon({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="p-1 text-white" style={{ background: "transparent", border: "none" }}>
      <Settings size={16} strokeWidth={1.5} />
    </button>
  );
}

export function EditDeleteButtons({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button onClick={onEdit} className="xp-btn py-0.5 px-2 flex items-center gap-1 text-xs text-white" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "none" }}>
        <Pencil size={12} strokeWidth={1.5} />
        수정
      </button>
      <button onClick={onDelete} className="xp-btn py-0.5 px-2 flex items-center gap-1 text-xs" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "none", color: "#ffaaaa" }}>
        <Trash2 size={12} strokeWidth={1.5} />
        삭제
      </button>
    </div>
  );
}
