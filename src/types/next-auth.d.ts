import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    role: Role;
    organizationId: string | null;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      organizationId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    role?: Role;
    organizationId?: string | null;
  }
}
