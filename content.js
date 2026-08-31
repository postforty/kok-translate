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
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: sans-serif;
        font-size: 14px;
        color: #333;
        max-width: 400px;
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
        padding-bottom: 5px;
        font-weight: bold;
        color: ${TARGET_COLOR};
      }
      .kok-tooltip-close {
        cursor: pointer;
        color: #999;
        font-size: 16px;
      }
      .kok-tooltip-close:hover {
        color: #333;
      }
      .kok-tooltip-content {
        line-height: 1.5;
        white-space: pre-wrap;
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
    let selectedText = [];
    
    function collectTextNodes(rootNode) {
      if (!rootNode) return;

      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (parent && ((parent.closest && parent.closest('.kok-tooltip')) || (parent.closest && parent.closest('.kok-marquee-box')))) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }, false);

      let node;
      while (node = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const nodeRect = range.getBoundingClientRect();
        
        // Check intersection
        if (
          nodeRect.left < rect.right &&
          nodeRect.right > rect.left &&
          nodeRect.top < rect.bottom &&
          nodeRect.bottom > rect.top
        ) {
          selectedText.push(node.nodeValue.trim());
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
    return selectedText.join(' ');
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
        contentDiv.textContent = response.translatedText;
        
        const copyBtn = document.createElement("button");
        copyBtn.className = "kok-tooltip-copy";
        const copyText = typeof I18N !== "undefined" ? I18N.t("copyBtn", [], currentLang) : "복사";
        const copiedText = typeof I18N !== "undefined" ? I18N.t("copiedBtn", [], currentLang) : "복사됨!";
        copyBtn.textContent = copyText;
        copyBtn.onclick = () => {
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
