const express = require('express');
const { clerkClient } = require('@clerk/express');

const router = express.Router();

function clientBaseUrl() {
    const raw = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return String(raw).replace(/\/$/, '');
}

router.get('/', async function (req, res) {
    try {
        const list = await clerkClient.users.getUserList({ limit: 50, orderBy: '-created_at' });
        const users = (list.data || []).map((user) => ({
            id: user.id,
            email:
                user.primaryEmailAddress?.emailAddress ||
                user.emailAddresses?.[0]?.emailAddress ||
                null,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt
        }));
        res.json({ users });
    } catch (err) {
        console.error('admin users list', err);
        res.status(500).json({ error: 'Could not load admin users from Clerk.' });
    }
});

router.get('/invitations', async function (req, res) {
    try {
        const list = await clerkClient.invitations.getInvitationList({
            status: 'pending',
            limit: 50
        });
        const invitations = (list.data || []).map((invitation) => ({
            id: invitation.id,
            emailAddress: invitation.emailAddress,
            status: invitation.status,
            createdAt: invitation.createdAt
        }));
        res.json({ invitations });
    } catch (err) {
        console.error('admin invitations list', err);
        res.status(500).json({ error: 'Could not load pending invitations from Clerk.' });
    }
});

router.post('/invitations', async function (req, res) {
    const emailAddress = req.body && String(req.body.emailAddress || '').trim().toLowerCase();

    if (!emailAddress || !emailAddress.includes('@')) {
        return res.status(422).json({ error: 'Enter a valid email address to invite.' });
    }

    try {
        const invitation = await clerkClient.invitations.createInvitation({
            emailAddress,
            redirectUrl: `${clientBaseUrl()}/admin/sign-up`,
            publicMetadata: { role: 'admin' },
            notify: true,
            ignoreExisting: false
        });

        res.status(201).json({
            ok: true,
            invitation: {
                id: invitation.id,
                emailAddress: invitation.emailAddress,
                status: invitation.status,
                createdAt: invitation.createdAt
            }
        });
    } catch (err) {
        console.error('admin invite create', err);
        const message =
            (err && err.errors && err.errors[0] && err.errors[0].longMessage) ||
            (err && err.message) ||
            'Could not send the invitation.';
        const status = err && err.status;
        res.status(typeof status === 'number' ? status : 500).json({ error: message });
    }
});

router.post('/invitations/:id/revoke', async function (req, res) {
    try {
        await clerkClient.invitations.revokeInvitation(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        console.error('admin invite revoke', err);
        res.status(500).json({ error: 'Could not revoke that invitation.' });
    }
});

module.exports = router;
