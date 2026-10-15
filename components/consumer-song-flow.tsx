"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/components/brand";
import { PreviewLibrary } from "@/components/preview-library";
import {
  aboutQuestions,
  addOnsAreOffered,
  advanceConsumerFlow,
  chorusChoices,
  consumerAddOnCards,
  consumerDraftStorageKey,
  consumerPlanCards,
  creationModes,
  emptyConsumerSession,
  feelingChoices,
  genreChoices,
  groupExperienceLinks,
  helpWriteLine,
  lyricText,
  memoryOptions,
  occasionChoices,
  occasionIsReady,
  qrCardIncluded,
  readConsumerSession,
  recipientChoices,
  retreatConsumerFlow,
  setLineText,
  signatureFanfare,
  surpriseLines,
  surpriseReplacements,
  suggestLine,
  toggleLineLock,
  withCustomChorus,
  withPreviewLines,
  type ConsumerDraft,
  type ConsumerSession,
  type CreationModeId,
  type FeelingId,
  type GenreId,
  type OccasionId,
  type RecipientId
} from "@/domain/consumer-song-flow";
import { getIndividualSongPlan, type IndividualSongPlanId } from "@/domain/individual-song-plans";
import { builtInPreviews, publicPreviewEntitlement } from "@/lib/preview-library";
import styles from "./consumer-song-flow.module.css";

type SpeechResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function speechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function StoryVoice({ value, onChange, prompt }: { value: string; onChange: (text: string) => void; prompt: string }) {
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const storyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function tellStory() {
    const recognition = speechRecognition();
    if (!recognition) {
      setHint("Type it in the box. This browser cannot take dictation yet.");
      storyRef.current?.focus();
      return;
    }
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) return;
      onChange(value.trim() ? `${value.trim()} ${transcript}` : transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setHint("We could not hear that. You can type it instead.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    setHint("Listening. Say what you want this song to hold.");
    try {
      recognition.start();
    } catch {
      setListening(false);
      setHint("Dictation is busy. You can type it instead.");
    }
  }

  return <div className={styles.voice}>
    <p>{prompt}</p>
    {listening
      ? <button type="button" onClick={() => { recognitionRef.current?.stop(); setListening(false); }}>Stop listening</button>
      : <button type="button" onClick={tellStory}>Say it out loud</button>}
    <label>Spoken notes
      <textarea ref={storyRef} value={value} rows={4} onChange={(event) => onChange(event.target.value)} placeholder="A porch light, a nickname, the way they laugh." />
    </label>
    {hint ? <p className={styles.notice} role="status">{hint}</p> : null}
  </div>;
}

export function ConsumerSongFlow() {
  const [session, setSession] = useState<ConsumerSession>(emptyConsumerSession);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [ownLine, setOwnLine] = useState("");
  const [showKeepsake, setShowKeepsake] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [printKeepsake, setPrintKeepsake] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { step, draft } = session;
  const questions = aboutQuestions(draft);
  const plans = consumerPlanCards();
  const addOns = consumerAddOnCards();
  const selectedPlan = getIndividualSongPlan(draft.planId);

  useEffect(() => {
    const stored = readConsumerSession(window.localStorage.getItem(consumerDraftStorageKey));
    const plan = getIndividualSongPlan(new URLSearchParams(window.location.search).get("plan"));
    const beforePackage = stored.step !== "addons" && stored.step !== "delivery";
    setSession(plan && beforePackage ? { ...stored, draft: { ...stored.draft, planId: plan.id } } : stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(consumerDraftStorageKey, JSON.stringify(session));
  }, [ready, session]);

  useEffect(() => {
    if (ready) headingRef.current?.focus();
  }, [ready, step]);

  useEffect(() => {
    if (!printKeepsake || !showKeepsake) return;
    window.print();
    setPrintKeepsake(false);
  }, [printKeepsake, showKeepsake]);

  function patch(partial: Partial<ConsumerDraft>) {
    setNotice("");
    setSession((current) => ({ ...current, draft: { ...current.draft, ...partial } }));
  }

  function goNext() {
    setNotice("");
    setSession((current) => {
      const next = advanceConsumerFlow(current.step, current.draft);
      const draftForNext = next === "preview" ? withPreviewLines(current.draft) : current.draft;
      return { step: next, draft: draftForNext };
    });
  }

  function goBack() {
    setNotice("");
    setSession((current) => ({ ...current, step: retreatConsumerFlow(current.step, current.draft) }));
  }

  function loveIt() {
    setNotice("");
    setSession((current) => {
      const nextDraft = { ...withPreviewLines(current.draft), loved: true };
      return { step: advanceConsumerFlow("preview", nextDraft), draft: nextDraft };
    });
  }

  function surprise() {
    setNotice("Open lines changed. Kept lines stayed.");
    setSession((current) => {
      const surpriseSalt = current.draft.surpriseSalt + 1;
      const nextDraft = { ...current.draft, surpriseSalt };
      return {
        step: "preview",
        draft: { ...nextDraft, lines: surpriseLines(current.draft.lines, surpriseReplacements(nextDraft, surpriseSalt)) }
      };
    });
  }

  function helpThisLine() {
    const target = draft.lines.find((line) => line.id === draft.activeLineId && !line.locked)
      ?? draft.lines.find((line) => !line.locked);
    if (!target) {
      setNotice("Every line is kept. Unlock one if you want a new idea.");
      return;
    }
    const suggestion = suggestLine(draft, target, draft.surpriseSalt + 1);
    setSession((current) => ({
      ...current,
      draft: {
        ...current.draft,
        activeLineId: target.id,
        surpriseSalt: current.draft.surpriseSalt + 1,
        lines: helpWriteLine(current.draft.lines, target.id, suggestion)
      }
    }));
    setNotice("Here is another way to say that line. Keep it if you love it.");
  }

  function choosePlan(planId: IndividualSongPlanId) {
    setNotice("");
    setSession((current) => {
      const nextDraft = { ...current.draft, planId };
      return { step: advanceConsumerFlow("pricing", nextDraft), draft: nextDraft };
    });
  }

  function toggleAddOn(id: string) {
    patch({
      addOnIds: draft.addOnIds.includes(id) ? draft.addOnIds.filter((item) => item !== id) : [...draft.addOnIds, id]
    });
  }

  function toggleMemory(id: string) {
    patch({
      includedMemoryIds: draft.includedMemoryIds.includes(id)
        ? draft.includedMemoryIds.filter((item) => item !== id)
        : [...draft.includedMemoryIds, id]
    });
  }

  function downloadLyrics() {
    const blob = new Blob([lyricText(draft.lines)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "songkeep-lyrics.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function shareLyric() {
    const text = lyricText(draft.lines);
    if (navigator.share) {
      try {
        await navigator.share({ title: "SongKeep", text });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied. Paste it wherever you want to share the lyric.");
    } catch {
      setNotice("Copy the lyric from the keepsake if sharing is unavailable.");
    }
  }

  function createAnother() {
    setNotice("");
    setOwnLine("");
    setShowKeepsake(false);
    setShowPlayer(false);
    setPrintKeepsake(false);
    setSession(emptyConsumerSession());
  }

  const sample = builtInPreviews[0];
  const choices = chorusChoices(draft);

  return <div className={styles.page} data-step={step}>
    <p className={styles.kicker}>SongKeep</p>
    {step !== "listen" ? <button className={styles.back} type="button" onClick={goBack}>Back</button> : null}

    {step === "listen" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>Hear a song</h1>
      <p>Start with a sound. Your words come next. No account yet.</p>
      <PreviewLibrary />
      <div className={styles.actions}><button className={styles.primary} type="button" onClick={goNext}>Continue</button></div>
    </section> : null}

    {step === "welcome" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>Your memories. Your words. Your song.</h1>
      <p className={styles.tagline}>Some memories deserve more than a photograph.</p>
      <p className={styles.taglineQuiet}>Turn yours into a song.</p>
      <fieldset>
        <legend>Who is this song for?</legend>
        <div className={styles.choices}>
          {recipientChoices.map((choice) => <button
            aria-pressed={draft.recipient === choice.id}
            key={choice.id}
            type="button"
            onClick={() => patch({ recipient: choice.id as RecipientId })}
          >{choice.label}</button>)}
        </div>
      </fieldset>
      {draft.recipient === "occasion" ? <div className={styles.choices} role="group" aria-label="Occasion">
        {occasionChoices.map((choice) => <button
          aria-pressed={draft.occasion === choice.id}
          key={choice.id}
          type="button"
          onClick={() => patch({ occasion: choice.id as OccasionId })}
        >{choice.label}</button>)}
      </div> : null}
      {draft.recipient === "occasion" && draft.occasion === "other" ? <label>What is the occasion?
        <input value={draft.occasionOther} onChange={(event) => patch({ occasionOther: event.target.value })} placeholder="A house concert, a reunion, a Tuesday" />
      </label> : null}
      {draft.recipient === "group" ? <div className={styles.handoff}>
        <p>A group starts with an account. You will plan the experience next, including Honor a Life Song Experience.</p>
        <div className={styles.actions}>
          {groupExperienceLinks.map((link) => <Link className={link.href.startsWith("/create-account") ? styles.primary : styles.quietLink} key={link.href} href={link.href}>{link.label}</Link>)}
        </div>
        <p className={styles.help}><Link href="/begin">Already have a group account? Plan the experience.</Link></p>
      </div> : <div className={styles.actions}>
        <button className={styles.primary} type="button" onClick={goNext} disabled={advanceConsumerFlow("welcome", draft) === "welcome"}>Continue</button>
      </div>}
      <p className={styles.help}>No songwriting experience needed.</p>
      <p className={styles.help}><Link href="/try">Already have interview notes? Open the song sandbox.</Link></p>
    </section> : null}

    {step === "story" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>{draft.recipient === "occasion" && draft.occasion ? questions.memory : "Tell us one memory"}</h1>
      <p>A sentence is enough. This is a taste of the song, not the finished lyric.</p>
      <label>A favorite memory
        <textarea value={draft.favoriteMemory} rows={4} onChange={(event) => patch({ favoriteMemory: event.target.value })} />
      </label>
      <StoryVoice prompt="Don't want to type? Say this memory out loud." value={draft.voiceStory} onChange={(voiceStory) => patch({ voiceStory })} />
      {draft.favoriteMemory.trim() || draft.voiceStory.trim() ? <div className={styles.taste} aria-label="Draft taste">
        <h2>A taste of the song</h2>
        {chorusChoices(draft, 0).map((line) => <p key={line}>{line}</p>)}
      </div> : null}
      <div className={styles.actions}><button className={styles.primary} type="button" onClick={goNext} disabled={advanceConsumerFlow("story", draft) === "story"}>Continue</button></div>
    </section> : null}

    {step === "occasion" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>What is the occasion?</h1>
      <p>This shapes the questions that follow.</p>
      <div className={styles.choices} role="group" aria-label="Occasion">
        {occasionChoices.map((choice) => <button
          aria-pressed={draft.occasion === choice.id}
          key={choice.id}
          type="button"
          onClick={() => patch({ occasion: choice.id as OccasionId })}
        >{choice.label}</button>)}
      </div>
      {draft.occasion === "other" ? <label>What is the occasion?
        <input value={draft.occasionOther} onChange={(event) => patch({ occasionOther: event.target.value })} placeholder="A house concert, a reunion, a Tuesday" />
      </label> : null}
      <div className={styles.actions}><button className={styles.primary} type="button" onClick={goNext} disabled={!occasionIsReady(draft)}>Continue</button></div>
    </section> : null}

    {step === "about" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>{questions.heading}</h1>
      <p>Share as much or as little as you like. The song can hold the rest.</p>
      <label>{questions.name}
        <input value={draft.subjectName} onChange={(event) => patch({ subjectName: event.target.value })} autoComplete="name" />
      </label>
      <label>{questions.relationship}
        <input value={draft.relationship} onChange={(event) => patch({ relationship: event.target.value })} placeholder="Grandmother, partner, friend" />
      </label>
      <label>{questions.words}
        <input value={draft.threeWords} onChange={(event) => patch({ threeWords: event.target.value })} placeholder="Kind, steady, funny" />
      </label>
      {draft.favoriteMemory.trim() ? null : <label>{questions.memory}
        <textarea value={draft.favoriteMemory} rows={4} onChange={(event) => patch({ favoriteMemory: event.target.value })} />
      </label>}
      <label>{questions.phrase}
        <input value={draft.alwaysSay} onChange={(event) => patch({ alwaysSay: event.target.value })} placeholder="Phrases, nicknames, catchphrases" />
      </label>
      <label>{questions.appearance}
        <input value={draft.appearance} onChange={(event) => patch({ appearance: event.target.value })} placeholder="The red scarf, the work boots, the smile" />
      </label>
      <label>{questions.favoriteThing}
        <input value={draft.favoriteThing} onChange={(event) => patch({ favoriteThing: event.target.value })} placeholder="Fishing, Sunday lunch, the garden" />
      </label>
      <label>{questions.standout}
        <input value={draft.standout} onChange={(event) => patch({ standout: event.target.value })} placeholder="Her laugh, his hands, the way they listen" />
      </label>
      <label>{questions.extra}
        <textarea value={draft.somethingElse} rows={3} onChange={(event) => patch({ somethingElse: event.target.value })} />
      </label>
      <StoryVoice prompt="Don't want to type the rest? Say it out loud." value={draft.voiceStory} onChange={(voiceStory) => patch({ voiceStory })} />
      <div className={styles.actions}><button className={styles.primary} type="button" onClick={goNext} disabled={advanceConsumerFlow("about", draft) === "about"}>Continue</button></div>
    </section> : null}

    {step === "sound" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>How should it feel?</h1>
      <div className={styles.choices} role="group" aria-label="Feeling">
        {feelingChoices.map((choice) => <button
          aria-pressed={draft.feeling === choice.id}
          key={choice.id}
          type="button"
          onClick={() => patch({ feeling: choice.id as FeelingId })}
        >{choice.label}</button>)}
      </div>
      <h2>What kind of song?</h2>
      <div className={styles.choices} role="group" aria-label="Genre">
        {genreChoices.map((choice) => <button
          aria-pressed={draft.genre === choice.id}
          key={choice.id}
          type="button"
          onClick={() => patch({ genre: choice.id as GenreId })}
        >{choice.label}</button>)}
      </div>
      <label className={styles.check}>
        <input type="checkbox" checked={draft.fitStory} onChange={(event) => patch({ fitStory: event.target.checked })} />
        Choose what fits my story
      </label>
      <div className={styles.actions}><button className={styles.primary} type="button" onClick={goNext} disabled={advanceConsumerFlow("sound", draft) === "sound"}>Continue</button></div>
    </section> : null}

    {step === "mode" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>How should we write it?</h1>
      <div className={styles.modes}>
        {creationModes.map((mode) => <button
          aria-pressed={draft.mode === mode.id}
          className={styles.mode}
          key={mode.id}
          type="button"
          onClick={() => patch({ mode: mode.id as CreationModeId })}
        >
          <strong>{mode.title}</strong>
          <span>{mode.detail}</span>
        </button>)}
      </div>
      <div className={styles.actions}><button className={styles.primary} type="button" onClick={goNext} disabled={!draft.mode}>Continue</button></div>
    </section> : null}

    {step === "with-me" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>Create it with me</h1>
      <p>Choose a chorus line, or write your own. Then pick the memories to keep.</p>
      <div className={styles.stack} role="group" aria-label="Chorus lines">
        {choices.map((line) => <button
          aria-pressed={draft.chorusLine === line}
          key={line}
          type="button"
          onClick={() => patch({ chorusLine: line })}
        >{line}</button>)}
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => patch({ chorusOffset: draft.chorusOffset + 3 })}>Show me three more</button>
      </div>
      <form className={styles.ownLine} onSubmit={(event) => {
        event.preventDefault();
        setSession((current) => ({ ...current, draft: withCustomChorus(current.draft, ownLine) }));
        setOwnLine("");
      }}>
        <label>Add your own line
          <input value={ownLine} onChange={(event) => setOwnLine(event.target.value)} />
        </label>
        <button type="submit">Use this line</button>
      </form>
      {memoryOptions(draft).length ? <fieldset>
        <legend>Memories to include</legend>
        <div className={styles.stack}>
          {memoryOptions(draft).map((option) => <label className={styles.check} key={option.id}>
            <input
              type="checkbox"
              checked={draft.includedMemoryIds.includes(option.id)}
              onChange={() => toggleMemory(option.id)}
            />
            <span><strong>{option.label}</strong>{option.text}</span>
          </label>)}
        </div>
      </fieldset> : null}
      <div className={styles.actions}><button className={styles.primary} type="button" onClick={goNext} disabled={!draft.chorusLine.trim()}>Continue</button></div>
    </section> : null}

    {step === "preview" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>Your draft</h1>
      <p>Edit any open line. Keep this line locks it so a new pass will not overwrite it.</p>
      <div className={styles.lines}>
        {draft.lines.map((line) => <article key={line.id} className={line.locked ? styles.lineKept : styles.line}>
          <header>
            <span>{line.role === "chorus" ? "Chorus" : "Verse"}</span>
            {line.locked ? <strong>Kept</strong> : null}
          </header>
          <textarea
            aria-label={line.role === "chorus" ? "Chorus line" : "Verse line"}
            readOnly={line.locked}
            rows={3}
            value={line.text}
            onFocus={() => patch({ activeLineId: line.id })}
            onChange={(event) => setSession((current) => ({
              ...current,
              draft: { ...current.draft, activeLineId: line.id, lines: setLineText(current.draft.lines, line.id, event.target.value) }
            }))}
          />
          <button aria-pressed={line.locked} type="button" onClick={() => setSession((current) => ({
            ...current,
            draft: { ...current.draft, activeLineId: line.id, lines: toggleLineLock(current.draft.lines, line.id) }
          }))}>Keep this line</button>
        </article>)}
      </div>
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <div className={styles.actions}>
        <button className={styles.primary} type="button" onClick={loveIt}>I love it</button>
        <button type="button" onClick={() => setNotice("Change any open line. Kept lines stay.")}>Change something</button>
        <button type="button" onClick={surprise}>Surprise me</button>
        <button type="button" onClick={helpThisLine}>Help me write this line</button>
      </div>
    </section> : null}

    {step === "pricing" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>Choose a plan</h1>
      <p>The draft is ready. Choose what you want to keep.</p>
      <div className={styles.plans}>
        {plans.map((plan) => {
          const signature = plan.id === "song-keep-signature";
          return <article className={signature ? styles.planSignature : plan.featured ? styles.planFeatured : styles.plan} key={plan.id}>
            {plan.badge ? <p className={styles.badge}>{plan.badge}</p> : null}
            {signature ? <p className={styles.fanfare}>Songwriter&apos;s Touch™</p> : null}
            <h2>{plan.name}</h2>
            <p className={styles.price}>{plan.priceLabel}</p>
            <ul>
              {plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
            </ul>
            <button className={styles.primary} type="button" onClick={() => choosePlan(plan.id)}>{draft.planId === plan.id ? `Continue with ${plan.name}` : `Choose ${plan.name}`}</button>
          </article>;
        })}
      </div>
    </section> : null}

    {step === "addons" && addOnsAreOffered(step, draft.loved) ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>Want to add anything?</h1>
      <p>These are optional. You already have a song you like.</p>
      <div className={styles.stack}>
        {addOns.filter((addOn) => addOn.id !== "lyric-pdf" || draft.planId !== "song-keep-signature").map((addOn) => <label className={styles.addOn} key={addOn.id}>
          <input type="checkbox" checked={draft.addOnIds.includes(addOn.id)} onChange={() => toggleAddOn(addOn.id)} />
          <span>{addOn.name}</span>
          <b>{addOn.priceLabel}</b>
        </label>)}
      </div>
      <div className={styles.actions}>
        <button className={styles.primary} type="button" onClick={goNext}>Continue</button>
      </div>
    </section> : null}

    {step === "delivery" ? <section className={styles.panel} aria-labelledby="create-heading">
      <h1 id="create-heading" ref={headingRef} tabIndex={-1}>Your SongKeep is ready</h1>
      <p>{draft.subjectName ? `${draft.subjectName}'s draft is here to keep.` : "Your draft is here to keep."} {selectedPlan ? `${selectedPlan.name} is the plan on this song.` : null}</p>
      {draft.planId === "song-keep-signature" ? <div className={styles.fanfareBox}>
        <p className={styles.fanfare}>Songwriter&apos;s Touch™</p>
        <p>{signatureFanfare()} Your lyric sheet is ready to view, download, or print.</p>
      </div> : null}
      <div className={styles.actions}>
        <button className={styles.primary} type="button" onClick={() => setShowPlayer(true)}>Play</button>
        <button type="button" onClick={downloadLyrics}>Download lyrics</button>
        <button type="button" onClick={() => setShowKeepsake(true)}>{draft.planId === "song-keep-signature" ? "View lyric sheet" : "View keepsake"}</button>
        <button type="button" onClick={() => void shareLyric()}>Share</button>
        <button type="button" onClick={() => { setShowKeepsake(true); setPrintKeepsake(true); }}>Print</button>
      </div>
      {showPlayer && sample ? <div className={styles.player}>
        <p>Play a sample while your own recording is finished with your plan.</p>
        <AudioPlayer
          src={sample.src}
          metadata={{ title: sample.title, subjectLabel: "SongKeep preview", creatorCredit: sample.credit }}
          entitlement={publicPreviewEntitlement}
          variant="public-preview"
          compact
        />
      </div> : null}
      {showKeepsake ? <article className={styles.keepsake}>
        <p>SongKeep</p>
        <h2>{draft.planId === "song-keep-signature" ? "Lyric sheet" : "Keepsake"}</h2>
        <p>{draft.subjectName ? `For ${draft.subjectName}` : draft.recipient === "myself" ? "For you" : "For this occasion"}</p>
        {draft.lines.map((line) => <p key={line.id}><strong>{line.role === "chorus" ? "Chorus" : "Verse"}</strong><br />{line.text}</p>)}
        {qrCardIncluded(draft) ? <div className={styles.qr} aria-label="QR code to the song">
          <span>QR code</span>
          <small>The song page arrives with this plan.</small>
        </div> : <p>A QR code to the song is part of Song Keep Signature, and of the lyric PDF add-on.</p>}
      </article> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      {selectedPlan ? <p className={styles.help}><Link href={`/create-account?next=%2Fcreate&plan=${selectedPlan.id}`}>Create an account to keep this draft with {selectedPlan.name}.</Link></p> : null}
      <div className={styles.again}>
        <p>Every life has more than one song.</p>
        <button className={styles.primary} type="button" onClick={createAnother}>Create another</button>
      </div>
    </section> : null}
  </div>;
}
