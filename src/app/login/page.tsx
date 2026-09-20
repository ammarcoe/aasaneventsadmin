"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ShieldAlert, LogIn, Sparkles } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { authState } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "forbidden") {
      setErrorMsg("This account doesn't have admin access.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (authState.status === "authenticated") {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
    }
  }, [authState, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };
      console.error("Sign-in error:", fbError);

      if (
        fbError.code === "auth/invalid-credential" ||
        fbError.code === "auth/user-not-found" ||
        fbError.code === "auth/wrong-password"
      ) {
        setErrorMsg("Invalid email or password.");
      } else if (fbError.code === "auth/too-many-requests") {
        setErrorMsg("Too many failed attempts. Please try again later.");
      } else {
        setErrorMsg(fbError.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("admin@aasanevent.com");
    setPassword("Admin123!@#");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-[400px]">
        {/* Logo and title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-on-ink font-bold text-xl shadow-xs mb-3">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Aasanevent Admin
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Sign in with your verified administrator account
          </p>
        </div>

        <Card variant="default">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Direct Firestore client panel with security rules enforcement
            </CardDescription>
          </CardHeader>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-md bg-crimson-surface border border-crimson/30 flex items-start gap-2.5 text-xs text-crimson font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="admin@aasanevent.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in to Panel
            </Button>
          </form>

          {process.env.NEXT_PUBLIC_USE_EMULATOR === "true" && (
            <div className="mt-5 pt-4 border-t border-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  Emulator Mode Active
                </span>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs text-accent-deep hover:underline font-medium cursor-pointer"
                >
                  Fill credentials
                </button>
              </div>
              <p className="text-[11px] text-ink-faint">
                Ensure local Auth emulator is running on port 9099 with an admin user claim.
              </p>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-ink-faint mt-6">
          Aasanevent Operations &copy; {new Date().getFullYear()} &bull; PKT Timezone
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <LoginForm />
    </Suspense>
  );
}
