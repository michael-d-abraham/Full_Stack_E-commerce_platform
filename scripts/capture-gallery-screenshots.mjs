#!/usr/bin/env node
/**
 * Capture gallery screenshots at audit breakpoints via CDP.
 * Requires dev server running. Uses chrome-remote-interface or built-in fetch to MCP not available.
 * Fallback: uses playwright if installed, otherwise puppeteer.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'screenshots/gallery-audit/after');
const BASE = process.argv[2] || 'http://localhost:5174';

const VIEWPORTS = [
  { name: '568x320', width: 568, height: 320 },
  { name: '667x375', width: 667, height: 375 },
  { name: '740x360', width: 740, height: 360 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '820x1180', width: 820, height: 1180 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1024x600', width: 1024, height: 600 },
  { name: '1280x800', width: 1280, height: 800 },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({ headless: true });
      const page = await browser.newPage();
      for (const vp of VIEWPORTS) {
        await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
        await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForSelector('.gallery-art-image', { timeout: 15000 });
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 400));
        const file = path.join(OUT_DIR, `${vp.name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`saved ${file}`);
      }
      await browser.close();
      return;
    } catch (err) {
      console.error('Install playwright or puppeteer to capture screenshots:', err.message);
      process.exit(1);
    }
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.gallery-art-image', { timeout: 15000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const file = path.join(OUT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`saved ${file}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
