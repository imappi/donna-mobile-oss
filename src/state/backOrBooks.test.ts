import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { backOrBooks } from './backOrBooks';

const fakeRouter = (history: boolean) => {
  const calls: string[] = [];
  return {
    calls,
    canGoBack: () => history,
    back: () => { calls.push('back'); },
    replace: (href: string) => { calls.push(`replace ${href}`); }
  };
};

test('Back goes back when there is history, and to Books after a cold deep link', () => {
  const warm = fakeRouter(true);
  backOrBooks(warm);
  assert.deepEqual(warm.calls, ['back']);
  const cold = fakeRouter(false);
  backOrBooks(cold);
  assert.deepEqual(cold.calls, ['replace /actions']);
});

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });

test('no route calls router.back() (or goBack) except through backOrBooks', () => {
  const root = join(import.meta.dirname, '..', '..');
  const offenders = [...sources(join(root, 'src')), ...sources(join(root, 'core'))]
    .filter(path => !path.endsWith(join('src', 'state', 'backOrBooks.ts')))
    .filter(path => /\.(back|goBack)\s*\(/.test(readFileSync(path, 'utf8')))
    .map(path => relative(root, path));
  assert.deepEqual(offenders, [], 'use backOrBooks(router) so a cold deep link can still leave the screen');
});
