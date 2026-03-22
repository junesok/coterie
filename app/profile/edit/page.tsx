"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVED = ["coterie_admin"];

export default function ProfileEditPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // username availability
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameError, setUsernameError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalUsername = useRef("");

  // Load current user info
  useEffect(() => {
    axios.get("/api/users/me").then((res) => {
      if (res.data.success) {
        const u = res.data.user;
        setName(u.name ?? "");
        setUsername(u.username ?? "");
        setAvatarUrl(u.avatarUrl ?? null);
        originalUsername.current = u.username ?? "";
      }
    });
  }, []);

  // Debounced username check
  const checkUsername = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (val: string) => {
        clearTimeout(timer);
        const normalized = val.toLowerCase();

        if (!normalized) {
          setUsernameStatus("idle");
          setUsernameError("");
          return;
        }

        if (normalized === originalUsername.current) {
          setUsernameStatus("idle");
          setUsernameError("");
          return;
        }

        if (!USERNAME_REGEX.test(normalized)) {
          setUsernameStatus("invalid");
          setUsernameError("3–20 chars: lowercase letters, numbers, underscores only.");
          return;
        }

        if (RESERVED.includes(normalized)) {
          setUsernameStatus("taken");
          setUsernameError("That username is reserved.");
          return;
        }

        setUsernameStatus("checking");
        setUsernameError("");

        timer = setTimeout(async () => {
          try {
            const res = await axios.get(
              `/api/auth/check-username?username=${encodeURIComponent(normalized)}`
            );
            if (res.data.available) {
              setUsernameStatus("available");
              setUsernameError("");
            } else {
              setUsernameStatus("taken");
              setUsernameError(res.data.error ?? "Username already taken.");
            }
          } catch {
            setUsernameStatus("idle");
          }
        }, 500);
      };
    })(),
    []
  );

  function handleUsernameChange(val: string) {
    setUsername(val);
    checkUsername(val);
  }

  // Avatar upload
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });

      const signRes = await axios.post("/api/upload/sign");
      const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;

      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("folder", folder);
      fd.append("timestamp", timestamp);
      fd.append("api_key", apiKey);
      fd.append("signature", signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: fd }
      );
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error("Upload failed");

      setAvatarUrl(uploadData.secure_url);
    } catch {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Remove avatar
  function handleRemoveAvatar() {
    setAvatarUrl(null);
  }

  // Save changes
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (usernameStatus === "taken" || usernameStatus === "invalid") return;

    setSaving(true);
    setMsg(null);
    try {
      const payload: Record<string, string | null> = {
        name: name.trim(),
        username: username.toLowerCase(),
        avatarUrl: avatarUrl,
      };

      await axios.put("/api/users/me", payload);

      // Update session so navbar/etc reflect new username immediately
      await updateSession();

      setMsg({ text: "Profile updated!", ok: true });
      originalUsername.current = username.toLowerCase();
      setUsernameStatus("idle");

      // Redirect to updated profile
      setTimeout(() => {
        router.push(`/profile/${username.toLowerCase()}`);
      }, 800);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error
        : "Something went wrong.";
      setMsg({ text: msg, ok: false });
    } finally {
      setSaving(false);
    }
  }

  const usernameStatusColor =
    usernameStatus === "available"
      ? "var(--point)"
      : usernameStatus === "taken" || usernameStatus === "invalid"
      ? "var(--danger)"
      : "var(--text-sub)";

  const usernameStatusText =
    usernameStatus === "available"
      ? "✓ available"
      : usernameStatus === "checking"
      ? "checking..."
      : usernameError;

  return (
    <div className="flex flex-col flex-1">
      <NavBar title="edit profile" showBack />

      <form onSubmit={handleSave} className="p-4 flex flex-col gap-4">

        {/* 프로필 사진 */}
        <div className="xp-window">
          <div className="xp-titlebar"><span>profile photo</span></div>
          <div className="p-4 flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                avatarUrl={avatarUrl}
                username={session?.user?.name ?? ""}
                size={80}
              />
              {uploading && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <span className="text-[10px] text-white">...</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="xp-btn text-xs px-3 py-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera size={11} className="inline mr-1" strokeWidth={1.5} />
                {avatarUrl ? "change photo" : "add photo"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  className="xp-btn text-xs px-3 py-1"
                  style={{ color: "var(--danger)" }}
                  onClick={handleRemoveAvatar}
                >
                  remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        {/* 이름 */}
        <div className="xp-window">
          <div className="xp-titlebar"><span>display name</span></div>
          <div className="p-3 flex flex-col gap-2">
            <input
              className="xp-input text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name"
              maxLength={40}
            />
          </div>
        </div>

        {/* 유저네임 */}
        <div className="xp-window">
          <div className="xp-titlebar"><span>username</span></div>
          <div className="p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm" style={{ color: "var(--text-sub)" }}>@</span>
              <input
                className="xp-input text-sm flex-1"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="username"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {usernameStatusText && (
              <p className="text-[11px]" style={{ color: usernameStatusColor }}>
                {usernameStatusText}
              </p>
            )}
            <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>
              3–20 chars · lowercase letters, numbers, underscores
            </p>
          </div>
        </div>

        {/* 결과 메시지 */}
        {msg && (
          <p className="text-xs text-center" style={{ color: msg.ok ? "var(--point)" : "var(--danger)" }}>
            {msg.text}
          </p>
        )}

        {/* 저장 버튼 */}
        <button
          type="submit"
          className="xp-btn w-full text-sm"
          disabled={
            saving ||
            uploading ||
            usernameStatus === "checking" ||
            usernameStatus === "taken" ||
            usernameStatus === "invalid"
          }
        >
          {saving ? "saving..." : "save changes"}
        </button>
      </form>
    </div>
  );
}
