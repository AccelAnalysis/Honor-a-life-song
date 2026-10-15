'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {parseModelVerses, sketchVerses, suggestVerses} = require('../songwriting');

const interview = 'She taught piano in the church basement for forty years. The children called her Miss Ruth. She still hums the hymn when the hallway gets quiet.';

function memoryDb(records) {
  return {
    doc(path) {
      return {
        async get() { return {exists: Object.hasOwn(records, path), data: () => records[path]}; },
        collection(name) {
          return {doc() { const id = 'suggestion-1'; return {id, async set(data) { records[`${path}/${name}/${id}`] = data; }}; }};
        }
      };
    }
  };
}

test('verse sketches use only lines from the interview notes', () => {
  const sketch = sketchVerses(interview);
  assert.equal(sketch.source, 'notes-sketch');
  assert.ok(sketch.verses.length > 0 && sketch.verses.length <= 4);
  for (const verse of sketch.verses) for (const line of verse.text.split('\n')) assert.ok(interview.includes(line));
  assert.throws(() => sketchVerses('too short'));
});

test('model replies must be verse JSON and cannot invent a finished-song wrapper', () => {
  const parsed = parseModelVerses('Here you go {"verses":[{"label":"Verse 1","text":"Miss Ruth hums."}]} thanks');
  assert.equal(parsed.source, 'model');
  assert.equal(parsed.verses[0].text, 'Miss Ruth hums.');
  assert.throws(() => parseModelVerses('no json here'));
  assert.throws(() => parseModelVerses('{"verses":[]}'));
});

test('suggestions are refused to other accounts and stored for the owner without a model key', async () => {
  const records = {
    'creativeWorks/song-1': {assignedUserId: 'tina', status: 'notes', interviewNotes: interview},
    'admins/jonathan': {active: true}
  };
  const db = memoryDb(records);
  await assert.rejects(suggestVerses({db, actor: {}, input: {creativeWorkId: 'song-1'}, modelKey: ''}));
  await assert.rejects(suggestVerses({db, actor: {uid: 'stranger'}, input: {creativeWorkId: 'song-1'}, modelKey: ''}));
  const saved = await suggestVerses({db, actor: {uid: 'tina'}, input: {creativeWorkId: 'song-1'}, modelKey: ''});
  assert.equal(saved.source, 'notes-sketch');
  assert.equal(saved.assignedUserId, 'tina');
  assert.equal(records['creativeWorks/song-1/suggestions/suggestion-1'].createdByUserId, 'tina');
  const asAdmin = await suggestVerses({db, actor: {uid: 'jonathan'}, input: {creativeWorkId: 'song-1'}, modelKey: ''});
  assert.equal(asAdmin.assignedUserId, 'tina');
});

test('a model key stays in the request and a failed model falls back to the notes', async () => {
  const records = {'creativeWorks/song-1': {assignedUserId: 'tina', status: 'drafting', interviewNotes: interview}};
  let seenKey = '';
  const fetchImpl = async (_url, options) => {
    seenKey = options.headers.Authorization;
    return {ok: true, json: async () => ({choices: [{message: {content: '{"verses":[{"label":"Chorus","text":"She still hums."}]}'}}]})};
  };
  const model = await suggestVerses({db: memoryDb(records), actor: {uid: 'tina'}, input: {creativeWorkId: 'song-1'}, modelKey: () => 'server-only-key', fetchImpl});
  assert.equal(model.source, 'model');
  assert.equal(seenKey, 'Bearer server-only-key');
  assert.equal(JSON.stringify(model).includes('server-only-key'), false);
  const failed = await suggestVerses({
    db: memoryDb(records),
    actor: {uid: 'tina'},
    input: {creativeWorkId: 'song-1'},
    modelKey: 'server-only-key',
    fetchImpl: async () => { throw new Error('down'); }
  });
  assert.equal(failed.source, 'notes-sketch');
  records['creativeWorks/song-1'] = {...records['creativeWorks/song-1'], status: 'finished'};
  await assert.rejects(suggestVerses({db: memoryDb(records), actor: {uid: 'tina'}, input: {creativeWorkId: 'song-1'}, modelKey: ''}));
});
