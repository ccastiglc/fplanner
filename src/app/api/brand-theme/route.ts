import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function foregroundFor(hex: string) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}

function mix(hex: string, target: number, weight: number) {
  return `#${[1, 3, 5].map((offset) => Math.round(Number.parseInt(hex.slice(offset, offset + 2), 16) * weight + target * (1 - weight)).toString(16).padStart(2, "0")).join("")}`;
}

export async function GET() {
  const session = await auth();
  const organization = await prisma.organization.findUnique({
    where: session?.user.organizationId ? { id: session.user.organizationId } : { slug: "fredo-productions" },
    select: { settings: { select: { brandAccentColor: true } } },
  });
  const brandAccentColor = organization?.settings?.brandAccentColor ?? "#FF6B00";
  const accent = /^#[0-9a-fA-F]{6}$/.test(brandAccentColor)
    ? brandAccentColor
    : "#FF6B00";
  const foreground = foregroundFor(accent);
  const hover = mix(accent, 0, 0.84);
  const darkHover = mix(accent, 255, 0.78);
  const css = `:root{--organization-accent:${accent};--organization-accent-foreground:${foreground};--organization-accent-hover:${hover};--organization-accent-hover-foreground:${foregroundFor(hover)};--organization-accent-dark-hover:${darkHover};--organization-accent-dark-hover-foreground:${foregroundFor(darkHover)}}`;

  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
