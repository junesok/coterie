import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hardDeleteUser } from "@/lib/delete-user";

const SUSPENDED_ROUTE = "/suspended";
const GENERIC_AUTH_ERROR = "Username or password is incorrect.";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
          throw new Error("Please enter your username and password.");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username.toLowerCase() },
        });

        if (!user) {
          throw new Error(GENERIC_AUTH_ERROR);
        }

        // Accounts soft-deleted more than 30 days ago: hard delete then show generic error
        if (user.deletedAt) {
          const elapsed = Date.now() - user.deletedAt.getTime();
          if (elapsed > THIRTY_DAYS_MS) {
            await hardDeleteUser(user.id);
            throw new Error(GENERIC_AUTH_ERROR);
          }
          // Within 30 days: allow login with pendingRecovery flag
          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isPasswordValid) throw new Error(GENERIC_AUTH_ERROR);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            isAdmin: user.isAdmin,
            avatarUrl: user.avatarUrl ?? null,
            isSuspended: user.isSuspended ?? false,
            pendingRecovery: true,
          } as never;
        }

        if (!user.isVerified) {
          throw new Error("Please verify your email address before signing in.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error(GENERIC_AUTH_ERROR);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          isAdmin: user.isAdmin,
          avatarUrl: user.avatarUrl ?? null,
          isSuspended: user.isSuspended ?? false,
          pendingRecovery: false,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string | null }).username ?? null;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.avatarUrl = (user as { avatarUrl?: string | null }).avatarUrl ?? null;
        token.isSuspended = (user as { isSuspended?: boolean }).isSuspended ?? false;
        token.pendingRecovery = (user as { pendingRecovery?: boolean }).pendingRecovery ?? false;
      } else if (token.id) {
        // updateAge 주기마다 DB에서 isSuspended 재확인
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isSuspended: true },
        });
        token.isSuspended = dbUser?.isSuspended ?? false;
      }
      if (trigger === "update") {
        if (sessionUpdate?.avatarUrl !== undefined) token.avatarUrl = sessionUpdate.avatarUrl;
        if (sessionUpdate?.username !== undefined) token.username = sessionUpdate.username;
        if (sessionUpdate?.pendingRecovery !== undefined) token.pendingRecovery = sessionUpdate.pendingRecovery;
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
        session.user.pendingRecovery = token.pendingRecovery as boolean | undefined;
      }
      return session;
    },
  },
};
