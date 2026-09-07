// popup.js
const statusEl = document.getElementById("status");
// Order matters: content.js reads the TurndownService global that turndown.js
// defines. Chrome injects these in array order, and nothing else enforces it.
const SCRIPTS = ["turndown.js", "content.js"];

// Pages Chrome refuses to let any extension touch. Worth naming explicitly,
// because it's the one failure with a cause we can actually explain.
const RESTRICTED_URL = /^(chrome|edge|about|devtools|chrome-extension|moz-extension):|^https:\/\/chromewebstore\.google\.com/;

function setStatus(text) {
  statusEl.textContent = text;
}

async function copyAsMarkdown() {
  setStatus("Copying...");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: SCRIPTS });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__copyAsMarkdown.extract()
    });

    // Written here rather than in the page: the async clipboard API needs a
    // focused document, and while the popup is open the page doesn't have focus
    // — the popup does.
    await navigator.clipboard.writeText(result.markdown);

    const what = result.mode === "selection" ? "selection" : "page";
    setStatus(`Copied ${what} — ${result.markdown.length.toLocaleString()} characters ✓`);
  } catch (error) {
    // This catch covers injection failures, clipboard failures and any bug in
    // content.js, so it must not claim to know which one happened.
    console.error("Copy as Markdown:", error);
    setStatus(
      RESTRICTED_URL.test(tab.url || "")
        ? "Chrome doesn't allow extensions to run on this page."
        : "Couldn't copy from this page. See the console for details."
    );
  }
}

document.getElementById("copy").addEventListener("click", copyAsMarkdown);
