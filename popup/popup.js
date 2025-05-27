// Функционал для всплывающего окна настроек

// Настройки по умолчанию
const defaultSettings = {
  targetLanguage: 'ru',
  highlightColor: '#FFFF00',
  highlightOpacity: 0.3,
  autoTranslate: true
};

// Элементы настроек
const targetLanguageSelect = document.getElementById('target-language');
const highlightColorInput = document.getElementById('highlight-color');
const highlightOpacityInput = document.getElementById('highlight-opacity');
const opacityValueSpan = document.getElementById('opacity-value');
const autoTranslateCheckbox = document.getElementById('auto-translate');
const saveButton = document.getElementById('save-btn');

// Загрузка настроек при открытии всплывающего окна
document.addEventListener('DOMContentLoaded', () => {
  // Загружаем текущие настройки из хранилища
  chrome.storage.sync.get('settings', (data) => {
    const settings = data.settings || defaultSettings;
    
    // Заполняем элементы формы значениями из настроек
    targetLanguageSelect.value = settings.targetLanguage || defaultSettings.targetLanguage;
    highlightColorInput.value = settings.highlightColor || defaultSettings.highlightColor;
    highlightOpacityInput.value = settings.highlightOpacity || defaultSettings.highlightOpacity;
    opacityValueSpan.textContent = settings.highlightOpacity || defaultSettings.highlightOpacity;
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
    autoTranslate: autoTranslateCheckbox.checked
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