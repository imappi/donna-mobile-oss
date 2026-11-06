import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeepLink } from './deepLink';
import { hrefForDeepLink } from './deepLink';

test('a card identity wins over a coarser screen destination', () => {
  const link = { screen: 'status', card_id: 'ask:neutral' } as DeepLink;
  assert.deepEqual(hrefForDeepLink(link), {
    pathname: '/card/[id]',
    params: { id: 'ask:neutral' }
  });
});

test('activity and push destinations share the safe route mapping', () => {
  assert.equal(hrefForDeepLink({ screen: 'capture' } as DeepLink), '/actions');
  assert.equal(hrefForDeepLink({ screen: 'status' } as DeepLink), '/books-status');
  assert.equal(hrefForDeepLink({ screen: 'queue' } as DeepLink), '/actions');
  assert.equal(hrefForDeepLink(undefined), null);
});
