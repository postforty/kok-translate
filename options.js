document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
  });

  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const apiKeyInput = document.getElementById('apiKey');
  
  if (toggleApiKeyBtn && apiKeyInput) {
    toggleApiKeyBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleApiKeyBtn.textContent = '숨기기';
      } else {
        apiKeyInput.type = 'password';
        toggleApiKeyBtn.textContent = '보기';
      }
    });
  }
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
    const status = document.getElementById('status');
    status.textContent = '설정이 저장되었습니다.';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});
