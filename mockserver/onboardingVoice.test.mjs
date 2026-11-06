import assert from 'node:assert/strict';
import { access, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import {
  VOICE_CLEANUP_INSTRUCTIONS,
  CLEANUP_PROMPT_VERSION,
  DEFAULT_CODEX_CLEANUP_MODEL,
  VoiceOnboardingError,
  confirmOnboardingProfile,
  createCodexTranscriptCleanup,
  createLocalWhisperVoiceDraft,
  createOpenAIVoiceDraft,
  createOpenAITranscriptCleanup,
  extractLocalPreviewProfile,
  prepareVoiceDraft,
  previewVoiceDraft,
  resolveOnboardingAudioMimeType
} from './onboardingVoice.mjs';

const principal = { id: 'owner-neutral', display_name: 'New owner', email: null };
const entity = { id: 'entity-neutral', display_name: 'My business', currency: 'EUR', country: 'FI' };
const extracted = {
  cleaned_transcript: 'Neutral transcript',
  owner_name: { value: 'Alix', state: 'uncertain' },
  business_name: { value: 'Blue Fern Repair', state: 'uncertain' },
  description: { value: 'Bicycle repairs', state: 'confident' },
  operating_area: { value: 'Southern Finland', state: 'confident' },
  people_involved: { value: 'Owner', state: 'confident' },
  payment_methods: { value: 'Card', state: 'confident' },
  spending_categories: { value: 'Parts', state: 'confident' }
};

test('transcription and extraction return evidence without writing profile fields', async () => {
  const principalBefore = structuredClone(principal);
  const entityBefore = structuredClone(entity);
  const draft = await prepareVoiceDraft({
    transcribe: async () => 'Neutral transcript',
    extract: async () => extracted
  });
  assert.equal(draft.processing_mode, 'live_transcription');
  assert.equal(draft.cleanup_mode, 'model_cleanup');
  assert.equal(draft.raw_transcript, 'Neutral transcript');
  assert.equal(draft.transcript, extracted.description.value);
  assert.equal(draft.business_name.requires_exact_confirmation, true);
  assert.deepEqual(principal, principalBefore);
  assert.deepEqual(entity, entityBefore);
});

test('the explicit sample fixture is clearly marked as sample data', () => {
  assert.equal(previewVoiceDraft().processing_mode, 'sample_preview');
  assert.equal(previewVoiceDraft().cleanup_mode, 'sample_preview');
  assert.equal(previewVoiceDraft().raw_transcript, '');
});

test('local preview extraction uses only facts stated in the transcript', () => {
  const result = extractLocalPreviewProfile(
    'My name is Alex. My business is called Blue Fern Repairs. I fix bicycles. ' +
      'I am based in Helsinki. I work alone. Customers pay me by card and bank transfer. ' +
      'I usually spend money on parts and tools.'
  );
  assert.equal(result.owner_name.value, 'Alex');
  assert.equal(result.business_name.value, 'Blue Fern Repairs');
  assert.equal(result.operating_area.value, 'Helsinki');
  assert.equal(result.people_involved.value, 'Owner only');
  assert.equal(result.payment_methods.value, 'card and bank transfer');
  assert.equal(result.spending_categories.value, 'parts and tools');
  assert.equal(result.business_name.state, 'uncertain');
});

test('local preview extraction recognizes explicitly stated Finnish business facts', () => {
  const result = extractLocalPreviewProfile(
    'Nimeni on Aino. Yritykseni nimi on Aurinko Pyörät, Korjaan polkupyöriä, ' +
      'Toimin Helsingissä, Työskentelen yksin, Asiakkaat maksavat kortilla ja pankkisiirrolla, ' +
      'Rahaa kuluu varaosiin ja työkaluihin.'
  );
  assert.equal(result.owner_name.value, 'Aino');
  assert.equal(result.business_name.value, 'Aurinko Pyörät');
  assert.equal(result.description.value, 'Korjaan polkupyöriä');
  assert.equal(result.operating_area.value, 'Helsingissä');
  assert.equal(result.people_involved.value, 'Owner only');
  assert.equal(result.payment_methods.value, 'kortilla ja pankkisiirrolla');
  assert.equal(result.spending_categories.value, 'varaosiin ja työkaluihin');
});

test('local Whisper drafts use the real transcript and remove their temporary files', async () => {
  let temporaryDirectory = '';
  let whisperArguments = [];
  const draft = await createLocalWhisperVoiceDraft({
    audio: Buffer.from('completed-audio'),
    filename: 'introduction.m4a',
    whisperCli: '/test/whisper',
    allowRulesPreview: true,
    execImpl: async (_command, args) => {
      whisperArguments = args;
      temporaryDirectory = args[args.indexOf('--output_dir') + 1];
      await writeFile(
        join(temporaryDirectory, 'recording.txt'),
        'My business is called North Star Studio. I am based in Turku.'
      );
    }
  });
  assert.equal(draft.processing_mode, 'local_transcription');
  assert.equal(draft.cleanup_mode, 'rules_cleanup');
  assert.match(draft.raw_transcript, /North Star Studio/);
  assert.equal(draft.transcript, '');
  assert.equal(draft.business_name.value, 'North Star Studio');
  assert.equal(whisperArguments[whisperArguments.indexOf('--model') + 1], 'small');
  await assert.rejects(access(temporaryDirectory));
});

test('local Whisper can use a strong cleanup runner while retaining the untouched transcript', async () => {
  const rawTranscript = 'My bussines is call North Star Studi and I repar bikes.';
  const cleanedTranscript = 'My business is called North Star Studio, and I repair bicycles.';
  const draft = await createLocalWhisperVoiceDraft({
    audio: Buffer.from('completed-audio'),
    filename: 'introduction.m4a',
    whisperCli: '/test/whisper',
    execImpl: async (_command, args) => {
      const temporaryDirectory = args[args.indexOf('--output_dir') + 1];
      await writeFile(join(temporaryDirectory, 'recording.txt'), rawTranscript);
    },
    cleanup: async (transcript) => ({
      ...extracted,
      cleaned_transcript: cleanedTranscript,
      business_name: { value: 'North Star Studio', state: 'uncertain' },
      description: { value: 'Bicycle repairs', state: 'confident' }
    })
  });

  assert.equal(draft.cleanup_mode, 'model_cleanup');
  assert.equal(draft.raw_transcript, rawTranscript);
  assert.equal(draft.transcript, 'Bicycle repairs');
  assert.equal(draft.business_name.value, 'North Star Studio');
});

test('the Codex development runner receives only delimited transcript text in an isolated directory', async () => {
  let call;
  let temporaryDirectory;
  const result = await createCodexTranscriptCleanup({
    transcript: 'Synthetic transcript data',
    codexCli: '/test/codex',
    runImpl: async (input) => {
      call = input;
      temporaryDirectory = dirname(input.outputPath);
      await writeFile(input.outputPath, JSON.stringify(extracted));
    }
  });

  assert.equal(result.cleaned_transcript, 'Neutral transcript');
  assert.equal(call.codexCli, '/test/codex');
  assert.ok(call.args.includes('--ephemeral'));
  assert.ok(call.args.includes('read-only'));
  assert.equal(call.args[call.args.indexOf('--model') + 1], process.env.CODEX_CLEANUP_MODEL || DEFAULT_CODEX_CLEANUP_MODEL);
  assert.match(call.input, /<transcript-data>\nSynthetic transcript data\n<\/transcript-data>/);
  await assert.rejects(access(temporaryDirectory));
});

test('failed language cleanup never returns a successful raw-transcript draft', async () => {
  let temporaryDirectory;
  await assert.rejects(createLocalWhisperVoiceDraft({
    audio: Buffer.from('completed-audio'),
    filename: 'introduction.m4a',
    execImpl: async (_command, args) => {
      temporaryDirectory = args[args.indexOf('--output_dir') + 1];
      await writeFile(join(temporaryDirectory, 'recording.txt'), 'Unpolished speech evidence.');
    },
    cleanup: async () => { throw new Error('model unavailable'); }
  }), (error) => error.code === 'VOICE_EXTRACTION_FAILED');
  await assert.rejects(access(temporaryDirectory));
});

test('cleanup logs the explicit model and prompt revision without transcript content', async () => {
  const events = [];
  await createCodexTranscriptCleanup({
    transcript: 'private-transcript-marker',
    model: 'test-model-override',
    logImpl: (event) => events.push(event),
    runImpl: async ({ args, outputPath }) => {
      assert.equal(args[args.indexOf('--model') + 1], 'test-model-override');
      await writeFile(outputPath, JSON.stringify(extracted));
      return { stderr: 'model: test-model-resolved\nreasoning effort: high\n', stdout: '' };
    }
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].requested_model, 'test-model-override');
  assert.equal(events[0].resolved_model, 'test-model-resolved');
  assert.equal(events[0].prompt_version, CLEANUP_PROMPT_VERSION);
  assert.equal(events[0].reasoning_effort, 'high');
  assert.equal(events[0].outcome, 'completed');
  assert.ok(events[0].duration_ms >= 0);
  assert.equal(JSON.stringify(events).includes('private-transcript-marker'), false);
});

test('failed cleanup logs only safe metadata and still deletes temporary files', async () => {
  const events = [];
  let temporaryDirectory;
  await assert.rejects(createCodexTranscriptCleanup({
    transcript: 'private-transcript-marker',
    logImpl: (event) => events.push(event),
    runImpl: async ({ outputPath }) => {
      temporaryDirectory = dirname(outputPath);
      throw new Error('private-transcript-marker in provider diagnostic');
    }
  }));
  assert.equal(events[0].outcome, 'failed');
  assert.equal(events[0].resolved_model, null);
  assert.equal(JSON.stringify(events).includes('private-transcript-marker'), false);
  await assert.rejects(access(temporaryDirectory));
});

test('API cleanup records the response model without recording its input or key', async () => {
  const events = [];
  await createOpenAITranscriptCleanup({
    transcript: 'private-transcript-marker', apiKey: 'private-key-marker',
    logImpl: (event) => events.push(event),
    fetchImpl: async () => new Response(JSON.stringify({
      model: 'test-response-model', output_text: JSON.stringify(extracted)
    }))
  });
  assert.equal(events[0].provider, 'openai');
  assert.equal(events[0].requested_model, 'gpt-5.4');
  assert.equal(events[0].resolved_model, 'test-response-model');
  assert.equal(events[0].prompt_version, CLEANUP_PROMPT_VERSION);
  assert.doesNotMatch(JSON.stringify(events), /private-transcript-marker|private-key-marker/);
});

test('a broken diagnostic sink cannot prevent a valid draft or temporary-file cleanup', async () => {
  let temporaryDirectory;
  const result = await createCodexTranscriptCleanup({
    transcript: 'Synthetic evidence',
    logImpl: () => { throw new Error('diagnostic sink unavailable'); },
    runImpl: async ({ outputPath }) => {
      temporaryDirectory = dirname(outputPath);
      await writeFile(outputPath, JSON.stringify(extracted));
    }
  });
  assert.equal(result.cleaned_transcript, extracted.cleaned_transcript);
  await assert.rejects(access(temporaryDirectory));
});

test('recognition confidence and exact-name confirmation remain independent', async () => {
  const draft = await prepareVoiceDraft({
    transcribe: async () => 'Synthetic name evidence',
    extract: async () => ({ ...extracted,
      owner_name: { value: 'Antti Laine', state: 'confident' },
      business_name: { value: 'Kuusiputkito Oy', state: 'uncertain' }
    })
  });
  assert.equal(draft.owner_name.state, 'confident');
  assert.equal(draft.business_name.state, 'uncertain');
  assert.equal(draft.owner_name.requires_exact_confirmation, true);
  assert.equal(draft.business_name.requires_exact_confirmation, true);
});

test('missing language cleanup is a retryable failure rather than a sample or raw success', async () => {
  await assert.rejects(createLocalWhisperVoiceDraft({
    audio: Buffer.from('completed-audio'),
    filename: 'introduction.m4a',
    execImpl: async (_command, args) => {
      await writeFile(join(args[args.indexOf('--output_dir') + 1], 'recording.txt'), 'Real speech.');
    }
  }), (error) => error.code === 'VOICE_EXTRACTION_FAILED');
  await assert.rejects(createOpenAIVoiceDraft({ audio: Buffer.from('audio') }),
    (error) => error.code === 'VOICE_TRANSCRIPTION_FAILED');
});

test('an exact correction is persisted only by explicit confirmation', () => {
  const result = confirmOnboardingProfile({
    principal,
    entity,
    input: {
      owner_name: 'Alex',
      business_name: 'Blue Fern Repairs',
      description: 'Bicycle repairs',
      operating_area: 'Southern Finland',
      people_involved: ['Owner'],
      payment_methods: ['Card'],
      spending_categories: ['Parts'],
      confirmed_exact_fields: ['owner_name', 'business_name']
    }
  });
  assert.equal(entity.display_name, 'My business');
  assert.equal(result.entity.display_name, 'Blue Fern Repairs');
  assert.equal(result.principal.display_name, 'Alex');
});

test('malformed extraction and missing exact confirmation fail closed', async () => {
  await assert.rejects(
    prepareVoiceDraft({
      transcribe: async () => 'Neutral transcript',
      extract: async () => ({ owner_name: { value: 'Alex' } })
    }),
    (cause) => cause instanceof VoiceOnboardingError && cause.code === 'VOICE_EXTRACTION_INVALID'
  );
  assert.throws(
    () =>
      confirmOnboardingProfile({
        principal,
        entity,
        input: { owner_name: 'Alex', business_name: 'Blue Fern Repairs', confirmed_exact_fields: [] }
      }),
    (cause) => cause instanceof VoiceOnboardingError && cause.code === 'PROFILE_EXACT_CONFIRMATION_REQUIRED'
  );
});

test('transcription and extraction failures keep distinct safe error codes', async () => {
  await assert.rejects(
    prepareVoiceDraft({
      transcribe: async () => {
        throw new Error('unavailable');
      },
      extract: async () => extracted
    }),
    (cause) => cause instanceof VoiceOnboardingError && cause.code === 'VOICE_TRANSCRIPTION_FAILED'
  );
  await assert.rejects(
    prepareVoiceDraft({
      transcribe: async () => 'Neutral transcript',
      extract: async () => {
        throw new Error('unavailable');
      }
    }),
    (cause) => cause instanceof VoiceOnboardingError && cause.code === 'VOICE_EXTRACTION_FAILED'
  );
});

test('OpenAI cleanup receives transcript text, not the raw recording', async () => {
  const calls = [];
  const draft = await createOpenAIVoiceDraft({
    audio: Buffer.from('raw-audio-marker'),
    filename: 'neutral.m4a',
    mimeType: 'audio/mp4',
    apiKey: 'test-key',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if (String(url).endsWith('/audio/transcriptions')) {
        return new Response(JSON.stringify({ text: 'Neutral transcript' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ output_text: JSON.stringify(extracted) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  const extractionBody = JSON.parse(calls[1].init.body);
  assert.equal(calls.length, 2);
  assert.equal(extractionBody.input, 'Neutral transcript');
  assert.equal(extractionBody.model, 'gpt-5.4');
  assert.equal(extractionBody.store, false);
  assert.equal(extractionBody.instructions, VOICE_CLEANUP_INSTRUCTIONS);
  assert.equal(extractionBody.text.format.schema.required.includes('cleaned_transcript'), false);
  for (const field of ['profession', 'billing_basis', 'experience', 'business_address']) {
    assert.ok(extractionBody.text.format.schema.required.includes(field));
  }
  assert.equal(JSON.stringify(extractionBody).includes('raw-audio-marker'), false);
  assert.equal(draft.raw_transcript, 'Neutral transcript');
  assert.equal(draft.transcript, extracted.description.value);
  assert.equal(draft.cleanup_mode, 'model_cleanup');
});

test('structured facts supersede a stale narrative while preserving raw evidence', async () => {
  const rawTranscript =
    'Moi mina olen Aino Esimerkinen putkiasenta ja yhtio Aurora Putkit Oy. Minun duunia korjaamaan asiakkaiden putkijut.';
  const cleanedTranscript =
    'Moi, minä olen Aino Esimerkki, putkiasentaja Aurora Putket Oy:stä. Työni on asiakkaiden putkien korjaamista.';
  const cleanedExtraction = {
    ...extracted,
    cleaned_transcript: cleanedTranscript,
    owner_name: { value: 'Aino Esimerkki', state: 'uncertain' },
    business_name: { value: 'Aurora Putket Oy', state: 'uncertain' },
    description: { value: 'Asiakkaiden putkien korjaaminen', state: 'confident' },
    operating_area: { value: '', state: 'missing' },
    people_involved: { value: '', state: 'missing' },
    payment_methods: { value: '', state: 'missing' },
    spending_categories: { value: '', state: 'missing' }
  };

  const draft = await createOpenAIVoiceDraft({
    audio: Buffer.from('neutral-audio'),
    filename: 'introduction.m4a',
    mimeType: 'audio/mp4',
    apiKey: 'test-key',
    fetchImpl: async (url) =>
      String(url).endsWith('/audio/transcriptions')
        ? new Response(JSON.stringify({ text: rawTranscript }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        : new Response(JSON.stringify({ output_text: JSON.stringify(cleanedExtraction) }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
  });

  assert.equal(draft.raw_transcript, rawTranscript);
  assert.equal(draft.transcript, 'Asiakkaiden putkien korjaaminen');
  assert.equal(draft.business_name.value, 'Aurora Putket Oy');
  assert.equal(draft.business_name.state, 'uncertain');
});

test('missing and blank facts normalize to empty without fabricating a fuller card', async () => {
  const draft = await prepareVoiceDraft({ transcribe: async () => 'Synthetic evidence',
    extract: async () => ({ ...extracted, profession: { value: '   ', state: 'confident' },
      billing_basis: { value: 'Do not show this', state: 'missing' },
      experience: { value: ' Pari vuotta ', state: 'uncertain' } }) });
  assert.equal(draft.profession.state, 'missing');
  assert.equal(draft.profession.value, '');
  assert.equal(draft.billing_basis.value, '');
  assert.equal(draft.business_address.state, 'missing');
  assert.equal(draft.experience.value, 'Pari vuotta');
  assert.equal(draft.experience.state, 'uncertain');
});

test('generic native Blob transport is accepted only for a supported recording extension', () => {
  assert.equal(resolveOnboardingAudioMimeType('introduction.m4a', 'application/octet-stream'), 'audio/mp4');
  assert.equal(resolveOnboardingAudioMimeType('introduction.webm', 'application/octet-stream'), 'audio/webm');
  assert.equal(resolveOnboardingAudioMimeType('introduction.exe', 'application/octet-stream'), null);
  assert.equal(resolveOnboardingAudioMimeType('introduction.m4a', 'text/plain'), null);
});
