import bcrypt from "bcryptjs";
import { createHmac } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const failedLoginLimit = 5;
const loginWindowMs = 15 * 60 * 1000;

function loginAttemptKeys(username: string, request: Request) {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET or AUTH_SECRET must be configured.");
  }

  const clientIp =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const values = [`username:${username}`];

  if (clientIp) values.push(`ip:${clientIp}`);

  return values.map((value) =>
    createHmac("sha256", secret).update(value).digest("hex")
  );
}

async function isLoginThrottled(keys: string[], now: Date) {
  const attempts = await prisma.loginAttempt.findMany({ where: { key: { in: keys } } });
  return attempts.some((attempt) => attempt.blockedUntil && attempt.blockedUntil > now);
}

async function recordFailedLogin(keys: string[], now: Date) {
  const windowStart = new Date(now.getTime() - loginWindowMs);
  const blockedUntil = new Date(now.getTime() + loginWindowMs);

  await Promise.all(keys.map(async (key) => {
    const current = await prisma.loginAttempt.findUnique({ where: { key } });

    if (!current || current.windowStartedAt < windowStart) {
      await prisma.loginAttempt.upsert({
        where: { key },
        create: { key, attempts: 1, windowStartedAt: now },
        update: { attempts: 1, windowStartedAt: now, blockedUntil: null },
      });
      return;
    }

    const updated = await prisma.loginAttempt.update({
      where: { key },
      data: { attempts: { increment: 1 } },
    });

    if (updated.attempts >= failedLoginLimit) {
      await prisma.loginAttempt.update({
        where: { key },
        data: { blockedUntil },
      });
    }
  }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const now = new Date();
        const username = String(credentials.username ?? "").trim().toLowerCase();
        const password = String(credentials.password ?? "");

        if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) || !password) {
          return null;
        }

        const attemptKeys = loginAttemptKeys(username, request);

        if (await isLoginThrottled(attemptKeys, now)) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { username } });

        if (
          !user?.passwordHash ||
          user.status !== "ACTIVE" ||
          !(await bcrypt.compare(password, user.passwordHash))
        ) {
          await recordFailedLogin(attemptKeys, now);
          return null;
        }

        await prisma.loginAttempt.deleteMany({ where: { key: { in: attemptKeys } } });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.username = typeof token.username === "string" ? token.username : "";
      session.user.role =
        token.role === "ADMIN" || token.role === "DJ" || token.role === "CLIENT"
          ? token.role
          : "CLIENT";
      session.user.organizationId =
        typeof token.organizationId === "string" ? token.organizationId : null;
      return session;
    },
  },
});
