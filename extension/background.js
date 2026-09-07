// background.js — Manifest V3 service worker.
// Creates the right-click context menu item, and on click injects the converter
// into the page and asks it to copy.

// Order matters: content.js reads the TurndownService global that turndown.js
// defines. Chrome injects these in array order, and nothing else enforces it.
const SCRIPTS = ["turndown.js", "content.js"];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copy-markdown",
    title: "Copy as Markdown",
    contexts: ["page", "selection"]
  });
});

// The context menu has no UI of its own, so the toolbar badge is the only place
// to say whether the copy actually happened.
async function flashBadge(tabId, text, color) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
  // Best effort: the service worker may be torn down before this fires, which
  // is why every run clears the badge before starting.
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), 2000);
}

async function copyFromTab(tabId) {
  await chrome.action.setBadgeText({ tabId, text: "" });
  try {
    // Injecting per invocation rather than declaring a content script keeps
    // this working after an extension update — a pre-injected script is
    // orphaned by the reload and silently stops responding until a tab reload.
    await chrome.scripting.executeScript({ target: { tabId }, files: SCRIPTS });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.__copyAsMarkdown.copy()
    });
    await flashBadge(tabId, result.ok ? "✓" : "!", result.ok ? "#1a7f37" : "#c62828");
  } catch {
    await flashBadge(tabId, "!", "#c62828");
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab && tab.id !== undefined) copyFromTab(tab.id);
});

// Both the shortcut and the menu item grant activeTab for the current tab.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "copy-as-markdown" && tab && tab.id !== undefined) copyFromTab(tab.id);
});
