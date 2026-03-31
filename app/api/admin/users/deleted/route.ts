import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { hardDeleteUser } from "@/lib/delete-user";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// GET /api/admin/users/deleted — list soft-deleted accounts
export async function GET(_req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const users = await prisma.user.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      deletedAt: true,
      _count: { select: { posts: true } },
    },
    orderBy: { deletedAt: "asc" },
  });

  const now = Date.now();
  const mapped = users.map((u) => ({
    ...u,
    isExpired: u.deletedAt ? now - u.deletedAt.getTime() > THIRTY_DAYS_MS : false,
  }));

  return NextResponse.json({ success: true, users: mapped });
}

// POST /api/admin/users/deleted — bulk recover or hard delete
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const { action, userIds } = await req.json();

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ success: false, error: "No users selected." }, { status: 400 });
  }
  if (action !== "recover" && action !== "delete") {
    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  }

  if (action === "recover") {
    await prisma.user.updateMany({
      where: { id: { in: userIds }, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
  } else {
    // Hard delete each user sequentially (hardDeleteUser runs a transaction per user)
    for (const userId of userIds) {
      await hardDeleteUser(userId);
    }
  }

  return NextResponse.json({ success: true });
}
