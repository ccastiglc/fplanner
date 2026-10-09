"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await signIn(email, password);
    if (result.success && result.user) {
      const role = result.user.role;
      if (role === "ADMIN" || role === "DJ") {
        router.replace("/dashboard");
      } else if (role === "CLIENT") {
        router.replace("/client");
      }
    } else {
      setError(result.error || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-foreground text-center">Log in</h2>
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground placeholder-italic focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Log in
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Dont have an account? <span onClick={() => router.replace("/signup")} className="underline cursor-pointer">Sign up</span>
        </p>
      </div>
    </div>
  );
}