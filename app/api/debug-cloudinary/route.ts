import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKeyLength: process.env.CLOUDINARY_API_KEY?.length,
    apiKeyFirst3: process.env.CLOUDINARY_API_KEY?.slice(0, 3),
    apiSecretLength: process.env.CLOUDINARY_API_SECRET?.length,
  });
}
