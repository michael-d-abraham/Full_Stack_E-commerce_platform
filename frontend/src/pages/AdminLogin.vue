<template>
  <div class="admin-auth">
    <header class="admin-auth__intro">
      <div class="admin-auth__brand">
        <SiteBrandMark to="/" variant="header" :aria-label="brandHomeAriaLabel" />
      </div>

      <h1 class="page-title admin-auth__title">{{ title }}</h1>
      <p v-if="lede" class="admin-auth__lede">{{ lede }}</p>
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

      <p v-if="notice" class="admin-auth__notice" role="status">{{ notice }}</p>
      <p v-if="error" class="error admin-auth__error" role="alert">{{ error }}</p>

      <AdminClerkSetupNotice v-if="!clerkEnabled" />

      <!-- Sign in -->
      <template v-else-if="step === 'sign-in'">
        <AdminAuthOAuthButtons
          mode="sign-in"
          :disabled="!isReady || busy"
          :redirect-complete="redirectTarget"
          @start="onOAuthStart"
          @error="onOAuthError"
        />

        <form
          class="admin-auth__form"
          @submit.prevent="onSignIn"
        >
          <label class="admin-auth__field">
            <span class="admin-auth__label">Email</span>
            <input
              v-model.trim="email"
              class="admin-auth__input"
              name="email"
              type="email"
              autocomplete="username"
              required
              :disabled="!isReady || busy"
            >
          </label>

          <label class="admin-auth__field">
            <span class="admin-auth__label">Password</span>
            <input
              v-model="password"
              class="admin-auth__input"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              :disabled="!isReady || busy"
            >
          </label>

          <div class="admin-auth__link-row">
            <button type="button" class="admin-auth__text-btn" :disabled="busy" @click="goForgot">
              Forgot password?
            </button>
            <router-link :to="{ name: 'admin-sign-up' }">Create account</router-link>
          </div>

          <button type="submit" class="btn-primary admin-auth__submit" :disabled="!isReady || busy">
            {{ busy ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </template>

    <!-- Forgot: request code -->
    <form
      v-else-if="step === 'forgot-request'"
      class="admin-auth__form"
      @submit.prevent="onForgotRequest"
    >
      <label class="admin-auth__field">
        <span class="admin-auth__label">Email</span>
        <input
          v-model.trim="email"
          class="admin-auth__input"
          name="email"
          type="email"
          autocomplete="username"
          required
          :disabled="busy"
        >
      </label>

      <button type="submit" class="btn-primary admin-auth__submit" :disabled="busy">
        {{ busy ? 'Sending…' : 'Send reset code' }}
      </button>

      <div class="admin-auth__actions">
        <button type="button" class="admin-auth__text-btn" :disabled="busy" @click="step = 'sign-in'">
          ← Back to sign in
        </button>
      </div>
    </form>

    <!-- Forgot: verify code -->
    <form
      v-else-if="step === 'forgot-verify'"
      class="admin-auth__form"
      @submit.prevent="onForgotVerify"
    >
      <p class="admin-auth__lede">Enter the code we sent to {{ email }}.</p>
      <label class="admin-auth__field">
        <span class="admin-auth__label">Reset code</span>
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
        {{ busy ? 'Verifying…' : 'Verify code' }}
      </button>

      <div class="admin-auth__actions">
        <button type="button" class="admin-auth__text-btn" :disabled="busy" @click="onForgotRequest">
          Resend code
        </button>
        <button type="button" class="admin-auth__text-btn" :disabled="busy" @click="resetForgot">
          ← Back to sign in
        </button>
      </div>
    </form>

    <!-- Forgot: new password -->
    <form
      v-else-if="step === 'forgot-password'"
      class="admin-auth__form"
      @submit.prevent="onForgotPassword"
    >
      <label class="admin-auth__field">
        <span class="admin-auth__label">New password</span>
        <input
          v-model="password"
          class="admin-auth__input"
          name="password"
          type="password"
          autocomplete="new-password"
          required
          :disabled="busy"
        >
      </label>

      <button type="submit" class="btn-primary admin-auth__submit" :disabled="busy">
        {{ busy ? 'Saving…' : 'Save password & sign in' }}
      </button>
    </form>

    <!-- Client trust / email MFA -->
    <form
      v-else-if="step === 'verify-email'"
      class="admin-auth__form"
      @submit.prevent="onVerifyEmail"
    >
      <p class="admin-auth__lede">Enter the verification code sent to your email.</p>
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
        {{ busy ? 'Verifying…' : 'Verify' }}
      </button>

      <div class="admin-auth__actions">
        <button type="button" class="admin-auth__text-btn" :disabled="busy" @click="resendTrustCode">
          Resend code
        </button>
        <button type="button" class="admin-auth__text-btn" :disabled="busy" @click="resetToSignIn">
          ← Back to sign in
        </button>
      </div>
    </form>

    <p class="admin-auth__footer">
      <router-link to="/gallery">← Back to gallery</router-link>
    </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SiteBrandMark from '../components/brand/SiteBrandMark.vue';
import AdminAuthOAuthButtons from '../components/admin/AdminAuthOAuthButtons.vue';
import AdminClerkSetupNotice from '../components/admin/AdminClerkSetupNotice.vue';
import { useSiteBrand, ensureSiteBrandLoaded } from '../composables/useSiteBrand.js';
import { clerkIsEnabled, useAuthWhenEnabled, useSignInWhenEnabled } from '../composables/useClerkWhenEnabled.js';
import { clerkErrorMessage } from '../utils/clerkErrors.js';
import '../styles/admin-auth.css';

const route = useRoute();
const router = useRouter();
const clerkEnabled = clerkIsEnabled();
const { brandHomeAriaLabel } = useSiteBrand();
const { isLoaded: authLoaded, isSignedIn } = useAuthWhenEnabled();
const { isLoaded, signIn, setActive } = useSignInWhenEnabled();

const step = ref('sign-in');
const email = ref('');
const password = ref('');
const code = ref('');
const error = ref('');
const notice = ref('');
const busy = ref(false);
const statusDelayElapsed = ref(false);

const isReady = computed(() => Boolean(isLoaded.value && authLoaded.value));
const showStatus = computed(() => busy.value || (!isReady.value && statusDelayElapsed.value));

const title = computed(() => {
  if (step.value === 'forgot-request' || step.value === 'forgot-verify' || step.value === 'forgot-password') {
    return 'Reset password';
  }
  if (step.value === 'verify-email') {
    return 'Verify sign in';
  }
  return 'Admin sign in';
});

const lede = computed(() => {
  if (step.value === 'forgot-request') {
    return 'We’ll email you a one-time code to reset your password.';
  }
  if (step.value === 'forgot-password') {
    return 'Choose a new password for your admin account.';
  }
  if (step.value === 'sign-in') {
    return 'Sign in to manage the gallery.';
  }
  return '';
});

const busyLabel = computed(() => {
  if (step.value === 'forgot-request') return 'Sending reset code…';
  if (step.value === 'forgot-verify' || step.value === 'verify-email') return 'Verifying…';
  if (step.value === 'forgot-password') return 'Updating password…';
  return 'Signing in…';
});

const redirectTarget = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
  if (
    redirect.startsWith('/admin') &&
    !redirect.startsWith('/admin/login') &&
    !redirect.startsWith('/admin/sign-up')
  ) {
    return redirect;
  }
  return '/admin/dashboard';
});

