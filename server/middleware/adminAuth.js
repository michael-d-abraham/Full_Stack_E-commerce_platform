const AdminUser = require('../models/AdminUser');

function getClerkAuth(req) {
    try {
        // Lazy-require so tests can run without Clerk env configured.
        const { getAuth } = require('@clerk/express');
        return getAuth(req);
    } catch {
        return null;
    }
}

function clerkUserToAdmin(auth) {
    const email =
        (auth.sessionClaims &&
            (auth.sessionClaims.email ||
                auth.sessionClaims.email_address ||
                (auth.sessionClaims.primary_email_address &&
                    auth.sessionClaims.primary_email_address.email_address))) ||
        null;

    return {
        _id: auth.userId,
        clerkUserId: auth.userId,
        username: email || auth.userId,
        email,
        isAdmin: true,
        enabled: true,
        authSource: 'clerk'
    };
}

/**
 * Loads the admin identity from a Clerk session (preferred) or a legacy
 * express-session AdminUser id (kept for automated tests / migration).
 */
function attachAdminUser(req, res, next) {
    const auth = getClerkAuth(req);
    if (auth && auth.isAuthenticated && auth.userId) {
        req.user = clerkUserToAdmin(auth);
        return next();
    }

    if (!req.session || !req.session.userId) {
        return res.sendStatus(401);
    }

    AdminUser.findById(req.session.userId)
        .then(function (user) {
            if (user && user.enabled) {
                req.user = user;
                next();
            } else {
                res.sendStatus(401);
            }
        })
        .catch(function (err) {
            console.error('attachAdminUser', err);
            res.sendStatus(500);
        });
}

/**
 * Ensures the loaded user is an admin (same idea as class authorizeAdmin).
 */
function requireAdminRole(req, res, next) {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = { attachAdminUser, requireAdminRole };
