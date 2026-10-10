document.addEventListener("DOMContentLoaded", async () => {
  const currentLang = await I18N.initDOM();
  const btn = document.getElementById("start-btn");
  let isActive = false;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      return;
    }

    const url = tab.url || "";
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url.startsWith("https://chrome.google.com/webstore")) {
      return; // Do not alert on load, just silently disable
    }

    // Check if content script is active
    chrome.tabs.sendMessage(tab.id, { action: "check_status" }, (response) => {
      if (!chrome.runtime.lastError && response && response.isActive) {
        isActive = true;
        btn.textContent = I18N.t("stopMode", [], currentLang);
        btn.classList.add("active");
      }
    });

    btn.addEventListener("click", async () => {
      // 로컬 파일 (file://) 접근 권한 사전 검사
      if (url.startsWith("file://")) {
        const isAllowed = await chrome.extension.isAllowedFileSchemeAccess();
        if (!isAllowed) {
          alert(I18N.t("alertFileAccessRequired", [], currentLang));
          return;
        }
      }

      // 1. 이미 메인 프레임에 스크립트가 주입되어 있는지 확인 (1ms)
      const checkResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => typeof window.hasInjectedKokTranslate !== "undefined"
      }).catch(() => null);

      const isAlreadyInjected = checkResult && checkResult[0] && checkResult[0].result === true;

      // 2. 주입되지 않은 경우에만 메인 프레임에 스크립트 파일 주입
      if (!isAlreadyInjected) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["i18n.js", "content.js"]
        });
      }

      // 3. 메인 프레임 함수 직접 호출 (iframe 포트 단절 방지 및 0ms 즉시 실행)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (shouldStop) => {
            if (shouldStop) {
              if (typeof window.stopHoverSelectionFromExtension === "function") {
                window.stopHoverSelectionFromExtension();
              }
            } else {
              if (typeof window.startHoverSelectionFromExtension === "function") {
                window.startHoverSelectionFromExtension();
              }
            }
          },
          args: [isActive]
        });
      } catch (directErr) {
        // 직접 실행 실패 시 fallback으로 메인 프레임(frameId: 0) 대상 메시지 전송
        await chrome.tabs.sendMessage(
          tab.id,
          { action: isActive ? "stop_hover_selection" : "start_hover_selection" },
          { frameId: 0 }
        ).catch(() => {});
      }

      window.close();
    });

  } catch (error) {
    console.error("스크립트 주입 또는 상태 확인 실패:", error);
  }
});

document.getElementById("options-btn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("guide-btn").addEventListener("click", async () => {
  const currentLang = await I18N.getEffectiveLanguage();
  const guidePage = currentLang === "en" ? "guide_en.html" : "guide.html";
  chrome.tabs.create({ url: chrome.runtime.getURL(guidePage) });
});
