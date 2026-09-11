import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRole, hasRoleAccess } from '../utils/roleUtils.js';

test('normalizes public registration roles to supported values', () => {
  assert.equal(normalizeRole('student'), 'student');
  assert.equal(normalizeRole('teacher'), 'teacher');
  assert.equal(normalizeRole('parent'), 'parent');
  assert.equal(normalizeRole('school administrator'), 'principal');
  assert.equal(normalizeRole('super admin'), 'super_admin');
});

test('checks role access across the expected role groups', () => {
  assert.equal(hasRoleAccess({ role: 'student' }, ['student']), true);
  assert.equal(hasRoleAccess({ role: 'teacher' }, ['teacher']), true);
  assert.equal(hasRoleAccess({ role: 'principal' }, ['principal']), true);
  assert.equal(hasRoleAccess({ role: 'staff' }, ['teacher']), true);
  assert.equal(hasRoleAccess({ role: 'parent' }, ['teacher']), false);
});
