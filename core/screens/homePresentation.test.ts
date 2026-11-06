import assert from 'node:assert/strict';
import test from 'node:test';
import type { Doc, QueueCard } from '../api';
import type { QueuedCapture } from '../capture/queue';
import {
  documentContext,
  filenameContext,
  queuedCaptureContext,
  queueCardContext
} from './homePresentation';

const card = (partial: Partial<QueueCard> = {}): QueueCard => ({
  id: 'approval:one',
  entity_id: 'entity-neutral',
  class: 'approval',
  state: 'open',
  title: 'Issue the monthly invoice to Kestrel Studio?',
  created_at: '2026-09-02T09:00:00Z',
  source: { kind: 'outbound_action', id: 'one' },
  blocks_close: false,
  ...partial
});

test('queue cards prefer a compact named context over the explanatory title', () => {
  assert.equal(queueCardContext(card({ counterparty: 'Kestrel Studio' })), 'Kestrel Studio');
  assert.equal(queueCardContext(card({ counterparty: 'Harbour Timber Supplies and Services' })), 'Harbour Timber Supplies and Services');
  assert.equal(queueCardContext(card({ context_label: 'Monthly invoice', counterparty: 'Kestrel Studio' })), 'Monthly invoice');
  assert.equal(queueCardContext(card({ counterparty: 'Meadow Fuel Station' })), 'Meadow Fuel Station');
});

test('queue cards without a party keep one to three meaningful title words', () => {
  assert.equal(
    queueCardContext(card({ counterparty: null, title: 'Reconciled 14 bank lines' })),
    '14 bank lines'
  );
  assert.equal(
    queueCardContext(card({ counterparty: null, title: 'Let Donna chase missing receipts automatically?' })),
    'Chase missing receipts'
  );
  assert.equal(queueCardContext(card({ counterparty: null, title: 'Sent your July summary' })), 'July summary');
});

test('filename context removes the raw file shell and keeps only useful words', () => {
  assert.equal(filenameContext('receipt-timber-today.jpg', 'Document'), 'Timber');
  assert.equal(filenameContext('bank-statement-aug-partial.pdf', 'Statement'), 'Statement');
  assert.equal(filenameContext('statement-password.pdf', 'Document'), 'Document');
  assert.equal(filenameContext('scan-crumpled-receipt.jpg', 'Document'), 'Document');
  assert.equal(filenameContext('bank-statement-jun.pdf', 'Tiliote'), 'Tiliote');
  assert.equal(filenameContext('receipt-glue-supplies.jpg', 'Document'), 'Glue Supplies');
  assert.equal(filenameContext('receipt-cafe-verano-23aug-2.jpg', 'Receipt'), 'Cafe Verano');
  assert.equal(filenameContext('receipt-2026.pdf', 'Receipt'), 'Receipt');
});

test('document and local-capture labels never surface their raw filename', () => {
  const document = {
    id: 'doc-one',
    entity_id: 'entity-neutral',
    filename: 'inv-2041-kestrel-studio.pdf',
    capture_state: 'processing',
    uploaded_at: '2026-09-02T09:00:00Z',
    counterparty: null
  } as Doc;
  const capture = {
    id: 'capture-one',
    entityId: 'entity-neutral',
    file: {
      uri: 'file:///receipt-workshop-tools.jpg',
      filename: 'receipt-workshop-tools.jpg',
      mimeType: 'image/jpeg',
      size: 10,
      source: 'camera'
    },
    capturedAt: '2026-09-02T09:00:00Z',
    answersCardId: null,
    state: 'waiting',
    error: null,
    attempts: 0
  } satisfies QueuedCapture;

  assert.equal(documentContext(document, 'Invoice'), 'Kestrel Studio');
  assert.equal(queuedCaptureContext(capture, 'Upload'), 'Workshop Tools');
});
