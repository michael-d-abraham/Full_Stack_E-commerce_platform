const SWIPE_THRESHOLD_PX = 48;

export function isHorizontalSwipe(deltaX, deltaY, threshold = SWIPE_THRESHOLD_PX) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < threshold) {
    return false;
  }

  return absX > absY;
}
