# Privacy Policy — Copy as Markdown

_Last updated: 7 September 2026_

## The short version

Copy as Markdown collects nothing, stores nothing, and sends nothing anywhere.
Everything it does happens inside your browser, on your computer.

## What the extension does with page content

When you click the toolbar button or choose "Copy as Markdown" from the
right-click menu, the extension reads the content of the page you are looking
at, converts it to Markdown, and writes the result to your clipboard.

That conversion happens entirely on your own machine. The page content is never
transmitted anywhere. The extension has no backend server, makes no network
requests of any kind, and includes no analytics, telemetry, crash reporting, or
advertising code.

## Data collection

None. Specifically, the extension does not collect, store, or transmit:

- Page content, URLs, or browsing history
- Personal or financial information
- Authentication information
- Location data
- Any form of usage analytics or identifiers

Nothing is written to disk, and no data persists after a copy completes.

## Permissions, and why each is needed

- **activeTab** — lets the extension read the page you are currently on, and
  only at the moment you explicitly ask it to copy. It grants no access to any
  other tab, and no standing access to the current one.
- **scripting** — used to run the converter on the page when you trigger a copy.
- **contextMenus** — adds the "Copy as Markdown" right-click menu item.
- **clipboardWrite** — writes the resulting Markdown to your clipboard.

The extension deliberately does **not** request a persistent content script on
all sites. Its code only runs on a page when you ask it to, on that one page.

## Third-party code

The extension bundles [Turndown](https://github.com/mixmark-io/turndown)
(MIT licensed) to perform the HTML-to-Markdown conversion. It runs locally and
makes no network requests.

## Changes

Any future change to this policy will accompany a new published version, and
this file will be updated with a new date.

## Contact

Questions or concerns: please open an issue at
https://github.com/GITHUB_USERNAME/copy-as-markdown/issues
