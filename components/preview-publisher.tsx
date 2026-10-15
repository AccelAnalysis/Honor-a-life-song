"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useCreatorAccess } from "@/components/creator-access-gate";
import { listCreatorAssignments } from "@/lib/firebase/creator-deliverables";
import { publishPreviewFile, publishPreviewLink } from "@/lib/firebase/song-previews";
import { customerMessage } from "@/lib/customer-messages";
import styles from "./preview-library.module.css";

export function PreviewPublisher() {
  const { user } = useAuth();
  const access = useCreatorAccess();
  const [assignmentId, setAssignmentId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    listCreatorAssignments(user.uid).then((items) => setAssignmentId(items[0]?.id ?? "")).catch(() => undefined);
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "");
    const link = String(data.get("link") ?? "").trim();
    const file = data.get("file");
    if (access === "creator" && !assignmentId) {
      setError("A creator assignment is needed before a preview can be added.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (file instanceof File && file.size) {
        await publishPreviewFile({ title, file, createdByUserId: user.uid, assignmentId });
      } else if (link) {
        await publishPreviewLink({ title, audioUrl: link, createdByUserId: user.uid, assignmentId });
      } else {
        throw new Error("Upload an audio file or paste an https link.");
      }
      form.reset();
      setNotice("Preview saved. Visitors can play it from the listening library.");
    } catch (reason) {
      setError(customerMessage(reason, "The preview could not be saved."));
    } finally {
      setBusy(false);
    }
  }

  return <section className={styles.library} aria-labelledby="preview-publisher-heading">
    <div>
      <p>Add a preview</p>
      <h2 id="preview-publisher-heading">Put a song where people can hear it</h2>
      <p>Upload an audio file or paste an https link. These are the previews visitors play.</p>
    </div>
    {error ? <p role="alert">{error}</p> : null}
    {notice ? <p role="status">{notice}</p> : null}
    <form onSubmit={submit}>
      <label>Title<input name="title" required maxLength={120} /></label>
      <label>Audio file<input name="file" type="file" accept="audio/*" /></label>
      <label>Or an https link<input name="link" type="url" placeholder="https://" /></label>
      <button disabled={busy} type="submit">{busy ? "Saving…" : "Add preview"}</button>
    </form>
  </section>;
}
