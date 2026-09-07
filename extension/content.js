// content.js
// Injected on demand by the popup and the context menu, not registered as a
// persistent content script. It therefore has to be safe to inject repeatedly
// into the same page, hence the guard and the IIFE.
//
// Converts the current selection into Markdown, or the full page when nothing
// is selected.

(() => {
  if (window.__copyAsMarkdown) return;

  const turndownService = new TurndownService({
    headingStyle: "atx",       // '#' style headings
    codeBlockStyle: "fenced",  // ``` fenced code blocks
    bulletListMarker: "-"
  });

  // Turndown's remove-list is empty by default, so a <style> or inline <script>
  // would otherwise dump its raw CSS/JS into the Markdown as body text.
  turndownService.remove(["style", "script", "noscript", "template"]);

  // Superscript and subscript change meaning, not just appearance — "H2O" and
  // "x2" are simply wrong. Markdown has no syntax for them, so keep the HTML.
  turndownService.keep(["sub", "sup"]);

  // Turndown only fences <pre><code>, leaving a bare <pre> to collapse into a
  // paragraph, and only recognises the "language-" class prefix.
  turndownService.addRule("codeBlock", {
    filter: "pre",
    replacement: (content, node) => {
      const code = node.querySelector("code") || node;
      const className = code.getAttribute("class") || "";
      const language = (className.match(/(?:language|lang|highlight)-(\S+)/) || ["", ""])[1];

      const text = code.textContent.replace(/\n+$/, "");
      // The fence must be longer than any run of backticks in the code itself.
      const longestRun = Math.max(0, ...(text.match(/`+/g) || []).map((run) => run.length));
      const fence = "`".repeat(Math.max(3, longestRun + 1));

      return `\n\n${fence}${language}\n${text}\n${fence}\n\n`;
    }
  });

  turndownService.addRule("strikethrough", {
    filter: ["del", "s", "strike"],
    replacement: (content) => `~~${content}~~`
  });

  // Markdown has no definition lists. A bold term with a ": " definition is the
  // Pandoc/Obsidian convention, and degrades to something readable elsewhere.
  turndownService.addRule("definitionList", {
    filter: ["dt", "dd"],
    replacement: (content, node) =>
      node.nodeName === "DT" ? `\n\n**${content.trim()}**` : `\n: ${content.trim()}`
  });

  // Turndown has no built-in table support and would otherwise flatten a table
  // into a stream of loose paragraphs, losing the row/column structure.
  turndownService.addRule("table", {
    filter: "table",
    replacement: (content, node) => {
      const rows = Array.from(node.rows);
      if (rows.length === 0) return "";

      const cellsOf = (row) =>
        Array.from(row.cells).map((cell) =>
          turndownService
            .turndown(cell.innerHTML)
            .replace(/\n+/g, " ")
            .replace(/\|/g, "\\|")
            .trim()
        );

      const table = rows.map(cellsOf);
      const width = Math.max(...table.map((row) => row.length));
      const line = (cells) =>
        "| " + cells.concat(Array(width - cells.length).fill("")).join(" | ") + " |";

      const [header, ...body] = table;
      const divider = "| " + Array(width).fill("---").join(" | ") + " |";
      return "\n\n" + [line(header), divider, ...body.map(line)].join("\n") + "\n\n";
    }
  });

  const HIDDEN_MARKER = "data-copy-as-markdown-hidden";

  // Interface furniture that is never part of what someone means by "the page".
  const NOISE_SELECTOR = [
    "nav", "form", "button", "input", "select", "textarea", "dialog",
    "[role=navigation]", "[role=complementary]", "[role=banner]",
    "[role=contentinfo]", "[role=search]", "[role=dialog]",
    "[aria-hidden=true]"
  ].join(", ");

  // Markdown gets pasted somewhere else entirely, so page-relative links and
  // images have to be resolved against the page they came from to stay valid.
  function absolutizeUrls(root) {
    for (const el of root.querySelectorAll("[href], [src]")) {
      for (const attribute of ["href", "src"]) {
        const value = el.getAttribute(attribute);
        if (!value) continue;
        try {
          el.setAttribute(attribute, new URL(value, document.baseURI).href);
        } catch {
          // Malformed URL in the page markup — leave it exactly as authored.
        }
      }
    }
  }

  // checkVisibility walks the ancestor chain, so it catches a node whose parent
  // is display:none. getComputedStyle does not — it reports such a child as a
  // plain visible block, because display doesn't inherit.
  function isHidden(el) {
    return !el.checkVisibility({ checkVisibilityCSS: true });
  }

  // Hidden nodes have to be identified on the live DOM — a detached clone has no
  // computed style. Tagging them in place lets the caller clone however it likes
  // and then drop whatever came back marked.
  function markHiddenElements(root) {
    const marked = [];
    for (const el of root.querySelectorAll("*")) {
      if (isHidden(el)) {
        el.setAttribute(HIDDEN_MARKER, "");
        marked.push(el);
      }
    }
    return marked;
  }

  function dropMarkedElements(container) {
    for (const el of container.querySelectorAll(`[${HIDDEN_MARKER}]`)) el.remove();
  }

  // A drag that starts and ends inside the same table clones bare <tr>/<td>
  // nodes with no <table> around them, which would flatten the rows into text.
  function restoreTableWrapper(container) {
    const children = Array.from(container.children);
    const looseCells = children.length > 0 && children.every((el) => /^(TD|TH)$/.test(el.tagName));
    const looseRows = children.some((el) => /^(TR|THEAD|TBODY|TFOOT)$/.test(el.tagName));
    if (!looseCells && !looseRows) return;

    const table = document.createElement("table");
    let parent = table;
    if (looseCells) {
      parent = document.createElement("tr");
      table.appendChild(parent);
    }
    while (container.firstChild) parent.appendChild(container.firstChild);
    container.appendChild(table);
  }

  function getMarkdownForSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return null;
    }
    const range = selection.getRangeAt(0);

    const ancestor = range.commonAncestorContainer;
    const scope = ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor.parentElement;

    // The marker lands on descendants, so a selection sitting entirely inside a
    // hidden subtree would come back unmarked. Nothing visible is selected.
    if (isHidden(scope)) return null;

    // A range spanning a collapsed menu still clones that menu's DOM, so
    // select-all on a page full of dropdowns would drag all of them in.
    const container = document.createElement("div");
    const marked = markHiddenElements(scope);
    try {
      container.appendChild(range.cloneContents());
      dropMarkedElements(container);
    } finally {
      for (const el of marked) el.removeAttribute(HIDDEN_MARKER);
    }

    // No NOISE_SELECTOR pass here: an explicit selection is taken at face value.
    // If someone deliberately highlights a nav menu, they get the nav menu.
    restoreTableWrapper(container);
    absolutizeUrls(container);
    return turndownService.turndown(container.innerHTML);
  }

  // <main> alone is a weak filter: on a Wikipedia article it still contains the
  // language menu, the tools menu and the appearance settings, most of it inside
  // collapsed dropdowns. Those are display:none, so the reader never sees them —
  // but they are in innerHTML, and they were ~70% of the copied markup. Copy
  // what is on screen, not what is in the DOM.
  function extractVisibleContent(root) {
    const marked = markHiddenElements(root);
    try {
      const clone = root.cloneNode(true);
      dropMarkedElements(clone);
      for (const el of clone.querySelectorAll(NOISE_SELECTOR)) el.remove();
      return clone;
    } finally {
      for (const el of marked) el.removeAttribute(HIDDEN_MARKER);
    }
  }

  function getMarkdownForPage() {
    // Prefer <main> or <article> if the page has one — usually the real content,
    // skipping nav bars, sidebars, footers, cookie banners, etc.
    const main =
      document.querySelector("main") ||
      document.querySelector("article") ||
      document.body;

    const container = extractVisibleContent(main);
    absolutizeUrls(container);

    const title = document.title ? `# ${document.title}\n\n` : "";
    return title + turndownService.turndown(container.innerHTML);
  }

  function extract() {
    const selectionMarkdown = getMarkdownForSelection();
    return selectionMarkdown
      ? { markdown: selectionMarkdown, mode: "selection" }
      : { markdown: getMarkdownForPage(), mode: "page" };
  }

  // Only used by the context menu, which has no document of its own to copy
  // from. The popup writes to the clipboard itself, where it can rely on its
  // own document having focus.
  async function copy() {
    const { markdown, mode } = extract();
    try {
      await navigator.clipboard.writeText(markdown);
      return { ok: true, mode, length: markdown.length };
    } catch {
      // The async clipboard API needs a focused document and is blocked
      // outright on some pages; fall back to the old selection-based copy.
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return { ok, mode, length: markdown.length };
    }
  }

  window.__copyAsMarkdown = { extract, copy };
})();
