// Основные переменные
let articleText = null;       // Основной текст страницы
let tokenizedText = [];       // Текст, разбитый на токены (слова/выражения)
let sentences = [];           // Массив предложений
// Убрали массив абзацев - используем только слова и предложения
let currentTokenIndex = -1;   // Индекс текущего выделенного токена
let currentSentenceIndex = -1; // Индекс текущего предложения
// Убрали индекс абзаца
let selectionStartIndex = -1; // Начальный индекс выделения (для множественного выделения)
let selectionEndIndex = -1;   // Конечный индекс выделения
let navigationMode = 'word';  // Режим навигации: 'word', 'sentence', 'paragraph'
let highlightOverlay = null;  // Элемент подсветки
let translationPopup = null;  // Всплывающее окно с переводом
let initialized = false;      // Флаг инициализации
let ctrlJumpWords = 5;        // Количество слов для прыжка с Ctrl+стрелки
let extensionEnabled = true;  // Флаг включения/выключения расширения

// Инициализация расширения при загрузке страницы
function initOnLoad() {
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeReader);
    } else {
      // Если страница уже загружена, запускаем инициализацию сразу
      setTimeout(initializeReader, 500);  // Небольшая задержка для стабильности
    }
    
    // Дополнительно добавляем инициализацию при полной загрузке страницы
    window.addEventListener('load', () => {
      if (!initialized) {
        setTimeout(initializeReader, 1000);  // Задержка после полной загрузки
      }
    });
    
    // Резервная инициализация через 3 секунды
    setTimeout(() => {
      if (!initialized) {
        console.log('Translate Reader: Резервная инициализация');
        initializeReader();
      }
    }, 3000);
  } catch (error) {
    console.error('Translate Reader: Ошибка при инициализации', error);
  }
}

// Запускаем инициализацию
initOnLoad();

