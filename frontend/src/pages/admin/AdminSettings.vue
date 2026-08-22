<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Settings</h1>
      <div class="admin-page-header__end">
        <UserButton v-if="clerkEnabled" />
      </div>
    </header>

    <section class="admin-float admin-float--padded admin-settings-section">
      <h2 class="admin-float-card__title">Account</h2>
      <p class="admin-settings-section__copy">
        Signed in with Clerk.
        <span v-if="displayName">{{ displayName }}</span>
      </p>
      <button type="button" class="admin-panel__btn-ghost" :disabled="busyLogout" @click="onLogout">
        {{ busyLogout ? 'Signing out…' : 'Log out' }}
      </button>
    </section>

    <section class="admin-float admin-float--padded admin-settings-section">
      <h2 class="admin-float-card__title">Admin users</h2>
      <p class="admin-settings-section__copy">
        Invite additional admins through Clerk. Passwords are managed by Clerk — this app does not store them.
        Prefer invitation-only sign-up in the
        <a
          href="https://dashboard.clerk.com/"
          target="_blank"
          rel="noopener noreferrer"
        >Clerk Dashboard</a>.
      </p>

      <form class="admin-settings-invite" @submit.prevent="onInvite">
        <label class="field">
          <span class="label-text">Invite by email</span>
          <input
            v-model.trim="inviteEmail"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="new-admin@example.com"
            required
          >
        </label>
        <p v-if="inviteError" class="error">{{ inviteError }}</p>
        <p v-if="inviteSuccess" class="admin-settings-section__success">{{ inviteSuccess }}</p>
        <button type="submit" class="admin-page-header__btn admin-page-header__btn--primary" :disabled="busyInvite">
          {{ busyInvite ? 'Sending…' : 'Send invitation' }}
        </button>
      </form>

      <p v-if="usersError" class="error">{{ usersError }}</p>

      <div v-if="pendingInvitations.length" class="admin-settings-list">
        <h3 class="admin-settings-list__title">Pending invitations</h3>
        <ul class="admin-settings-list__items">
          <li v-for="invitation in pendingInvitations" :key="invitation.id" class="admin-settings-list__item">
            <span>{{ invitation.emailAddress }}</span>
            <button
              type="button"
              class="admin-panel__btn-ghost"
              :disabled="revokingId === invitation.id"
              @click="onRevoke(invitation.id)"
            >
              {{ revokingId === invitation.id ? 'Revoking…' : 'Revoke' }}
            </button>
          </li>
        </ul>
      </div>

      <div v-if="adminUsers.length" class="admin-settings-list">
        <h3 class="admin-settings-list__title">Current users</h3>
        <ul class="admin-settings-list__items">
          <li v-for="user in adminUsers" :key="user.id" class="admin-settings-list__item">
            <span>{{ user.email || user.id }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { UserButton } from '@clerk/vue';
import {
  clerkIsEnabled,
  useAuthWhenEnabled,
  useUserWhenEnabled
} from '../../composables/useClerkWhenEnabled.js';
import {
  logoutAdmin,
  listAdminUsers,
  listAdminInvitations,
  inviteAdminUser,
  revokeAdminInvitation
} from '../../services/api.js';

const router = useRouter();
const clerkEnabled = clerkIsEnabled();
const { signOut, isSignedIn } = useAuthWhenEnabled();
const { user } = useUserWhenEnabled();

const busyLogout = ref(false);
const busyInvite = ref(false);
const inviteEmail = ref('');
const inviteError = ref('');
const inviteSuccess = ref('');
const usersError = ref('');
const adminUsers = ref([]);
const pendingInvitations = ref([]);
const revokingId = ref('');

const displayName = computed(() => {
  const u = user.value;
  if (!u) return '';
  return (
    u.primaryEmailAddress?.emailAddress ||
    u.emailAddresses?.[0]?.emailAddress ||
    u.fullName ||
    ''
  );
});

async function refreshUsers() {
  usersError.value = '';
  try {
    const [usersRes, invitesRes] = await Promise.all([
      listAdminUsers(),
      listAdminInvitations()
    ]);
    adminUsers.value = usersRes.users || [];
    pendingInvitations.value = invitesRes.invitations || [];
  } catch (e) {
    usersError.value = e.message || 'Could not load admin users.';
  }
}

async function onInvite() {
  inviteError.value = '';
  inviteSuccess.value = '';
  busyInvite.value = true;
  try {
    await inviteAdminUser({ emailAddress: inviteEmail.value });
    inviteSuccess.value = `Invitation sent to ${inviteEmail.value}.`;
    inviteEmail.value = '';
    await refreshUsers();
  } catch (e) {
    inviteError.value = e.message || 'Could not send invitation.';
  } finally {
    busyInvite.value = false;
  }
}

async function onRevoke(id) {
  revokingId.value = id;
  try {
    await revokeAdminInvitation(id);
    await refreshUsers();
  } catch (e) {
    usersError.value = e.message || 'Could not revoke invitation.';
  } finally {
    revokingId.value = '';
  }
}

async function onLogout() {
  busyLogout.value = true;
  try {
    if (isSignedIn.value && signOut.value) {
      await signOut.value();
    }
  } catch {
    /* still clear legacy session and leave */
  }
  try {
    await logoutAdmin();
  } catch {
    /* ignore */
  }
  router.replace({ name: 'admin-login' });
  busyLogout.value = false;
}

onMounted(() => {
  refreshUsers();
});
</script>

<style scoped>
.admin-settings-section + .admin-settings-section {
  margin-top: var(--space-lg);
}

.admin-settings-section__copy {
  margin: 0 0 var(--space-md);
  font-size: 0.9375rem;
  line-height: 1.5;
  max-width: 40rem;
}

.admin-settings-section__copy a {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.admin-settings-section__success {
  margin: 0 0 var(--space-sm);
  font-size: 0.9375rem;
  color: var(--color-text);
}

.admin-settings-invite {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-width: 28rem;
  margin-bottom: var(--space-lg);
}

.admin-settings-list {
  margin-top: var(--space-md);
}

.admin-settings-list__title {
  margin: 0 0 var(--space-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: lowercase;
}

.admin-settings-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.admin-settings-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9375rem;
}
</style>
