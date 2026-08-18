/**
 * @jest-environment node
 */

const {
  shouldShowImage,
  shouldRetryUntransformed
} = require('../frontend/src/utils/smartImagePolicy.js');

describe('smartImagePolicy', () => {
  it('hides failed images cleanly (no broken-icon render)', () => {
    expect(shouldShowImage('https://example.com/a.jpg', false)).toBe(true);
    expect(shouldShowImage('https://example.com/a.jpg', true)).toBe(false);
    expect(shouldShowImage('', false)).toBe(false);
    expect(shouldShowImage(null, false)).toBe(false);
  });

  it('retries once with the original URL after a transform failure', () => {
    const original = 'https://ik.imagekit.io/demo/a.jpg';
    const transformed = 'https://ik.imagekit.io/demo/tr:w-960/a.jpg';
    expect(shouldRetryUntransformed(false, transformed, original)).toBe(true);
    expect(shouldRetryUntransformed(true, transformed, original)).toBe(false);
    expect(shouldRetryUntransformed(false, original, original)).toBe(false);
  });
});
