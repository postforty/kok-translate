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

      // 2. 주입되지 않은 경우 메인 프레임에 우선 확실하게 스크립트 파일 주입
      if (!isAlreadyInjected) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["i18n.js", "content.js"]
        });
      }

      // 3. 서브프레임(Google Stitch 등 iframe 기반 웹앱) 대상 비동기 확장 주입 (광고 iframe 오류 시에도 무시)
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["i18n.js", "content.js"]
      }).catch(() => {});

      // 4. 메인 프레임 함수 직접 호출 (0ms 즉시 실행)
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
        console.warn("Direct execution fallback:", directErr);
      }

      // 5. 전체 탭 대상 메시지 브로드캐스트 (서브프레임 내부 선택 모드 동시 활성화)
      chrome.tabs.sendMessage(
        tab.id,
        { action: isActive ? "stop_hover_selection" : "start_hover_selection" }
      ).catch(() => {});

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
