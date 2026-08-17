// KokTranslate - 다국어 (i18n) 모듈
(function (global) {
  // 중복 선언 방지 가드
  if (global.I18N) return;

  const I18N = {
    dictionaries: {
      ko: {
        extName: "KokTranslate",
        extDescription: "웹페이지 요소를 콕! 찍어 바로 번역하는 LLM 기반 크롬 확장 프로그램",

        // Popup UI
        popupSubtitle: "번역할 요소를 직접 선택해 보세요!",
        startMode: "콕! 번역 모드 켜기",
        stopMode: "번역 모드 끄기 (Esc)",
        guideBtn: "설명서",
        optionsBtn: "설정",
        alertProtectedPage: "이 페이지에서는 확장 프로그램을 사용할 수 없습니다.",
        alertScriptFailed: "스크립트 주입 또는 상태 확인에 실패했습니다.",

        // Options UI
        optionsTitle: "KokTranslate 설정",
        apiKeyLabel: "Gemini API Key",
        apiKeyPlaceholder: "AI Studio에서 발급받은 API 키 입력",
        toggleApiKeyTitle: "비밀번호 표시/숨기기",
        geminiModelLabel: "Gemini 모델 (Model)",
        geminiModelPlaceholder: "gemini-3.1-flash-lite",
        geminiModelDesc: "기본값(gemini-3.1-flash-lite) 외에 사용할 모델 ID를 직접 입력할 수 있습니다.",
        uiLanguageLabel: "UI 언어 (Language)",
        langAuto: "시스템 기본값 (자동 감지)",
        langKo: "한국어 (Korean)",
        langEn: "English",
        saveBtn: "저장하기",
        saveSuccess: "설정이 저장되었습니다.",
        resetBtn: "기본값 초기화",
        resetConfirm: "설정을 기본값으로 초기화하시겠습니까? (API 키는 유지됩니다)",
        resetSuccess: "기본값으로 초기화되었습니다.",

        // Content Script UI (Tooltip)
        translatingHeader: "번역 중...",
        resultHeader: "번역 결과",
        errorHeader: "오류 발생",
        copyBtn: "복사",
        copiedBtn: "복사됨!",
        noResponseError: "응답을 받지 못했습니다.",

        // Background / API Messages
        apiKeyRequiredMsg: "API Key가 필요합니다. KokTranslate 확장 프로그램 설정에서 Gemini API Key를 입력해주세요.",
        translationErrorMsg: "오류 발생: $1"
      },
      en: {
        extName: "KokTranslate",
        extDescription: "Point and click or drag web page elements to translate instantly with LLM.",

        // Popup UI
        popupSubtitle: "Select elements directly to translate!",
        startMode: "Start Point & Click Mode",
        stopMode: "Stop Translation Mode (Esc)",
        guideBtn: "Guide",
        optionsBtn: "Settings",
        alertProtectedPage: "The extension cannot be used on this page.",
        alertScriptFailed: "Failed to inject script or check status.",

        // Options UI
        optionsTitle: "KokTranslate Settings",
        apiKeyLabel: "Gemini API Key",
        apiKeyPlaceholder: "Enter API Key from Google AI Studio",
        toggleApiKeyTitle: "Show/Hide API Key",
        geminiModelLabel: "Gemini Model",
        geminiModelPlaceholder: "gemini-3.1-flash-lite",
        geminiModelDesc: "Custom model ID can be specified (default: gemini-3.1-flash-lite).",
        uiLanguageLabel: "UI Language",
        langAuto: "System Default (Auto Detect)",
        langKo: "한국어 (Korean)",
        langEn: "English",
        saveBtn: "Save Settings",
        saveSuccess: "Settings saved successfully.",
        resetBtn: "Reset Defaults",
        resetConfirm: "Reset settings to defaults? (API Key will be kept)",
        resetSuccess: "Settings reset to defaults.",

        // Content Script UI (Tooltip)
        translatingHeader: "Translating...",
        resultHeader: "Translation Result",
        errorHeader: "Error Occurred",
        copyBtn: "Copy",
        copiedBtn: "Copied!",
        noResponseError: "No response received from background service.",

        // Background / API Messages
        apiKeyRequiredMsg: "Gemini API Key is required. Please enter your API Key in KokTranslate extension settings.",
        translationErrorMsg: "Error: $1"
      }
    },

    // 현재 적용할 언어 코드 ('ko' 또는 'en') 비동기 조회
    async getEffectiveLanguage() {
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
          const result = await chrome.storage.sync.get(["uiLanguage"]);
          const stored = result.uiLanguage;
          if (stored === "ko" || stored === "en") {
            return stored;
          }
        }
      } catch (e) {
        console.warn("i18n storage access failed, falling back to navigator:", e);
      }
      const navLang = (typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage) || "en").toLowerCase();
      return navLang.startsWith("ko") ? "ko" : "en";
    },

    // 문자열 번역 반환 (플레이스홀더 치환 포함)
    t(key, params = [], lang = "ko") {
      const dict = this.dictionaries[lang] || this.dictionaries.ko;
      let text = dict[key] || this.dictionaries.ko[key] || key;
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          text = text.replace(new RegExp(`\\$${index + 1}`, "g"), param);
        });
      }
      return text;
    },

    // DOM 요소의 data-i18n, data-i18n-title, data-i18n-placeholder 속성을 기반으로 다국어 적용
    applyI18nToDOM(root = document, lang = "ko") {
      if (!root || !root.querySelectorAll) return;

      // 텍스트 내용 적용
      root.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const text = this.t(key, [], lang);
        if (text) el.textContent = text;
      });

      // title 속성 적용
      root.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        const text = this.t(key, [], lang);
        if (text) el.setAttribute("title", text);
      });

      // placeholder 속성 적용
      root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        const text = this.t(key, [], lang);
        if (text) el.setAttribute("placeholder", text);
      });

      // html lang 속성 업데이트
      if (document.documentElement) {
        document.documentElement.lang = lang;
      }
    },

    // 비동기로 현재 언어를 가져와 DOM에 즉시 적용
    async initDOM(root = document) {
      const lang = await this.getEffectiveLanguage();
      this.applyI18nToDOM(root, lang);
      return lang;
    }
  };

  // 전역 객체에 안전하게 할당
  global.I18N = I18N;
})(typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this));
