/**
 * Pure display rules for SmartImage — kept separate for unit tests.
 */

export function shouldShowImage(src, errored) {
  return Boolean(src) && !errored;
}

/**
 * Retry once with the original (untransformed) URL after a transform failure.
 */
export function shouldRetryUntransformed(retried, currentSrc, originalSrc) {
  return !retried && Boolean(originalSrc) && currentSrc !== originalSrc;
}
