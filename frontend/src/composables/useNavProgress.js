import { ref } from 'vue';

const active = ref(false);
const done = ref(false);
let doneTimer = null;

function clearDoneTimer() {
  if (doneTimer != null) {
    clearTimeout(doneTimer);
    doneTimer = null;
  }
}

export function startNavProgress() {
  clearDoneTimer();
  done.value = false;
  active.value = true;
}

export function finishNavProgress() {
  if (!active.value) {
    return;
  }
  done.value = true;
  clearDoneTimer();
  doneTimer = setTimeout(() => {
    active.value = false;
    done.value = false;
    doneTimer = null;
  }, 220);
}

export function useNavProgressState() {
  return { active, done };
}
