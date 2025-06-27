# Руководство по созданию игры "Змейка" на JavaScript

## Введение

Это руководство поможет вам создать классическую игру "Змейка" с нуля, используя HTML, CSS и JavaScript. Игра включает игровое поле, змейку, яблоко, счет и сохранение лучшего результата (`highScore`). Мы также добавим модификацию — препятствия (стены), которые усложняют игру.

**Цель**: Создать браузерную игру, где игрок управляет змейкой, собирает яблоки, избегает столкновений и сохраняет рекорд.

**Стек технологий**:

- HTML: Структура интерфейса.
- CSS: Стили для сетки и элементов.
- JavaScript: Логика игры, обработка ввода, рендеринг.
- `localStorage`: Сохранение рекорда.

**Предварительные знания**:

- Базовые знания HTML, CSS и JavaScript.
- Понимание событий клавиатуры и работы с DOM.
- Основы CSS Grid и `requestAnimationFrame`.

---

## Пошаговые инструкции

### Шаг 1: Настройка проекта

1. Создайте папку проекта `snake-game`.
2. Внутри создайте три файла:
   - `index.html` — для структуры.
   - `styles.css` — для стилей.
   - `script.js` — для логики игры.
3. Настройте Git-репозиторий:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

```
snake-game/
├── index.html
├── styles.css
└── script.js
```

### Шаг 2: Создание HTML-структуры

Создайте базовую HTML-структуру с контейнером, заголовком (для счета и контраста), игровым полем и футером (для сообщений).

**Код (index.html)**:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Snake Game</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="container">
      <header>
        <div class="contrast">100%</div>
        <div class="score">Score: 0 | High: 0</div>
      </header>
      <div class="grid"></div>
      <footer>
        <div class="message">Press an arrow key or space to start!</div>
        <div class="mode">Ready for hard mode? Press H</div>
      </footer>
    </div>
    <script src="script.js"></script>
  </body>
</html>
```

**Объяснение**:

- `.container`: Центрирует содержимое.
- `.grid`: Игровое поле (сетка 15x15).
- `.score`: Отображает текущий счет и рекорд.
- `.message` и `.mode`: Для сообщений о старте и выборе режима.

### Шаг 3: Стилизация с помощью CSS

Настройте CSS для отображения сетки, змейки, яблока и интерфейса.

**Код (styles.css)**:

```css
html,
body {
  height: 100%;
  margin: 0;
}

body {
  --size: 15px;
  --color: black;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: var(--color);
  background: linear-gradient(
    162deg,
    rgba(255, 133, 133, 1) 0%,
    rgba(227, 84, 95, 1) 100%
  );
}

