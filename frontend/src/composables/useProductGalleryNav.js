const SWIPE_THRESHOLD_PX = 48;

export function isHorizontalSwipe(deltaX, deltaY, threshold = SWIPE_THRESHOLD_PX) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < threshold) {
    return false;
  }

  return absX > absY;
}

export function useProductGalleryNavSwipe({ canSwipe, onPrev, onNext }) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;

  function resetTouch() {
    touchActive = false;
    touchStartX = 0;
    touchStartY = 0;
  }

  function onTouchStart(event) {
    if (!canSwipe()) {
      return;
    }
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    touchActive = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function onTouchEnd(event) {
    if (!touchActive || !canSwipe()) {
      resetTouch();
      return;
    }

    const touch = event.changedTouches[0];
    resetTouch();
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (!isHorizontalSwipe(deltaX, deltaY)) {
      return;
    }

    if (deltaX > 0) {
      onPrev();
      return;
    }
    onNext();
  }

  function onTouchCancel() {
    resetTouch();
  }

  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel
  };
}

export function useProductGalleryNavKeyboard({ canNavigate, onPrev, onNext }) {
  function onKeydown(event) {
    if (!canNavigate()) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onPrev();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNext();
    }
  }

  return { onKeydown };
}
