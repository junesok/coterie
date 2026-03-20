"use client";

type Strength = 0 | 1 | 2 | 3;

function getStrength(password: string): Strength {
  if (password.length < 8) return 0;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLong = password.length >= 10;

  if (hasUpper && hasLower && hasDigit && hasSpecial && isLong) return 3;
  if ((hasUpper || hasLower) && hasDigit) return 2;
  return 1;
}

const LEVELS: { label: string; color: string }[] = [
  { label: "Weak",   color: "var(--danger)" },
  { label: "Fair",   color: "#FF8C00" },
  { label: "Good",   color: "#DAA520" },
  { label: "Strong", color: "#228B22" },
];

interface PasswordStrengthBarProps {
  password: string;
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  if (!password) return null;

  const strength = getStrength(password);
  const { label, color } = LEVELS[strength];

  return (
    <div className="mt-1.5 flex items-center gap-2">
      {/* 4칸 바 */}
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 8,
              background: i <= strength ? color : "var(--bg-button)",
              border: "1px solid var(--shadow-lo)",
              boxShadow:
                i <= strength
                  ? `inset 1px 1px rgba(255,255,255,0.3)`
                  : "inset 1px 1px var(--shadow-hi), inset -1px -1px var(--shadow-lo)",
              transition: "background 0.15s",
            }}
          />
        ))}
      </div>
      {/* 레이블 */}
      <span className="text-[11px] font-bold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
