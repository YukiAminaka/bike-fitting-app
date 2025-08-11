import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { videoSchema } from "@/schema/schema";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import path from "path";

export const GET = auth(async (request: NextAuthRequest) => {
  const userId = request.auth?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videos = await prisma.video.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(videos);
});

export const POST = auth(async (request: NextAuthRequest) => {
  try {
    const userId = request.auth?.user?.id;
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User not authenticated" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const parsedBody = videoSchema.safeParse(body);
    if (!parsedBody.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid request body",
          details: parsedBody.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { filePath } = parsedBody.data;

    if (!filePath) {
      return new NextResponse(
        JSON.stringify({ error: "File path is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // 拡張子を除いたファイル名を取得
    const nameWithoutExt = path.parse(filePath).name;

    const video = await prisma.video.create({
      data: {
        filePath: nameWithoutExt,
        userId: userId,
      },
    });

    return new NextResponse(JSON.stringify(video), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/video:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create video" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
