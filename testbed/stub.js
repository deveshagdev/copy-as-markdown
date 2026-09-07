// Lets the real content.js run in a plain page, the way chrome.scripting would
// inject it. content.js exposes window.__copyAsMarkdown = { extract, copy }.
window.__copied = null;

const realWrite = navigator.clipboard && navigator.clipboard.writeText
  ? navigator.clipboard.writeText.bind(navigator.clipboard)
  : null;

if (navigator.clipboard) {
  navigator.clipboard.writeText = (text) => {
    window.__copied = text;
    return realWrite ? realWrite(text) : Promise.reject(new Error("no clipboard"));
  };
}

// Mirrors what the popup does: extract in the page, copy outside it.
window.__run = async function () {
  const result = window.__copyAsMarkdown.extract();
  window.__copied = result.markdown;
  return { ok: true, mode: result.mode, length: result.markdown.length };
};

// Mirrors what the context menu does: extract and copy inside the page.
window.__runCopy = function () {
  return window.__copyAsMarkdown.copy();
};

// Select the contents of an element, the way a user drag-select would.
window.__select = function (selector) {
  const el = document.querySelector(selector);
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

window.__clearSelection = function () {
  window.getSelection().removeAllRanges();
};
