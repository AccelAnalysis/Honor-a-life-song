/** Translate provider failures at the UI boundary; never show SDK/configuration diagnostics. */
export function customerMessage(error: unknown, fallback = "We could not complete that. Please try again."): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code).split("/").pop() ?? "" : "";
  const messages: Record<string, string> = {
    "email-already-in-use": "There is already an account with this email. Sign in to continue.",
    "invalid-credential": "The email or password does not match. Please try again.",
    "invalid-login-credentials": "The email or password does not match. Please try again.",
    "wrong-password": "The email or password does not match. Please try again.",
    "user-not-found": "The email or password does not match. Please try again.",
    "invalid-email": "Enter a valid email address.",
    "weak-password": "Choose a stronger password with at least 8 characters.",
    "too-many-requests": "Please wait a moment before trying again.",
    "network-request-failed": "Check your connection and try again.",
    "permission-denied": "You do not have access to this action. Ask your account administrator for help.",
    "unauthenticated": "Please sign in again to continue.",
    "unavailable": "This service is temporarily unavailable. Please try again shortly.",
    "internal": "This service is temporarily unavailable. Please try again shortly.",
    "operation-not-allowed": "Account sign-up is temporarily unavailable. Please contact SongKeep for help."
  };
  if (messages[code]) return messages[code];
  const message = error instanceof Error ? error.message.trim() : "";
  if (!message || /firebase|firestore|cloud function|index|SDK|adapter|canonical|authoritative|configuration|configured|permission_denied|failed-precondition|internal|stack|\.env|https?:\/\//i.test(message) || /\b[A-Z_]{6,}\b/.test(message)) return fallback;
  return message.length > 240 ? fallback : message;
}
