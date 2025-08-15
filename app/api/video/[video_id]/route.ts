import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NextAuthRequest } from "next-auth";
import prisma from "@/lib/prisma";

export const GET = auth(async (request: NextAuthRequest) => {
  const userid = request.auth?.user?.id;
  if (!userid) {
    return new NextResponse(JSON.stringify({ error: "User ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const video = await prisma.video.findUnique({
      where: { id: userid },
    });
    if (!video) {
      return new NextResponse(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const res = NextResponse.json({ video });
    return res;
  } catch (error) {
    console.error("Error fetching video:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch video" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
