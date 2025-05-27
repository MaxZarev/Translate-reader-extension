// Функционал для всплывающего окна настроек

// Настройки по умолчанию
const defaultSettings = {
  targetLanguage: 'ru',
  highlightColor: '#FFFF00',
  highlightOpacity: 0.3,
  autoTranslate: true,
  ctrlJumpWords: 5,
  extensionEnabled: true,
  googleApiKey: ''
};

// Элементы настроек
const toggleExtensionBtn = document.getElementById('toggle-extension');
const targetLanguageSelect = document.getElementById('target-language');
const highlightColorInput = document.getElementById('highlight-color');
const highlightOpacityInput = document.getElementById('highlight-opacity');
const opacityValueSpan = document.getElementById('opacity-value');
const ctrlJumpWordsInput = document.getElementById('ctrl-jump-words');
const googleApiKeyInput = document.getElementById('google-api-key');
const autoTranslateCheckbox = document.getElementById('auto-translate');
const saveButton = document.getElementById('save-btn');

// Загрузка настроек при открытии всплывающего окна
document.addEventListener('DOMContentLoaded', () => {
  // Загружаем текущие настройки из хранилища
  chrome.storage.sync.get('settings', (data) => {
    const settings = data.settings || defaultSettings;
    
    // Заполняем элементы формы значениями из настроек
    const extensionEnabled = settings.extensionEnabled !== undefined ? settings.extensionEnabled : defaultSettings.extensionEnabled;
    updateToggleButton(extensionEnabled);
    
    targetLanguageSelect.value = settings.targetLanguage || defaultSettings.targetLanguage;
    highlightColorInput.value = settings.highlightColor || defaultSettings.highlightColor;
    highlightOpacityInput.value = settings.highlightOpacity || defaultSettings.highlightOpacity;
    opacityValueSpan.textContent = settings.highlightOpacity || defaultSettings.highlightOpacity;
    ctrlJumpWordsInput.value = settings.ctrlJumpWords || defaultSettings.ctrlJumpWords;
    googleApiKeyInput.value = settings.googleApiKey || defaultSettings.googleApiKey;
    autoTranslateCheckbox.checked = settings.autoTranslate !== undefined ? settings.autoTranslate : defaultSettings.autoTranslate;
  });
});

// Обновление отображения значения прозрачности
highlightOpacityInput.addEventListener('input', () => {
  opacityValueSpan.textContent = highlightOpacityInput.value;
});

// Сохранение настроек
saveButton.addEventListener('click', () => {
  // Собираем настройки из элементов формы
  const settings = {
    targetLanguage: targetLanguageSelect.value,
    highlightColor: highlightColorInput.value,
    highlightOpacity: parseFloat(highlightOpacityInput.value),
    ctrlJumpWords: parseInt(ctrlJumpWordsInput.value),
    googleApiKey: googleApiKeyInput.value.trim(),
    autoTranslate: autoTranslateCheckbox.checked,
    extensionEnabled: toggleExtensionBtn.classList.contains('active')
  };
  
  // Сохраняем настройки в хранилище
  chrome.storage.sync.set({ settings }, () => {
    // Показываем уведомление об успешном сохранении
    const saveStatus = document.createElement('div');
    saveStatus.textContent = 'Настройки сохранены';
    saveStatus.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #4caf50;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      transition: opacity 0.5s;
    `;
    
    document.body.appendChild(saveStatus);
    
    // Убираем уведомление через 2 секунды
    setTimeout(() => {
      saveStatus.style.opacity = '0';
      setTimeout(() => {
        saveStatus.remove();
      }, 500);
    }, 2000);
  });
});

// Обработчик кнопки переключения расширения
toggleExtensionBtn.addEventListener('click', () => {
  const isActive = toggleExtensionBtn.classList.contains('active');
  updateToggleButton(!isActive);
  
  // Сразу сохраняем изменение состояния
  const currentSettings = {
    extensionEnabled: !isActive
  };
  
  chrome.storage.sync.get('settings', (data) => {
    const settings = { ...data.settings, ...currentSettings };
    chrome.storage.sync.set({ settings }, () => {
      // Отправляем сообщение в content script о изменении состояния
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleExtension',
            enabled: !isActive
          });
        }
      });
    });
  });
});

// Функция обновления внешнего вида кнопки переключения
function updateToggleButton(enabled) {
  const icon = toggleExtensionBtn.querySelector('.toggle-icon');
  const text = toggleExtensionBtn.querySelector('.toggle-text');
  
  if (enabled) {
    toggleExtensionBtn.classList.remove('inactive');
    toggleExtensionBtn.classList.add('active');
    icon.textContent = '🟢';
    text.textContent = 'Расширение включено';
  } else {
    toggleExtensionBtn.classList.remove('active');
    toggleExtensionBtn.classList.add('inactive');
    icon.textContent = '🔴';
    text.textContent = 'Расширение выключено';
  }
} 