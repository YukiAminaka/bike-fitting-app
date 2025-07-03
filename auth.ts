import NextAuth, { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

//configはNextAuth()関数で使う
export const config: NextAuthConfig = {
  //themのlogoプロパティでロゴを設定できる
  theme: {
    logo: "https://next-auth.js.org/img/logo/logo-sm.png",
  },
  adapter: PrismaAdapter(prisma),
  providers: [GitHub], //どのプロバイダーで認証するか
  basePath: "/api/auth", //apiのパス,エンドポイント
  callbacks: {
    //認証が終わった後にできる操作
    authorized({ request, auth }) {
      //ミドルウェア的な役割
      try {
        const { pathname } = request.nextUrl; //requestのnextUrlからパスを取得
        if (pathname === "/protected-page") return !!auth; //authを真偽値に変換する。falseならログインしていないのでページは見れない
        return true; //trueだけにしているとユーザー認証していなくてもすべてのユーザーがページを見れる
      } catch (error) {
        console.log(error);
      }
    },
    jwt({ token, trigger, session }) {
      //認証が成功するとjwtが返される。jwtの中身を変えたい場合細かく変更することができる
      if (trigger === "update") {
        //ユーザーの認証状態を更新する場合トークンの名前をセッションのユーザーネームに更新し最新のユーザーネームにする
        token.name = session.user.name;
      }
      return token;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
