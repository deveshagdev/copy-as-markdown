# Microsoft Edge Add-ons listing

Copy-paste source for Microsoft Partner Center (https://partner.microsoft.com/dashboard/microsoftedge/overview).
Nothing in this folder ships in the extension zip — upload only the zip built
from `extension/` (see "Packaging" in the README).

Registering as an Edge Add-ons developer is free.

---

## 1. Packages

Upload `copy-as-markdown-v1.0.0.zip`. Partner Center reads the name, version,
description and permissions from `manifest.json`, so there is nothing to type
on this page.

---

## 2. Availability

**Visibility:** Public
**Markets:** all markets (the default)

---

## 3. Properties

**Category:** Productivity

**Privacy policy requirements** — "Does your extension access, collect, or
transmit any personal information?": **No**. The extension reads the page only
to convert it locally; nothing is collected, stored or transmitted.

**Privacy policy URL** (optional when the answer above is No, but worth giving)
```
https://github.com/deveshagdev/copy-as-markdown/blob/main/PRIVACY.md
```

**Website URL**
```
https://github.com/deveshagdev/copy-as-markdown
```

**Support contact details**
```
https://github.com/deveshagdev/copy-as-markdown/issues
```

**Mature content:** No

---

## 4. Store listings (English)

**Description** (250–5,000 characters — this is 1,921)

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

**Short description**, if the form asks for one

```
Copy any page or selection as clean Markdown, without navigation menus, banners and hidden page clutter.
```

**Extension store logo:** `store/edge-logo-300x300.png` (1:1, 300×300)

**Small promotional tile** (optional): `store/promo-tile-440x280.png`

**Large promotional tile** (optional, 1400×560): skip it.

**Screenshots** (optional but strongly recommended; 640×480 or 1280×800, up
to 10): see the suggestions in `CHROME_LISTING.md` — they apply unchanged. Take
them in Edge so the browser UI matches the store.

**Search terms** (up to 7 terms, 30 characters each, 21 words in total)

```
markdown
copy as markdown
html to markdown
obsidian
notion
clipboard
web clipper
```

---

## 5. Notes for certification

```
No account, login or configuration is needed. To test: open any article (for example a Wikipedia page), then either click the toolbar button, press Alt+Shift+M, or right-click and choose "Copy as Markdown". The page is converted to Markdown and placed on the clipboard; paste into any text editor to check. Select some text first to copy only the selection.

The extension makes no network requests and uses no remote code. Permissions: activeTab and scripting (inject the converter into the current tab only when the user invokes it), contextMenus (the right-click item), clipboardWrite (write the result). Turndown (MIT, https://github.com/mixmark-io/turndown) is bundled unminified in turndown.js. Source: https://github.com/deveshagdev/copy-as-markdown
```
