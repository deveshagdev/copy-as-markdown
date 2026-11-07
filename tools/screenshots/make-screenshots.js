// Renders the store screenshots (1280x800) into store/screenshots/.
// Run: node tools/screenshots/make-screenshots.js   (needs Playwright + Chromium)
//
// The demo article is original content served from a fake origin, so links come
// out absolute. The Markdown in the shots is the real output of turndown.js +
// content.js; the popup is the real popup.html with its status line filled in.
// The browser frame and the context menu are drawn by stage.html.

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const EXT = path.join(HERE, "..", "..", "extension") + "/";
const OUT = path.join(HERE, "..", "..", "store", "screenshots");
const ORIGIN = "https://theslowcup.example";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();

  const conv = await b.newPage();
  await conv.route(ORIGIN + "/**", r => r.fulfill({ contentType: "text/html", body: fs.readFileSync(path.join(HERE, "article.html")) }));
  await conv.goto(ORIGIN + "/guides/pour-over");
  await conv.addScriptTag({ path: EXT + "turndown.js" });
  await conv.addScriptTag({ path: EXT + "content.js" });
  const pageMd = (await conv.evaluate(() => window.__copyAsMarkdown.extract())).markdown;
  await conv.close();

  for (const shot of ['1', '2', '3']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await p.route(ORIGIN + "/**", r => {
      const u = new URL(r.request().url());
      if (u.pathname.startsWith('/ext/')) return r.fulfill({ path: EXT + u.pathname.slice(5) });
      if (u.pathname === '/stage') return r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(HERE, "stage.html")) });
      return r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(HERE, "article.html")) });
    });
    await p.addInitScript(([md]) => {
      window.PAGE_MD = md;
      window.STATUS = `Copied page — ${md.length.toLocaleString()} characters ✓`;
    }, [pageMd]);
    await p.goto(ORIGIN + "/stage?shot=" + shot);
    await p.evaluate(() => window.ready);
    await p.waitForTimeout(300);
    const names = { 1: 'popup', 2: 'before-after', 3: 'selection-menu' };
    await p.screenshot({ path: `${OUT}/${shot}-${names[shot]}-1280x800.png` });
    await p.close();
  }
  await b.close();
  console.log(`wrote 3 screenshots to ${path.relative(process.cwd(), OUT) || "."}`);
})();
