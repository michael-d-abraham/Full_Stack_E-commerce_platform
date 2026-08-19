import { ref } from 'vue';
import { useAuth, useSignIn, useSignUp, useUser, useClerk } from '@clerk/vue';
import { isClerkEnabled } from '../utils/clerkConfig.js';

export function clerkIsEnabled() {
    return isClerkEnabled();
}

export function useAuthWhenEnabled() {
    if (!isClerkEnabled()) {
        const isLoaded = ref(true);
        const isSignedIn = ref(false);
        return {
            isLoaded,
            isSignedIn,
            signOut: async () => undefined
        };
    }
    return useAuth();
}

export function useSignInWhenEnabled() {
    if (!isClerkEnabled()) {
        const isLoaded = ref(true);
        const signIn = ref(null);
        const setActive = ref(async () => undefined);
        return { isLoaded, signIn, setActive };
    }
    return useSignIn();
}

export function useSignUpWhenEnabled() {
    if (!isClerkEnabled()) {
        const isLoaded = ref(true);
        const signUp = ref(null);
        const setActive = ref(async () => undefined);
        return { isLoaded, signUp, setActive };
    }
    return useSignUp();
}

export function useUserWhenEnabled() {
    if (!isClerkEnabled()) {
        return { user: ref(null) };
    }
    return useUser();
}

export function useClerkWhenEnabled() {
    if (!isClerkEnabled()) {
        return { clerk: ref(null) };
    }
    return { clerk: useClerk() };
}