// Основная функция инициализации
function initializeReader() {
  if (initialized) return; // Предотвращаем повторную инициализацию
  
  console.log('Translate Reader: Инициализация...');
  
  // Загружаем настройки
  loadSettings();
  
  // Ждем полной загрузки страницы
  setTimeout(() => {
    // Находим основной текст на странице
    articleText = findMainContent();
    
    if (articleText) {
      console.log('Translate Reader: Основной текст найден');
      
      // Токенизируем текст
      tokenizedText = tokenizeText(articleText);
      console.log(`Translate Reader: Найдено ${tokenizedText.length} токенов`);
      
      // Парсим предложения
      sentences = parseSentences(articleText);
      console.log(`Translate Reader: Найдено ${sentences.length} предложений`);
      
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

// Добавление обработчиков клавиатуры и мыши
function addKeyboardListeners() {
  document.addEventListener('keydown', handleKeyPress);
  document.addEventListener('click', handleClick);
}

// Обработка нажатий клавиш
function handleKeyPress(event) {
  // Игнорируем событие, если расширение выключено
  if (!extensionEnabled) {
    return;
  }
  
  // Игнорируем событие, если пользователь вводит в поле ввода
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
    return;
  }
  
  // Стрелка вправо - следующее слово
  if (event.key === 'ArrowRight') {
    event.preventDefault(); // Предотвращаем стандартное поведение (например, прокрутку)
    
    // Скрываем окно перевода при навигации
    hideTranslationPopup();
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + стрелка вправо - прыжок на несколько слов вперед
      clearSelection();
      jumpWordsForward();
    } else if (event.shiftKey) {
      // Shift + стрелка вправо - расширяем выделение
      expandSelectionRight();
    } else {
      // Обычная стрелка вправо - переходим к следующему элементу
      clearSelection();
      navigateNext();
    }
  }
  // Стрелка влево - предыдущее слово
  else if (event.key === 'ArrowLeft') {
    event.preventDefault(); // Предотвращаем стандартное поведение
    
    // Скрываем окно перевода при навигации
    hideTranslationPopup();
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + стрелка влево - прыжок на несколько слов назад
      clearSelection();
      jumpWordsBackward();
    } else if (event.shiftKey) {
      // Shift + стрелка влево - расширяем выделение
      expandSelectionLeft();
    } else {
      // Обычная стрелка влево - переходим к предыдущему элементу
      clearSelection();
      navigatePrevious();
    }
  }
  // T - показать/скрыть перевод
  else if (event.key === 't' || event.key === 'T') {
    event.preventDefault(); // Предотвращаем стандартное поведение (например, открытие новой вкладки)
    toggleTranslation();
  }
  // Переключение режимов навигации
  else if (event.key === '1') {
    event.preventDefault();
    switchNavigationMode('word');
  }
  else if (event.key === '2') {
    event.preventDefault();
    switchNavigationMode('sentence');
  }
  // Переключение режимов навигации
  else if (event.key === '`' || event.key === '~') {
    event.preventDefault();
    cycleThroughModes();
  }
  // S - установить начальную позицию здесь
  else if (event.key === 's' || event.key === 'S') {
    event.preventDefault();
    setStartPositionFromCursor();
  }
  // Escape - очистить выделение
  else if (event.key === 'Escape') {
    event.preventDefault();
    hideTranslationPopup();
    clearSelection();
    clearHighlightOverlays();
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
  let fallbackNode = null;
  let fallbackOffset = 0;
  
  // Ищем нужный текстовый узел
  for (const node of textNodes) {
    // Сохраняем первый текстовый узел как запасной вариант
    if (!fallbackNode && node.textContent.trim().length > 0) {
      fallbackNode = node;
    }
    
    const nodeTextLength = node.textContent.length;
    
    if (token.index >= currentTextLength && token.index < currentTextLength + nodeTextLength) {
      const startOffset = token.index - currentTextLength;
      let endOffset = startOffset + token.text.length;
      
      // Проверяем, что смещения не выходят за пределы узла
      endOffset = Math.min(endOffset, nodeTextLength);
      
      try {
        // Устанавливаем диапазон для подсветки
        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);
        
        // Получаем позицию для подсветки
        const rect = range.getBoundingClientRect();
        
        // Проверяем, что получили корректный прямоугольник
        if (rect.width === 0 && rect.height === 0) {
          throw new Error('Получен некорректный прямоугольник');
        }
        
        // Очищаем предыдущие элементы подсветки
        clearHighlightOverlays();
        
        // Создаем элемент подсветки для одного слова
        createHighlightForRect(rect, 0);
        
        // Всегда прокручиваем страницу так, чтобы слово было в центре экрана
        scrollToElement(rect);
        
        nodeFound = true;
        break;
      } catch (error) {
        console.error('Translate Reader: Ошибка установки диапазона', error);
        fallbackOffset = currentTextLength;
      }
    }
    
    currentTextLength += nodeTextLength;
  }
  
  // Если не нашли или произошла ошибка, пробуем использовать запасной вариант
  if (!nodeFound && fallbackNode) {
    try {
      console.log('Translate Reader: Используем запасной вариант для подсветки');
      
      // Используем запасной узел и подсвечиваем первые несколько символов
      const textLength = Math.min(fallbackNode.textContent.length, 5);
      range.setStart(fallbackNode, 0);
      range.setEnd(fallbackNode, textLength);
      
      const rect = range.getBoundingClientRect();
      
      // Очищаем предыдущие элементы подсветки
      clearHighlightOverlays();
      
      // Создаем элемент подсветки для запасного варианта
      createHighlightForRect(rect, 0);
      
      scrollToElement(rect);
      
      // Обновляем текущий индекс токена
      const nearestToken = findNearestToken(fallbackOffset);
      if (nearestToken !== -1) {
        currentTokenIndex = nearestToken;
      }
    } catch (error) {
      console.error('Translate Reader: Не удалось использовать запасной вариант', error);
      clearHighlightOverlays();
    }
  } else if (!nodeFound) {
    clearHighlightOverlays();
  }
}

// Функция для поиска ближайшего токена к заданной позиции
function findNearestToken(position) {
  if (tokenizedText.length === 0) return -1;
  
  let nearestIndex = 0;
  let minDistance = Math.abs(tokenizedText[0].index - position);
  
  for (let i = 1; i < tokenizedText.length; i++) {
    const distance = Math.abs(tokenizedText[i].index - position);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }
  
  return nearestIndex;
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

// Функция для плавной прокрутки к элементу
function scrollToElement(rect) {
  // Вычисляем центр выделенного элемента
  const elementCenterY = rect.top + rect.height / 2;
  
  // Вычисляем центр видимой области
  const viewportCenterY = window.innerHeight / 2;
  
  // Определяем, насколько нужно прокрутить страницу
  const scrollY = elementCenterY - viewportCenterY + window.scrollY;
  
  // Проверяем, насколько элемент виден в области просмотра
  const elementVisibility = getVisibility(rect);
  
  // Если элемент полностью видим и близко к центру, не прокручиваем
  if (elementVisibility === 'fully-visible' && 
      Math.abs(elementCenterY - viewportCenterY) < window.innerHeight * 0.2) {
    return;
  }
  
  // Плавно прокручиваем страницу
  window.scrollTo({
    top: scrollY,
    behavior: 'smooth'
  });
}

// Определяет видимость элемента в области просмотра
function getVisibility(rect) {
  if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
    return 'fully-visible';
  } else if (rect.top < 0 && rect.bottom > 0) {
    return 'partially-visible-top';
  } else if (rect.bottom > window.innerHeight && rect.top < window.innerHeight) {
    return 'partially-visible-bottom';
  } else {
    return 'not-visible';
  }
}

// Показать/скрыть перевод
function toggleTranslation() {
  // Если перевод уже отображается, скрываем его
  if (translationPopup.style.display === 'block') {
    hideTranslationPopup();
    return;
  }
  
  // Получаем текст для перевода (выделенный текст или текущее слово)
  const textToTranslate = getSelectedText();
  
  if (!textToTranslate) {
    console.log('Translate Reader: Нет текста для перевода');
    return;
  }
  
  // Получаем перевод текста
  getTranslation(textToTranslate).then(translation => {
    // Устанавливаем текст перевода
    translationPopup.innerHTML = `
      <div><b>${textToTranslate}</b></div>
      <div>${translation}</div>
    `;
    
    // Позиционируем всплывающее окно рядом с подсветкой
    let highlightRect = null;
    
    // Ищем активный элемент подсветки
    const activeHighlight = document.querySelector('.translate-reader-highlight-line');
    if (activeHighlight && activeHighlight.style.display !== 'none') {
      highlightRect = activeHighlight.getBoundingClientRect();
    } else if (highlightOverlay && highlightOverlay.style.display !== 'none') {
      highlightRect = highlightOverlay.getBoundingClientRect();
    }
    
    // Если не найден активный элемент подсветки, используем центр экрана
    if (!highlightRect || (highlightRect.width === 0 && highlightRect.height === 0)) {
      highlightRect = {
        left: window.innerWidth / 2 - 100,
        right: window.innerWidth / 2 + 100,
        top: window.innerHeight / 2 - 50,
        bottom: window.innerHeight / 2 + 50
      };
    }
    
    // Проверяем, достаточно ли места под подсветкой
    const spaceBelow = window.innerHeight - highlightRect.bottom;
    const spaceAbove = highlightRect.top;
    
    // Оцениваем размер всплывающего окна (примерно)
    const estimatedPopupHeight = 60; // Минимальная высота в пикселях
    
    if (spaceBelow >= estimatedPopupHeight || spaceBelow >= spaceAbove) {
      // Размещаем под подсветкой
      translationPopup.style.left = `${highlightRect.left + window.scrollX}px`;
      translationPopup.style.top = `${highlightRect.bottom + window.scrollY + 5}px`;
    } else {
      // Размещаем над подсветкой
      translationPopup.style.left = `${highlightRect.left + window.scrollX}px`;
      translationPopup.style.top = `${highlightRect.top + window.scrollY - 5 - estimatedPopupHeight}px`;
    }
    
    // Показываем всплывающее окно
    translationPopup.style.display = 'block';
    
    // Проверяем, что всплывающее окно полностью видно после показа
    setTimeout(() => {
      const popupRect = translationPopup.getBoundingClientRect();
      ensurePopupVisible(popupRect);
    }, 0);
  });
}

// Функция для обеспечения видимости всплывающего окна
function ensurePopupVisible(popupRect) {
  // Проверяем, не выходит ли всплывающее окно за границы экрана
  let adjustX = 0;
  let adjustY = 0;
  
  // Проверяем границы по горизонтали
  if (popupRect.right > window.innerWidth) {
    adjustX = window.innerWidth - popupRect.right - 10;
  } else if (popupRect.left < 0) {
    adjustX = -popupRect.left + 10;
  }
  
  // Проверяем границы по вертикали
  if (popupRect.bottom > window.innerHeight) {
    adjustY = window.innerHeight - popupRect.bottom - 10;
  } else if (popupRect.top < 0) {
    adjustY = -popupRect.top + 10;
  }
  
  // Применяем корректировки, если необходимо
  if (adjustX !== 0 || adjustY !== 0) {
    const currentLeft = parseInt(translationPopup.style.left) || 0;
    const currentTop = parseInt(translationPopup.style.top) || 0;
    
    translationPopup.style.left = `${currentLeft + adjustX}px`;
    translationPopup.style.top = `${currentTop + adjustY}px`;
  }
}

// Получение перевода
async function getTranslation(word) {
  // Отправляем сообщение в background script для получения перевода
  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage(
        { action: 'translate', word: word },
        response => {
          // Проверка на ошибку chrome.runtime.lastError
          if (chrome.runtime.lastError) {
            console.error('Translate Reader: Ошибка отправки сообщения', chrome.runtime.lastError);
            resolve('Ошибка связи с фоновым скриптом');
            return;
          }
          
          // Проверка на существование ответа
          if (!response) {
            console.error('Translate Reader: Не получен ответ от фонового скрипта');
            resolve('Не удалось получить перевод');
            return;
          }
          
          resolve(response.translation || 'Перевод недоступен');
        }
      );
    } catch (error) {
      console.error('Translate Reader: Критическая ошибка при запросе перевода', error);
      resolve('Ошибка запроса перевода');
    }
  });
}

