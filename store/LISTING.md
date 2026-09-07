# Chrome Web Store listing

Copy-paste source for the Developer Dashboard. Nothing in this folder ships in
the extension zip — upload only the contents of `extension/`.

---

## Store listing tab

**Extension name** (45 char limit — this is 16)

```
Copy as Markdown
```

**Short description** (132 char limit — this is 118)

```
Copy any page or selection as clean Markdown, without the navigation menus, cookie banners and hidden page clutter.
```

**Category:** Productivity → Workflow & Planning
**Language:** English

**Detailed description**

```
Copy the page you are reading — or just the part you highlighted — to your clipboard as clean Markdown.

Built for people who keep notes in Obsidian, Notion or Logseq, write GitHub issues, or paste web pages into an AI assistant and would rather not bring a wall of navigation menus along with them.


IT STRIPS THE NOISE

Converting HTML to Markdown is the easy half. The hard half is working out which part of the page is actually the content.

Most converters copy everything the browser knows about, including collapsed dropdowns, language pickers and tool menus that exist in the page but are not on your screen. On a typical encyclopedia article that hidden markup is around 70% of what gets copied.

This extension copies what you can actually see. Anything not rendered is dropped, along with navigation, forms and page controls.


WHAT IT HANDLES

• Tables, as proper Markdown tables — including when you drag-select part way through one
• Relative links and images, rewritten to full URLs so they still work after pasting
• Code blocks, with the language preserved
• Headings, nested lists, blockquotes, strikethrough, subscript and superscript, definition lists
• Page title and heading de-duplicated, so you don't get the same heading twice


ONE ACTION

Click the toolbar button, press Alt+Shift+M, or right-click the page. If you have text selected it copies the selection; otherwise it copies the whole page. No menus, no options to configure.

A selection is taken at face value — if you deliberately highlight a navigation menu, you get the navigation menu.


PRIVACY

No servers. No network requests. No analytics. No accounts. Nothing is stored.

Everything runs locally in your browser, and the extension asks only for access to the page you are actively using, at the moment you ask it to copy. It does not run on pages in the background.

Open source: https://github.com/deveshagdev/copy-as-markdown
```

---

## Privacy practices tab

**Single purpose description**

```
Copy as Markdown converts the web page the user is currently viewing — or the portion of it they have selected — into Markdown text, and places that text on their clipboard. Converting the current page to Markdown is the extension's only function.
```

**Permission justifications**

`activeTab`
```
The extension reads the content of the page the user is viewing in order to convert it to Markdown. activeTab grants that access only at the moment the user explicitly invokes the extension — by clicking the toolbar button, choosing the context menu item, or pressing the keyboard shortcut — and only for that one tab. It provides no access to any other tab and no standing access to the current one.
```

`scripting`
```
Used to inject the converter into the current tab when the user invokes the extension. The extension deliberately does not declare a persistent content script, so no code runs on any page until the user asks for a copy, and then only on that page.
```

`contextMenus`
```
Adds a single "Copy as Markdown" item to the page right-click menu, so the user can copy without opening the toolbar popup.
```

`clipboardWrite`
```
Writes the converted Markdown to the user's clipboard. Placing the result on the clipboard is the extension's only output.
```

**Host permissions:** none requested.

**Remote code:** No. All code is contained in the uploaded package. The extension
loads no external scripts and makes no network requests of any kind.

**Data usage:** tick nothing. The extension collects no user data at all — no
page content leaves the device, nothing is stored, and there is no analytics or
telemetry of any kind.

**Privacy policy URL**
```
https://github.com/deveshagdev/copy-as-markdown/blob/main/PRIVACY.md
```

---

## Graphic assets

| Asset | Size | Status |
|---|---|---|
| Store icon | 128×128 | `extension/icons/icon128.png` |
| Small promo tile | 440×280 | `store/promo-tile-440x280.png` (optional; needed only to be eligible for featuring) |
| Screenshots | 1280×800 | **You need to take these** — at least 1, up to 5 |

### Screenshot suggestions

Take these at 1280×800. The most persuasive set:

1. **The popup on a real article** — a documentation page or Wikipedia article
   with the popup open showing "Copied page — 4,213 characters ✓". Shows what
   the extension is in one glance.
2. **Before and after** — the web page on the left, the pasted Markdown in
   Obsidian or a text editor on the right. This is the screenshot that sells it,
   because it shows the output quality rather than the UI.
3. **The right-click menu** on a text selection, showing "Copy as Markdown".
4. **Optional: the noise argument** — Markdown from this extension beside the
   same page copied by a naive converter full of menu links. Your strongest
   differentiator, if you want to make the point explicitly.

Windows: Win+Shift+S captures a region. Resize the browser window to roughly
1280×800 first so the capture doesn't need upscaling.
