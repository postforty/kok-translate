if (!window.hasInjectedKokTranslate) {
  window.hasInjectedKokTranslate = true;

  let highlightedElement = null;
  let originalOutline = "";
  let originalBackgroundColor = "";
  let currentTooltip = null;

  // Marquee variables
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startScrollX = 0;
  let startScrollY = 0;
  let lastClientX = 0;
  let lastClientY = 0;
  let marqueeBox = null;
  let ignoreNextClick = false;
  let autoScrollRafId = null;

  const TARGET_COLOR = "#8A2BE2";
  const TARGET_BG = "rgba(138, 43, 226, 0.15)";

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .kok-tooltip {
        position: fixed;
        margin: 0;
        inset: unset;
        z-index: 2147483647;
        background: #fff;
        border: 2px solid ${TARGET_COLOR};
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        color: #333;
        width: max-content;
        max-width: 480px;
        max-height: 480px;
        word-wrap: break-word;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-sizing: border-box;
      }
      .kok-tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
        padding-bottom: 6px;
        font-weight: bold;
        color: ${TARGET_COLOR};
        font-size: 13px;
        cursor: grab;
        user-select: none;
      }
      .kok-tooltip-header:active {
        cursor: grabbing;
      }
      .kok-tooltip-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .kok-tooltip-toggle-btn {
        background: rgba(138, 43, 226, 0.08);
        border: 1px solid rgba(138, 43, 226, 0.3);
        color: ${TARGET_COLOR};
        border-radius: 4px;
        font-size: 11px;
        padding: 2px 7px;
        cursor: pointer;
        font-weight: 500;
        display: none;
        transition: all 0.15s ease;
      }
      .kok-tooltip-toggle-btn:hover {
        background: ${TARGET_COLOR};
        color: #fff;
      }
      .kok-tooltip-close {
        cursor: pointer;
        color: #999;
        font-size: 16px;
        line-height: 1;
        padding: 0 2px;
      }
      .kok-tooltip-close:hover {
        color: #333;
      }
      .kok-tooltip-content {
        line-height: 1.6;
        white-space: normal;
        overflow-y: auto;
        max-height: 380px;
        padding-right: 4px;
        font-size: 13.5px;
      }
      .kok-tooltip-content.plain-text {
        white-space: pre-wrap;
      }
      .kok-tooltip-content::-webkit-scrollbar {
        width: 6px;
      }
      .kok-tooltip-content::-webkit-scrollbar-thumb {
        background: rgba(138, 43, 226, 0.3);
        border-radius: 3px;
      }
      .kok-tooltip-content::-webkit-scrollbar-thumb:hover {
        background: rgba(138, 43, 226, 0.6);
      }
      .kok-md-p {
        margin: 0 0 8px 0;
      }
      .kok-md-p:last-child {
        margin-bottom: 0;
      }
      .kok-md-h1, .kok-md-h2, .kok-md-h3 {
        margin: 10px 0 6px 0;
        color: #1f2328;
        font-weight: 700;
      }
      .kok-md-h1 { font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
      .kok-md-h2 { font-size: 15px; }
      .kok-md-h3 { font-size: 14px; }
      .kok-md-ul, .kok-md-ol {
        margin: 4px 0 8px 0;
        padding-left: 20px;
      }
      .kok-md-ul li, .kok-md-ol li {
        margin-bottom: 4px;
      }
      .kok-md-blockquote {
        margin: 6px 0 8px 0;
        padding: 6px 12px;
        border-left: 3px solid ${TARGET_COLOR};
        background: rgba(138, 43, 226, 0.06);
        border-radius: 0 4px 4px 0;
        color: #555;
      }
      .kok-md-blockquote p {
        margin: 0;
      }
      .kok-inline-code {
        background: #f1f3f5;
        color: #d63384;
        padding: 2px 5px;
        border-radius: 4px;
        font-family: Consolas, Monaco, monospace;
        font-size: 12px;
      }
      .kok-code-container {
        position: relative;
        margin: 8px 0;
        background: #282c34;
        border-radius: 6px;
        overflow: hidden;
      }
      .kok-code-lang {
        display: block;
        font-size: 10.5px;
        color: #abb2bf;
        background: #21252b;
        padding: 3px 8px;
        text-transform: uppercase;
        font-family: sans-serif;
        font-weight: bold;
      }
      .kok-code-block {
        margin: 0;
        padding: 10px 12px;
        color: #abb2bf;
        background: transparent;
        font-family: Consolas, Monaco, monospace;
        font-size: 12px;
        line-height: 1.45;
        overflow-x: auto;
        white-space: pre;
      }
      .kok-code-block code {
        font-family: inherit;
        color: inherit;
        background: none;
        padding: 0;
      }
      .kok-table-container {
        margin: 8px 0;
        max-width: 100%;
        overflow-x: auto;
        border-radius: 6px;
        border: 1px solid #e1e4e8;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }
      .kok-table-container::-webkit-scrollbar {
        height: 5px;
      }
      .kok-table-container::-webkit-scrollbar-thumb {
        background: rgba(138, 43, 226, 0.3);
        border-radius: 3px;
      }
      .kok-md-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12.5px;
        line-height: 1.5;
        text-align: left;
      }
      .kok-md-table th {
        background: #f8f9fa;
        color: #24292f;
        font-weight: 600;
        padding: 7px 10px;
        border-bottom: 2px solid #e1e4e8;
        border-right: 1px solid #eee;
        white-space: nowrap;
      }
      .kok-md-table th:last-child {
        border-right: none;
      }
      .kok-md-table td {
        padding: 7px 10px;
        border-bottom: 1px solid #eee;
        border-right: 1px solid #eee;
        color: #333;
      }
      .kok-md-table td:last-child {
        border-right: none;
      }
      .kok-md-table tr:last-child td {
        border-bottom: none;
      }
      .kok-md-table tr:nth-child(even) td {
        background: #fafbfc;
      }
      .kok-md-table tr:hover td {
        background: rgba(138, 43, 226, 0.04);
      }
      .kok-tooltip-copy {
        align-self: flex-end;
        background: ${TARGET_COLOR};
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      .kok-tooltip-copy:hover {
        background: #7A1DD2;
      }
      @keyframes kok-spin { 100% { transform: rotate(360deg); } }
      .kok-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(138,43,226,0.3);
        border-radius: 50%;
        border-top-color: ${TARGET_COLOR};
        animation: kok-spin 1s ease-in-out infinite;
      }
      .kok-marquee-box {
        position: fixed;
        margin: 0;
        inset: unset;
        border: 2px dashed ${TARGET_COLOR};
        background: rgba(138, 43, 226, 0.2);
        z-index: 2147483647;
        pointer-events: none;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
  }

  // 안전한 초경량 마크다운 렌더러 (XSS 원천 방지)
  function renderMarkdownSafe(rawText) {
    if (!rawText) return "";

    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    // 1. 코드 블록 보호 (```lang ... ```)
    const codeBlocks = [];
    let text = escapeHtml(rawText).replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      const langBadge = lang ? `<span class="kok-code-lang">${lang}</span>` : "";
      codeBlocks.push(`<div class="kok-code-container">${langBadge}<pre class="kok-code-block"><code>${code.trim()}</code></pre></div>`);
      return `\n@@KOKCODE${idx}@@\n`;
    });

    // 2. 인라인 코드 보호 (`code`)
    const inlineCodes = [];
    text = text.replace(/`([^`\n]+)`/g, (match, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(`<code class="kok-inline-code">${code}</code>`);
      return `@@KOKINLINE${idx}@@`;
    });

    function formatInline(str) {
      return str
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #8A2BE2; text-decoration: underline;">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/__([^_]+)__/g, "<strong>$1</strong>")
        .replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, "$1<em>$2</em>$3")
        .replace(/(^|[\s\(\[\{<])_([^_ \n]+)_(?=[\s\)\]\}>.,!?;:]|$)/g, "$1<em>$2</em>")
        .replace(/&lt;br\s*\/?&gt;/gi, "<br>");
    }

    function splitTableRow(row) {
      let r = row.trim();
      if (r.startsWith("|")) r = r.slice(1);
      if (r.endsWith("|")) r = r.slice(0, -1);
      return r.split("|").map(cell => cell.trim());
    }

    function isTableDelimiter(row) {
      const cells = splitTableRow(row);
      return cells.length > 0 && cells.every(c => /^:?-+:?$/.test(c.trim()));
    }

    function getAlignments(delimiterRow) {
      const cells = splitTableRow(delimiterRow);
      return cells.map(c => {
        const trimmed = c.trim();
        const left = trimmed.startsWith(":");
        const right = trimmed.endsWith(":");
        if (left && right) return "center";
        if (right) return "right";
        return "left";
      });
    }

    const lines = text.split("\n");
    const output = [];
    let inUl = false;
    let inOl = false;
    let inBlockquote = false;

    function closeListsAndQuotes() {
      if (inUl) { output.push("</ul>"); inUl = false; }
      if (inOl) { output.push("</ol>"); inOl = false; }
      if (inBlockquote) { output.push("</blockquote>"); inBlockquote = false; }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const codeMatch = trimmed.match(/^@@KOKCODE(\d+)@@$/);
      if (codeMatch) {
        closeListsAndQuotes();
        output.push(codeBlocks[parseInt(codeMatch[1], 10)]);
        continue;
      }

      if (!trimmed) {
        closeListsAndQuotes();
        continue;
      }

      // 마크다운 테이블 감지
      if (trimmed.includes("|") && i + 1 < lines.length && isTableDelimiter(lines[i + 1].trim())) {
        closeListsAndQuotes();
        const headerRow = trimmed;
        const delimiterRow = lines[i + 1].trim();
        const alignments = getAlignments(delimiterRow);
        const headers = splitTableRow(headerRow);

        let tableHtml = '<div class="kok-table-container"><table class="kok-md-table"><thead><tr>';
        headers.forEach((h, colIdx) => {
          const align = alignments[colIdx] || "left";
          tableHtml += `<th style="text-align:${align}">${formatInline(h)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        i += 1; // 구분선 행 건너뛰기

        // 후속 데이터 행 파싱
        while (i + 1 < lines.length && lines[i + 1].trim().includes("|") && !isTableDelimiter(lines[i + 1].trim())) {
          i += 1;
          const rowCells = splitTableRow(lines[i].trim());
          tableHtml += '<tr>';
          rowCells.forEach((cell, colIdx) => {
            const align = alignments[colIdx] || "left";
            tableHtml += `<td style="text-align:${align}">${formatInline(cell)}</td>`;
          });
          tableHtml += '</tr>';
        }

        tableHtml += '</tbody></table></div>';
        output.push(tableHtml);
        continue;
      }

      if (trimmed.startsWith("### ")) {
        closeListsAndQuotes();
        output.push(`<h3 class="kok-md-h3">${formatInline(trimmed.slice(4))}</h3>`);
        continue;
      } else if (trimmed.startsWith("## ")) {
        closeListsAndQuotes();
        output.push(`<h2 class="kok-md-h2">${formatInline(trimmed.slice(3))}</h2>`);
        continue;
      } else if (trimmed.startsWith("# ")) {
        closeListsAndQuotes();
        output.push(`<h1 class="kok-md-h1">${formatInline(trimmed.slice(2))}</h1>`);
        continue;
      }

      if (trimmed.startsWith("&gt; ") || trimmed.startsWith("&gt;")) {
        if (inUl) { output.push("</ul>"); inUl = false; }
        if (inOl) { output.push("</ol>"); inOl = false; }
        const quoteText = trimmed.replace(/^&gt;\s?/, "");
        if (!inBlockquote) {
          output.push('<blockquote class="kok-md-blockquote">');
          inBlockquote = true;
        }
        output.push(`<p>${formatInline(quoteText)}</p>`);
        continue;
      } else if (inBlockquote) {
        output.push("</blockquote>");
        inBlockquote = false;
      }

      const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
      if (ulMatch) {
        if (inOl) { output.push("</ol>"); inOl = false; }
        if (!inUl) { output.push('<ul class="kok-md-ul">'); inUl = true; }
        output.push(`<li>${formatInline(ulMatch[1])}</li>`);
        continue;
      }

      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        if (inUl) { output.push("</ul>"); inUl = false; }
        if (!inOl) { output.push('<ol class="kok-md-ol">'); inOl = true; }
        output.push(`<li>${formatInline(olMatch[2])}</li>`);
        continue;
      }

      closeListsAndQuotes();
      output.push(`<p class="kok-md-p">${formatInline(trimmed)}</p>`);
    }

    closeListsAndQuotes();

    let htmlResult = output.join("");
    htmlResult = htmlResult.replace(/@@KOKINLINE(\d+)@@/g, (match, idx) => {
      return inlineCodes[parseInt(idx, 10)] || "";
    });

    return htmlResult;
  }

  injectStyles();

  // Shadow DOM 내부 실제 요소를 가져오고 확장 프로그램 자체 UI는 배제하는 헬퍼 함수
  function getDeepTarget(e) {
    const path = e.composedPath ? e.composedPath() : [e.target];
    for (const el of path) {
      if (!el || el === window || el === document || el.nodeType !== 1) continue;
      if ((el.classList && el.classList.contains("kok-tooltip")) ||
          (el.closest && el.closest(".kok-tooltip")) ||
          (el.classList && el.classList.contains("kok-marquee-box")) ||
          (el.closest && el.closest(".kok-marquee-box"))) {
        return null;
      }
      return el;
    }
    return e.target;
  }

  function startSelection() {
    window.hasStartedSelection = true;
    document.addEventListener("mousedown", mouseDownHandler, true);
    document.addEventListener("mousemove", mouseMoveHandler, true);
    document.addEventListener("mouseup", mouseUpHandler, true);
    document.addEventListener("click", clickHandler, true);
    document.addEventListener("keydown", escapeHandler, true);
  }

  function stopSelection() {
    window.hasStartedSelection = false;
    isDragging = false;
    stopAutoScroll();
    document.removeEventListener("mousedown", mouseDownHandler, true);
    document.removeEventListener("mousemove", mouseMoveHandler, true);
    document.removeEventListener("mouseup", mouseUpHandler, true);
    document.removeEventListener("click", clickHandler, true);
    document.removeEventListener("keydown", escapeHandler, true);
    
    clearHighlight();
    if (marqueeBox) {
      marqueeBox.remove();
      marqueeBox = null;
    }
  }

  function clearHighlight() {
    if (highlightedElement) {
      highlightedElement.style.outline = originalOutline;
      highlightedElement.style.backgroundColor = originalBackgroundColor;
      highlightedElement = null;
    }
  }

  function escapeHandler(e) {
    if (e.key === "Escape") {
      window.isTranslationModeActive = false;
      stopSelection();
    }
  }

  function updateMarqueeBox() {
    if (!marqueeBox || !isDragging) return;

    // 드래그 시작점의 현재 뷰포트 좌표 (스크롤 이동 보정)
    const currentStartX = startX - (window.scrollX - startScrollX);
    const currentStartY = startY - (window.scrollY - startScrollY);
    const currentEndX = lastClientX;
    const currentEndY = lastClientY;

    const left = Math.min(currentStartX, currentEndX);
    const top = Math.min(currentStartY, currentEndY);
    const width = Math.abs(currentEndX - currentStartX);
    const height = Math.abs(currentEndY - currentStartY);

    marqueeBox.style.left = `${left}px`;
    marqueeBox.style.top = `${top}px`;
    marqueeBox.style.width = `${width}px`;
    marqueeBox.style.height = `${height}px`;
  }

  function startAutoScroll() {
    if (autoScrollRafId) return;

    function scrollStep() {
      if (!isDragging) {
        stopAutoScroll();
        return;
      }

      const threshold = 60; // 뷰포트 상/하단 60px 이내 접근 시 스크롤
      const maxSpeed = 22;
      let scrollDeltaY = 0;

      // 하단 가장자리 근접 시 아래로 스크롤
      if (lastClientY >= window.innerHeight - threshold) {
        const ratio = Math.min(1, Math.max(0, (lastClientY - (window.innerHeight - threshold)) / threshold));
        scrollDeltaY = Math.max(2, Math.round(ratio * maxSpeed));
      }
      // 상단 가장자리 근접 시 위로 스크롤
      else if (lastClientY <= threshold) {
        const ratio = Math.min(1, Math.max(0, (threshold - lastClientY) / threshold));
        scrollDeltaY = -Math.max(2, Math.round(ratio * maxSpeed));
      }

      if (scrollDeltaY !== 0) {
        const prevScrollY = window.scrollY;
        window.scrollBy(0, scrollDeltaY);
        // 실제 스크롤 발생 시 마퀴 박스 즉시 업데이트
        if (window.scrollY !== prevScrollY) {
          updateMarqueeBox();
        }
      }

      autoScrollRafId = requestAnimationFrame(scrollStep);
    }

    autoScrollRafId = requestAnimationFrame(scrollStep);
  }

  function stopAutoScroll() {
    if (autoScrollRafId) {
      cancelAnimationFrame(autoScrollRafId);
      autoScrollRafId = null;
    }
  }

  function mouseDownHandler(e) {
    if (e.button !== 0) return;
    const target = getDeepTarget(e);
    if (!target) return;

    ignoreNextClick = false; // Reset ignore flag on a new interaction

    // 네이티브 텍스트 선택 방지
    e.preventDefault();
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startScrollX = window.scrollX;
    startScrollY = window.scrollY;
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    marqueeBox = document.createElement("div");
    marqueeBox.className = "kok-marquee-box";
    if (marqueeBox.showPopover) {
      marqueeBox.setAttribute("popover", "manual");
    }
    marqueeBox.style.left = `${startX}px`;
    marqueeBox.style.top = `${startY}px`;
    marqueeBox.style.width = "0px";
    marqueeBox.style.height = "0px";
    document.body.appendChild(marqueeBox);
    if (marqueeBox.showPopover) {
      marqueeBox.showPopover();
    }

    clearHighlight();
    startAutoScroll();
  }

  function mouseMoveHandler(e) {
    if (isDragging) {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      updateMarqueeBox();
      return;
    }

    const target = getDeepTarget(e);
    if (!target) return;

    // 일반 호버 로직
    if (highlightedElement === target) return;

    clearHighlight();
    
    highlightedElement = target;
    originalOutline = highlightedElement.style.outline;
    originalBackgroundColor = highlightedElement.style.backgroundColor;

    highlightedElement.style.outline = `2px dashed ${TARGET_COLOR}`;
    highlightedElement.style.backgroundColor = TARGET_BG;
  }

  function domToMarkdown(node) {
    if (!node) return "";
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toUpperCase();

    // 툴팁이나 마퀴 등 확장 프로그램 UI 배제
    if (node.classList && (node.classList.contains("kok-tooltip") || node.classList.contains("kok-marquee-box"))) {
      return "";
    }

    // 화면 숨김 요소 배제
    if (node.closest && node.closest(".sr-only, .visually-hidden, .screen-reader-text, [aria-hidden='true'], a.anchor, a.header-anchor, a.hash-link, .anchorjs-link")) {
      return "";
    }

    function getChildrenMd(parent) {
      let result = "";
      for (const child of parent.childNodes) {
        result += domToMarkdown(child);
      }
      return result;
    }

    switch (tag) {
      case "CODE":
      case "KBD":
      case "SAMP": {
        if (node.parentElement && node.parentElement.tagName.toUpperCase() === "PRE") {
          return node.textContent || "";
        }
        const text = node.textContent.trim();
        return text ? `\`${text}\`` : "";
      }
      case "PRE": {
        const text = node.textContent.trim();
        return `\n\n\`\`\`\n${text}\n\`\`\`\n\n`;
      }
      case "STRONG":
      case "B": {
        const text = getChildrenMd(node).trim();
        return text ? `**${text}**` : "";
      }
      case "EM":
      case "I": {
        const text = getChildrenMd(node).trim();
        return text ? `*${text}*` : "";
      }
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
        const level = parseInt(tag[1], 10);
        const prefix = "#".repeat(level) + " ";
        return `\n\n${prefix}${getChildrenMd(node).trim()}\n\n`;
      }
      case "P": {
        return `\n\n${getChildrenMd(node).trim()}\n\n`;
      }
      case "BR": {
        return "\n";
      }
      case "BLOCKQUOTE": {
        const text = getChildrenMd(node).trim();
        return "\n\n" + text.split("\n").map(line => `> ${line}`).join("\n") + "\n\n";
      }
      case "LI": {
        return `\n- ${getChildrenMd(node).trim()}`;
      }
      case "UL":
      case "OL": {
        return `\n${getChildrenMd(node).trim()}\n\n`;
      }
      case "TABLE": {
        return "\n\n" + tableToMarkdown(node) + "\n\n";
      }
      default: {
        return getChildrenMd(node);
      }
    }
  }

  function tableToMarkdown(tableEl) {
    if (!tableEl) return "";
    const rows = Array.from(tableEl.querySelectorAll("tr"));
    if (rows.length === 0) return "";

    const mdRows = [];
    let hasHeaderDelimiter = false;
    let maxCols = 0;

    rows.forEach((tr, index) => {
      const cells = Array.from(tr.querySelectorAll("th, td"));
      if (cells.length === 0) return;

      if (cells.length > maxCols) maxCols = cells.length;

      const rowText = cells.map(cell => {
        let cellMd = domToMarkdown(cell).trim().replace(/\|/g, "\\|").replace(/\n+/g, " ");
        return cellMd || " ";
      }).join(" | ");

      mdRows.push(`| ${rowText} |`);

      const isThRow = cells.some(c => c.tagName.toUpperCase() === "TH");
      if ((isThRow || index === 0) && !hasHeaderDelimiter) {
        hasHeaderDelimiter = true;
        const delimiter = Array(cells.length).fill("---").join(" | ");
        mdRows.push(`| ${delimiter} |`);
      }
    });

    if (!hasHeaderDelimiter && mdRows.length > 0) {
      const delimiter = Array(maxCols || 1).fill("---").join(" | ");
      mdRows.splice(1, 0, `| ${delimiter} |`);
    }

    return mdRows.join("\n");
  }

  function getTextInRect(rect) {
    const BLOCK_TAGS = new Set([
      "P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6",
      "LI", "BLOCKQUOTE", "PRE", "SECTION", "ARTICLE",
      "HEADER", "FOOTER", "ASIDE", "NAV", "MAIN",
      "FIGURE", "FIGCAPTION", "TABLE", "TR", "HR", "DT", "DD"
    ]);

    function getClosestBlock(node) {
      let cur = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        if (BLOCK_TAGS.has(cur.tagName.toUpperCase())) {
          return cur;
        }
        cur = cur.parentElement;
      }
      return document.body;
    }

    const blockMap = new Map();
    const orderedBlocks = [];

    function getOrCreateBlock(blockEl) {
      if (!blockMap.has(blockEl)) {
        const bRect = blockEl.getBoundingClientRect();
        const blockObj = {
          element: blockEl,
          tag: blockEl.tagName ? blockEl.tagName.toUpperCase() : "DIV",
          rect: bRect,
          items: []
        };
        blockMap.set(blockEl, blockObj);
        orderedBlocks.push(blockObj);
      }
      return blockMap.get(blockEl);
    }

    function collectFromRoot(rootNode) {
      if (!rootNode) return;

      // 교차하는 TABLE 요소 사전 수집
      const allTables = rootNode.querySelectorAll ? Array.from(rootNode.querySelectorAll("table")) : [];
      const intersectingTables = new Set();
      for (const table of allTables) {
        const tRect = table.getBoundingClientRect();
        if (
          tRect.left < rect.right &&
          tRect.right > rect.left &&
          tRect.top < rect.bottom &&
          tRect.bottom > rect.top
        ) {
          intersectingTables.add(table);
        }
      }

      const walker = document.createTreeWalker(
        rootNode,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const tag = node.tagName.toUpperCase();

              // 확장 프로그램 자체 UI 배제
              if (node.classList && (node.classList.contains("kok-tooltip") || node.classList.contains("kok-marquee-box"))) {
                return NodeFilter.FILTER_REJECT;
              }

              // 화면 숨김 요소 및 스크린 리더 숨김 클래스 배제
              if (node.closest && node.closest(".sr-only, .visually-hidden, .screen-reader-text, [aria-hidden='true'], a.anchor, a.header-anchor, a.hash-link, .anchorjs-link")) {
                return NodeFilter.FILTER_REJECT;
              }

              try {
                const style = window.getComputedStyle(node);
                if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
                  return NodeFilter.FILTER_REJECT;
                }
                if (style.clip === "rect(0px, 0px, 0px, 0px)" || style.clip === "rect(0, 0, 0, 0)" || style.clipPath === "inset(50%)") {
                  return NodeFilter.FILTER_REJECT;
                }
              } catch (err) {}

              // 교차하는 TABLE을 만났을 때 수락하여 단일 블록으로 처리
              if (tag === "TABLE" && intersectingTables.has(node)) {
                return NodeFilter.FILTER_ACCEPT;
              }

              // 다른 테이블 내부 요소는 개별 순회 배제
              if (node.closest && node.closest("table")) {
                const tbl = node.closest("table");
                if (intersectingTables.has(tbl)) {
                  return NodeFilter.FILTER_REJECT;
                }
              }

              // <BR> 태그는 줄바꿈 항목으로 수락
              if (tag === "BR") {
                return NodeFilter.FILTER_ACCEPT;
              }

              return NodeFilter.FILTER_SKIP;
            }

            if (node.nodeType === Node.TEXT_NODE) {
              if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;

              if (parent.closest && parent.closest("table")) {
                const tbl = parent.closest("table");
                if (intersectingTables.has(tbl)) {
                  return NodeFilter.FILTER_REJECT;
                }
              }

              return NodeFilter.FILTER_ACCEPT;
            }

            return NodeFilter.FILTER_REJECT;
          }
        },
        false
      );

      let currNode;
      while ((currNode = walker.nextNode())) {
        if (currNode.nodeType === Node.ELEMENT_NODE) {
          const tag = currNode.tagName.toUpperCase();
          if (tag === "TABLE") {
            const tRect = currNode.getBoundingClientRect();
            const mdTable = tableToMarkdown(currNode);
            if (mdTable.trim()) {
              const blockObj = {
                element: currNode,
                tag: "TABLE",
                rect: tRect,
                items: [{ text: mdTable.trim(), isTable: true }]
              };
              blockMap.set(currNode, blockObj);
              orderedBlocks.push(blockObj);
            }
          } else if (tag === "BR") {
            const blockEl = getClosestBlock(currNode);
            const blockObj = getOrCreateBlock(blockEl);
            blockObj.items.push({ text: "\n", isBr: true });
          }
          continue;
        }

        if (currNode.nodeType === Node.TEXT_NODE) {
          const range = document.createRange();
          range.selectNodeContents(currNode);
          const nodeRect = range.getBoundingClientRect();

          if (nodeRect.width <= 2 || nodeRect.height <= 2) continue;

          // 드래그 영역과 교차하는지 검사
          if (
            nodeRect.left < rect.right &&
            nodeRect.right > rect.left &&
            nodeRect.top < rect.bottom &&
            nodeRect.bottom > rect.top
          ) {
            const parent = currNode.parentElement;
            const blockEl = getClosestBlock(parent);
            const blockObj = getOrCreateBlock(blockEl);

            const raw = currNode.nodeValue;
            const hasLead = /^\s/.test(raw);
            const hasTrail = /\s$/.test(raw);
            let cleanText = raw.replace(/\s+/g, " ").trim();
            if (!cleanText) continue;

            // 인라인 마크다운 서식 래핑 (code, strong, em)
            if (parent) {
              const codeAncestor = parent.closest("code, kbd, samp");
              if (codeAncestor && !codeAncestor.closest("pre")) {
                cleanText = `\`${cleanText}\``;
              } else {
                if (parent.closest("strong, b")) {
                  cleanText = `**${cleanText}**`;
                }
                if (parent.closest("em, i")) {
                  cleanText = `*${cleanText}*`;
                }
              }
            }

            blockObj.items.push({
              text: cleanText,
              hasLeadingSpace: hasLead,
              hasTrailingSpace: hasTrail,
              rect: nodeRect
            });
          }
        }
      }

      // Shadow DOM 내부도 재귀 탐색
      if (rootNode.querySelectorAll) {
        const potentialCustomElements = rootNode.querySelectorAll("*");
        for (const el of potentialCustomElements) {
          if (el.shadowRoot) {
            const elRect = el.getBoundingClientRect();
            if (
              elRect.left < rect.right &&
              elRect.right > rect.left &&
              elRect.top < rect.bottom &&
              elRect.bottom > rect.top
            ) {
              collectFromRoot(el.shadowRoot);
            }
          }
        }
      }
    }

    collectFromRoot(document.body);

    const nonEmptyBlocks = orderedBlocks.filter(b => b.items.length > 0);
    if (nonEmptyBlocks.length === 0) return "";

    // 블록 간 시각적 순서(Top 우선, 그 다음 Left) 정렬
    // 블록 내부의 items는 DOM 문서 순서가 100% 보존됨
    nonEmptyBlocks.sort((a, b) => {
      if (Math.abs(a.rect.top - b.rect.top) > 10) {
        return a.rect.top - b.rect.top;
      }
      return a.rect.left - b.rect.left;
    });

    const blockTexts = [];
    for (const block of nonEmptyBlocks) {
      if (block.tag === "TABLE") {
        blockTexts.push({ text: block.items[0].text, tag: "TABLE" });
        continue;
      }

      let bText = "";
      for (let i = 0; i < block.items.length; i++) {
        const item = block.items[i];
        if (item.isBr) {
          bText = bText.trimEnd() + "\n";
          continue;
        }

        if (bText === "" || bText.endsWith("\n")) {
          bText += item.text;
        } else {
          const prev = block.items[i - 1];
          // 구두점으로 시작하는 경우 공백 없이 바로 붙임 (: , . ! ? ; ) ] ' " 등)
          const isPunctuation = /^[:.,!?;)\]’”]/.test(item.text);
          // 이전 아이템이 여는 괄호로 끝나는 경우 공백 없이 바로 붙임
          const prevIsOpenBracket = /[(\[“‘]$/.test(prev ? prev.text : "");

          if (isPunctuation || prevIsOpenBracket) {
            bText += item.text;
          } else {
            bText += " " + item.text;
          }
        }
      }

      bText = bText.trim();
      if (!bText) continue;

      // 헤딩 블록 접두사 (#)
      if (/^H[1-6]$/.test(block.tag) && !bText.startsWith("#")) {
        const hLvl = parseInt(block.tag[1], 10);
        bText = `${"#".repeat(hLvl)} ${bText}`;
      } else if (block.tag === "LI" && !bText.startsWith("- ")) {
        bText = `- ${bText}`;
      } else if (block.tag === "BLOCKQUOTE" && !bText.startsWith("> ")) {
        bText = bText.split("\n").map(line => `> ${line}`).join("\n");
      } else if (block.tag === "PRE" && !bText.startsWith("```")) {
        bText = `\`\`\`\n${bText}\n\`\`\``;
      }

      blockTexts.push({ text: bText, tag: block.tag });
    }

    let fullText = "";
    for (let i = 0; i < blockTexts.length; i++) {
      const b = blockTexts[i];
      if (i === 0) {
        fullText += b.text;
      } else {
        const prevB = blockTexts[i - 1];
        const isMajorBlock = new Set(["P", "TABLE", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "SECTION", "ARTICLE"]);
        if (isMajorBlock.has(b.tag) || isMajorBlock.has(prevB.tag)) {
          fullText += "\n\n" + b.text;
        } else if (b.tag === "LI" && prevB.tag === "LI") {
          fullText += "\n" + b.text;
        } else {
          fullText += "\n\n" + b.text;
        }
      }
    }

    return fullText.trim();
  }

  function mouseUpHandler(e) {
    if (e.button !== 0) return;

    if (!isDragging) return;
    isDragging = false;
    stopAutoScroll();

    if (marqueeBox) {
      const currentStartX = startX - (window.scrollX - startScrollX);
      const currentStartY = startY - (window.scrollY - startScrollY);
      const dx = Math.abs(e.clientX - currentStartX);
      const dy = Math.abs(e.clientY - currentStartY);

      // 드래그가 충분히 일어났는지 확인 (10px 이상 이동)
      if (dx > 10 || dy > 10) {
        e.preventDefault();
        e.stopPropagation();

        const rect = marqueeBox.getBoundingClientRect();
        const extractedText = getTextInRect(rect);
        
        marqueeBox.remove();
        marqueeBox = null;

        if (extractedText.trim() !== "") {
          const x = e.clientX;
          const y = e.clientY;

          stopSelection();
          showTooltip(extractedText.trim(), x, y);
        }
      } else {
        // 클릭으로 간주
        marqueeBox.remove();
        marqueeBox = null;
      }
    }
  }

  function clickHandler(e) {
    if (e.button !== 0) return;

    if (ignoreNextClick) {
      ignoreNextClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const clickedEl = getDeepTarget(e);
    if (!clickedEl) return;

    e.preventDefault();
    e.stopPropagation();

    // 단일 클릭 시 마크다운 서식(코드, 볼드, 헤딩, 표 등) 보존 추출
    let textToTranslate = "";
    const tableAncestor = clickedEl.closest("table");
    if (tableAncestor) {
      textToTranslate = tableToMarkdown(tableAncestor);
    } else {
      textToTranslate = domToMarkdown(clickedEl).trim();
    }

    if (!textToTranslate) {
      textToTranslate = (clickedEl.innerText || clickedEl.textContent || "").trim();
    }

    if (!textToTranslate || textToTranslate.trim() === "") {
      return;
    }

    const x = e.clientX;
    const y = e.clientY;

    stopSelection();
    showTooltip(textToTranslate.trim(), x, y);
  }

  async function showTooltip(text, x, y) {
    if (currentTooltip) {
      currentTooltip.remove();
    }

    const currentLang = typeof I18N !== "undefined" ? await I18N.getEffectiveLanguage() : "ko";
    const translatingText = typeof I18N !== "undefined" ? I18N.t("translatingHeader", [], currentLang) : "번역 중...";

    const tooltip = document.createElement("div");
    tooltip.className = "kok-tooltip";
    if (tooltip.showPopover) {
      tooltip.setAttribute("popover", "manual");
    }
    
    tooltip.innerHTML = `
      <div class="kok-tooltip-header">
        <span class="kok-tooltip-title">${translatingText}</span>
        <div class="kok-tooltip-header-actions">
          <button type="button" class="kok-tooltip-toggle-btn" style="display: none;"></button>
          <span class="kok-tooltip-close">&times;</span>
        </div>
      </div>
      <div class="kok-tooltip-content">
        <div class="kok-spinner"></div>
      </div>
    `;

    document.body.appendChild(tooltip);
    if (tooltip.showPopover) {
      tooltip.showPopover();
    }
    currentTooltip = tooltip;

    const rect = tooltip.getBoundingClientRect();
    const padding = 12;
    
    // 뷰포트 고정(Fixed) 좌표계 계산
    let finalX = x + 15;
    let finalY = y + 15;

    if (finalX + rect.width + padding > window.innerWidth) {
      finalX = Math.max(padding, x - rect.width - 15);
    }
    if (finalY + rect.height + padding > window.innerHeight) {
      finalY = Math.max(padding, y - rect.height - 15);
    }

    tooltip.style.left = `${finalX}px`;
    tooltip.style.top = `${finalY}px`;

    // 툴팁 헤더 드래그 기능 구현
    const headerEl = tooltip.querySelector('.kok-tooltip-header');
    let isHeaderDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let tooltipInitialLeft = 0;
    let tooltipInitialTop = 0;

    function onHeaderMouseMove(e) {
      if (!isHeaderDragging) return;
      e.preventDefault();
      e.stopPropagation();

      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      let newLeft = tooltipInitialLeft + deltaX;
      let newTop = tooltipInitialTop + deltaY;

      const tRect = tooltip.getBoundingClientRect();
      newLeft = Math.max(0, Math.min(window.innerWidth - tRect.width, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - tRect.height, newTop));

      tooltip.style.left = `${newLeft}px`;
      tooltip.style.top = `${newTop}px`;
    }

    function onHeaderMouseUp(e) {
      if (!isHeaderDragging) return;
      isHeaderDragging = false;
      headerEl.style.cursor = 'grab';
      document.removeEventListener('mousemove', onHeaderMouseMove, true);
      document.removeEventListener('mouseup', onHeaderMouseUp, true);
    }

    function onHeaderMouseDown(e) {
      if (e.target.closest('.kok-tooltip-close') || e.target.closest('.kok-tooltip-toggle-btn')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      isHeaderDragging = true;
      headerEl.style.cursor = 'grabbing';
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      const currentRect = tooltip.getBoundingClientRect();
      tooltipInitialLeft = currentRect.left;
      tooltipInitialTop = currentRect.top;

      document.addEventListener('mousemove', onHeaderMouseMove, true);
      document.addEventListener('mouseup', onHeaderMouseUp, true);
    }

    headerEl.addEventListener('mousedown', onHeaderMouseDown);

    function closeTooltip() {
      if (currentTooltip === tooltip) {
        tooltip.remove();
        currentTooltip = null;
      }
      document.removeEventListener('mousedown', outsideClickHandler, true);
      document.removeEventListener('mousemove', onHeaderMouseMove, true);
      document.removeEventListener('mouseup', onHeaderMouseUp, true);
      
      // Resume selection if translation mode is still globally active
      if (window.isTranslationModeActive) {
        stopSelection();
        startSelection();
      }
    }

    tooltip.querySelector('.kok-tooltip-close').onclick = closeTooltip;

    function outsideClickHandler(e) {
      if (tooltip) {
        const path = e.composedPath ? e.composedPath() : [e.target];
        const isInsideTooltip = path.some(el => el && (el === tooltip || (el.classList && el.classList.contains("kok-tooltip"))));
        if (!isInsideTooltip) {
          ignoreNextClick = true;
          closeTooltip();
        }
      }
    }

    setTimeout(() => {
      document.addEventListener('mousedown', outsideClickHandler, true);
    }, 0);

    chrome.runtime.sendMessage({
      action: "translate_text",
      text: text
    }, (response) => {
      if (!currentTooltip || currentTooltip !== tooltip) return;

      const contentDiv = tooltip.querySelector('.kok-tooltip-content');
      const titleSpan = tooltip.querySelector('.kok-tooltip-title');
      const toggleBtn = tooltip.querySelector('.kok-tooltip-toggle-btn');

      if (response && response.success) {
        const originalText = text;
        const originalHtml = renderMarkdownSafe(originalText);
        let translatedHtml = "";
        let isOriginalView = false;
        let useMarkdown = true;

        const origLabel = typeof I18N !== "undefined" ? I18N.t("toggleOriginal", [], currentLang) : "원문";
        const transLabel = typeof I18N !== "undefined" ? I18N.t("toggleTranslation", [], currentLang) : "번역";
        const resultHeader = typeof I18N !== "undefined" ? I18N.t("resultHeader", [], currentLang) : "번역 결과";
        const originalHeader = typeof I18N !== "undefined" ? I18N.t("originalHeader", [], currentLang) : "원문";

        function updateView() {
          const currentText = isOriginalView ? originalText : response.translatedText;
          const currentHtml = isOriginalView ? originalHtml : translatedHtml;

          if (useMarkdown) {
            contentDiv.classList.remove("plain-text");
            contentDiv.innerHTML = currentHtml;
          } else {
            contentDiv.classList.add("plain-text");
            contentDiv.textContent = currentText;
          }

          titleSpan.textContent = isOriginalView ? originalHeader : resultHeader;
          toggleBtn.textContent = isOriginalView ? transLabel : origLabel;

          // 렌더링 후 툴팁 크기 변화에 맞춰 뷰포트 벗어남 재조정
          const updatedRect = tooltip.getBoundingClientRect();
          let currentLeft = parseInt(tooltip.style.left, 10);
          let currentTop = parseInt(tooltip.style.top, 10);
          if (isNaN(currentLeft)) currentLeft = finalX;
          if (isNaN(currentTop)) currentTop = finalY;

          if (currentLeft + updatedRect.width + padding > window.innerWidth) {
            currentLeft = Math.max(padding, window.innerWidth - updatedRect.width - padding);
          }
          if (currentTop + updatedRect.height + padding > window.innerHeight) {
            currentTop = Math.max(padding, window.innerHeight - updatedRect.height - padding);
          }
          tooltip.style.left = `${currentLeft}px`;
          tooltip.style.top = `${currentTop}px`;
        }

        // 마크다운 서식 뷰어 옵션 확인 및 초기 렌더링
        chrome.storage.sync.get(["enableMarkdown"], (syncData) => {
          useMarkdown = !syncData || syncData.enableMarkdown !== false;
          translatedHtml = renderMarkdownSafe(response.translatedText);
          updateView();
        });

        // 원문 / 번역문 토글 기능 활성화
        toggleBtn.textContent = origLabel;
        toggleBtn.style.display = "inline-block";

        toggleBtn.onclick = (e) => {
          e.stopPropagation();
          isOriginalView = !isOriginalView;
          updateView();
        };
        
        const copyBtn = document.createElement("button");
        copyBtn.className = "kok-tooltip-copy";
        const copyText = typeof I18N !== "undefined" ? I18N.t("copyBtn", [], currentLang) : "복사";
        const copiedText = typeof I18N !== "undefined" ? I18N.t("copiedBtn", [], currentLang) : "복사됨!";
        copyBtn.textContent = copyText;
        copyBtn.onclick = () => {
          const textToCopy = isOriginalView ? originalText : response.translatedText;
          navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.textContent = copiedText;
            setTimeout(() => { copyBtn.textContent = copyText; }, 2000);
          });
        };
        tooltip.appendChild(copyBtn);
      } else {
        titleSpan.textContent = typeof I18N !== "undefined" ? I18N.t("errorHeader", [], currentLang) : "오류 발생";
        titleSpan.style.color = "#D13438";
        const defaultNoResponse = typeof I18N !== "undefined" ? I18N.t("noResponseError", [], currentLang) : "응답을 받지 못했습니다.";
        contentDiv.classList.add("plain-text");
        contentDiv.textContent = response ? response.translatedText : defaultNoResponse;
      }
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "check_status") {
      sendResponse({ isActive: window.isTranslationModeActive === true });
    } else if (request.action === "start_hover_selection") {
      window.isTranslationModeActive = true;
      // 기존 리스너 및 상태 안전 정리 후 시작
      stopSelection();
      if (!currentTooltip) {
        startSelection();
      }
    } else if (request.action === "stop_hover_selection") {
      window.isTranslationModeActive = false;
      stopSelection();
      if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
      }
    }
  });
}
