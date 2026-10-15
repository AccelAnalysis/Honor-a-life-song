import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  channelsAwaitingConsent,
  checkoutConsentInput,
  consentAlreadyRecorded,
  emailConsentCopy,
  smsConsentCopy
} from "../domain/communication-consent";

const read = (name: string) => readFileSync(name, "utf8");

describe("account-level message consent", () => {
  it("keeps email and SMS language separate from each other and from the server copy", () => {
    expect(emailConsentCopy.version).not.toBe(smsConsentCopy.version);
    expect(emailConsentCopy.language).not.toBe(smsConsentCopy.language);
    expect(emailConsentCopy.language).toMatch(/unsubscribe/i);
    expect(smsConsentCopy.language).toMatch(/STOP/);
    expect(smsConsentCopy.language).toMatch(/Message and data rates/);
    const server = read("functions/communication.js");
    expect(server).toContain(emailConsentCopy.version);
    expect(server).toContain(smsConsentCopy.version);
    expect(server).toContain(emailConsentCopy.language);
    expect(server).toContain(smsConsentCopy.language);
  });

  it("asks at checkout only for channels the account has not accepted", () => {
    expect(channelsAwaitingConsent(null)).toEqual(["email", "sms"]);
    expect(channelsAwaitingConsent({ email: { channel: "email", consented: true }, sms: { channel: "sms", consented: false } })).toEqual(["sms"]);
    expect(channelsAwaitingConsent({
      email: { channel: "email", consented: true },
      sms: { channel: "sms", consented: true, withdrawnAt: "2026-10-20T00:00:00.000Z" }
    })).toEqual(["sms"]);
    expect(channelsAwaitingConsent({
      email: { channel: "email", consented: true, languageVersion: emailConsentCopy.version },
      sms: { channel: "sms", consented: true, languageVersion: smsConsentCopy.version }
    })).toEqual([]);
    expect(checkoutConsentInput({ preferences: { email: { channel: "email", consented: true }, sms: { channel: "sms", consented: true } }, emailOptIn: true, smsOptIn: true })).toEqual({ ok: true, patch: null });
    expect(checkoutConsentInput({ preferences: null, emailOptIn: true, smsOptIn: false })).toEqual({ ok: true, patch: { email: true } });
    expect(checkoutConsentInput({ preferences: null, emailOptIn: false, smsOptIn: true }).ok).toBe(false);
    expect(checkoutConsentInput({ preferences: null, emailOptIn: false, smsOptIn: true, phone: "555-555-0100" })).toEqual({ ok: true, patch: { sms: true, phone: "+15555550100" } });
    expect(consentAlreadyRecorded({
      email: { channel: "email", consented: false, languageVersion: emailConsentCopy.version },
      sms: { channel: "sms", consented: false, languageVersion: smsConsentCopy.version }
    })).toBe(true);
    expect(consentAlreadyRecorded(null)).toBe(false);
  });

  it("captures both choices at account creation and only the missing channel during individual checkout", () => {
    const registration = read("components/account-registration-form.tsx");
    const checkout = read("components/memories-hub.tsx");
    const intake = read("components/participant-permission-route.tsx");
    expect(registration).toContain('name="emailConsent"');
    expect(registration).toContain('name="smsConsent"');
    expect(registration).toContain('source: "account_creation"');
    expect(registration).not.toContain('name="marketingConsent"');
    expect(checkout).toContain("channelsAwaitingConsent");
    expect(checkout).toContain('source: "checkout"');
    expect(checkout).toContain("Optional");
    expect(checkout).not.toContain("emailConsent\" required");
    expect(checkout).not.toContain("smsConsent\" required");
    expect(intake).not.toContain("emailConsent");
    expect(intake).not.toContain("smsConsent");
    expect(intake).not.toContain("saveCommunicationConsent");
  });

  it("lands an individual purchase on song status instead of a bare return flag", () => {
    const hub = read("components/memories-hub.tsx");
    expect(hub).toContain("purchase-status-title");
    expect(hub).toContain("Open private materials");
    expect(hub).toContain("Your payment is confirmed");
    expect(read("functions/individual-payments.js")).toContain("queuePostPurchaseMessages");
    expect(read("functions/index.js")).toContain("SONGKEEP_EMAIL_ENABLED");
    expect(read("functions/index.js")).toContain("songkeepPurchaseMail");
    expect(read("functions/index.js")).toContain("songkeepUnsubscribe");
  });
});
