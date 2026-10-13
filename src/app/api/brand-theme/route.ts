import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettingsOrganizationId } from "@/lib/settings-organization";

function foregroundFor(hex: string) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.179 ? "#172033" : "#FFFFFF";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const organizationId = await getSettingsOrganizationId(session.user.organizationId);
  const settings = await prisma.organizationSettings.findUnique({
    where: { organizationId },
    select: { brandAccentColor: true },
  });
  const accent = /^#[0-9a-fA-F]{6}$/.test(settings?.brandAccentColor ?? "")
    ? settings?.brandAccentColor ?? "#FF6B00"
    : "#FF6B00";
  const foreground = foregroundFor(accent);
  const css = `:root{--brand-accent:${accent};--brand-accent-foreground:${foreground};--brand-accent-50:color-mix(in srgb,${accent} 6%,white);--brand-accent-100:color-mix(in srgb,${accent} 12%,white);--brand-accent-200:color-mix(in srgb,${accent} 24%,white);--brand-accent-300:color-mix(in srgb,${accent} 40%,white);--brand-accent-400:color-mix(in srgb,${accent} 70%,white);--brand-accent-600:color-mix(in srgb,${accent} 86%,black);--brand-accent-700:color-mix(in srgb,${accent} 70%,black);--brand-accent-800:color-mix(in srgb,${accent} 55%,black);--brand-accent-900:color-mix(in srgb,${accent} 40%,black)}`;

  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
