#!/usr/bin/env node
/**
 * Gallery layout audit — run against local dev server.
 * Usage: node scripts/gallery-layout-audit.mjs [baseUrl]
 */

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

const AUDIT_JS = `(() => {
  const grid = document.querySelector('.product-grid--gallery');
  const cards = [...document.querySelectorAll('.product-grid--gallery .product-card')];
  const gridStyle = grid ? getComputedStyle(grid) : null;
  const issues = [];
  const items = cards.map((card, i) => {
    const frame = card.querySelector('.gallery-art-frame');
    const mat = card.querySelector('.gallery-art-mat');
    const img = card.querySelector('.gallery-art-image');
    const fr = frame?.getBoundingClientRect();
    const mr = mat?.getBoundingClientRect();
    const ir = img?.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const title = card.querySelector('.gallery-product-title')?.textContent?.trim();
    const orientation = frame?.className.match(/gallery-art--\\w+/)?.[0] || 'unknown';
    const framePad = frame ? parseFloat(getComputedStyle(frame).padding) : 0;
    const matPad = mat ? parseFloat(getComputedStyle(mat).padding) : 0;

    if (fr && ir && (ir.width > fr.width + 1 || ir.height > fr.height + 1)) {
      issues.push({ type: 'img-overflows-frame', title, orientation, img: { w: ir.width, h: ir.height }, frame: { w: fr.width, h: fr.height } });
    }
    if (fr && mr && (mr.width > fr.width + 1 || mr.height > fr.height + 1)) {
      issues.push({ type: 'mat-overflows-frame', title, mat: { w: mr.width, h: mr.height }, frame: { w: fr.width, h: fr.height } });
    }
    if (fr && cr && Math.abs(fr.width - cr.width) < 2 && ir && ir.width < fr.width - framePad * 2 - matPad * 2 - 20) {
      issues.push({ type: 'frame-stretched-to-column', title, frameW: fr.width, imgW: ir.width, cardW: cr.width });
    }

    return {
      title,
      orientation,
      card: { w: Math.round(cr.width), h: Math.round(cr.height), x: Math.round(cr.x) },
      frame: fr ? { w: Math.round(fr.width), h: Math.round(fr.height) } : null,
      mat: mr ? { w: Math.round(mr.width), h: Math.round(mr.height) } : null,
      img: ir ? { w: Math.round(ir.width), h: Math.round(ir.height) } : null,
      framePad,
      matPad,
    };
  });

  const colXs = [...new Set(items.map((it) => it.card.x))].sort((a, b) => a - b);
  const frameWs = items.map((it) => it.frame?.w).filter(Boolean);
  const uniqueFrameWs = [...new Set(frameWs)];

  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    grid: gridStyle
      ? {
          display: gridStyle.display,
          columns: gridStyle.columnCount,
          columnGap: gridStyle.columnGap,
          width: Math.round(grid.getBoundingClientRect().width),
        }
      : null,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    columnPositions: colXs,
    frameWidthSpread: { min: Math.min(...frameWs), max: Math.max(...frameWs), unique: uniqueFrameWs.length },
    issues,
    items,
  };
})()`;

async function auditViewport(page, vp) {
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('.product-grid--gallery .gallery-art-image', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 500));
  return page.evaluate(AUDIT_JS);
}

async function main() {
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.error('puppeteer not installed — using fetch-only mode unavailable');
    process.exit(1);
  }

  const browser = await puppeteer.default.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];
  for (const vp of VIEWPORTS) {
    try {
      const data = await auditViewport(page, vp);
      results.push({ viewport: vp.name, ...data });
      const issueCount = data.issues.length;
      console.log(
        `${vp.name}: grid=${data.grid?.display}/${data.grid?.columns}cols w=${data.grid?.width} overflow=${data.horizontalOverflow} issues=${issueCount} frameW=${data.frameWidthSpread.min}-${data.frameWidthSpread.max}`
      );
      if (issueCount) {
        for (const issue of data.issues) {
          console.log(`  - ${issue.type}: ${issue.title || JSON.stringify(issue)}`);
        }
      }
    } catch (err) {
      console.error(`${vp.name}: ERROR ${err.message}`);
    }
  }

  await browser.close();
  console.log('\n--- SUMMARY ---');
  for (const r of results) {
    if (r.issues?.length) {
      console.log(`${r.viewport}: ${r.issues.length} issues`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
