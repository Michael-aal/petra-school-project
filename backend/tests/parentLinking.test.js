import test from 'node:test';
import assert from 'node:assert/strict';
import { findStudentsForParentEmail } from '../utils/parentLinking.js';

test('findStudentsForParentEmail matches students by normalized guardian email', () => {
  const students = [
    { id: 'student-1', parentEmail: 'Parent@Example.com' },
    { id: 'student-2', parentEmail: 'parent@example.com' },
    { id: 'student-3', parentEmail: 'other@example.com' },
  ];

  const matches = findStudentsForParentEmail(students, 'parent@example.com');

  assert.deepEqual(matches.map((student) => student.id), ['student-1', 'student-2']);
});

test('findStudentsForParentEmail ignores empty or non-matching emails', () => {
  const students = [
    { id: 'student-1', parentEmail: '' },
    { id: 'student-2', parentEmail: 'another@example.com' },
  ];

  const matches = findStudentsForParentEmail(students, 'parent@example.com');

  assert.deepEqual(matches, []);
});
