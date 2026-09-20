"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AuthState } from "./types";

interface AuthContextValue {
  authState: AuthState;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  const checkUserAdminClaim = async (user: import("firebase/auth").User) => {
    try {
      const tokenResult = await user.getIdTokenResult(true);
      const hasAdminClaim = tokenResult.claims.admin === true;

      // Allow configured admin emails (useful for rapid dev without service accounts)
      const devAdminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const isEmailAllowed = user.email && devAdminEmails.includes(user.email.toLowerCase());

      if (hasAdminClaim || isEmailAllowed) {
        setAuthState({
          status: "authenticated",
          user,
          uid: user.uid,
          email: user.email || "",
        });
      } else {
        await firebaseSignOut(auth);
        setAuthState({
          status: "forbidden",
          email: user.email,
        });
      }
    } catch (error) {
      console.error("Error inspecting ID token claims:", error);
      await firebaseSignOut(auth);
      setAuthState({ status: "forbidden", email: user.email });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({ status: "unauthenticated" });
        return;
      }
      await checkUserAdminClaim(user);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setAuthState({ status: "unauthenticated" });
  };

  const refreshClaims = async () => {
    if (auth.currentUser) {
      setAuthState({ status: "loading" });
      await checkUserAdminClaim(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ authState, signOut, refreshClaims }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