// Расширение выделения вправо
function expandSelectionRight() {
  if (tokenizedText.length === 0) return;
  
  // Если выделение еще не начато, начинаем с текущего токена
  if (selectionStartIndex === -1) {
    if (currentTokenIndex === -1) {
      currentTokenIndex = 0;
    }
    selectionStartIndex = currentTokenIndex;
    selectionEndIndex = currentTokenIndex;
  }
  
  // Расширяем выделение вправо
  selectionEndIndex = Math.min(selectionEndIndex + 1, tokenizedText.length - 1);
  currentTokenIndex = selectionEndIndex;
  
  highlightSelection();
}

// Расширение выделения влево
function expandSelectionLeft() {
  if (tokenizedText.length === 0) return;
  
  // Если выделение еще не начато, начинаем с текущего токена
  if (selectionStartIndex === -1) {
    if (currentTokenIndex === -1) {
      currentTokenIndex = 0;
    }
    selectionStartIndex = currentTokenIndex;
    selectionEndIndex = currentTokenIndex;
  }
  
  // Расширяем выделение влево
  selectionStartIndex = Math.max(selectionStartIndex - 1, 0);
  currentTokenIndex = selectionStartIndex;
  
  highlightSelection();
}

// Очистка выделения
function clearSelection() {
  selectionStartIndex = -1;
  selectionEndIndex = -1;
}

