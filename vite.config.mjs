import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedDir = path.resolve(path.join(__dirname, 'shared'));

function resolveAppCommitSha() {
    try {
        return execSync('git rev-parse --short HEAD', {
            cwd: __dirname,
            encoding: 'utf8'
        }).trim();
    } catch {
        return process.env.RENDER_GIT_COMMIT?.slice(0, 7) || 'unknown';
    }
}

const appCommitSha = resolveAppCommitSha();

/**
 * shared/ uses CommonJS (module.exports) for Node/Jest.
 * Vite serves files outside frontend/ via @fs without CJS interop — convert on load for dev.
 */
function sharedCjsToEsmPlugin() {
    return {
        name: 'shared-cjs-to-esm',
        enforce: 'pre',
        load(id) {
            const file = id.split('?')[0];
            if (!file.startsWith(sharedDir) || !file.endsWith('.js')) {
                return null;
            }
            const code = fs.readFileSync(file, 'utf8');
            if (!code.includes('module.exports')) {
                return null;
            }
            const exportMatch = code.match(/module\.exports\s*=\s*\{([\s\S]*?)\};?\s*$/);
            if (!exportMatch) {
                return null;
            }
            const names = exportMatch[1]
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean)
                .map((part) => part.split(':').pop().trim());
            const body = code.replace(/module\.exports\s*=\s*\{[\s\S]*?\};?\s*$/, '');
            return `${body}\nexport { ${names.join(', ')} };\n`;
        }
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.resolve(__dirname), '');
    const apiTarget = `http://localhost:${env.PORT || process.env.PORT || 3000}`;

    return {
    root: path.join(__dirname, 'frontend'),
    // Clerk and other secrets live in the repo-root .env (not frontend/.env).
    envDir: path.resolve(__dirname),
    define: {
        __APP_COMMIT_SHA__: JSON.stringify(appCommitSha)
    },
    plugins: [vue(), sharedCjsToEsmPlugin()],
    resolve: {
        alias: {
            '@': path.join(__dirname, 'frontend', 'src'),
            '@shared': sharedDir
        }
    },
    preview: {
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true
            }
        }
    },
    server: {
        fs: {
            allow: [path.resolve(__dirname)]
        },
        port: 5173,
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true
            }
        }
    }
    };
});
