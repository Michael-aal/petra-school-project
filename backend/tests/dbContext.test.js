import test from 'node:test';
import assert from 'node:assert/strict';
import { runWithSchoolContext, runWithoutSchoolContext, getCurrentSchoolId } from '../config/db.js';

test('runWithoutSchoolContext temporarily bypasses school tenant context', () => {
  runWithSchoolContext(99, () => {
    assert.equal(getCurrentSchoolId(), 99);

    runWithoutSchoolContext(() => {
      assert.equal(getCurrentSchoolId(), null);
    });

    assert.equal(getCurrentSchoolId(), 99);
  });
});
