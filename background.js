importScripts("i18n.js");

async function translateText(text, apiKey, model = "gemini-3.1-flash-lite") {
  const promptText = `Translate the following text to Korean naturally.
If it is already in Korean, translate it to English.
Only output the translated text without any conversational text or quotes.

Text to translate:
${text}`;

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
  const syncConfig = await chrome.storage.sync.get(["geminiApiKey", "geminiModel"]);
  const activeLang = await I18N.getEffectiveLanguage();

  if (!syncConfig.geminiApiKey) {
    return I18N.t("apiKeyRequiredMsg", [], activeLang);
  } else {
    return await translateText(originalText, syncConfig.geminiApiKey, syncConfig.geminiModel);
  }
}
