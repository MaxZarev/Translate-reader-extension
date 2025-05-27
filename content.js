// Основные переменные
let articleText = null;       // Основной текст страницы
let tokenizedText = [];       // Текст, разбитый на токены (слова/выражения)
let currentTokenIndex = -1;   // Индекс текущего выделенного токена
let highlightOverlay = null;  // Элемент подсветки
let translationPopup = null;  // Всплывающее окно с переводом
let initialized = false;      // Флаг инициализации

// Инициализация расширения при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReader);
} else {
  // Если страница уже загружена, запускаем инициализацию сразу
  initializeReader();
}

// Дополнительно добавляем инициализацию при полной загрузке страницы
window.addEventListener('load', () => {
  if (!initialized) {
    initializeReader();
  }
});

// Основная функция инициализации
function initializeReader() {
  if (initialized) return; // Предотвращаем повторную инициализацию
  
  console.log('Translate Reader: Инициализация...');
  
  // Ждем полной загрузки страницы
  setTimeout(() => {
    // Находим основной текст на странице
    articleText = findMainContent();
    
    if (articleText) {
      console.log('Translate Reader: Основной текст найден');
      
      // Токенизируем текст
      tokenizedText = tokenizeText(articleText);
      console.log(`Translate Reader: Найдено ${tokenizedText.length} токенов`);
      
      // Создаем элементы интерфейса
      createHighlightOverlay();
      createTranslationPopup();
      
      // Добавляем обработчики клавиатуры
      addKeyboardListeners();
      
      // Создаем кнопку активации
      createActivationButton();
      
      initialized = true;
      console.log('Translate Reader: Инициализация завершена');
    } else {
      console.log('Translate Reader: Не удалось найти основной текст');
    }
  }, 1000);
}

// Создание кнопки активации
function createActivationButton() {
  const button = document.createElement('div');
  button.className = 'translate-reader-button';
  button.textContent = 'TR';
  button.title = 'Активировать Translate Reader';
  
  button.addEventListener('click', () => {
    if (currentTokenIndex === -1 && tokenizedText.length > 0) {
      currentTokenIndex = 0;
      highlightCurrentToken();
    }
  });
  
  document.body.appendChild(button);
}

// Функция для нахождения основного контента страницы
function findMainContent() {
  // Используем эвристику для поиска основного контента
  // Стратегия: ищем самый большой блок с текстом
  
  // Массив потенциальных контейнеров контента
  const contentContainers = [
    'article',
    'main',
    '.content',
    '.post',
    '.article',
    '#content',
    '#main'
  ];
  
  // Ищем по селекторам
  for (const selector of contentContainers) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 500) {
      return element;
    }
  }
  
  // Если не нашли по селекторам, ищем самый большой текстовый блок
  const paragraphs = Array.from(document.querySelectorAll('p'));
  if (paragraphs.length > 0) {
    // Находим параграф с наибольшим количеством текста
    let largestParagraph = paragraphs[0];
    let largestTextLength = paragraphs[0].textContent.trim().length;
    
    for (const p of paragraphs) {
      const textLength = p.textContent.trim().length;
      if (textLength > largestTextLength) {
        largestParagraph = p;
        largestTextLength = textLength;
      }
    }
    
    // Ищем родительский элемент, который, скорее всего, содержит весь контент
    let parent = largestParagraph.parentElement;
    const paragraphsInParent = parent.querySelectorAll('p').length;
    
    // Подбираемся выше, пока не найдем контейнер с достаточным количеством параграфов
    while (parent && paragraphsInParent < 3 && parent !== document.body) {
      parent = parent.parentElement;
    }
    
    return parent;
  }
  
  // Если все не удалось, возвращаем body
  return document.body;
}

// Функция для токенизации текста
function tokenizeText(element) {
  const text = element.textContent;
  // Разбиваем текст на слова и выражения
  // За выражение считаем несколько слов через дефис или с апострофом
  const tokenRegex = /[\wа-яА-ЯёЁ]+-[\wа-яА-ЯёЁ]+|[\wа-яА-ЯёЁ]+'\w+|[\wа-яА-ЯёЁ]+/g;
  
  return Array.from(text.matchAll(tokenRegex), match => ({
    text: match[0],
    index: match.index
  }));
}

// Создание элемента подсветки
function createHighlightOverlay() {
  highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'translate-reader-highlight';
  highlightOverlay.style.cssText = `
    position: absolute;
    background-color: yellow;
    opacity: 0.3;
    pointer-events: none;
    z-index: 9999;
    border-radius: 2px;
    display: none;
  `;
  document.body.appendChild(highlightOverlay);
}

