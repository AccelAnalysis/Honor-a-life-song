import { doc, getDoc } from "firebase/firestore";
import type { ChannelConsent, CommunicationPreferences } from "@/domain/communication-consent";
import { getFirebaseFirestore } from "./client";
import { nativeAction } from "./native-services";

function channelFrom(value: unknown, channel: ChannelConsent["channel"]): ChannelConsent | undefined {
  if (!value || typeof value !== "object") return undefined;
  const data = value as Record<string, unknown>;
  return {
    channel,
    consented: data.consented === true,
    languageVersion: typeof data.languageVersion === "string" ? data.languageVersion : undefined,
    language: typeof data.language === "string" ? data.language : undefined,
    source: data.source === "account_creation" || data.source === "checkout" || data.source === "unsubscribe" ? data.source : undefined,
    withdrawnAt: typeof data.withdrawnAt === "string" ? data.withdrawnAt : undefined,
    phone: typeof data.phone === "string" ? data.phone : undefined
  };
}

export async function getCommunicationPreferences(userId: string): Promise<CommunicationPreferences | null> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), "users", userId));
  const value = snapshot.data()?.communicationPreferences;
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  return {
    phone: typeof data.phone === "string" ? data.phone : undefined,
    email: channelFrom(data.email, "email"),
    sms: channelFrom(data.sms, "sms")
  };
}

export async function saveCommunicationConsent(input: {
  source: "account_creation" | "checkout";
  email?: boolean;
  sms?: boolean;
  phone?: string;
}) {
  return nativeAction("saveCommunicationConsent", input);
}
