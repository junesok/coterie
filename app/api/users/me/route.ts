import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Cloudinary 이미지 삭제 (public_id 추출 후 REST API 호출)
async function deleteCloudinaryImage(url: string) {
  try {
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1];
    const fileName = fileWithExt.split(".")[0];
    const folderIndex = parts.indexOf("coterie");
    const publicId = folderIndex !== -1 ? `coterie/${fileName}` : fileName;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const { createHash } = await import("crypto");
    const sig = createHash("sha256")
      .update(`public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest("hex");

    const fd = new FormData();
    fd.append("public_id", publicId);
    fd.append("timestamp", timestamp);
    fd.append("api_key", process.env.CLOUDINARY_API_KEY!);
    fd.append("signature", sig);

    await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      { method: "POST", body: fd }
    );
  } catch (e) {
    console.error("[deleteCloudinaryImage]", e);
  }
}

// GET /api/users/me — 내 정보
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, username: true, theme: true, avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[GET /api/users/me]", error);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = ["coterie_admin"];

// PUT /api/users/me — 이름 / 유저네임 / 비밀번호 / 테마 / avatarUrl 변경
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { name, username, currentPassword, newPassword, theme, avatarUrl } = await req.json();
    const updateData: {
      name?: string;
      username?: string;
      passwordHash?: string;
      theme?: string;
      avatarUrl?: string | null;
    } = {};

    // 이름 변경 (빈값도 허용)
    if (name !== undefined && name !== null) {
      updateData.name = name.trim();
    }

    // 유저네임 변경
    if (username !== undefined && username !== null) {
      const normalized = username.toLowerCase().trim();
      if (!USERNAME_REGEX.test(normalized)) {
        return NextResponse.json(
          { success: false, error: "Username must be 3–20 chars: lowercase letters, numbers, underscores." },
          { status: 400 }
        );
      }
      if (RESERVED_USERNAMES.includes(normalized)) {
        return NextResponse.json(
          { success: false, error: "That username is reserved." },
          { status: 400 }
        );
      }
      // 중복 확인 (자기 자신 제외)
      const existing = await prisma.user.findFirst({
        where: { username: normalized, NOT: { id: session.user.id } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Username already taken." },
          { status: 409 }
        );
      }
      updateData.username = normalized;
    }

    // 테마 변경
    if (theme === "light" || theme === "dark") {
      updateData.theme = theme;
    }

    // 프로필 이미지 변경
    if (avatarUrl !== undefined) {
      // 기존 이미지가 Cloudinary에 있으면 삭제
      const current = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { avatarUrl: true },
      });
      if (current?.avatarUrl && current.avatarUrl !== avatarUrl) {
        await deleteCloudinaryImage(current.avatarUrl);
      }
      updateData.avatarUrl = avatarUrl; // null이면 기본 이미지로 되돌아감
    }

    // 비밀번호 변경
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required." },
          { status: 400 }
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters." },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect." },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, theme: true, avatarUrl: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[PUT /api/users/me]", error);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