// Проверка, есть ли активное выделение
function hasSelection() {
  return selectionStartIndex !== -1 && selectionEndIndex !== -1 && selectionStartIndex !== selectionEndIndex;
}

// Подсветка выделенного диапазона
function highlightSelection() {
  if (!hasSelection()) {
    highlightCurrentToken();
    return;
  }
  
  const startIndex = Math.min(selectionStartIndex, selectionEndIndex);
  const endIndex = Math.max(selectionStartIndex, selectionEndIndex);
  
  // Находим текстовые узлы
  const textNodes = [];
  getTextNodes(articleText, textNodes);
  
  let currentTextLength = 0;
  let startNode = null, endNode = null;
  let startOffset = 0, endOffset = 0;
  
  // Ищем начальный и конечный узлы
  for (const node of textNodes) {
    const nodeTextLength = node.textContent.length;
    
    // Проверяем начальный токен
    if (!startNode && tokenizedText[startIndex]) {
      const startTokenIndex = tokenizedText[startIndex].index;
      if (startTokenIndex >= currentTextLength && startTokenIndex < currentTextLength + nodeTextLength) {
        startNode = node;
        startOffset = startTokenIndex - currentTextLength;
      }
    }
    
    // Проверяем конечный токен
    if (!endNode && tokenizedText[endIndex]) {
      const endTokenIndex = tokenizedText[endIndex].index + tokenizedText[endIndex].text.length;
      if (endTokenIndex > currentTextLength && endTokenIndex <= currentTextLength + nodeTextLength) {
        endNode = node;
        endOffset = endTokenIndex - currentTextLength;
      }
    }
    
    currentTextLength += nodeTextLength;
    
    if (startNode && endNode) break;
  }
  
  if (startNode && endNode) {
    try {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      
      // Получаем все прямоугольники для многострочного выделения
      const rects = range.getClientRects();
      
      if (rects.length > 0) {
        // Очищаем предыдущие элементы подсветки
        clearHighlightOverlays();
        
        // Создаем элемент подсветки для каждой строки
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          if (rect.width > 0 && rect.height > 0) {
            createHighlightForRect(rect, i);
          }
        }
        
        // Прокручиваем к первому прямоугольнику
        scrollToElement(rects[0]);
      }
    } catch (error) {
      console.error('Translate Reader: Ошибка при выделении диапазона', error);
      highlightCurrentToken();
    }
  } else {
    highlightCurrentToken();
  }
}

