import test from 'node:test';
import assert from 'node:assert/strict';
import { isInvitationUsable, getInvitationError } from '../utils/staffInvitationUtils.js';

test('accepts unused invitations for activation', () => {
  assert.equal(isInvitationUsable({ status: 'unused' }), true);
  assert.equal(getInvitationError({ status: 'unused' }), null);
});

test('rejects used or revoked invitations', () => {
  assert.equal(isInvitationUsable({ status: 'used' }), false);
  assert.equal(isInvitationUsable({ status: 'revoked' }), false);
  assert.equal(getInvitationError({ status: 'used' }), 'Registration code has already been used');
  assert.equal(getInvitationError({ status: 'revoked' }), 'Registration code has been revoked');
});
