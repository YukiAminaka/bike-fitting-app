export { auth as middleware } from "@/auth";

//ファビコンや静的画像などのパスでミドルウェアが実行されないように
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
