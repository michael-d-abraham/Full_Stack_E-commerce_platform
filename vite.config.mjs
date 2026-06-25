import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedDir = path.resolve(path.join(__dirname, 'shared'));

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

export default defineConfig({
    root: path.join(__dirname, 'frontend'),
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
                target: 'http://localhost:3000',
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
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
});
