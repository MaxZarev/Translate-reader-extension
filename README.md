# Translate Reader Extension 
*v 2.1.0*

Мощное расширение для браузера Chrome, которое помогает читать и переводить тексты на иностранных языках с удобной навигацией и множественными режимами чтения.

*Расширение было "навайбкодено" в Cursor AI*, я не написал ни единой строчки кода.

Моя канал, подписывайтесь: https://t.me/maxzarev

## 🚀 Основные функции

### 📖 Умная навигация по тексту
- **Автоматическое определение** основного контента на странице
- **Два режима навигации**: по словам и по предложениям
- **Циклическое переключение** между режимами
- **Прыжки на несколько слов** с Ctrl+стрелки (Cmd+стрелки на Mac)
- **Выделение нескольких слов** с Shift+стрелки (с фиксированной точкой якоря)

### 🌐 Перевод текста
- **Мгновенный перевод** текущего слова/предложения
- **Перевод выделенного мышкой текста** по горячей клавише
- **Поддержка Google Translate API** (с API ключом) и бесплатного MyMemory API
- **Умное позиционирование** popup с переводом
- **Кэширование переводов** для быстрой работы

### 🎯 Гибкое позиционирование
- **Ctrl+клик** (Cmd+клик на Mac) для установки начальной позиции чтения в любом месте
- **Автоматическая прокрутка** к выделенному тексту
- **Сохранение позиции** при переключении режимов

### 🔄 Адаптация к динамическому контенту
- **Автоматическое отслеживание** изменений DOM
- **Переинициализация** при смене контента на SPA сайтах
- **Уведомления** об обновлении контента

### ⚙️ Настройки и персонализация
- **Включение/выключение** расширения
- **Выбор языка** перевода
- **Настройка цвета и прозрачности** подсветки
- **Количество слов** для Ctrl+прыжков (Cmd+прыжков на Mac)
- **Google Translate API ключ** для улучшенного перевода
- **Автоматический показ** перевода

## 🎮 Горячие клавиши

### Навигация
- **→/←** - Навигация по элементам в текущем режиме
- **Shift + →/←** - Выделение нескольких слов (якорная система)
- **Ctrl + →/←** (Cmd + →/← на Mac) - Прыжок на несколько слов (настраивается)

### Перевод
- **T/Е** - Показать/скрыть перевод (работает с русской раскладкой)
  - Если есть выделенный мышкой текст → переводит выделенное
  - Если нет выделения → переводит текущий элемент навигации

### Режимы и управление
- **`/Ё** - Циклическое переключение режимов (слова ↔ предложения)
- **Ctrl + клик** (Cmd + клик на Mac) - Установить начальную позицию чтения
- **Esc** - Очистить выделение и скрыть перевод

## 📱 Интерфейс

### Визуальные индикаторы
- **Желтая подсветка** - режим слов
- **Зеленая подсветка с рамкой** - режим предложений  
- **Синяя подсветка** - множественное выделение
- **Уведомления** о смене режимов и обновлении контента

### Кнопка активации
- **Плавающая кнопка "TR"** для быстрого запуска
- **Автоматическое скрытие/показ** при включении/выключении

## 🛠 Установка

### Из исходного кода

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/MaxZarev/translate-reader-extension.git
```
или скачайте архив zip с проектом

2. **Откройте Chrome и перейдите к расширениям:**
```
chrome://extensions/
```

3. **Включите "Режим разработчика"** (переключатель в правом верхнем углу)

4. **Нажмите "Загрузить распакованное расширение"** и выберите папку с кодом

## 🔧 Настройка API перевода

### Без API ключа (по умолчанию)
Расширение использует бесплатный **MyMemory API** - работает сразу после установки.

### С Google Translate API (рекомендуется)
Для более качественного перевода:

1. **Получите API ключ:**
   - Перейдите в [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Создайте проект и включите Google Translate API
   - Создайте API ключ

2. **Введите ключ в настройки:**
   - Откройте popup расширения
   - Вставьте ключ в поле "Google Translate API ключ"
   - Нажмите "Сохранить настройки"

## 🌍 Поддерживаемые языки

- **Русский** (по умолчанию)
- **Английский**
- **Немецкий** 
- **Французский**
- **Испанский**

## 🔄 Совместимость

- **Chrome** (основная поддержка)
- **Manifest V3** (современный стандарт)
- **SPA сайты** (React, Vue, Angular и др.)
- **Динамический контент** (AJAX загрузка)
- **Русская и английская** раскладки клавиатуры

## 📋 Технические особенности

### Архитектура
- **content.js** - основная логика навигации и UI
- **background.js** - обработка переводов и API
- **popup/** - интерфейс настроек

### Алгоритмы
- **Эвристическое определение** основного контента
- **Regex токенизация** с поддержкой составных слов
- **MutationObserver** для отслеживания изменений DOM
- **Умное кэширование** переводов

## 🤝 Вклад в проект

Проект создан с помощью AI, но приветствуются:
- Сообщения об ошибках
- Предложения новых функций
- Улучшения кода
- Переводы интерфейса

## 📄 Лицензия

MIT License - свободное использование и модификация.

---

**Создано с помощью Cursor AI** 🤖 