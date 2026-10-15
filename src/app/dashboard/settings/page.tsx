import SectionNavigation from "@/components/common/section-navigation";
import { PageHeader } from "@/components/common/page-header";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import BusinessProfileForm from "@/components/settings/business-profile-form";
import DataManagement from "@/components/settings/data-management";
import { prisma } from "@/lib/prisma";
import { getSettingsOrganizationId } from "@/lib/settings-organization";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") notFound();

  const organizationId = await getSettingsOrganizationId(session.user.organizationId);
  const [organization, batches, query] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, settings: true },
    }),
    prisma.importBatch.findMany({
      where: session.user.organizationId ? { organizationId } : {},
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        source: true,
        fileName: true,
        status: true,
        totalRecords: true,
        processedRecords: true,
        errorCount: true,
        createdAt: true,
      },
    }),
    searchParams,
  ]);

  if (!organization) notFound();

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <PageHeader title="Settings" eyebrow="Workspace" description="Manage your business profile and planner data." />
      <SectionNavigation label="Settings sections" sections={[{ id: "business-profile", label: "Business Profile" }, { id: "data-management", label: "Data Management" }]} />
      <div className="space-y-6">
        <BusinessProfileForm
          profile={{
            businessName: organization.name,
            businessPhone: organization.settings?.businessPhone ?? "",
            businessPhoneCountry: organization.settings?.businessPhoneCountry ?? "US",
            businessEmail: organization.settings?.businessEmail ?? "",
            businessWebsite: organization.settings?.businessWebsite ?? "",
            logoUrl: organization.settings?.logoUrl ?? "",
            brandAccentColor: organization.settings?.brandAccentColor ?? "#FF6B00",
          }}
          saved={query.saved === "business"}
          hasError={query.error === "business-profile"}
        />
        <DataManagement batches={batches} />
      </div>
    </div>
  );
}
