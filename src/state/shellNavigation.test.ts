import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAPTURE_RETURN_HREF,
  destinationForOwnerMenuAction,
  destinationForLauncherAction,
  LAUNCHER_ACTIONS,
  ownerMenuActions,
  OWNER_MENU_ACTIONS
} from './shellNavigation';

test('Donna keeps the approved four-action order and only explicit destination actions navigate', () => {
  assert.deepEqual(
    LAUNCHER_ACTIONS.map((action) => action.key),
    ['chat', 'snap', 'file', 'mileage']
  );
  assert.equal(destinationForLauncherAction('chat'), '/chat');
  assert.equal(destinationForLauncherAction('mileage'), '/mileage');
  assert.equal(destinationForLauncherAction('snap'), null);
  assert.equal(destinationForLauncherAction('file'), null);
});

test('completed and queued captures return to the unified Books compatibility route', () => {
  assert.equal(CAPTURE_RETURN_HREF, '/actions');
});

test('the owner menu exposes app and account destinations and keeps sign-out local', () => {
  assert.deepEqual(
    OWNER_MENU_ACTIONS.map((action) => action.key),
    ['status', 'activity', 'entities', 'account', 'signOut']
  );
  assert.deepEqual(
    ownerMenuActions(false).map((action) => action.key),
    ['status', 'activity', 'account', 'signOut']
  );
  assert.deepEqual(
    ownerMenuActions(true).map((action) => action.key),
    ['status', 'activity', 'entities', 'account', 'signOut']
  );
  assert.equal(destinationForOwnerMenuAction('status'), '/books-status');
  assert.equal(destinationForOwnerMenuAction('activity'), '/activity');
  assert.equal(destinationForOwnerMenuAction('entities'), '/entities');
  assert.equal(destinationForOwnerMenuAction('account'), '/account');
  assert.equal(destinationForOwnerMenuAction('signOut'), null);
});
