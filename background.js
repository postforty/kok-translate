importScripts("i18n.js");

const LANGUAGE_NAMES = {
  ko: "Korean",
  en: "English",
  ja: "Japanese",
  zh: "Chinese",
  es: "Spanish",
  fr: "French",
  de: "German",
  ru: "Russian",
  vi: "Vietnamese"
};

function buildSystemInstruction(targetLang = "ko") {
  // auto 설정이 들어오더라도 기본값(ko) 처리
  const safeLang = (!targetLang || targetLang === "auto") ? "ko" : targetLang;
  const targetName = LANGUAGE_NAMES[safeLang] || safeLang;

  return `Translate all titles, headings, and body content of the text into ${targetName} naturally and completely.
Only preserve distinct proper names (like product/brand names such as "Google", "YouTube"), URLs, or code identifiers in their original English; all other general words, headings (e.g. "Getting Started", "Download", "Installation"), and phrases MUST be translated into ${targetName}.
Preserve the structural format using Markdown (e.g. use markdown headers like '### ' for titles/headings, bold '**' for emphasized words or selectable options, bullet/numbered lists for steps, and inline code '\`' for commands or terms).
Output ONLY the translated text in clean Markdown without any conversational text or outer quotes.`;
}

async function translateText(text, apiKey, model = "gemini-3.5-flash-lite", targetLang = "ko") {
  const selectedModel = model || "gemini-3.5-flash-lite";
  console.log(`[KokTranslate] Target: ${targetLang}, Model: ${selectedModel}`);

  const systemPrompt = buildSystemInstruction(targetLang);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        parts: [{ text: text }]
      }]
    })
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error && errJson.error.message) {
        errorDetail = `${response.status} - ${errJson.error.message}`;
      }
    } catch (e) {
      // JSON 파싱 실패 시 기본 상태 코드 유지
    }
    throw new Error(`Gemini API Error: ${errorDetail}`);
  }

  const data = await response.json();
  const candidate = data.candidates && data.candidates[0];

  if (!candidate) {
    throw new Error("No response candidates returned by Gemini API.");
  }

  if (candidate.finishReason === "SAFETY") {
    throw new Error("Content was blocked due to Gemini safety policy.");
  }

  if (candidate.finishReason === "RECITATION") {
    throw new Error("Content was blocked due to recitation check.");
  }

  const translatedText = candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;
  if (!translatedText) {
    throw new Error("Empty translation text received.");
  }

  return translatedText;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate_text") {
    handleTranslation(request.text)
      .then((translatedText) => {
        sendResponse({ success: true, translatedText: translatedText });
      })
      .catch(async (error) => {
        console.error("Translation Error:", error);
        const activeLang = await I18N.getEffectiveLanguage();
        sendResponse({
          success: false,
          translatedText: I18N.t("translationErrorMsg", [error.message], activeLang)
        });
      });

    return true; // 비동기 응답
  }

  if (request.action === "test_connection") {
    testConnection(request.apiKey, request.model)
      .then((res) => {
        sendResponse({ success: true, result: res });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });

    return true; // 비동기 응답
  }
});

async function handleTranslation(originalText) {
  const syncConfig = await chrome.storage.sync.get(["geminiApiKey", "geminiModel", "targetLanguage"]);
  const activeLang = await I18N.getEffectiveLanguage();
  console.log(`[KokTranslate] Loaded targetLanguage from storage: ${syncConfig.targetLanguage}`);

  if (!syncConfig.geminiApiKey) {
    throw new Error(I18N.t("apiKeyRequiredMsg", [], activeLang));
  }
  
  return await translateText(originalText, syncConfig.geminiApiKey, syncConfig.geminiModel, syncConfig.targetLanguage);
}

async function testConnection(apiKey, model = "gemini-3.5-flash-lite") {
  if (!apiKey || !apiKey.trim()) {
    const activeLang = await I18N.getEffectiveLanguage();
    throw new Error(I18N.t("apiKeyRequiredMsg", [], activeLang));
  }
  return await translateText("Hello", apiKey.trim(), model, "ko");
}

// 전역 단축키 수신 (Ctrl+Shift+X)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-translate-mode") {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;
      if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore"))) {
        return;
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ["i18n.js", "content.js"]
        });
      } catch (e) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["i18n.js", "content.js"]
          });
        } catch (err) {
          console.warn("[KokTranslate] Script injection warning:", err);
        }
      }

      chrome.tabs.sendMessage(tab.id, { action: "check_status" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          chrome.tabs.sendMessage(tab.id, { action: "start_hover_selection" }).catch(() => {});
        } else if (response.isActive) {
          chrome.tabs.sendMessage(tab.id, { action: "stop_hover_selection" }).catch(() => {});
        } else {
          chrome.tabs.sendMessage(tab.id, { action: "start_hover_selection" }).catch(() => {});
        }
      });
    } catch (error) {
      console.error("[KokTranslate] Command execution error:", error);
    }
  }
});