// Получение выделенного текста
function getSelectedText() {
  if (!hasSelection()) {
    // Если нет выделения, возвращаем текущий элемент в зависимости от режима
    switch (navigationMode) {
      case 'word':
        if (currentTokenIndex !== -1 && tokenizedText[currentTokenIndex]) {
          return tokenizedText[currentTokenIndex].text;
        }
        break;
      case 'sentence':
        if (currentSentenceIndex !== -1 && sentences[currentSentenceIndex]) {
          return sentences[currentSentenceIndex].text;
        }
        break;

    }
    return '';
  }
  
  const startIndex = Math.min(selectionStartIndex, selectionEndIndex);
  const endIndex = Math.max(selectionStartIndex, selectionEndIndex);
  
  const selectedTokens = [];
  for (let i = startIndex; i <= endIndex; i++) {
    if (tokenizedText[i]) {
      selectedTokens.push(tokenizedText[i].text);
    }
  }
  
  return selectedTokens.join(' ');
}

// Скрыть окно перевода
function hideTranslationPopup() {
  translationPopup.style.display = 'none';
}

// Функция для разбора текста на предложения
function parseSentences(element) {
  const text = element.textContent;
  
  // Улучшенный регекс для разбиения на предложения
  // Учитываем сокращения, числа с точками, инициалы
  const sentenceRegex = /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Inc|Ltd|Co|vs|etc|i\.e|e\.g|a\.m|p\.m|U\.S|U\.K)\.)(?<!\b\d)(?<!\b[A-ZА-Я])[.!?]+(?=\s+[A-ZА-ЯЁ]|\s*$)/g;
  
  const sentenceArray = [];
  let lastIndex = 0;
  let match;
  
  while ((match = sentenceRegex.exec(text)) !== null) {
    const endIndex = match.index + match[0].length;
    const sentence = text.substring(lastIndex, endIndex).trim();
    
    if (sentence.length > 10) { // Минимальная длина предложения
      // Находим начало предложения (пропускаем пробелы)
      let startIndex = lastIndex;
      while (startIndex < text.length && /\s/.test(text[startIndex])) {
        startIndex++;
      }
      
      sentenceArray.push({
        text: sentence,
        startIndex: startIndex,
        endIndex: endIndex
      });
    }
    lastIndex = endIndex;
  }
  
  // Добавляем последнее предложение, если оно есть
  if (lastIndex < text.length) {
    let startIndex = lastIndex;
    while (startIndex < text.length && /\s/.test(text[startIndex])) {
      startIndex++;
    }
    
    const lastSentence = text.substring(startIndex).trim();
    if (lastSentence.length > 10) {
      sentenceArray.push({
        text: lastSentence,
        startIndex: startIndex,
        endIndex: text.length
      });
    }
  }
  
  return sentenceArray;
}



// Переключение режима навигации
function switchNavigationMode(mode) {
  const previousMode = navigationMode;
  navigationMode = mode;
  clearSelection();
  
  // Сохраняем позицию при переключении между режимами
  preservePositionOnModeSwitch(previousMode, mode);
  
  // Показываем уведомление о смене режима
  showModeNotification(mode);
  
  // Подсвечиваем текущий элемент в новом режиме
  highlightCurrentItem();
  
  console.log(`Translate Reader: Режим навигации изменен на ${mode}`);
}

// Показать уведомление о смене режима
function showModeNotification(mode) {
  const modeInfo = {
    'word': { name: 'Слова', color: '#ffc107', icon: '🔤' },
    'sentence': { name: 'Предложения', color: '#28a745', icon: '📝' }
  };
  
  const modes = ['word', 'sentence'];
  const currentIndex = modes.indexOf(mode);
  const info = modeInfo[mode];
  
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${info.icon}</span>
      <span>Режим: ${info.name}</span>
      <span style="font-size: 12px; opacity: 0.8;">(${currentIndex + 1}/2)</span>
    </div>
  `;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${info.color};
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10001;
    transition: opacity 0.3s;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  `;
  
  document.body.appendChild(notification);
  
  // Убираем уведомление через 2 секунды
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
}

