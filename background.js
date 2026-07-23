async function translateText(text, apiKey) {
  const promptText = `Translate the following text to Korean naturally.
If it is already in Korean, translate it to English.
Only output the translated text without any conversational text or quotes.

Text to translate:
${text}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
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
      .catch(error => {
        console.error("Translation Error:", error);
        sendResponse({
          success: false,
          translatedText: `오류 발생: ${error.message}`
        });
      });

    return true; // 비동기 응답
  }
});

async function handleTranslation(originalText) {
  const syncConfig = await chrome.storage.sync.get(["geminiApiKey"]);

  if (!syncConfig.geminiApiKey) {
    return `API Key가 필요합니다. KokTranslate 확장 프로그램 설정에서 Gemini API Key를 입력해주세요.`;
  } else {
    return await translateText(originalText, syncConfig.geminiApiKey);
  }
}
