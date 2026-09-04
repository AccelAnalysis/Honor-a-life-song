"use client";

import { customerMessage } from "@/lib/customer-messages";
import { useState } from "react";
import { authorizedMediaUrl, nativeAction } from "@/lib/firebase/native-services";
export function AuthorizedAsset({ organizationId, assetId, kind, accessId }: { organizationId: string; assetId: string; kind: string; accessId?: string }) {
  const [url, setUrl] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function open() { const tab = kind === "song" ? null : window.open("", "_blank"); setBusy(true); setError(""); try { const next = await authorizedMediaUrl({ organizationId, assetId, accessId }); if (tab) { tab.opener = null; tab.location.href = next; } else setUrl(next); } catch (reason) { tab?.close(); setError(customerMessage(reason, "This material could not be opened.")); } finally { setBusy(false); } }
  return <div>{url && kind === "song" ? <audio aria-label="SongKeep recording" controls src={url} preload="none" onError={() => { setUrl(""); setError("Reopen the recording to refresh its private access."); }} /> : null}<button type="button" disabled={busy} onClick={open}>{busy ? "Opening…" : kind === "song" ? "Listen" : "Open material"}</button>{error ? <p role="alert">{error}</p> : null}</div>;
}
export function PrivateExperienceMaterials({ accessId }: { accessId: string }) {
  const [items, setItems] = useState<Array<{id: string; organizationId: string; title: string; kind: string}>>([]); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function open() { setBusy(true); setError(""); try { setItems(await nativeAction("materials", { accessId })); } catch (reason) { setError(customerMessage(reason, "Unable to open these materials.")); } finally { setBusy(false); } }
  return <section><button type="button" disabled={busy} onClick={open}>{busy ? "Opening…" : "Open private materials"}</button>{items.map(item => <article key={item.id}><h3>{item.title}</h3><AuthorizedAsset {...item} assetId={item.id} accessId={accessId} /></article>)}{error ? <p role="alert">{error}</p> : null}</section>;
}
