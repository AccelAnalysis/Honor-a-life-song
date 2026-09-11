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
import { getFirebaseAuth, prepareFirebaseClient } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/firebase/organization-account";

type AuthStatus = "loading" | "signed_out" | "signed_in" | "unavailable";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  configurationError: string | null;
  signIn: (email: string, password: string) => Promise<User>;
  createAccount: (input: { email: string; password: string; firstName: string; lastName: string }) => Promise<User>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authUnavailableMessage() {
  return "Account access is temporarily unavailable. Please try again or contact SongKeep for help.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    prepareFirebaseClient().then(() => {
      if (cancelled) return;
      unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
        setUser(nextUser);
        setStatus(nextUser ? "signed_in" : "signed_out");
        if (nextUser) void ensureUserProfile({ uid: nextUser.uid, email: nextUser.email, displayName: nextUser.displayName }).catch(() => undefined);
      });
    }).catch(() => {
      if (!cancelled) { setConfigurationError(authUnavailableMessage()); setStatus("unavailable"); }
    });
    return () => { cancelled = true; unsubscribe?.(); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    configurationError,
    async signIn(email, password) {
      const result = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      await ensureUserProfile({ uid: result.user.uid, email: result.user.email, displayName: result.user.displayName }).catch(() => undefined);
      setUser(result.user);
      setStatus("signed_in");
      return result.user;
    },
    async createAccount({ email, password, firstName, lastName }) {
      const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      const normalizedName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(result.user, { displayName: normalizedName }).catch(() => undefined);
      await ensureUserProfile({ uid: result.user.uid, email: result.user.email, displayName: normalizedName, firstName: firstName.trim(), lastName: lastName.trim() }).catch(() => undefined);
      await sendEmailVerification(result.user).catch(() => undefined);
      setUser(result.user);
      setStatus("signed_in");
      return result.user;
    },
    async signOut() {
      await firebaseSignOut(getFirebaseAuth());
      setUser(null); setStatus("signed_out");
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
