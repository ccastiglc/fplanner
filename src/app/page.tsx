import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppearanceSelector } from "@/components/appearance-selector";

function publicHttpsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "CLIENT" ? "/client" : "/dashboard");
  }

  const [{ error }, organization] = await Promise.all([
    searchParams,
    prisma.organization.findUnique({
      where: { slug: "fredo-productions" },
      select: { name: true, settings: { select: { logoUrl: true, updatedAt: true } } },
    }),
  ]);
  const secureLogoUrl = publicHttpsUrl(organization?.settings?.logoUrl);

  async function authenticate(formData: FormData) {
    "use server";

    try {
      await signIn("credentials", {
        username: formData.get("username"),
        password: formData.get("password"),
        redirectTo: "/plan/dashboard",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/?error=invalid");
      }
      throw error;
    }
  }

  return (
    <>
      <link rel="stylesheet" href={`/plan/api/brand-theme?v=${organization?.settings?.updatedAt.getTime() ?? 0}`} precedence="brand-theme" />
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <section className="ui-surface w-full max-w-md p-7 sm:p-9">
          <div className="mb-4 flex justify-end"><AppearanceSelector /></div>
          <div className="mb-8 text-center">
            {secureLogoUrl ? (
              <img src={secureLogoUrl} alt={`${organization?.name ?? "Fredo Productions"} logo`} width={96} height={96} className="mx-auto size-20 rounded-2xl object-contain" />
            ) : (
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-500 text-lg font-bold text-brand-accent-foreground">FP</span>
            )}
            <p className="mt-5 text-sm font-semibold text-orange-600">{organization?.name ?? "Fredo Productions"}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Event Planner</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your events.</p>
          </div>
          {error === "invalid" && (
            <p role="alert" className="mb-4 rounded-xl bg-error-background px-4 py-3 text-sm text-error-foreground">
              Invalid username or password.
            </p>
          )}
          <form action={authenticate} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                maxLength={32}
                className="ui-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={72}
                className="ui-input"
              />
            </div>
            <button type="submit" className="ui-button ui-button-primary w-full">
              Sign in
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
