'use strict';
const {DomainError, requireValue, id, text} = require('./domain');

const LABELS = ['Verse 1', 'Chorus', 'Verse 2', 'Bridge'];

function sketchVerses(notes) {
  const cleaned = text(notes, 'interview notes', 20000).replace(/\s+/g, ' ').trim();
  requireValue(cleaned.length >= 40, 'Add a little more from the interview before asking for verse ideas.', 'failed-precondition');
  const sentences = cleaned.split(/(?<=[.!?])\s+/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 8);
  const lines = (sentences.length ? sentences : [cleaned]).slice(0, 8);
  const chunks = [];
  for (let index = 0; index < lines.length && chunks.length < 4; index += 2) chunks.push(lines.slice(index, index + 2).join('\n'));
  return {
    source: 'notes-sketch',
    notice: 'Arranged from the interview notes. Shape these lines yourself.',
    verses: chunks.map((line, index) => ({label: LABELS[index] || `Verse ${index + 1}`, text: line}))
  };
}

function parseModelVerses(raw) {
  requireValue(typeof raw === 'string' && raw.includes('{'), 'The suggestion could not be read.', 'internal');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  requireValue(end > start, 'The suggestion could not be read.', 'internal');
  let data;
  try { data = JSON.parse(raw.slice(start, end + 1)); }
  catch { throw new DomainError('The suggestion could not be read.', 'internal'); }
  requireValue(Array.isArray(data.verses) && data.verses.length > 0, 'The suggestion did not include any verses.', 'internal');
  const verses = data.verses.slice(0, 4).map(verse => ({
    label: text(verse && verse.label, 'section label', 40),
    text: text(verse && verse.text, 'verse', 2000)
  }));
  return {
    source: 'model',
    notice: 'A starting suggestion from the interview notes. You decide what stays.',
    verses
  };
}

async function requestModelVerses(notes, apiKey, fetchImpl) {
  const endpoint = process.env.SONGKEEP_LYRIC_MODEL_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.SONGKEEP_LYRIC_MODEL || 'gpt-4o-mini';
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        {role: 'system', content: 'You help a human songwriter start verses from interview notes. Return only JSON with the shape {"verses":[{"label":"Verse 1","text":"line"}]}. Use at most 4 short sections. Use only details that appear in the notes. Do not invent names, places, dates, or events. Do not claim the song is finished.'},
        {role: 'user', content: notes}
      ]
    }),
    signal: AbortSignal.timeout(20000)
  });
  requireValue(response.ok, 'The suggestion service did not respond.', 'unavailable');
  const payload = await response.json();
  const content = payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
  return parseModelVerses(content);
}

async function suggestVerses({db, actor, input, modelKey, fetchImpl = fetch, warn = () => undefined}) {
  requireValue(actor && actor.uid, 'Sign in to continue.', 'unauthenticated');
  const workId = id(input && input.creativeWorkId);
  const workRef = db.doc(`creativeWorks/${workId}`);
  const [workSnap, adminSnap] = await Promise.all([workRef.get(), db.doc(`admins/${actor.uid}`).get()]);
  requireValue(workSnap.exists, 'Choose a song to continue.', 'not-found');
  const work = workSnap.data();
  const isAdmin = adminSnap.exists && adminSnap.data().active !== false;
  requireValue(isAdmin || work.assignedUserId === actor.uid, 'You do not have access to this song.', 'permission-denied');
  requireValue(work.status !== 'finished', 'This song is already finished.', 'failed-precondition');
  const notes = text(work.interviewNotes, 'interview notes', 20000);
  const key = typeof modelKey === 'function' ? modelKey() : modelKey;
  let suggestion;
  if (key) {
    try { suggestion = await requestModelVerses(notes, key, fetchImpl); }
    catch (error) {
      warn('Lyric suggestion fell back to the interview notes.');
      suggestion = sketchVerses(notes);
      suggestion.notice = 'The suggestion service could not complete a model draft, so these lines come straight from the interview notes.';
    }
  } else suggestion = sketchVerses(notes);
  const suggestionRef = workRef.collection('suggestions').doc();
  const record = {
    creativeWorkId: workId,
    assignedUserId: work.assignedUserId,
    createdByUserId: actor.uid,
    source: suggestion.source,
    notice: suggestion.notice,
    verses: suggestion.verses,
    createdAt: new Date().toISOString()
  };
  await suggestionRef.set(record);
  return {id: suggestionRef.id, ...record};
}

module.exports = {sketchVerses, parseModelVerses, requestModelVerses, suggestVerses};
