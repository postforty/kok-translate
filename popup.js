document.addEventListener("DOMContentLoaded", async () => {
  const currentLang = await I18N.initDOM();
  const btn = document.getElementById("start-btn");
  let isActive = false;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
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
      // Ensure content script and i18n module are injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["i18n.js", "content.js"]
      });

      if (isActive) {
        chrome.tabs.sendMessage(tab.id, { action: "stop_hover_selection" });
      } else {
        chrome.tabs.sendMessage(tab.id, { action: "start_hover_selection" });
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
