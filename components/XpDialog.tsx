"use client";

interface XpDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function XpDialog({
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  danger = false,
}: XpDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="xp-window w-[280px]">
        <div className="xp-titlebar">
          <span>{title}</span>
        </div>
        <div className="p-4">
          <p className="text-sm mb-4" style={{ color: "var(--text-base)" }}>{message}</p>
          <div className="flex gap-2 justify-end">
            <button className="xp-btn text-sm" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              className="xp-btn text-sm font-bold"
              onClick={onConfirm}
              style={danger ? { color: "var(--danger)", borderColor: "var(--danger)" } : {}}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
