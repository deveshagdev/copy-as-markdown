# Copy as Markdown

A Chrome extension that copies the page you're reading — or just the bit you've
highlighted — to your clipboard as clean Markdown.

Built for people who take notes in Obsidian, Notion or Logseq, write GitHub
issues, or paste web pages into an LLM and would rather not paste a wall of
navigation menus along with them.

## What makes it different

**It strips the noise.** Converting HTML to Markdown is the easy half. The hard
half is working out which parts of the page are actually content.

Most converters run over `innerHTML`, which includes everything the browser
knows about — including collapsed dropdowns, language pickers and tool menus
that are in the DOM but not on your screen. On a Wikipedia article that hidden
markup is roughly **70% of what gets copied**.

This extension copies what you can see:

- Anything not actually rendered (`display:none`, `visibility:hidden`, or nested
  inside something hidden) is dropped
- Navigation, forms, controls and banner/complementary ARIA landmarks are dropped
- `<style>` and `<script>` content never leaks into the output

An explicit selection is treated differently: it gets the visibility filter, but
not the navigation filter. If you deliberately highlight a nav menu, you get the
nav menu.

## Other things it handles

- **Tables** as real GFM tables, including drags that start and end mid-table
  (which otherwise arrive as orphaned `<tr>` elements with no `<table>`)
- **Relative links and images** resolved to absolute URLs, so they still work
  once pasted somewhere else
- **Code blocks** — `language-`, `lang-` and `highlight-` class prefixes, plus
  bare `<pre>` with no `<code>` inside, and longer fences when the code itself
  contains backticks
- Strikethrough, sub/sup, definition lists, nested lists, blockquotes
- **The page title and its heading de-duplicated**, so a page called
  "Lorem ipsum - Wikipedia" whose `<h1>` is "Lorem ipsum" doesn't start with the
  same heading twice

## Install

### Microsoft Edge

Being published on [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons).
Once it's live, install it from there and it will update automatically.

### Chrome, Brave, Opera and other Chromium browsers (manual install)

Not on the Chrome Web Store, so installation is manual. Edge users can do this
too while the store listing is in review.

1. Download the `copy-as-markdown-v….zip` file from the
   [latest release](https://github.com/deveshagdev/copy-as-markdown/releases/latest)
2. **Unzip it** — put the folder somewhere you're happy to leave it, because
   deleting it uninstalls the extension
3. Open `chrome://extensions` (or `edge://extensions`)
4. Turn on **Developer mode** (top right in Chrome, left sidebar in Edge)
5. Click **Load unpacked** and select the unzipped folder

Your browser will warn about developer-mode extensions and may repeat the
warning at startup. That's expected for anything not installed from a store —
it isn't specific to this extension. There are no automatic updates, so to
upgrade, download the new release and repeat the steps.

If you'd rather install from the source tree, clone the repo and point
**Load unpacked** at the `extension/` folder specifically, not the repository
root — Chromium refuses to load an unpacked extension containing files whose
names begin with `_`.

## Usage

Click the toolbar icon, press **Alt+Shift+M**, or right-click the page and
choose **Copy as Markdown**. The shortcut can be changed at
`edge://extensions/shortcuts` (or `chrome://extensions/shortcuts`).

One action, not two: if you have something selected it copies the selection,
otherwise it copies the whole page. The popup tells you which it did; the
right-click menu flashes a badge on the toolbar icon.

## Privacy

No servers, no network requests, no analytics, no storage. Everything runs
locally in your browser. It requests `activeTab` rather than a persistent
all-sites content script, so its code only runs on a page at the moment you ask
it to. See [PRIVACY.md](PRIVACY.md).

## Development

```
extension/   the extension itself — this is what gets loaded and published
store/       store listing copy and images — never part of the zip
testbed/     test fixtures
tools/       icon, screenshot and packaging scripts
```

### Releasing

1. Bump `version` in `extension/manifest.json` and add a matching section to
   [CHANGELOG.md](CHANGELOG.md)
2. Merge to `main`
3. On GitHub, open **Actions → Release → Run workflow** and run it on `main`

The [release workflow](.github/workflows/release.yml) creates the `vX.Y.Z` tag
from the manifest version, builds the zip, and publishes a GitHub release with
the changelog section as its notes. It refuses to run if that version has
already been released. Pushing a `vX.Y.Z` tag yourself also works. Upload the
same zip to Edge Add-ons.

### Packaging locally

To build the zip yourself:

```bash
# Windows
powershell -ExecutionPolicy Bypass -File tools/package.ps1

# macOS / Linux
git archive --format=zip --output copy-as-markdown.zip HEAD:extension
```

Both zip the committed contents of `extension/`, with `manifest.json` at the
root. Uncommitted changes are not included.

### Tests

The test harness loads the *real* `turndown.js` and `content.js` into an
ordinary web page with a stubbed `chrome` API, so the conversion logic can be
exercised without loading the extension. `content.js` deliberately contains no
`chrome.*` calls, which is what makes this possible.

It must be served over HTTP — opened as `file://` the scripts won't execute:

```bash
python -m http.server 8765
```

Then open `http://localhost:8765/testbed/complex.html` (a realistic article) or
`testbed/edge.html` (a per-feature grid). In the console:

```js
await window.__run();   // convert selection-or-page
window.__copied;        // the resulting Markdown
```

### Icons

Generated from code rather than drawn in an editor:

```bash
node tools/make-icons.js
```

## Credits

HTML-to-Markdown conversion by [Turndown](https://github.com/mixmark-io/turndown)
(MIT), vendored in `extension/turndown.js`.

## License

[MIT](LICENSE)
