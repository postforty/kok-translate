document.addEventListener('DOMContentLoaded', async () => {
  // 1. 다국어 DOM 초기화
  await I18N.initDOM();

  // 2. 저장된 설정값 불러오기
  chrome.storage.sync.get(['geminiApiKey', 'geminiModel', 'uiLanguage'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
    
    // 모델 복원 (기본값: gemini-3.1-flash-lite)
    document.getElementById('geminiModel').value = result.geminiModel || 'gemini-3.1-flash-lite';

    // UI 언어 복원
    const uiLang = result.uiLanguage || 'auto';
    document.getElementById('uiLanguage').value = uiLang;
  });

  // 3. 언어 선택 변경 시 실시간 UI 미리보기 반영
  document.getElementById('uiLanguage').addEventListener('change', (e) => {
    const selected = e.target.value;
    let targetLang = selected;
    if (selected === 'auto') {
      const navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      targetLang = navLang.startsWith('ko') ? 'ko' : 'en';
    }
    I18N.applyI18nToDOM(document, targetLang);
  });

  // 4. 비밀번호 표시/숨기기 아이콘 토글
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const apiKeyInput = document.getElementById('apiKey');
  const eyeIconOpen = document.getElementById('eyeIconOpen');
  const eyeIconClosed = document.getElementById('eyeIconClosed');
  
  if (toggleApiKeyBtn && apiKeyInput) {
    toggleApiKeyBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        if (eyeIconOpen) eyeIconOpen.style.display = 'none';
        if (eyeIconClosed) eyeIconClosed.style.display = 'block';
      } else {
        apiKeyInput.type = 'password';
        if (eyeIconOpen) eyeIconOpen.style.display = 'block';
        if (eyeIconClosed) eyeIconClosed.style.display = 'none';
      }
    });
  }
});

// 5. 설정 저장
document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const rawModel = document.getElementById('geminiModel').value.trim();
  const selectedModel = rawModel || 'gemini-3.1-flash-lite';
  const uiLanguage = document.getElementById('uiLanguage').value;
  
  chrome.storage.sync.set({ 
    geminiApiKey: apiKey,
    geminiModel: selectedModel,
    uiLanguage: uiLanguage
  }, async () => {
    const activeLang = await I18N.getEffectiveLanguage();
    I18N.applyI18nToDOM(document, activeLang);

    const status = document.getElementById('status');
    status.textContent = I18N.t('saveSuccess', [], activeLang);
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});

// 6. 기본값 초기화
document.getElementById('resetBtn').addEventListener('click', async () => {
  const activeLang = await I18N.getEffectiveLanguage();
  const confirmMsg = I18N.t('resetConfirm', [], activeLang);
  
  if (!confirm(confirmMsg)) return;

  const defaultModel = 'gemini-3.1-flash-lite';
  const defaultLang = 'auto';

  // 폼 UI 복원
  document.getElementById('geminiModel').value = defaultModel;
  document.getElementById('uiLanguage').value = defaultLang;

  // 스토리지에 기본값 저장 (API 키는 유지)
  chrome.storage.sync.set({
    geminiModel: defaultModel,
    uiLanguage: defaultLang
  }, async () => {
    const newLang = await I18N.getEffectiveLanguage();
    I18N.applyI18nToDOM(document, newLang);

    const status = document.getElementById('status');
    status.textContent = I18N.t('resetSuccess', [], newLang);
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});
