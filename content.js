// Основные переменные
let articleText = null;       // Основной текст страницы
let tokenizedText = [];       // Текст, разбитый на токены (слова/выражения)
let currentTokenIndex = -1;   // Индекс текущего выделенного токена
let highlightOverlay = null;  // Элемент подсветки
let translationPopup = null;  // Всплывающее окно с переводом
let initialized = false;      // Флаг инициализации

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
    event.preventDefault(); // Предотвращаем стандартное поведение (например, прокрутку)
    highlightNextToken();
  }
  // Стрелка влево - предыдущее слово
  else if (event.key === 'ArrowLeft') {
    event.preventDefault(); // Предотвращаем стандартное поведение
    highlightPreviousToken();
  }
  // T - показать/скрыть перевод
  else if (event.key === 't' || event.key === 'T') {
    event.preventDefault(); // Предотвращаем стандартное поведение (например, открытие новой вкладки)
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
        
        // Устанавливаем позицию и размеры элемента подсветки
        highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
        highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
        highlightOverlay.style.width = `${rect.width}px`;
        highlightOverlay.style.height = `${rect.height}px`;
        highlightOverlay.style.display = 'block';
        
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
      
      highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
      highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
      highlightOverlay.style.width = `${rect.width}px`;
      highlightOverlay.style.height = `${rect.height}px`;
      highlightOverlay.style.display = 'block';
      
      scrollToElement(rect);
      
      // Обновляем текущий индекс токена
      const nearestToken = findNearestToken(fallbackOffset);
      if (nearestToken !== -1) {
        currentTokenIndex = nearestToken;
      }
    } catch (error) {
      console.error('Translate Reader: Не удалось использовать запасной вариант', error);
      highlightOverlay.style.display = 'none';
    }
  } else if (!nodeFound) {
    highlightOverlay.style.display = 'none';
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