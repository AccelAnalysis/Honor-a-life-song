export const emailConsentCopy = {
  channel: "email" as const,
  version: "2026-10-email-1",
  language: "I agree to receive emails from SongKeep about the song I purchase, including a link to open that song, and later emails about another song or a group booking. I can unsubscribe at any time. Commercial emails include SongKeep's postal address. Consent is not required to purchase."
};

export const smsConsentCopy = {
  channel: "sms" as const,
  version: "2026-10-sms-1",
  language: "I agree to receive text messages from SongKeep about my purchase and SongKeep offers at the mobile number I provide. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help. Consent is not required to purchase."
};

export type CommunicationChannel = "email" | "sms";
export type CommunicationConsentSource = "account_creation" | "checkout" | "unsubscribe";

export interface ChannelConsent {
  channel: CommunicationChannel;
  consented: boolean;
  languageVersion?: string;
  language?: string;
  source?: CommunicationConsentSource;
  consentedAt?: string;
  declinedAt?: string;
  withdrawnAt?: string;
  unsubscribeToken?: string;
  phone?: string;
}

export interface CommunicationPreferences {
  phone?: string;
  email?: ChannelConsent;
  sms?: ChannelConsent;
}

export function normalizePhone(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function channelConsentActive(record?: ChannelConsent): boolean {
  return record?.consented === true && !record.withdrawnAt;
}

/** Channels the account has not accepted. Checkout may prompt for these only. */
export function channelsAwaitingConsent(preferences?: CommunicationPreferences | null): CommunicationChannel[] {
  const awaiting: CommunicationChannel[] = [];
  if (!channelConsentActive(preferences?.email)) awaiting.push("email");
  if (!channelConsentActive(preferences?.sms)) awaiting.push("sms");
  return awaiting;
}

/** True once signup has stored a decision for both channels, including a decline. */
export function consentAlreadyRecorded(preferences?: CommunicationPreferences | null): boolean {
  return Boolean(preferences?.email?.languageVersion && preferences?.sms?.languageVersion);
}

export function checkoutConsentInput(input: {
  preferences?: CommunicationPreferences | null;
  emailOptIn: boolean;
  smsOptIn: boolean;
  phone?: string;
}): { ok: true; patch: { email?: true; sms?: true; phone?: string } | null } | { ok: false; message: string } {
  const awaiting = channelsAwaitingConsent(input.preferences);
  const typedPhone = normalizePhone(input.phone);
  const phoneOnFile = normalizePhone(input.preferences?.phone) ?? (input.preferences?.phone || null);
  const patch: { email?: true; sms?: true; phone?: string } = {};
  if (input.emailOptIn && awaiting.includes("email")) patch.email = true;
  if (input.smsOptIn && awaiting.includes("sms")) {
    if (!typedPhone && !phoneOnFile) {
      return { ok: false, message: "Add a mobile number to agree to text messages, or leave text messages unchecked. You can complete this purchase either way." };
    }
    patch.sms = true;
    if (typedPhone) patch.phone = typedPhone;
  } else if (typedPhone && !phoneOnFile) {
    patch.phone = typedPhone;
  }
  return { ok: true, patch: patch.email || patch.sms || patch.phone ? patch : null };
}
