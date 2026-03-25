import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SUSPENDED_ROUTE = "/suspended";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,  // 30일
    updateAge: 5 * 60,           // 5분마다 JWT 갱신 → isSuspended 재확인
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("유저네임과 비밀번호를 입력해 주세요.");
        }

        // username으로 유저 조회
        const user = await prisma.user.findUnique({
          where: { username: credentials.username.toLowerCase() },
        });

        if (!user) {
          throw new Error("유저네임 또는 비밀번호가 올바르지 않습니다.");
        }

        // 이메일 인증 완료 여부 체크
        if (!user.isVerified) {
          throw new Error("이메일 인증을 완료해 주세요.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("유저네임 또는 비밀번호가 올바르지 않습니다.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          isAdmin: user.isAdmin,
          avatarUrl: user.avatarUrl ?? null,
          isSuspended: user.isSuspended ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      if (user) {
        // 최초 로그인 시 DB 값으로 채움
        token.id = user.id;
        token.username = (user as { username?: string | null }).username ?? null;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.avatarUrl = (user as { avatarUrl?: string | null }).avatarUrl ?? null;
        token.isSuspended = (user as { isSuspended?: boolean }).isSuspended ?? false;
      } else if (token.id) {
        // updateAge 주기마다 DB에서 isSuspended 재확인
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isSuspended: true },
        });
        token.isSuspended = dbUser?.isSuspended ?? false;
      }
      // session.update() 호출 시 avatarUrl 갱신
      if (trigger === "update" && sessionUpdate?.avatarUrl !== undefined) {
        token.avatarUrl = sessionUpdate.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null | undefined;
        session.user.isAdmin = token.isAdmin as boolean | undefined;
        session.user.avatarUrl = token.avatarUrl as string | null | undefined;
        session.user.isSuspended = token.isSuspended as boolean | undefined;
      }
      return session;
    },
  },
};
