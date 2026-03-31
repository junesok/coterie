import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { ReportReason, ReportTarget } from "@/app/generated/prisma/client";

// POST /api/reports — 신고 접수
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const { targetType, targetId, reason } = await req.json();

  if (!["POST", "COMMENT"].includes(targetType)) {
    return NextResponse.json({ success: false, error: "Invalid target type." }, { status: 400 });
  }
  if (!Object.values(ReportReason).includes(reason)) {
    return NextResponse.json({ success: false, error: "Invalid reason." }, { status: 400 });
  }

  // 신고 대상 존재 여부 확인
  if (targetType === "POST") {
    const post = await prisma.post.findUnique({ where: { id: targetId }, select: { id: true, authorId: true } });
    if (!post || post.authorId === session.user.id) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true, authorId: true, isDeleted: true } });
    if (!comment || comment.authorId === session.user.id) {
      return NextResponse.json({ success: false, error: "Comment not found." }, { status: 404 });
    }
  }

  try {
    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType: targetType as ReportTarget,
        targetId,
        reason: reason as ReportReason,
      },
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    // Unique constraint violation = 이미 신고한 경우
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: false, error: "You've already reported this." }, { status: 409 });
    }
    console.error("[POST /api/reports]", err);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