async function finishSession(sessionId) {
  await setActive.value({ session: sessionId });
  await router.replace(redirectTarget.value);
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

function goForgot() {
  error.value = '';
  code.value = '';
  password.value = '';
  step.value = 'forgot-request';
}

function resetForgot() {
  error.value = '';
  code.value = '';
  password.value = '';
  step.value = 'sign-in';
}

function resetToSignIn() {
  error.value = '';
  code.value = '';
  password.value = '';
  step.value = 'sign-in';
}

async function onSignIn() {
  error.value = '';
  if (!isReady.value || !signIn.value) return;

  busy.value = true;
  try {
    const result = await signIn.value.create({
      identifier: email.value,
      password: password.value
    });

    if (result.status === 'complete') {
      await finishSession(result.createdSessionId);
      return;
    }

    if (result.status === 'needs_client_trust' || result.status === 'needs_second_factor') {
      const factors = result.supportedSecondFactors || [];
      const emailFactor = factors.find((f) => f.strategy === 'email_code');
      if (emailFactor) {
        await signIn.value.prepareSecondFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId
        });
        code.value = '';
        step.value = 'verify-email';
        return;
      }
    }

    error.value = 'Additional verification is required. Check your email or try again.';
  } catch (e) {
    error.value = clerkErrorMessage(e, 'That email or password is not correct.');
  } finally {
    busy.value = false;
  }
}

