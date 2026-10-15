import { auth } from "@/auth";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettingsOrganizationId } from "@/lib/settings-organization";

function publicHttpsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export default async function DashboardRouteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  if (session.user.role === "CLIENT") {
    redirect("/client");
  }

  const organizationId = await getSettingsOrganizationId(session.user.organizationId);
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, settings: { select: { logoUrl: true, updatedAt: true } } },
  });
  const logoUrl = publicHttpsUrl(organization?.settings?.logoUrl);

  return (
    <>
      <link
        rel="stylesheet"
        href={`/plan/api/brand-theme?v=${organization?.settings?.updatedAt.getTime() ?? 0}`}
        precedence="brand-theme"
      />
      <DashboardLayout
        canManageClients={session.user.role === "ADMIN"}
        businessName={organization?.name ?? "Fredo Productions"}
        logoUrl={logoUrl}
        userName={session.user.name || session.user.username || "Account"}
      >
        {children}
      </DashboardLayout>
    </>
  );
}