// Универсальная навигация вперед
function navigateNext() {
  switch (navigationMode) {
    case 'word':
      highlightNextToken();
      break;
    case 'sentence':
      highlightNextSentence();
      break;

  }
}

// Универсальная навигация назад
function navigatePrevious() {
  switch (navigationMode) {
    case 'word':
      highlightPreviousToken();
      break;
    case 'sentence':
      highlightPreviousSentence();
      break;

  }
}

// Подсветка текущего элемента в зависимости от режима
function highlightCurrentItem() {
  switch (navigationMode) {
    case 'word':
      highlightCurrentToken();
      break;
    case 'sentence':
      highlightCurrentSentence();
      break;

  }
}

// Навигация по предложениям
function highlightNextSentence() {
  if (sentences.length === 0) return;
  
  currentSentenceIndex = Math.min(currentSentenceIndex + 1, sentences.length - 1);
  highlightCurrentSentence();
}

function highlightPreviousSentence() {
  if (sentences.length === 0) return;
  
  if (currentSentenceIndex === -1) {
    currentSentenceIndex = 0;
  } else {
    currentSentenceIndex = Math.max(currentSentenceIndex - 1, 0);
  }
  
  highlightCurrentSentence();
}

function highlightCurrentSentence() {
  if (currentSentenceIndex === -1 || !sentences[currentSentenceIndex]) return;
  
  const sentence = sentences[currentSentenceIndex];
  highlightTextRange(sentence.startIndex, sentence.endIndex);
}



// Универсальная функция для подсветки диапазона текста
function highlightTextRange(startIndex, endIndex) {
  const textNodes = [];
  getTextNodes(articleText, textNodes);
  
  let currentTextLength = 0;
  let startNode = null, endNode = null;
  let startOffset = 0, endOffset = 0;
  
  // Ищем начальный и конечный узлы
  for (const node of textNodes) {
    const nodeTextLength = node.textContent.length;
    
    // Проверяем начальную позицию
    if (!startNode && startIndex >= currentTextLength && startIndex < currentTextLength + nodeTextLength) {
      startNode = node;
      startOffset = startIndex - currentTextLength;
    }
    
    // Проверяем конечную позицию
    if (!endNode && endIndex > currentTextLength && endIndex <= currentTextLength + nodeTextLength) {
      endNode = node;
      endOffset = endIndex - currentTextLength;
    }
    
    currentTextLength += nodeTextLength;
    
    if (startNode && endNode) break;
  }
  
  if (startNode && endNode) {
    try {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      
      // Получаем все прямоугольники для многострочного текста
      const rects = range.getClientRects();
      
      if (rects.length > 0) {
        // Очищаем предыдущие элементы подсветки
        clearHighlightOverlays();
        
        // Создаем элемент подсветки для каждой строки
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          if (rect.width > 0 && rect.height > 0) {
            createHighlightForRect(rect, i);
          }
        }
        
        // Прокручиваем к первому прямоугольнику
        scrollToElement(rects[0]);
      }
    } catch (error) {
      console.error('Translate Reader: Ошибка при подсветке диапазона', error);
    }
  }
}