async function onVerifyEmail() {
  error.value = '';
  busy.value = true;
  try {
    const result = await signIn.value.attemptSecondFactor({
      strategy: 'email_code',
      code: code.value
    });
    if (result.status === 'complete') {
      await finishSession(result.createdSessionId);
      return;
    }
    error.value = 'Could not verify that code. Try again.';
  } catch (e) {
    error.value = clerkErrorMessage(e, 'That code is not valid.');
  } finally {
    busy.value = false;
  }
}

async function resendTrustCode() {
  error.value = '';
  busy.value = true;
  try {
    const factors = signIn.value?.supportedSecondFactors || [];
    const emailFactor = factors.find((f) => f.strategy === 'email_code');
    if (!emailFactor) {
      error.value = 'Could not resend a code right now.';
      return;
    }
    await signIn.value.prepareSecondFactor({
      strategy: 'email_code',
      emailAddressId: emailFactor.emailAddressId
    });
    notice.value = 'A new code was sent.';
  } catch (e) {
    error.value = clerkErrorMessage(e, 'Could not resend the code.');
  } finally {
    busy.value = false;
  }
}

async function onForgotRequest() {
  error.value = '';
  notice.value = '';
  if (!email.value.trim()) {
    error.value = 'Enter the email for your admin account.';
    return;
  }

  busy.value = true;
  try {
    await signIn.value.create({
      strategy: 'reset_password_email_code',
      identifier: email.value.trim()
    });

    const factor = (signIn.value.supportedFirstFactors || []).find(
      (f) => f.strategy === 'reset_password_email_code'
    );
    if (factor?.emailAddressId) {
      await signIn.value.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: factor.emailAddressId
      });
    }

    code.value = '';
    step.value = 'forgot-verify';
    notice.value = 'Check your email for a reset code.';
  } catch (e) {
    error.value = clerkErrorMessage(e, 'Could not start password reset for that email.');
  } finally {
    busy.value = false;
  }
}

async function onForgotVerify() {
  error.value = '';
  notice.value = '';
  busy.value = true;
  try {
    const result = await signIn.value.attemptFirstFactor({
      strategy: 'reset_password_email_code',
      code: code.value
    });

    if (result.status === 'needs_new_password') {
      password.value = '';
      step.value = 'forgot-password';
      return;
    }

    if (result.status === 'complete') {
      await finishSession(result.createdSessionId);
      return;
    }

    error.value = 'Could not verify that code.';
  } catch (e) {
    error.value = clerkErrorMessage(e, 'That reset code is not valid.');
  } finally {
    busy.value = false;
  }
}

async function onForgotPassword() {
  error.value = '';
  busy.value = true;
  try {
    const result = await signIn.value.resetPassword({
      password: password.value,
      signOutOfOtherSessions: true
    });

    if (result.status === 'complete') {
      await finishSession(result.createdSessionId);
      return;
    }

    error.value = 'Password updated, but sign-in could not be completed. Try signing in.';
    step.value = 'sign-in';
  } catch (e) {
    error.value = clerkErrorMessage(e, 'Could not update your password.');
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  ensureSiteBrandLoaded();
  window.setTimeout(() => {
    statusDelayElapsed.value = true;
  }, 400);
  try {
    const stored = sessionStorage.getItem('admin_login_notice');
    if (stored) {
      notice.value = stored;
      sessionStorage.removeItem('admin_login_notice');
    }
  } catch {
    /* ignore */
  }
});

watch(
  [authLoaded, isSignedIn],
  ([loaded, signedIn]) => {
    if (!clerkEnabled) {
      return;
    }
    if (loaded && signedIn) {
      router.replace(redirectTarget.value);
    }
  },
  { immediate: true }
);
</script>
