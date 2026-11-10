import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { buildActivity, buildCards, buildChat, buildDocuments, buildSecondBook } from './fixtures.mjs';
import { localizeSeedActivity, localizeSeedChat } from './finnishFixtures.mjs';

// The fixtures' dates are relative to today, so every month their texts and
// filenames name must come from those same dates: on any day of the year the
// demo has to read true. Each "today" below is checked separately.
const TODAYS = ['2026-11-10T09:00:00', '2027-01-02T09:00:00', '2027-03-31T21:00:00', '2027-08-15T09:00:00'];
const SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const before = (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1);
const en = (date) => date.toLocaleDateString('en-GB', { month: 'long' });
const fi = (date) => {
  const name = date.toLocaleDateString('fi-FI', { month: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1);
};
/** A calendar date is local noon; a timestamp is read as the instant it is. */
const day = (iso) => (iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso));

const atEachToday = (name, check) => test(name, async (t) => {
  for (const today of TODAYS) {
    mock.timers.enable({ apis: ['Date'], now: new Date(today).getTime() });
    try {
      await t.test(today, () => check(new Date(today)));
    } finally {
      mock.timers.reset();
    }
  }
});

atEachToday('document filenames name the month of their own dates', () => {
  const documents = [...buildDocuments(), ...buildSecondBook().documents];
  const byId = new Map(documents.map((doc) => [doc.id, doc]));
  const problems = [];
  for (const doc of documents) {
    const token = /-(\d{2})?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?=[-.])/.exec(doc.filename);
    if (!token) continue;
    const source = doc.duplicate_of ? byId.get(doc.duplicate_of) : doc;
    const date = day(source.document_date ?? source.captured_at ?? source.uploaded_at);
    const month = SHORT.indexOf(token[2]);
    const expected = doc.document_type === 'bank_statement' && !/partial/.test(doc.filename)
      ? before(date) // a statement is named for the month it covers
      : date;
    if (month !== expected.getMonth() || (token[1] && Number(token[1]) !== date.getDate())) {
      problems.push(`${doc.id} ${doc.filename} vs ${source.document_date ?? source.uploaded_at}`);
    }
  }
  assert.deepEqual(problems, []);
});

atEachToday('activity and chat name the months their dates fall in', () => {
  const activity = new Map(buildActivity().map((event) => [event.id, event]));
  const ready = activity.get('ev-004');
  const summary = activity.get('ev-005');
  assert.equal(ready.title, `${en(before(new Date(ready.at)))} is ready to close`);
  assert.equal(summary.title, `Your ${en(before(new Date(summary.at)))} summary`);
  const quayside = buildDocuments().find((doc) => doc.id === activity.get('ev-003').deep_link.document_id);
  assert.equal(activity.get('ev-003').title, `${quayside.filename} is in your books`);
  const digest = buildCards().find((card) => card.id === 'digest:fyi-july-summary');
  assert.match(digest.title, new RegExp(en(before(new Date(digest.created_at)))));

  const welcome = buildChat().find((message) => message.id === 'msg-welcome');
  assert.match(welcome.text, new RegExp(`^Morning Sam\\. ${en(new Date(welcome.at))} is moving along`));
});

atEachToday('the Finnish copy derives the same months', () => {
  const activity = new Map(localizeSeedActivity(buildActivity(), 'fi').map((event) => [event.id, event]));
  const ready = activity.get('ev-004');
  const summary = activity.get('ev-005');
  assert.equal(ready.title, `${fi(before(new Date(ready.at)))} on valmis suljettavaksi`);
  assert.equal(summary.title, `${fi(before(new Date(summary.at)))}n yhteenvetosi`);
  const quayside = buildDocuments().find((doc) => doc.id === activity.get('ev-003').deep_link.document_id);
  assert.equal(activity.get('ev-003').title, `${quayside.filename} on nyt kirjanpidossasi`);
  const welcome = localizeSeedChat(buildChat(), 'fi').find((message) => message.id === 'msg-welcome');
  assert.match(welcome.text, new RegExp(`^Huomenta, Sam\\. ${fi(new Date(welcome.at))} etenee hyvin`));
});
