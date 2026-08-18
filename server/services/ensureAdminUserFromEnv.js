const AdminUser = require('../models/AdminUser');
const { hashPassword, verifyPassword } = require('../utils/adminPassword');

/**
 * Create or update one admin user (username + password hash synced from env).
 */
async function ensureAdminUser(username, password) {
    const name = username != null ? String(username).trim() : '';
    const plain = password != null ? String(password) : '';

    if (!name || !plain) {
        return;
    }

    const existing = await AdminUser.findOne({ username: name });
    if (!existing) {
        await AdminUser.create({
            username: name,
            passwordHash: hashPassword(plain),
            enabled: true,
            isAdmin: true
        });
        return;
    }

    const $set = { enabled: true, isAdmin: true };
    if (!verifyPassword(plain, existing.passwordHash)) {
        $set.passwordHash = hashPassword(plain);
    }

    await AdminUser.updateOne({ _id: existing._id }, { $set });
}

/**
 * Sync primary admin (ADMIN_USERNAME / ADMIN_PASSWORD) and master admin
 * (ADMIN_MASTER_USERNAME / ADMIN_MASTER_PASSWORD) from environment on server start.
 */
async function ensureAdminUserFromEnv() {
    await ensureAdminUser(
        process.env.ADMIN_USERNAME,
        process.env.ADMIN_PASSWORD
    );

    const masterUsername =
        process.env.ADMIN_MASTER_USERNAME != null
            ? String(process.env.ADMIN_MASTER_USERNAME).trim()
            : 'admin';
    await ensureAdminUser(masterUsername, process.env.ADMIN_MASTER_PASSWORD);
}

module.exports = { ensureAdminUserFromEnv, ensureAdminUser };
