"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/firebase/organization-account";

type AuthStatus = "loading" | "signed_out" | "signed_in" | "unavailable";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  configurationError: string | null;
  signIn: (email: string, password: string) => Promise<User>;
  createAccount: (input: { email: string; password: string; displayName: string }) => Promise<User>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authUnavailableMessage(error: unknown) {
  return error instanceof Error ? error.message : "Firebase authentication is not configured for this environment.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      return onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        setStatus(nextUser ? "signed_in" : "signed_out");
        if (nextUser) {
          try {
            await ensureUserProfile(nextUser);
          } catch {
            // Account access should still resolve even if the optional profile write is temporarily unavailable.
          }
        }
      });
    } catch (error) {
      setConfigurationError(authUnavailableMessage(error));
      setStatus("unavailable");
      return undefined;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    configurationError,
    async signIn(email, password) {
      const result = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      await ensureUserProfile(result.user);
      return result.user;
    },
    async createAccount({ email, password, displayName }) {
      const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      await updateProfile(result.user, { displayName: displayName.trim() });
      await sendEmailVerification(result.user);
      await ensureUserProfile({ ...result.user, displayName: displayName.trim() });
      setUser(result.user);
      setStatus("signed_in");
      return result.user;
    },
    async signOut() {
      await firebaseSignOut(getFirebaseAuth());
    },
    async sendPasswordReset(email) {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    },
    async resendVerification() {
      if (!user) throw new Error("Sign in before requesting another verification email.");
      await sendEmailVerification(user);
    }
  }), [configurationError, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
