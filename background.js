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

  return `Translate all titles, headings, and body content of the following text into ${targetName} naturally and completely.
Only preserve distinct proper names (like product/brand names such as "Antigravity"), URLs, or code identifiers in their original English; all other general words, headings (e.g. "Getting Started", "Download", "Installation"), and phrases MUST be translated into ${targetName}.
Preserve the structural format using Markdown (e.g. use markdown headers like '### ' for titles/headings, bold '**' for emphasized words or selectable options, bullet/numbered lists for steps, and inline code '\`' for commands or terms).
Output ONLY the translated text in clean Markdown without any conversational text or outer quotes.

Text to translate:
${text}`;
}

async function translateText(text, apiKey, model = "gemini-3.5-flash-lite", targetLang = "ko") {
  const promptText = buildTranslationPrompt(text, targetLang);
  console.log(`[KokTranslate] Target: ${targetLang}, Model: ${model || "gemini-3.5-flash-lite"}`);

  const selectedModel = model || "gemini-3.5-flash-lite";
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
