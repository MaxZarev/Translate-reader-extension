// Фоновый скрипт для расширения Translate Reader

// Информация о расширении
const EXTENSION_VERSION = '2.1.0';
const EXTENSION_REPO = 'https://github.com/MaxZarev/translate-reader-extension';

// API ключ будет загружаться из настроек
let API_KEY = '';

// Кэш переводов для уменьшения количества запросов к API
const translationCache = {};

// Логирование запуска расширения
console.log(`Translate Reader v${EXTENSION_VERSION}: Фоновый скрипт инициализирован`);

// Загружаем API ключ из настроек при запуске
loadApiKey();

// Обработчик сообщений от контент-скрипта
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Translate Reader: Получено сообщение', request);
  
  if (request.action === 'translate') {
    console.log(`Translate Reader: Запрос на перевод слова "${request.word}"`);
    
    // Используем кэш, если перевод уже есть
    if (translationCache[request.word]) {
      console.log(`Translate Reader: Найден перевод в кэше для "${request.word}"`);
      sendResponse({ translation: translationCache[request.word] });
      return true;
    }
    
    // Запускаем асинхронный перевод
    translateWord(request.word)
      .then(translation => {
        console.log(`Translate Reader: Перевод слова "${request.word}": "${translation}"`);
        sendResponse({ translation: translation });
      })
      .catch(error => {
        console.error('Translate Reader: Ошибка перевода слова:', error);
        sendResponse({ translation: 'Ошибка перевода' });
      });
    
    // Возвращаем true, чтобы указать, что ответ будет асинхронным
    return true;
  }
});

// Функция для перевода слова
async function translateWord(word) {
  // Проверяем кэш
  if (translationCache[word]) {
    return translationCache[word];
  }
  
  // Определяем языки для перевода
  const sourceLang = 'en'; // Исходный язык - английский
  const targetLang = 'ru'; // Целевой язык - русский
  
  // Используем бесплатный API для перевода
  // Если у вас есть API ключ для Google Translate, используйте его
  if (API_KEY) {
    console.log('Translate Reader: Используем Google Translate API');
    // Используем Google Translate API (платный)
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: word,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      });
      
      const data = await response.json();
      
      if (data.data && data.data.translations && data.data.translations.length > 0) {
        const translation = data.data.translations[0].translatedText;
        
        // Сохраняем в кэш
        translationCache[word] = translation;
        
        return translation;
      }
    } catch (error) {
      console.error('Translate Reader: Ошибка с Google Translate API:', error);
    }
  }
  
  // Используем бесплатный API-сервис как запасной вариант
  console.log('Translate Reader: Используем MyMemory API');
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${sourceLang}|${targetLang}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      const translation = data.responseData.translatedText;
      
      // Сохраняем в кэш
      translationCache[word] = translation;
      
      return translation;
    } else {
      console.log('Translate Reader: MyMemory API вернул некорректные данные', data);
    }
  } catch (error) {
    console.error('Translate Reader: Ошибка с MyMemory API:', error);
  }
  
  // Если оба API не сработали, возвращаем исходное слово
  return word;
}

// Функция для загрузки API ключа из настроек
async function loadApiKey() {
  try {
    const result = await chrome.storage.sync.get('settings');
    if (result.settings && result.settings.googleApiKey) {
      API_KEY = result.settings.googleApiKey;
      console.log('Translate Reader: API ключ загружен из настроек');
    } else {
      console.log('Translate Reader: API ключ не найден в настройках');
    }
  } catch (error) {
    console.error('Translate Reader: Ошибка загрузки API ключа:', error);
  }
}

// Управление локальным хранилищем для сохранения настроек
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    // Обновляем настройки при их изменении
    console.log('Translate Reader: Настройки обновлены:', changes.settings.newValue);
    
    // Обновляем API ключ, если он изменился
    if (changes.settings.newValue && changes.settings.newValue.googleApiKey !== undefined) {
      API_KEY = changes.settings.newValue.googleApiKey || '';
      console.log('Translate Reader: API ключ обновлен');
    }
  }
}); 