// Создание элемента подсветки для конкретного прямоугольника
function createHighlightForRect(rect, index) {
  const overlay = document.createElement('div');
  overlay.className = 'translate-reader-highlight-line';
  overlay.id = `translate-reader-highlight-${index}`;
  
  overlay.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX}px;
    top: ${rect.top + window.scrollY}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background-color: rgba(255, 255, 0, 0.3);
    pointer-events: none;
    z-index: 9999;
    border-radius: 2px;
    transition: all 0.2s ease;
    display: block;
  `;
  
  // Устанавливаем стиль в зависимости от режима навигации
  if (hasSelection()) {
    overlay.style.backgroundColor = 'rgba(0, 123, 255, 0.3)';
    overlay.style.border = '2px solid rgba(0, 123, 255, 0.6)';
  } else if (navigationMode === 'sentence') {
    overlay.style.backgroundColor = 'rgba(40, 167, 69, 0.3)';
    overlay.style.border = '2px solid rgba(40, 167, 69, 0.6)';
    overlay.style.borderRadius = '4px';
  }
  
  document.body.appendChild(overlay);
}

// Очистка всех элементов подсветки
function clearHighlightOverlays() {
  // Удаляем старые элементы подсветки строк
  const existingOverlays = document.querySelectorAll('.translate-reader-highlight-line');
  existingOverlays.forEach(overlay => overlay.remove());
  
  // Скрываем основной элемент подсветки
  if (highlightOverlay) {
    highlightOverlay.style.display = 'none';
  }
  
  // Скрываем окно перевода, если оно открыто
  if (translationPopup && translationPopup.style.display === 'block') {
    hideTranslationPopup();
  }
}

// Циклическое переключение режимов навигации
function cycleThroughModes() {
  const modes = ['word', 'sentence'];
  const currentIndex = modes.indexOf(navigationMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  const nextMode = modes[nextIndex];
  
  switchNavigationMode(nextMode);
}

// Сохранение позиции при переключении между режимами
function preservePositionOnModeSwitch(previousMode, newMode) {
  if (previousMode === newMode) return;
  
  if (previousMode === 'word' && newMode === 'sentence') {
    // Переход от слова к предложению
    if (currentTokenIndex !== -1) {
      // Находим предложение, содержащее текущее слово
      const currentToken = tokenizedText[currentTokenIndex];
      if (currentToken) {
        const sentenceIndex = findSentenceContainingPosition(currentToken.index);
        if (sentenceIndex !== -1) {
          currentSentenceIndex = sentenceIndex;
        } else {
          currentSentenceIndex = 0;
        }
      }
    } else {
      currentSentenceIndex = 0;
    }
  } else if (previousMode === 'sentence' && newMode === 'word') {
    // Переход от предложения к слову
    if (currentSentenceIndex !== -1) {
      // Находим первое слово в текущем предложении
      const currentSentence = sentences[currentSentenceIndex];
      if (currentSentence) {
        const tokenIndex = findFirstTokenInSentence(currentSentence);
        if (tokenIndex !== -1) {
          currentTokenIndex = tokenIndex;
        } else {
          currentTokenIndex = 0;
        }
      }
    } else {
      currentTokenIndex = 0;
    }
  }
}

// Найти предложение, содержащее указанную позицию
function findSentenceContainingPosition(position) {
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (position >= sentence.startIndex && position <= sentence.endIndex) {
      return i;
    }
  }
  return -1;
}

// Найти первый токен в предложении
function findFirstTokenInSentence(sentence) {
  for (let i = 0; i < tokenizedText.length; i++) {
    const token = tokenizedText[i];
    if (token.index >= sentence.startIndex && token.index < sentence.endIndex) {
      return i;
    }
  }
  return -1;
}

// Прыжок на несколько слов вперед
function jumpWordsForward() {
  if (tokenizedText.length === 0) return;
  
  // Если текущий индекс не установлен, начинаем с первого слова
  if (currentTokenIndex === -1) {
    currentTokenIndex = 0;
  } else {
    // Прыгаем на заданное количество слов вперед
    currentTokenIndex = Math.min(currentTokenIndex + ctrlJumpWords, tokenizedText.length - 1);
  }
  
  highlightCurrentToken();
}

// Прыжок на несколько слов назад
function jumpWordsBackward() {
  if (tokenizedText.length === 0) return;
  
  // Если текущий индекс не установлен, начинаем с первого слова
  if (currentTokenIndex === -1) {
    currentTokenIndex = 0;
  } else {
    // Прыгаем на заданное количество слов назад
    currentTokenIndex = Math.max(currentTokenIndex - ctrlJumpWords, 0);
  }
  
  highlightCurrentToken();
}

// Загрузка настроек из хранилища
function loadSettings() {
  try {
    chrome.storage.sync.get('settings', (data) => {
      if (chrome.runtime.lastError) {
        console.log('Translate Reader: Используем настройки по умолчанию');
        return;
      }
      
      const settings = data.settings || {};
      ctrlJumpWords = settings.ctrlJumpWords || 5;
      extensionEnabled = settings.extensionEnabled !== undefined ? settings.extensionEnabled : true;
      
      console.log(`Translate Reader: Загружены настройки, прыжок на ${ctrlJumpWords} слов, расширение ${extensionEnabled ? 'включено' : 'выключено'}`);
    });
  } catch (error) {
    console.log('Translate Reader: Ошибка загрузки настроек, используем значения по умолчанию');
  }
}

// Обработчик клика для установки начальной позиции
function handleClick(event) {
  // Игнорируем событие, если расширение выключено
  if (!extensionEnabled) {
    return;
  }
  
  // Проверяем, что нажата клавиша Ctrl/Cmd во время клика
  if (event.ctrlKey || event.metaKey) {
    // Проверяем, что клик не по элементам интерфейса расширения
    const target = event.target;
    if (target.id === 'translate-reader-popup' || 
        target.closest('#translate-reader-popup') ||
        target.className.includes('translate-reader')) {
      return; // Не обрабатываем клики по элементам расширения
    }
    
    event.preventDefault();
    setStartPositionFromClick(event);
  }
}

// Установка начальной позиции по клику
function setStartPositionFromClick(event) {
  const clickX = event.clientX;
  const clickY = event.clientY;
  
  // Находим элемент под курсором
  const elementUnderCursor = document.elementFromPoint(clickX, clickY);
  
  if (elementUnderCursor && articleText.contains(elementUnderCursor)) {
    // Создаем диапазон для определения позиции клика в тексте
    const range = document.caretRangeFromPoint(clickX, clickY);
    
    if (range) {
      setStartPositionFromRange(range);
      showStartPositionNotification("Начальная позиция установлена по клику");
    }
  }
}

// Установка начальной позиции от текущей позиции курсора (клавиша S)
function setStartPositionFromCursor() {
  // Получаем текущее выделение или позицию курсора
  const selection = window.getSelection();
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    setStartPositionFromRange(range);
    showStartPositionNotification("Начальная позиция установлена");
  } else {
    // Если нет выделения, используем центр экрана
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const range = document.caretRangeFromPoint(centerX, centerY);
    
    if (range) {
      setStartPositionFromRange(range);
      showStartPositionNotification("Начальная позиция установлена в центре экрана");
    }
  }
}

// Установка начальной позиции из диапазона
function setStartPositionFromRange(range) {
  try {
    // Получаем позицию в тексте
    const textPosition = getTextPositionFromRange(range);
    
    if (textPosition !== -1) {
      // Находим ближайшее слово к этой позиции
      const nearestTokenIndex = findNearestToken(textPosition);
      
      if (nearestTokenIndex !== -1) {
        currentTokenIndex = nearestTokenIndex;
        
        // Если мы в режиме предложений, находим соответствующее предложение
        if (navigationMode === 'sentence') {
          const token = tokenizedText[currentTokenIndex];
          if (token) {
            const sentenceIndex = findSentenceContainingPosition(token.index);
            if (sentenceIndex !== -1) {
              currentSentenceIndex = sentenceIndex;
            }
          }
        }
        
        // Скрываем окно перевода перед изменением позиции
        hideTranslationPopup();
        
        // Очищаем выделение и подсвечиваем новую позицию
        clearSelection();
        highlightCurrentItem();
        
        console.log(`Translate Reader: Начальная позиция установлена на слово ${currentTokenIndex + 1}`);
      }
    }
  } catch (error) {
    console.error('Translate Reader: Ошибка при установке начальной позиции', error);
  }
}

// Получение позиции в тексте из диапазона
function getTextPositionFromRange(range) {
  try {
    // Создаем диапазон от начала articleText до позиции клика
    const fullRange = document.createRange();
    fullRange.setStart(articleText, 0);
    fullRange.setEnd(range.startContainer, range.startOffset);
    
    // Получаем текст до позиции клика
    const textBeforeClick = fullRange.toString();
    
    return textBeforeClick.length;
  } catch (error) {
    console.error('Translate Reader: Ошибка получения позиции текста', error);
    return -1;
  }
}

// Показать уведомление об установке начальной позиции
function showStartPositionNotification(message) {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">📍</span>
      <span>${message}</span>
    </div>
  `;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #2196f3;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10001;
    transition: opacity 0.3s;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  `;
  
  document.body.appendChild(notification);
  
  // Убираем уведомление через 3 секунды
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Обработчик сообщений от popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleExtension') {
    extensionEnabled = message.enabled;
    
    if (!extensionEnabled) {
      // Если расширение выключается, очищаем все элементы интерфейса
      clearHighlightOverlays();
      hideTranslationPopup();
      clearSelection();
      
      // Скрываем кнопку активации
      const activationButton = document.querySelector('.translate-reader-button');
      if (activationButton) {
        activationButton.style.display = 'none';
      }
      
      console.log('Translate Reader: Расширение выключено');
    } else {
      // Если расширение включается, показываем кнопку активации
      const activationButton = document.querySelector('.translate-reader-button');
      if (activationButton) {
        activationButton.style.display = 'block';
      }
      
      console.log('Translate Reader: Расширение включено');
    }
    
    sendResponse({ success: true });
  }
}); 