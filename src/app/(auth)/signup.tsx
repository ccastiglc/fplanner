"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CLIENT" | "DJ" | "ADMIN">("CLIENT");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await signUp(name, email, password, role);
    if (result.success) {
      router.replace("/");
    } else {
      setError(result.error || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-foreground text-center">Create account</h2>
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-border border-bg bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-border border-bg bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-border border-bg bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onChange={() => setRole("CLIENT")}
                disabled={role === "CLIENT"}
                className={`rounded-md border px-3 py-2 text-sm ${role === "CLIENT" ? "bg-primary text-primary-foreground" : "text-foreground opacity-50"} hover:opacity-80 transition-opacity`}
                >Client</button>
              <button
                onChange={() => setRole("DJ")}
                disabled={role === "DJ"}
                className={`rounded-md border px-3 py-2 text-sm ${role === "DJ" ? "bg-primary text-primary-foreground" : "text-foreground opacity-50"} hover:opacity-80 transition-opacity`}
                >DJ</button>
              <button
                onChange={() => setRole("ADMIN")}
                disabled={role === "ADMIN"}
                className={`rounded-md border px-3 py-2 text-sm ${role === "ADMIN" ? "bg-primary text-primary-foreground" : "text-foreground opacity-50"} hover:opacity-80 transition-opacity`}
                >Admin</button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Create account
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account? <span onClick={() => router.replace("/login")} className="underline cursor-pointer">Log in</span>
        </p>
      </div>
    </div>
  );
}