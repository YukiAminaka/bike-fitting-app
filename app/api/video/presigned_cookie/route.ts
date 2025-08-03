// app/api/set-cookie/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NextAuthRequest } from "next-auth";
import { createPresignedCookie } from "@/lib/cookie";

export const GET = auth(async (request: NextAuthRequest) => {
  const userid = request.auth?.user?.id;
  if (!userid) {
    return new NextResponse(JSON.stringify({ error: "User ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const cookies = createPresignedCookie(userid);

    const res = NextResponse.json({ ok: true });

    Object.entries(cookies).forEach(([name, value]) => {
      res.cookies.set(name, value, {
        httpOnly: true,
        secure: true,
        path: "/", // CloudFront URL に合致するように設定
        sameSite: "strict",
      });
    });

    return res;
  } catch (error) {
    console.error("Error setting cookies:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to set cookies" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
