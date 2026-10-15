import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppearanceSelector } from "@/components/appearance-selector";

export default async function ClientDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <AppearanceSelector />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
        <p className="mt-2 text-muted-foreground">Your event dashboard is ready</p>
      </div>
    </main>
  );
}