@media (min-height: 425px) {
  body {
    --size: 25px;
  }
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

header {
  display: flex;
  justify-content: space-between;
  width: calc(var(--size) * 20);
  font-size: 1.5em;
  font-weight: 900;
  margin-bottom: 10px;
}

.score {
  white-space: nowrap;
  text-align: right;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.grid {
  display: grid;
  grid-template-columns: repeat(15, var(--size));
  grid-template-rows: repeat(15, var(--size));
  border: var(--size) solid var(--color);
}

.tile {
  position: relative;
  width: var(--size);
  height: var(--size);
}

.content {
  position: absolute;
  width: 100%;
  height: 100%;
}

footer {
  margin-top: 20px;
  max-width: calc(var(--size) * 20);
  text-align: center;
  font-size: 1em;
}

.message {
  font-weight: bold;
  transition: opacity 0.3s ease;
}

.mode {
  font-size: 0.8em;
  margin-top: 5px;
}
```

**Объяснение**:

- CSS Grid создает поле 15x15 ячеек.
- `--size` адаптируется под размер экрана (15px или 25px).
- `.score` использует `white-space: nowrap`, чтобы текст не переносился.

### Шаг 4: Реализация базовой логики игры

Создайте JavaScript-код для управления змейкой, яблоком, счетом и рекордом.

**Код (script.js)**:

```javascript
window.addEventListener("DOMContentLoaded", function (event) {
  window.focus();
  document.addEventListener("click", () => window.focus());

  let snakePositions;
  let applePosition;
  let obstacles = []; // Для модификации
  let startTimestamp;
  let lastTimestamp;
  let stepsTaken;
  let score;
  let contrast;
  let inputs;
  let gameStarted = false;
  let hardMode = false;
  let highScore = localStorage.getItem("highScore") || 0;

  const width = 15;
  const height = 15;
  const speed = 200;
  let fadeSpeed = 5000;
  let fadeExponential = 1.024;
  const contrastIncrease = 0.5;
  const color = "black";

  const grid = document.querySelector(".grid");
  for (let i = 0; i < width * height; i++) {
    const content = document.createElement("div");
    content.setAttribute("class", "content");
    content.setAttribute("id", i);
    const tile = document.createElement("div");
    tile.setAttribute("class", "tile");
    tile.appendChild(content);
    grid.appendChild(tile);
  }

  const tiles = document.querySelectorAll(".grid .tile .content");
  const containerElement = document.querySelector(".container");
  const noteElement = document.querySelector(".message");
  const contrastElement = document.querySelector(".contrast");
  const scoreElement = document.querySelector(".score");

  function resetGame() {
    snakePositions = [168, 169, 170, 171];
    applePosition = 100;
    obstacles = []; // Сбрасываем препятствия
    startTimestamp = undefined;
    lastTimestamp = undefined;
    stepsTaken = -1;
    score = 0;
    contrast = 1;
    inputs = [];
    highScore = localStorage.getItem("highScore") || 0;
    contrastElement.innerText = `${Math.floor(contrast * 100)}%`;
    scoreElement.innerText = hardMode
      ? `H Score: ${score} | High: ${highScore}`
      : `Score: ${score} | High: ${highScore}`;
    noteElement.innerText = "Press an arrow key or space to start!";
    noteElement.style.opacity = 1;
    for (const tile of tiles) setTile(tile);
    setTile(tiles[applePosition], {
      "background-color": color,
      "border-radius": "50%",
    });
    for (const i of snakePositions.slice(1)) {
      const snakePart = tiles[i];
      snakePart.style.backgroundColor = color;
      if (i == snakePositions[snakePositions.length - 1])
        snakePart.style.left = 0;
      if (i == snakePositions[0]) snakePart.style.right = 0;
    }
    if (hardMode) addObstacles(3); // Добавляем препятствия в сложном режиме
  }

  function updateScore() {
    score++;
    if (score > highScore) {
      highScore = score;
      try {
        localStorage.setItem("highScore", highScore);
      } catch (e) {
        console.warn("localStorage is not available:", e);
      }
    }
    scoreElement.innerText = hardMode
      ? `H Score: ${score} | High: ${highScore}`
      : `Score: ${score} | High: ${highScore}`;
  }

  window.addEventListener("keydown", function (event) {
    if (
      ![
        "ArrowLeft",
        "ArrowUp",
        "ArrowRight",
        "ArrowDown",
        " ",
        "H",
        "h",
        "E",
        "e",
      ].includes(event.key)
    )
      return;
    event.preventDefault();

    if (event.key == " ") {
      resetGame();
      startGame();
      return;
    }
    if (event.key == "H" || event.key == "h") {
      hardMode = true;
      fadeSpeed = 4000;
      fadeExponential = 1.025;
      noteElement.innerText = "Hard mode. Press space to start!";
      noteElement.style.opacity = 1;
      resetGame();
      return;
    }
    if (event.key == "E" || event.key == "e") {
      hardMode = false;
      fadeSpeed = 5000;
      fadeExponential = 1.024;
      noteElement.innerText = "Easy mode. Press space to start!";
      noteElement.style.opacity = 1;
      resetGame();
      return;
    }
    if (
      event.key == "ArrowLeft" &&
      inputs[inputs.length - 1] != "left" &&
      headDirection() != "right"
    ) {
      inputs.push("left");
      if (!gameStarted) startGame();
      return;
    }
    if (
      event.key == "ArrowUp" &&
      inputs[inputs.length - 1] != "up" &&
      headDirection() != "down"
    ) {
      inputs.push("up");
      if (!gameStarted) startGame();
      return;
    }
    if (
      event.key == "ArrowRight" &&
      inputs[inputs.length - 1] != "right" &&
      headDirection() != "left"
    ) {
      inputs.push("right");
      if (!gameStarted) startGame();
      return;
    }
    if (
      event.key == "ArrowDown" &&
      inputs[inputs.length - 1] != "down" &&
      headDirection() != "up"
    ) {
      inputs.push("down");
      if (!gameStarted) startGame();
      return;
    }
  });

  function startGame() {
    gameStarted = true;
    noteElement.innerText = "";
    noteElement.style.opacity = 0;
    window.requestAnimationFrame(main);
  }

  function main(timestamp) {
    try {
      if (startTimestamp === undefined) startTimestamp = timestamp;
      const totalElapsedTime = timestamp - startTimestamp;
      const timeElapsedSinceLastCall = timestamp - lastTimestamp;
      const stepsShouldHaveTaken = Math.floor(totalElapsedTime / speed);
      const percentageOfStep = (totalElapsedTime % speed) / speed;

      if (stepsTaken != stepsShouldHaveTaken) {
        stepAndTransition(percentageOfStep);
        const headPosition = snakePositions[snakePositions.length - 1];
        if (headPosition == applePosition) {
          updateScore();
          addNewApple();
          if (hardMode && score % 3 === 0) addObstacles(1); // Добавляем препятствие каждые 3 яблока
          contrast = Math.min(1, contrast + contrastIncrease);
        }
        stepsTaken++;
      } else {
        transition(percentageOfStep);
      }

      if (lastTimestamp) {
        const contrastDecrease =
          timeElapsedSinceLastCall /
          (Math.pow(fadeExponential, score) * fadeSpeed);
        contrast = Math.max(0, contrast - contrastDecrease);
      }

      contrastElement.innerText = `${Math.floor(contrast * 100)}%`;
      containerElement.style.opacity = contrast;
      window.requestAnimationFrame(main);
    } catch (error) {
      const pressSpaceToStart = "Press space to reset the game.";
      const changeMode = hardMode
        ? "Back to easy mode? Press E."
        : "Ready for hard mode? Press H.";
      noteElement.innerHTML = `${error.message}. ${pressSpaceToStart} <div>${changeMode}</div>`;
      noteElement.style.opacity = 1;
      containerElement.style.opacity = 1;
    }
    lastTimestamp = timestamp;
  }

  function stepAndTransition(percentageOfStep) {
    const newHeadPosition = getNextPosition();
    snakePositions.push(newHeadPosition);

    const previousTail = tiles[snakePositions[0]];
    setTile(previousTail);

    if (newHeadPosition != applePosition) {
      snakePositions.shift();
      const tail = tiles[snakePositions[0]];
      const tailDi = tailDirection();
      const tailValue = `${100 - percentageOfStep * 100}%`;

      if (tailDi == "right")
        setTile(tail, { left: 0, width: tailValue, "background-color": color });
      if (tailDi == "left")
        setTile(tail, {
          right: 0,
          width: tailValue,
          "background-color": color,
        });
      if (tailDi == "down")
        setTile(tail, { top: 0, height: tailValue, "background-color": color });
      if (tailDi == "up")
        setTile(tail, {
          bottom: 0,
          height: tailValue,
          "background-color": color,
        });
    }

    const previousHead = tiles[snakePositions[snakePositions.length - 2]];
    setTile(previousHead, { "background-color": color });

    const head = tiles[newHeadPosition];
    const headDi = headDirection();
    const headValue = `${percentageOfStep * 100}%`;

    if (headDi == "right")
      setTile(head, {
        left: 0,
        width: headValue,
        "background-color": color,
        "border-radius": 0,
      });
    if (headDi == "left")
      setTile(head, {
        right: 0,
        width: headValue,
        "background-color": color,
        "border-radius": 0,
      });
    if (headDi == "down")
      setTile(head, {
        top: 0,
        height: headValue,
        "background-color": color,
        "border-radius": 0,
      });
    if (headDi == "up")
      setTile(head, {
        bottom: 0,
        height: headValue,
        "background-color": color,
        "border-radius": 0,
      });
  }

  function transition(percentageOfStep) {
    const head = tiles[snakePositions[snakePositions.length - 1]];
    const headDi = headDirection();
    const headValue = `${percentageOfStep * 100}%`;
    if (headDi == "right" || headDi == "left") head.style.width = headValue;
    if (headDi == "down" || headDi == "up") head.style.height = headValue;

    const tail = tiles[snakePositions[0]];
    const tailDi = tailDirection();
    const tailValue = `${100 - percentageOfStep * 100}%`;
    if (tailDi == "right" || tailDi == "left") tail.style.width = tailValue;
    if (tailDi == "down" || tailDi == "up") tail.style.height = tailValue;
  }

  function getNextPosition() {
    const headPosition = snakePositions[snakePositions.length - 1];
    const snakeDirection = inputs.shift() || headDirection();
    switch (snakeDirection) {
      case "right": {
        const nextPosition = headPosition + 1;
        if (nextPosition % width == 0) throw Error("The snake hit the wall");
        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("The snake bit itself");
        if (obstacles.includes(nextPosition))
          throw Error("The snake hit an obstacle");
        return nextPosition;
      }
      case "left": {
        const nextPosition = headPosition - 1;
        if (nextPosition % width == width - 1 || nextPosition < 0)
          throw Error("The snake hit the wall");
        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("The snake bit itself");
        if (obstacles.includes(nextPosition))
          throw Error("The snake hit an obstacle");
        return nextPosition;
      }
      case "down": {
        const nextPosition = headPosition + width;
        if (nextPosition > width * height - 1)
          throw Error("The snake hit the wall");
        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("The snake bit itself");
        if (obstacles.includes(nextPosition))
          throw Error("The snake hit an obstacle");
        return nextPosition;
      }
      case "up": {
        const nextPosition = headPosition - width;
        if (nextPosition < 0) throw Error("The snake hit the wall");
        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("The snake bit itself");
        if (obstacles.includes(nextPosition))
          throw Error("The snake hit an obstacle");
        return nextPosition;
      }
    }
  }

  function headDirection() {
    const head = snakePositions[snakePositions.length - 1];
    const neck = snakePositions[snakePositions.length - 2];
    try {
      return getDirection(head, neck);
    } catch (error) {
      return inputs[inputs.length - 1] || "right";
    }
  }

  function tailDirection() {
    const tail1 = snakePositions[0];
    const tail2 = snakePositions[1];
    return getDirection(tail1, tail2);
  }

  function getDirection(first, second) {
    if (first - 1 == second) return "right";
    if (first + 1 == second) return "left";
    if (first - width == second) return "down";
    if (first + width == second) return "up";
    throw Error("the two tiles are not connected");
  }

  function addNewApple() {
    let newPosition;
    do {
      newPosition = Math.floor(Math.random() * width * height);
    } while (snakePositions.includes(newPosition) || obstacles.includes(newPosition));
    setTile(tiles[newPosition], {
      "background-color": color,
      "border-radius": "50%",
    });
    applePosition = newPosition;
  }

  function addObstacles(count) {
    for (let i = 0; i < count; i++) {
      let newPosition;
      do {
        newPosition = Math.floor(Math.random() * width * height);
      } while (
        snakePositions.includes(newPosition) ||
        newPosition === applePosition ||
        obstacles.includes(newPosition)
      );
      obstacles.push(newPosition);
      setTile(tiles[newPosition], {
        "background-color": "gray",
        border: "1px solid black",
      });
    }
  }

  function setTile(element, overrides = {}) {
    const defaults = {
      width: "100%",
      height: "100%",
      top: "auto",
      right: "auto",
      bottom: "auto",
      left: "auto",
      "background-color": "transparent",
    };
    const cssProperties = { ...defaults, ...overrides };
    element.style.cssText = Object.entries(cssProperties)
      .map(([key, value]) => `${key}: ${value};`)
      .join(" ");
  }

  resetGame();
});
```

1. Пользователь нажимает стрелку → `keydown` добавляет направление в `inputs`.
2. `main` вызывает `stepAndTransition` → `getNextPosition` → обновление `snakePositions`.
3. При съедании яблока вызывается `updateScore` → обновление `scoreElement`.

**Объяснение**:

- Инициализация: Создается сетка 15x15, змейка (4 клетки), яблоко и начальный счет.
- Управление: Стрелки добавляют направления в `inputs`, которые обрабатываются в `main`.
- Рендеринг: `requestAnimationFrame` обеспечивает плавную анимацию движения.
- `highScore`: Сохраняется в `localStorage` при достижении нового рекорда.

### Шаг 5: Модификация — Затухание экрана

**Описание модификации**:

- Экран затемняется (`opacity` контейнера уменьшается), имитируя задымление.
- В сложном режиме (`hardMode`) затухание быстрее (`fadeSpeed=3000`, `fadeExponential=1.03`).
- Достижение выхода восстанавливает видимость (`+0.5`) и завершает игру.
- Если видимость падает до 20%, игра заканчивается с ошибкой.
- Подсчет шагов (`steps`) и сохранение лучшего результата (`bestSteps`).

**Реализация**:

- Заменили `contrast` на `visibility`.
- В `main` уменьшаем `visibility` с использованием `fadeSpeed` и `fadeExponential`.
- В `resetGame` задаем разные параметры затухания для режимов.

### Шаг 6: Тестирование

1. Запустите игру в браузере (`index.html`).
2. Проверьте:
   - Управление стрелками.
   - Обновление счета и рекорда при съедании яблока.
   - Появление препятствий в сложном режиме (нажмите `H`).
   - Завершение игры при столкновении с препятствием, стеной или хвостом.
3. Откройте консоль (F12) и проверьте, нет ли ошибок.

- Инициализация → Ожидание ввода (`Press space or arrow`).
- Игра начата → Движение змейки → Съедание яблока → Обновление счета.
- Столкновение → Game Over → Сброс игры.

---

## Архитектура проекта

- `Game`: Управляет состоянием (`snakePositions`, `applePosition`, `obstacles`, `score`, `highScore`).
- `Grid`: Сетка 15x15, содержит `Tile` элементы.
- `Tile`: Содержит стили (`background-color`, `width`, `height`).
- `Input`: Обрабатывает события клавиатуры (`Arrow keys`, `H`, `E`, `Space`).

**Таблица 1: Основные функции**
| Функция | Описание |
|--------------------|---------------------------------------|
| `resetGame` | Сбрасывает игру, инициализирует змейку, яблоко, счет и препятствия. |
| `startGame` | Запускает игровой цикл с `requestAnimationFrame`. |
| `main` | Основной цикл: обновляет позицию змейки, счет, контраст. |
| `updateScore` | Увеличивает счет, обновляет рекорд, отображает в `.score`. |
| `getNextPosition` | Вычисляет следующую позицию змейки с учетом препятствий. |

---

## Установка и запуск

1. Склонируйте репозиторий:
   ```bash
   git clone <ваш-репозиторий>
   cd snake-game
   ```
2. Откройте `index.html` в браузере.
3. Управление:
   - Стрелки: Движение змейки.
   - Пробел: Сброс игры.
   - `H`: Сложный режим (с препятствиями).
   - `E`: Легкий режим.

---

## Модификация проекта

**Описание модификации**: Добавлено затухние экрана и сложный режим. Затухание экрана происходит постоянно, при съедании яблока процент затухания понижается, давая тем самым обзор. При полном затухании игрок ничего не сможет видеть и, скорее всего, врежется в стенку или в самого себя. В сложном режиме затухание происходит в разы быстрее, скорость змейки так же увеличина.

**Обоснование**:

- Усложняет игру, добавляя стратегический элемент.
- Демонстрирует навыки работы с массивами и проверкой столкновений.
- Легко интегрируется в существующий код.

---

## Отладка и улучшения

- **Отладка**: Используйте консоль разработчика (F12) для проверки логов (`console.log`) при движении змейки, съедании яблока и столкновениях.
- **Возможные улучшения**:
  - Мобильное управление (свайпы или кнопки).
  - Звуковые эффекты при съедании яблока.
  - Анимация для рекорда (например, мигание текста).

---

## Заключение

Вы создали полноценную игру "Змейка" с сохранением рекорда и добавили модификацию с препятствиями. Проект демонстрирует навыки работы с DOM, событиями, анимацией и локальным хранилищем. Поместите код в Git-репозиторий и создайте HTML-версию документации для сайта.
