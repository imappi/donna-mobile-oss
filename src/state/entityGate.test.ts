import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Entity, Principal } from '@core/api';
import { entityGate } from './entityGate';

const principal = { id: 'principal-1' } as Principal;
const books = { id: 'entity-1' } as Entity;

test('an entity route waits while the session restores, then unlocks or signs in', () => {
  assert.equal(entityGate({ phase: 'loading' }), 'wait');
  assert.equal(entityGate({ phase: 'locked' }), '/unlock');
  assert.equal(entityGate({ phase: 'signedOut' }), '/onboarding/phone');
});

test('an entity route opens only when the active entity is one of the principal’s books', () => {
  assert.equal(entityGate({ phase: 'signedIn', principal, entities: [books], entityId: 'entity-1' }), 'open');
  assert.equal(entityGate({ phase: 'signedIn', principal, entities: [books], entityId: 'entity-2' }), 'noEntity');
  assert.equal(entityGate({ phase: 'signedIn', principal, entities: [], entityId: '' }), 'noEntity');
});

// A cold deep link mounts the leaf route directly: any route that reads the
// active entity (useEntityId, the entity hooks, or a shared route wrapper)
// must render through the gate itself or sit under a layout that does.
const appDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const stateDir = dirname(fileURLToPath(import.meta.url));
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.tsx') ? [path] : [];
  });
const guarded = (source: string) => /<EntityRoute\b|entityGate\(/.test(source);
const needsEntity = /useEntityId|from '@\/state\/hooks'/;

test('every route that needs the active entity is behind the entity gate', () => {
  const unguarded: string[] = [];
  for (const file of walk(appDir)) {
    const route = relative(appDir, file);
    let source = readFileSync(file, 'utf8');
    for (const [, wrapper] of source.matchAll(/from '@\/state\/(\w+Route)'/g))
      source += readFileSync(join(stateDir, wrapper + '.tsx'), 'utf8');
    if (!needsEntity.test(source) || guarded(source)) continue;
    const layout = join(dirname(file), '_layout.tsx');
    if (!route.endsWith('_layout.tsx') && existsSync(layout) && guarded(readFileSync(layout, 'utf8'))) continue;
    unguarded.push(route);
  }
  assert.deepEqual(unguarded, []);
});
