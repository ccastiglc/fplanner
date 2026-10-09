import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function signIn(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || user.password !== password) {
      return { success: false, error: "Invalid credentials" };
    }

    if (user.status !== "ACTIVE") {
      return { success: false, error: "Account is disabled" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization?.name,
      },
    };
  } catch (error) {
    return { success: false, error: "Authentication error. Please try again." };
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  role: "CLIENT" | "DJ" | "ADMIN"
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    return { success: false, error: "Signup failed. Please try again." };
  }
}

export async function getCurrentUser() {
  "use server";
  try {
    // In a real app, this would check the session cookie
    // For now, we'll return null - session managed via middleware
    return null;
  } catch {
    return null;
  }
}