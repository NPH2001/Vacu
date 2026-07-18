/**
 * Layout guard: loads the storefront at phone, tablet and desktop widths and
 * fails if a page scrolls sideways.
 *
 * Horizontal overflow is the objective signature of a blown-out layout, and
 * admin-entered data is what causes it: a product name with no spaces once
 * stretched a 390px phone layout to 1510px, and enough menu items pushed the
 * cart button off every desktop page. Neither showed up in the tests, the
 * typecheck or the build — only in a real browser.
 *
 * Usage: start the dev server, then
 *   node scripts/check-layout.mjs
 * Exits non-zero when something overflows. Set SHOT_DIR to also save full-page
 * screenshots, BASE_URL to point at another host.
 */
import { chromium } from 'playwright';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.SHOT_DIR;

const PAGES = [
  ['home', '/'],
  ['products', '/products'],
  ['about', '/about'],
  ['tin-tuc', '/tin-tuc'],
  ['farmers', '/farmers'],
  ['contact', '/contact'],
];
const VIEWPORTS = [
  ['mobile', 390, 844],
  ['tablet', 768, 1024],
  ['desktop', 1280, 900],
];

const browser = await chromium.launch();
let failed = 0;

for (const [vpName, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();

  for (const [name, url] of PAGES) {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });

    const res = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const guilty = [];
      if (docW > winW + 1) {
        for (const el of document.querySelectorAll('body *')) {
          // Off-canvas drawers sit outside the viewport by design and do not
          // create a scrollbar — don't report them as the culprit.
          if (getComputedStyle(el).position === 'fixed') continue;
          const r = el.getBoundingClientRect();
          if (r.right > winW + 1 && r.width > 0) {
            guilty.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className?.toString?.() ?? '').slice(0, 70),
              text: (el.textContent ?? '').trim().slice(0, 40),
            });
          }
        }
      }
      return { docW, winW, over: docW - winW, guilty: guilty.slice(0, 3) };
    });

    if (OUT) {
      await page.screenshot({ path: path.join(OUT, `${vpName}-${name}.png`), fullPage: true });
    }

    const bad = res.over > 1;
    if (bad) failed++;
    console.log(
      `  ${bad ? 'FAIL' : 'ok  '} ${vpName.padEnd(7)} ${name.padEnd(14)} ${res.docW}/${res.winW}` +
      (bad ? `  tràn ${res.over}px` : ''),
    );
    for (const g of res.guilty) {
      console.log(`         <${g.tag}> "${g.text}" [${g.cls}]`);
    }
  }
  await ctx.close();
}

await browser.close();

if (failed > 0) {
  console.error(`\n${failed} trang bị tràn ngang.`);
  process.exit(1);
}
console.log('\nKhông trang nào tràn ngang.');
