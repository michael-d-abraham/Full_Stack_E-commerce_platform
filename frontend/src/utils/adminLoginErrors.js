/**
 * User-facing message for failed admin sign-in (maps API / network errors).
 */
export function adminLoginErrorMessage(err) {
    if (!err) {
        return 'Sign-in failed. Please try again.';
    }

    const status = err.status;
    const serverMsg =
        err.data && typeof err.data.error === 'string' ? err.data.error.trim() : '';

    if (serverMsg) {
        return serverMsg;
    }

    if (status === 401) {
        return 'That username or password is not correct. Check your details and try again.';
    }

    if (status === 422) {
        return 'Please enter your username and password.';
    }

    if (status === 500) {
        return 'Something went wrong while signing you in. Please try again in a moment.';
    }

    if (status === 0 || err.message === 'Failed to fetch') {
        return 'Could not reach the server. Check your connection and try again.';
    }

    return err.message || 'Sign-in failed. Please try again.';
}
