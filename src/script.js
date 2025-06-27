window.addEventListener("DOMContentLoaded", function (event) {
  window.focus();

  // Game data
  let snakePositions;
  let applePosition;

  let startTimestamp;
  let lastTimestamp;
  let stepsTaken;
  let score;
  let contrast;

  let inputs;

  let gameStarted = false;
  let hardMode = false;

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
  const noteElement = document.querySelector("footer");
  const contrastElement = document.querySelector(".contrast");
  const scoreElement = document.querySelector(".score");

  resetGame();

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

  function resetGame() {
    snakePositions = [168, 169, 170, 171];
    applePosition = 100;

    startTimestamp = undefined;
    lastTimestamp = undefined;
    stepsTaken = -1;
    score = 0;
    contrast = 1;
    highScore = localStorage.getItem("highScore") || 0;

    inputs = [];

    contrastElement.innerText = `${Math.floor(contrast * 100)}%`;

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
      noteElement.innerHTML = `Hard mode. Press space to start!`;
      noteElement.style.opacity = 1;
      resetGame();
      return;
    }

    if (event.key == "E" || event.key == "e") {
      hardMode = false;
      fadeSpeed = 5000;
      fadeExponential = 1.024;
      noteElement.innerHTML = `Easy mode. Press space to start!`;
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

          contrast = Math.min(1, contrast + contrastIncrease);

          console.log(`Contrast increased by ${contrastIncrease * 100}%`);
          console.log(
            "New fade speed (from 100% to 0% in milliseconds)",
            Math.pow(fadeExponential, score) * fadeSpeed
          );
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
        ? "Back to easy mode? Press the letter E."
        : "Ready for hard more? Press the letter H.";

      noteElement.innerHTML = `${error.message}. ${pressSpaceToStart} <div>${changeMode}</div>`;
      noteElement.style.opacity = 1;
      containerElement.style.opacity = 1;
    }

    lastTimestamp = timestamp;
  }

  function stepAndTransition(percentageOfStep) {
    const newHeadPosition = getNextPosition();
    console.log(`Snake stepping into tile ${newHeadPosition}`);
    snakePositions.push(newHeadPosition);

    const previousTail = tiles[snakePositions[0]];
    setTile(previousTail);

    if (newHeadPosition != applePosition) {
      snakePositions.shift();

      const tail = tiles[snakePositions[0]];
      const tailDi = tailDirection();
      const tailValue = `${100 - percentageOfStep * 100}%`;

      if (tailDi == "right")
        setTile(tail, {
          left: 0,
          width: tailValue,
          "background-color": color,
        });

      if (tailDi == "left")
        setTile(tail, {
          right: 0,
          width: tailValue,
          "background-color": color,
        });

      if (tailDi == "down")
        setTile(tail, {
          top: 0,
          height: tailValue,
          "background-color": color,
        });

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
        return nextPosition;
      }
      case "left": {
        const nextPosition = headPosition - 1;
        if (nextPosition % width == width - 1 || nextPosition < 0)
          throw Error("The snake hit the wall");
        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("The snake bit itself");
        return nextPosition;
      }
      case "down": {
        const nextPosition = headPosition + width;
        if (nextPosition > width * height - 1)
          throw Error("The snake hit the wall");
        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("The snake bit itself");
        return nextPosition;
      }
      case "up": {
        const nextPosition = headPosition - width;
        if (nextPosition < 0) throw Error("The snake hit the wall");
        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("The snake bit itself");
        return nextPosition;
      }
    }
  }

  function headDirection() {
    const head = snakePositions[snakePositions.length - 1];
    const neck = snakePositions[snakePositions.length - 2];
    return getDirection(head, neck);
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
    throw Error("the two tile are not connected");
  }

  function addNewApple() {
    let newPosition;
    do {
      newPosition = Math.floor(Math.random() * width * height);
    } while (snakePositions.includes(newPosition));

    setTile(tiles[newPosition], {
      "background-color": color,
      "border-radius": "50%",
    });

    applePosition = newPosition;
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
});
