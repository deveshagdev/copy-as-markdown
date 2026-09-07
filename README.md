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

## Install

Not yet on the Chrome Web Store. To run it locally:

1. Clone or download this repository
2. Open `chrome://extensions`
3. Turn on **Developer mode** (top right)
4. Click **Load unpacked** and select the **`extension/`** folder

Point it at `extension/`, not the repository root — Chrome refuses to load an
unpacked extension containing files whose names begin with `_`, and only that
folder should ever ship.

## Usage

Click the toolbar icon, or right-click the page and choose **Copy as Markdown**.

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
testbed/     test fixtures
tools/       icon generator
```

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