// Создание всплывающего окна перевода
function createTranslationPopup() {
  translationPopup = document.createElement('div');
  translationPopup.id = 'translate-reader-popup';
  translationPopup.style.cssText = `
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    max-width: 300px;
    display: none;
  `;
  document.body.appendChild(translationPopup);
}

// Добавление обработчиков клавиатуры
function addKeyboardListeners() {
  document.addEventListener('keydown', handleKeyPress);
}

// Обработка нажатий клавиш
function handleKeyPress(event) {
  // Игнорируем событие, если пользователь вводит в поле ввода
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
    return;
  }
  
  // Стрелка вправо - следующее слово
  if (event.key === 'ArrowRight') {
    highlightNextToken();
  }
  // Стрелка влево - предыдущее слово
  else if (event.key === 'ArrowLeft') {
    highlightPreviousToken();
  }
  // T - показать/скрыть перевод
  else if (event.key === 't' || event.key === 'T') {
    toggleTranslation();
  }
}

// Подсветка следующего токена
function highlightNextToken() {
  if (tokenizedText.length === 0) return;
  
  currentTokenIndex = Math.min(currentTokenIndex + 1, tokenizedText.length - 1);
  highlightCurrentToken();
}

// Подсветка предыдущего токена
function highlightPreviousToken() {
  if (tokenizedText.length === 0) return;
  
  if (currentTokenIndex === -1) {
    currentTokenIndex = 0;
  } else {
    currentTokenIndex = Math.max(currentTokenIndex - 1, 0);
  }
  
  highlightCurrentToken();
}

// Подсветка текущего токена
function highlightCurrentToken() {
  if (currentTokenIndex === -1 || !tokenizedText[currentTokenIndex]) return;
  
  const token = tokenizedText[currentTokenIndex];
  const range = document.createRange();
  
  // Находим текстовый узел, содержащий токен
  const textNodes = [];
  getTextNodes(articleText, textNodes);
  
  let currentTextLength = 0;
  let nodeFound = false;
  
  // Ищем нужный текстовый узел
  for (const node of textNodes) {
    const nodeTextLength = node.textContent.length;
    
    if (token.index >= currentTextLength && token.index < currentTextLength + nodeTextLength) {
      const startOffset = token.index - currentTextLength;
      const endOffset = startOffset + token.text.length;
      
      try {
        // Устанавливаем диапазон для подсветки
        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);
        
        // Получаем позицию для подсветки
        const rect = range.getBoundingClientRect();
        
        // Устанавливаем позицию и размеры элемента подсветки
        highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
        highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
        highlightOverlay.style.width = `${rect.width}px`;
        highlightOverlay.style.height = `${rect.height}px`;
        highlightOverlay.style.display = 'block';
        
        // Прокручиваем страницу, чтобы подсветка была видна
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          node.scrollIntoView({behavior: "smooth", block: "center"});
        }
        
        nodeFound = true;
        break;
      } catch (error) {
        console.error('Translate Reader: Ошибка установки диапазона', error);
      }
    }
    
    currentTextLength += nodeTextLength;
  }
  
  // Если не нашли, скрываем подсветку
  if (!nodeFound) {
    highlightOverlay.style.display = 'none';
  }
}

// Получение всех текстовых узлов элемента
function getTextNodes(element, result) {
  if (element.nodeType === Node.TEXT_NODE) {
    result.push(element);
  } else {
    for (const child of element.childNodes) {
      getTextNodes(child, result);
    }
  }
}

// Показать/скрыть перевод
function toggleTranslation() {
  if (currentTokenIndex === -1 || !tokenizedText[currentTokenIndex]) return;
  
  const token = tokenizedText[currentTokenIndex];
  
  // Если перевод уже отображается, скрываем его
  if (translationPopup.style.display === 'block') {
    translationPopup.style.display = 'none';
    return;
  }
  
  // Получаем перевод слова
  getTranslation(token.text).then(translation => {
    // Устанавливаем текст перевода
    translationPopup.innerHTML = `
      <div><b>${token.text}</b></div>
      <div>${translation}</div>
    `;
    
    // Позиционируем всплывающее окно рядом с подсветкой
    const highlightRect = highlightOverlay.getBoundingClientRect();
    
    translationPopup.style.left = `${highlightRect.left + window.scrollX}px`;
    translationPopup.style.top = `${highlightRect.bottom + window.scrollY + 5}px`;
    translationPopup.style.display = 'block';
  });
}

// Получение перевода
async function getTranslation(word) {
  // Отправляем сообщение в background script для получения перевода
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      { action: 'translate', word: word },
      response => {
        if (response) {
          resolve(response.translation || 'Перевод недоступен');
        } else {
          console.error('Translate Reader: Ошибка получения перевода');
          resolve('Ошибка получения перевода');
        }
      }
    );
  });
} 