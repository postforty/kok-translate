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
        z-index: 9999999;
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
        border: 2px dashed ${TARGET_COLOR};
        background: rgba(138, 43, 226, 0.2);
        z-index: 9999999;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  injectStyles();

  function startSelection() {
    window.hasStartedSelection = true;
    document.addEventListener("mousedown", mouseDownHandler, true);
    document.addEventListener("mousemove", mouseMoveHandler, true);
    document.addEventListener("mouseup", mouseUpHandler, true);
    document.addEventListener("click", clickHandler, true);
    document.addEventListener("keydown", escapeHandler);
  }

  function stopSelection() {
    window.hasStartedSelection = false;
    document.removeEventListener("mousedown", mouseDownHandler, true);
    document.removeEventListener("mousemove", mouseMoveHandler, true);
    document.removeEventListener("mouseup", mouseUpHandler, true);
    document.removeEventListener("click", clickHandler, true);
    document.removeEventListener("keydown", escapeHandler);
    
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
    if (e.target.closest('.kok-tooltip') || e.button !== 0) return;

    ignoreNextClick = false; // Reset ignore flag on a new interaction

    // 네이티브 텍스트 선택 방지
    e.preventDefault();
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    marqueeBox = document.createElement("div");
    marqueeBox.className = "kok-marquee-box";
    marqueeBox.style.left = `${startX}px`;
    marqueeBox.style.top = `${startY}px`;
    marqueeBox.style.width = "0px";
    marqueeBox.style.height = "0px";
    document.body.appendChild(marqueeBox);

    clearHighlight();
  }

  function mouseMoveHandler(e) {
    if (e.target.closest('.kok-tooltip')) return;

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

    // 일반 호버 로직
    if (highlightedElement === e.target) return;

    clearHighlight();
    
    highlightedElement = e.target;
    originalOutline = highlightedElement.style.outline;
    originalBackgroundColor = highlightedElement.style.backgroundColor;

    highlightedElement.style.outline = `2px dashed ${TARGET_COLOR}`;
    highlightedElement.style.backgroundColor = TARGET_BG;
  }

  function getTextInRect(rect) {
    let selectedText = [];
    // TreeWalker를 사용하여 모든 텍스트 노드를 순회
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      if (!node.nodeValue.trim()) continue;
      
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
    return selectedText.join(' ');
  }

  function mouseUpHandler(e) {
    if (e.target.closest('.kok-tooltip') || e.button !== 0) return;

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
    if (e.target.closest('.kok-tooltip') || e.button !== 0) return;

    if (ignoreNextClick) {
      ignoreNextClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // 마퀴 박스가 성공적으로 텍스트를 추출해서 stopSelection을 호출했다면 여기로 오지 않음.
    // 여기로 왔다면 단일 클릭이므로 요소 텍스트를 번역함.
    const clickedEl = e.target;
    const textToTranslate = clickedEl.innerText || clickedEl.textContent;

    if (!textToTranslate || textToTranslate.trim() === "") {
      return;
    }

    const x = e.pageX;
    const y = e.pageY;

    stopSelection();
    showTooltip(textToTranslate.trim(), x, y);
  }

  function showTooltip(text, x, y) {
    if (currentTooltip) {
      currentTooltip.remove();
    }

    const tooltip = document.createElement("div");
    tooltip.className = "kok-tooltip";
    
    tooltip.innerHTML = `
      <div class="kok-tooltip-header">
        <span>번역 중...</span>
        <span class="kok-tooltip-close">&times;</span>
      </div>
      <div class="kok-tooltip-content">
        <div class="kok-spinner"></div>
      </div>
    `;

    document.body.appendChild(tooltip);
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
      document.removeEventListener('mousedown', outsideClickHandler);
      
      // Resume selection if translation mode is still globally active
      if (window.isTranslationModeActive) {
        startSelection();
      }
    }

    tooltip.querySelector('.kok-tooltip-close').onclick = closeTooltip;

    function outsideClickHandler(e) {
      if (tooltip && !tooltip.contains(e.target)) {
        ignoreNextClick = true;
        closeTooltip();
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
        headerSpan.textContent = "번역 결과";
        contentDiv.textContent = response.translatedText;
        
        const copyBtn = document.createElement("button");
        copyBtn.className = "kok-tooltip-copy";
        copyBtn.textContent = "복사";
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(response.translatedText).then(() => {
            copyBtn.textContent = "복사됨!";
            setTimeout(() => { copyBtn.textContent = "복사"; }, 2000);
          });
        };
        tooltip.appendChild(copyBtn);
      } else {
        headerSpan.textContent = "오류 발생";
        headerSpan.style.color = "#D13438";
        contentDiv.textContent = response ? response.translatedText : "응답을 받지 못했습니다.";
      }
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "check_status") {
      sendResponse({ isActive: window.isTranslationModeActive === true });
    } else if (request.action === "start_hover_selection") {
      window.isTranslationModeActive = true;
      if (!window.hasStartedSelection && !currentTooltip) {
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
