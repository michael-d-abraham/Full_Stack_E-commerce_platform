/**
 * Map Clerk API errors to short, user-facing copy.
 */
export function clerkErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
    if (!err) {
        return fallback;
    }

    const first =
        err.errors?.[0] ||
        (Array.isArray(err) ? err[0] : null) ||
        err;

    const longMessage =
        (first && typeof first.longMessage === 'string' && first.longMessage.trim()) ||
        (err.longMessage && String(err.longMessage).trim()) ||
        '';
    const message =
        (first && typeof first.message === 'string' && first.message.trim()) ||
        (err.message && String(err.message).trim()) ||
        '';

    return longMessage || message || fallback;
}

export function clerkFieldError(err, code) {
    const errors = err?.errors || (Array.isArray(err) ? err : null);
    if (!errors) {
        return '';
    }
    const match = errors.find((e) => e.meta?.paramName === code || e.code?.includes(code));
    return match ? clerkErrorMessage(match) : '';
}
