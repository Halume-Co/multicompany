"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { user, error: authError } = await login(email, password);

      if (user) {
        const nextPath =
          user.role === "seller"
            ? user.companyId
              ? "/seller/dashboard"
              : "/seller/company"
            : "/";

        router.push(nextPath);
      } else {
        setError(authError || "Invalid email or password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-lg">
        <div className="text-center mb-2xl">
          <h1 className="text-4xl font-bold text-foreground mb-md">Sign In</h1>
          <p className="text-muted-foreground">
            Enter your email and password to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-lg">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-sm">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-sm"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="w-full"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-md rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-lg">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
