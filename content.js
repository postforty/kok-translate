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
  let marqueeBox = null;
  let ignoreNextClick = false;

  const TARGET_COLOR = "#8A2BE2";
  const TARGET_BG = "rgba(138, 43, 226, 0.15)";

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .kok-tooltip {
        position: absolute;
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
      }
      .kok-tooltip-close {
        cursor: pointer;
        color: #999;
        font-size: 16px;
        line-height: 1;
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
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/__([^_]+)__/g, "<strong>$1</strong>")
        .replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, "$1<em>$2</em>$3")
        .replace(/(^|[^\w])_([^_\n]+)_([^\w]|$)/g, "$1<em>$2</em>$3");
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
  }

  function mouseMoveHandler(e) {
    if (isDragging) {
      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      marqueeBox.style.left = `${left}px`;
      marqueeBox.style.top = `${top}px`;
      marqueeBox.style.width = `${width}px`;
      marqueeBox.style.height = `${height}px`;
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

  function getTextInRect(rect) {
    const textPieces = [];
    const blockElements = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "PRE", "SECTION", "ARTICLE", "HEADER", "FOOTER", "TR"]);

    function collectTextNodes(rootNode) {
      if (!rootNode) return;

      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          // 확장 프로그램 UI 배제
          if ((parent.closest && parent.closest('.kok-tooltip')) || (parent.closest && parent.closest('.kok-marquee-box'))) {
            return NodeFilter.FILTER_REJECT;
          }

          // Shadow Root를 가진 커스텀 엘리먼트 호스트의 직접 Light DOM 텍스트 배제
          // (Shadow Root 내부 탐색에서 실제 렌더링된 텍스트가 별도로 수집되므로 중복 방지)
          if (parent.shadowRoot) {
            return NodeFilter.FILTER_REJECT;
          }

          // 화면에 실제로 보이지 않는 요소 배제
          try {
            const style = window.getComputedStyle(parent);
            if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
              return NodeFilter.FILTER_REJECT;
            }
          } catch (err) {}

          return NodeFilter.FILTER_ACCEPT;
        }
      }, false);

      let node;
      while (node = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const nodeRect = range.getBoundingClientRect();
        
        // 크기가 없는(보이지 않는) 요소 배제
        if (nodeRect.width === 0 || nodeRect.height === 0) continue;

        // Check intersection
        if (
          nodeRect.left < rect.right &&
          nodeRect.right > rect.left &&
          nodeRect.top < rect.bottom &&
          nodeRect.bottom > rect.top
        ) {
          const parent = node.parentElement;
          const tag = parent ? parent.tagName.toUpperCase() : "";
          const isHeading = /^H[1-6]$/.test(tag);
          const isBlock = isHeading || blockElements.has(tag);

          textPieces.push({
            text: node.nodeValue.trim(),
            tag: tag,
            isBlock: isBlock,
            isHeading: isHeading,
            rect: nodeRect
          });
        }
      }

      // Open Shadow DOM 내부까지 재귀적으로 텍스트 노드 수집
      const elements = rootNode.querySelectorAll ? rootNode.querySelectorAll("*") : [];
      for (const el of elements) {
        if (el.shadowRoot) {
          collectTextNodes(el.shadowRoot);
        }
      }
    }

    collectTextNodes(document.body);

    if (textPieces.length === 0) return "";

    // 화면 시각적 흐름 순서(Top 우선, 그 다음 Left)로 정렬
    textPieces.sort((a, b) => {
      if (Math.abs(a.rect.top - b.rect.top) > 5) {
        return a.rect.top - b.rect.top;
      }
      return a.rect.left - b.rect.left;
    });

    // 중복 텍스트 조각 제거 (Shadow DOM / Slot / 앵커 링크 중복 방지)
    const dedupedPieces = [];
    for (let i = 0; i < textPieces.length; i++) {
      const current = textPieces[i];
      if (dedupedPieces.length === 0) {
        dedupedPieces.push(current);
        continue;
      }
      const last = dedupedPieces[dedupedPieces.length - 1];

      const isSameText = current.text === last.text;
      const isOverlapping = Math.abs(current.rect.top - last.rect.top) < 15;

      // 동일한 텍스트가 시각적으로 같은 줄/위치에 있으면 중복 제거
      if (isSameText && isOverlapping) {
        continue;
      }

      // 부분 포함 관계이면서 같은 위치인 경우 더 긴 텍스트 유지
      if (isOverlapping && (current.text.includes(last.text) || last.text.includes(current.text))) {
        if (current.text.length > last.text.length) {
          dedupedPieces[dedupedPieces.length - 1] = current;
        }
        continue;
      }

      dedupedPieces.push(current);
    }

    let fullText = "";
    for (let i = 0; i < dedupedPieces.length; i++) {
      const piece = dedupedPieces[i];
      if (i > 0) {
        const prev = dedupedPieces[i - 1];
        const isNewLine = Math.abs(piece.rect.top - prev.rect.top) > 8 || piece.isBlock || prev.isBlock;
        if (piece.isHeading || prev.isHeading) {
          fullText += "\n\n";
        } else if (isNewLine) {
          fullText += "\n";
        } else {
          fullText += " ";
        }
      }
      fullText += piece.text;
    }

    return fullText.trim();
  }

  function mouseUpHandler(e) {
    if (e.button !== 0) return;

    if (!isDragging) return;
    isDragging = false;

    if (marqueeBox) {
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);

      // 드래그가 충분히 일어났는지 확인 (10px 이상 이동)
      if (dx > 10 || dy > 10) {
        e.preventDefault();
        e.stopPropagation();

        const rect = marqueeBox.getBoundingClientRect();
        const extractedText = getTextInRect(rect);
        
        marqueeBox.remove();
        marqueeBox = null;

        if (extractedText.trim() !== "") {
          const x = e.pageX;
          const y = e.pageY;

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

    // 마퀴 박스가 성공적으로 텍스트를 추출해서 stopSelection을 호출했다면 여기로 오지 않음.
    // 여기로 왔다면 단일 클릭이므로 요소 텍스트를 번역함.
    const textToTranslate = clickedEl.innerText || clickedEl.textContent;

    if (!textToTranslate || textToTranslate.trim() === "") {
      return;
    }

    const x = e.pageX;
    const y = e.pageY;

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
        <span>${translatingText}</span>
        <span class="kok-tooltip-close">&times;</span>
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
    const padding = 10;
    
    let finalX = x + 15;
    let finalY = y + 15;

    if (x + rect.width + padding > window.innerWidth + window.scrollX) {
      finalX = x - rect.width - 15;
    }
    if (y + rect.height + padding > window.innerHeight + window.scrollY) {
      finalY = y - rect.height - 15;
    }

    tooltip.style.left = `${finalX}px`;
    tooltip.style.top = `${finalY}px`;

    function closeTooltip() {
      if (currentTooltip === tooltip) {
        tooltip.remove();
        currentTooltip = null;
      }
      document.removeEventListener('mousedown', outsideClickHandler, true);
      
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
      const headerSpan = tooltip.querySelector('.kok-tooltip-header span');

      if (response && response.success) {
        headerSpan.textContent = typeof I18N !== "undefined" ? I18N.t("resultHeader", [], currentLang) : "번역 결과";
        
        // 마크다운 서식 뷰어 옵션 확인
        chrome.storage.sync.get(["enableMarkdown"], (syncData) => {
          const useMarkdown = !syncData || syncData.enableMarkdown !== false;
          if (useMarkdown) {
            contentDiv.classList.remove("plain-text");
            contentDiv.innerHTML = renderMarkdownSafe(response.translatedText);
          } else {
            contentDiv.classList.add("plain-text");
            contentDiv.textContent = response.translatedText;
          }

          // 렌더링 후 툴팁 크기 변화에 맞춰 뷰포트 벗어남 재조정
          const updatedRect = tooltip.getBoundingClientRect();
          let adjustedX = finalX;
          let adjustedY = finalY;
          if (adjustedX + updatedRect.width + padding > window.innerWidth + window.scrollX) {
            adjustedX = Math.max(10, x - updatedRect.width - 15);
          }
          if (adjustedY + updatedRect.height + padding > window.innerHeight + window.scrollY) {
            adjustedY = Math.max(10, y - updatedRect.height - 15);
          }
          tooltip.style.left = `${adjustedX}px`;
          tooltip.style.top = `${adjustedY}px`;
        });
        
        const copyBtn = document.createElement("button");
        copyBtn.className = "kok-tooltip-copy";
        const copyText = typeof I18N !== "undefined" ? I18N.t("copyBtn", [], currentLang) : "복사";
        const copiedText = typeof I18N !== "undefined" ? I18N.t("copiedBtn", [], currentLang) : "복사됨!";
        copyBtn.textContent = copyText;
        copyBtn.onclick = () => {
          // 마크다운 원문(텍스트) 복사
          navigator.clipboard.writeText(response.translatedText).then(() => {
            copyBtn.textContent = copiedText;
            setTimeout(() => { copyBtn.textContent = copyText; }, 2000);
          });
        };
        tooltip.appendChild(copyBtn);
      } else {
        headerSpan.textContent = typeof I18N !== "undefined" ? I18N.t("errorHeader", [], currentLang) : "오류 발생";
        headerSpan.style.color = "#D13438";
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
