import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ClientDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Welcome</h1>
        <p className="mt-2 text-slate-500">Your event dashboard is ready</p>
      </div>
    </main>
  );
}
