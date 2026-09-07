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

function buildTranslationPrompt(text, targetLang = "ko") {
  // auto 설정이 들어오더라도 기본값(ko) 처리
  const safeLang = (!targetLang || targetLang === "auto") ? "ko" : targetLang;
  const targetName = LANGUAGE_NAMES[safeLang] || safeLang;

  return `Translate the following text into ${targetName} naturally.
Keep proper nouns, brand names, or technical terms in their original language if appropriate.
Output ONLY the translated text without any conversational text or quotes.

Text to translate:
${text}`;
}

async function translateText(text, apiKey, model = "gemini-3.1-flash-lite", targetLang = "ko") {
  const promptText = buildTranslationPrompt(text, targetLang);
  console.log(`[KokTranslate] Target: ${targetLang}, Model: ${model || "gemini-3.1-flash-lite"}`);

  const selectedModel = model || "gemini-3.1-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: promptText }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
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
});

async function handleTranslation(originalText) {
  const syncConfig = await chrome.storage.sync.get(["geminiApiKey", "geminiModel", "targetLanguage"]);
  const activeLang = await I18N.getEffectiveLanguage();
  console.log(`[KokTranslate] Loaded targetLanguage from storage: ${syncConfig.targetLanguage}`);

  if (!syncConfig.geminiApiKey) {
    return I18N.t("apiKeyRequiredMsg", [], activeLang);
  } else {
    return await translateText(originalText, syncConfig.geminiApiKey, syncConfig.geminiModel, syncConfig.targetLanguage);
  }
}
