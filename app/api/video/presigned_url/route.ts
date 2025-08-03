import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createPostPresignedUrl } from "@/lib/s3";
import { NextAuthRequest } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const GET = auth(async (request: NextAuthRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("filePath");
    if (!filePath) {
      return new NextResponse(
        JSON.stringify({ error: "File path is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const user = await prisma.user.findUnique({
      where: {
        id: request.auth?.user?.id,
      },
    });
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const presignedUrl = await createPostPresignedUrl({
      bucket: process.env.AWS_S3_VIDEO_BUCKET!,
      key: `users/${request.auth?.user?.id}/${filePath}`,
    });
    return new NextResponse(JSON.stringify({ presignedUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate presigned URL" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

export const POST = auth(async (request: NextAuthRequest) => {
  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return new NextResponse(
        JSON.stringify({ error: "File path is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: request.auth?.user?.id,
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ユニークなファイル名を生成（タイムスタンプ + オリジナル名）
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${filePath}`;

    const presignedUrl = await createPostPresignedUrl({
      bucket: process.env.AWS_S3_VIDEO_BUCKET!,
      key: `users/${request.auth?.user?.id}/uploads/${uniqueFileName}`,
    });

    return new NextResponse(
      JSON.stringify({ presignedUrl, fileName: uniqueFileName }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate presigned URL" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
