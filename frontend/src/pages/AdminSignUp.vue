<template>
  <div class="admin-auth">
    <header class="admin-auth__intro">
      <div class="admin-auth__brand">
        <SiteBrandMark to="/" variant="header" :aria-label="brandHomeAriaLabel" />
      </div>

      <h1 class="page-title admin-auth__title">{{ title }}</h1>
      <p class="admin-auth__lede">{{ lede }}</p>
    </header>

    <div class="admin-auth__panel">
      <p
        v-if="showStatus"
        class="admin-auth__status"
        aria-live="polite"
      >
        <template v-if="!isReady">Getting things ready…</template>
        <template v-else-if="busy">{{ busyLabel }}</template>
      </p>

      <p v-if="error" class="error admin-auth__error" role="alert">{{ error }}</p>
      <p v-if="notice" class="admin-auth__notice" role="status">{{ notice }}</p>

      <AdminAuthOAuthButtons
        v-if="step === 'sign-up'"
        mode="sign-up"
        :disabled="!isReady || busy"
        redirect-complete="/admin/dashboard"
        @start="onOAuthStart"
        @error="onOAuthError"
      />

      <form
        v-if="step === 'sign-up'"
        class="admin-auth__form"
        @submit.prevent="onSignUp"
      >
        <label class="admin-auth__field">
          <span class="admin-auth__label">Email</span>
          <input
            v-model.trim="email"
            class="admin-auth__input"
            name="email"
            type="email"
            autocomplete="email"
            required
            :disabled="!isReady || busy || ticketLocked"
          >
        </label>

        <label class="admin-auth__field">
          <span class="admin-auth__label">Password</span>
          <input
            v-model="password"
            class="admin-auth__input"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            :disabled="!isReady || busy"
          >
        </label>

        <!-- Clerk bot protection mount point -->
        <div id="clerk-captcha" class="admin-auth__captcha" />

        <button type="submit" class="btn-primary admin-auth__submit" :disabled="!isReady || busy">
          {{ busy ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <form
        v-else-if="step === 'verify'"
        class="admin-auth__form"
        @submit.prevent="onVerify"
      >
        <label class="admin-auth__field">
          <span class="admin-auth__label">Verification code</span>
          <input
            v-model.trim="code"
            class="admin-auth__input"
            name="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            required
            :disabled="busy"
          >
        </label>

        <button type="submit" class="btn-primary admin-auth__submit" :disabled="busy">
          {{ busy ? 'Verifying…' : 'Verify & continue' }}
        </button>

        <div class="admin-auth__actions">
          <button type="button" class="admin-auth__text-btn" :disabled="busy" @click="resendCode">
            Resend code
          </button>
        </div>
      </form>

      <div class="admin-auth__link-row">
        <router-link :to="{ name: 'admin-login' }">Already have an account? Sign in</router-link>
      </div>

      <p class="admin-auth__footer">
        <router-link to="/gallery">← Back to gallery</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth, useSignUp } from '@clerk/vue';
import SiteBrandMark from '../components/brand/SiteBrandMark.vue';
import AdminAuthOAuthButtons from '../components/admin/AdminAuthOAuthButtons.vue';
import { useSiteBrand, ensureSiteBrandLoaded } from '../composables/useSiteBrand.js';
import { clerkErrorMessage } from '../utils/clerkErrors.js';
import '../styles/admin-auth.css';

const route = useRoute();
const router = useRouter();
const { brandHomeAriaLabel } = useSiteBrand();
const { isLoaded: authLoaded, isSignedIn } = useAuth();
const { isLoaded, signUp, setActive } = useSignUp();

const step = ref('sign-up');
const email = ref('');
const password = ref('');
const code = ref('');
const error = ref('');
const notice = ref('');
const busy = ref(false);
const ticket = ref('');
const ticketLocked = ref(false);
const statusDelayElapsed = ref(false);

const isReady = computed(() => Boolean(isLoaded.value && authLoaded.value));
const showStatus = computed(() => busy.value || (!isReady.value && statusDelayElapsed.value));

const title = computed(() =>
  step.value === 'verify' ? 'Verify your email' : 'Create admin account'
);

const lede = computed(() => {
  if (step.value === 'verify') {
    return `Enter the code sent to ${email.value || 'your email'}.`;
  }
  if (ticket.value) {
    return 'Finish setting your password to accept the invitation.';
  }
  return 'Use an invitation when available. Passwords are managed by Clerk.';
});

const busyLabel = computed(() =>
  step.value === 'verify' ? 'Verifying…' : 'Creating account…'
);

async function finishSession(sessionId) {
  await setActive.value({ session: sessionId });
  await router.replace('/admin/dashboard');
}

function onOAuthStart() {
  error.value = '';
  notice.value = '';
  busy.value = true;
}

function onOAuthError(err) {
  busy.value = false;
  error.value = clerkErrorMessage(err, 'Could not continue with that provider.');
}

async function onSignUp() {
  error.value = '';
  notice.value = '';
  if (!isReady.value || !signUp.value) return;

  busy.value = true;
  try {
    if (ticket.value) {
      await signUp.value.create({
        strategy: 'ticket',
        ticket: ticket.value
      });
      if (password.value) {
        await signUp.value.update({ password: password.value });
      }
    } else {
      await signUp.value.create({
        emailAddress: email.value,
        password: password.value
      });
    }

    if (signUp.value.status === 'complete') {
      await finishSession(signUp.value.createdSessionId);
      return;
    }

    await signUp.value.prepareEmailAddressVerification({ strategy: 'email_code' });
    code.value = '';
    step.value = 'verify';
    notice.value = 'Check your email for a verification code.';
  } catch (e) {
    error.value = clerkErrorMessage(
      e,
      'Could not create the account. You may need an invitation.'
    );
  } finally {
    busy.value = false;
  }
}

async function onVerify() {
  error.value = '';
  busy.value = true;
  try {
    const result = await signUp.value.attemptEmailAddressVerification({
      code: code.value
    });

    if (result.status === 'complete') {
      await finishSession(result.createdSessionId);
      return;
    }

    error.value = 'Verification is incomplete. Try again or request a new code.';
  } catch (e) {
    error.value = clerkErrorMessage(e, 'That verification code is not valid.');
  } finally {
    busy.value = false;
  }
}

async function resendCode() {
  error.value = '';
  busy.value = true;
  try {
    await signUp.value.prepareEmailAddressVerification({ strategy: 'email_code' });
    notice.value = 'A new code was sent.';
  } catch (e) {
    error.value = clerkErrorMessage(e, 'Could not resend the code.');
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  ensureSiteBrandLoaded();
  window.setTimeout(() => {
    statusDelayElapsed.value = true;
  }, 400);
  const qTicket =
    (typeof route.query.__clerk_ticket === 'string' && route.query.__clerk_ticket) ||
    (typeof route.query.ticket === 'string' && route.query.ticket) ||
    '';
  if (qTicket) {
    ticket.value = qTicket;
    ticketLocked.value = true;
  }
  if (typeof route.query.email_address === 'string') {
    email.value = route.query.email_address;
  }
});

watch(
  [authLoaded, isSignedIn],
  ([loaded, signedIn]) => {
    if (loaded && signedIn) {
      router.replace('/admin/dashboard');
    }
  },
  { immediate: true }
);
</script>
