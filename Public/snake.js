const board = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".highscore");
const topScoreDisplay = document.getElementById("topScoreDisplay");
const finalScoreElement = document.getElementById("finalScore");
const gameOverModal = document.getElementById("gameOverModal");
const difficultyModal = document.getElementById("difficultyModal");

let gameInterval;
let speed = 200;
let direction = { x: 0, y: 0 };
let snake = [{ x: 5, y: 5 }];
let food = { x: 10, y: 10 };
let score = 0;
let highScore = localStorage.getItem("high-score") || 0;

highScoreElement.innerText = `High Score: ${highScore}`;
topScoreDisplay.innerText = highScore;

const gridSize = 20;

function startGame(difficulty) {
  difficultyModal.style.display = "none";
  switch (difficulty) {
    case "easy":
      speed = 200;
      break;
    case "medium":
      speed = 120;
      break;
    case "hard":
      speed = 60;
      break;
  }

  snake = [{ x: 5, y: 5 }];
  direction = { x: 0, y: 0 };
  score = 0;
  updateScore();
  placeFood();
  drawBoard();

  document.addEventListener("keydown", changeDirection);
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(updateGame, speed);
}

function updateGame() {
  const head = { ...snake[0] };
  head.x += direction.x;
  head.y += direction.y;

  if (
    head.x < 0 ||
    head.x >= gridSize ||
    head.y < 0 ||
    head.y >= gridSize ||
    isCollision(head)
  ) {
    return endGame();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    updateScore();
    placeFood();
  } else {
    snake.pop();
  }

  drawBoard();
}

function isCollision(pos) {
  return snake.slice(1).some((segment) => segment.x === pos.x && segment.y === pos.y);
}

function placeFood() {
  let newFoodPosition;
  do {
    newFoodPosition = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  } while (snake.some((seg) => seg.x === newFoodPosition.x && seg.y === newFoodPosition.y));
  food = newFoodPosition;
}

function drawBoard() {
  board.innerHTML = "";

  snake.forEach((seg, index) => {
    const segment = document.createElement("div");
    segment.style.gridColumnStart = seg.x + 1;
    segment.style.gridRowStart = seg.y + 1;
    segment.className = index === 0 ? "snake-head" : "snake-body";
    board.appendChild(segment);
  });

  const foodElem = document.createElement("div");
  foodElem.style.gridColumnStart = food.x + 1;
  foodElem.style.gridRowStart = food.y + 1;
  foodElem.className = "food";
  board.appendChild(foodElem);
}

function changeDirection(e) {
  switch (e.key) {
    case "ArrowUp":
      if (direction.y === 0) direction = { x: 0, y: -1 };
      break;
    case "ArrowDown":
      if (direction.y === 0) direction = { x: 0, y: 1 };
      break;
    case "ArrowLeft":
      if (direction.x === 0) direction = { x: -1, y: 0 };
      break;
    case "ArrowRight":
      if (direction.x === 0) direction = { x: 1, y: 0 };
      break;
  }
}

function updateScore() {
  scoreElement.innerText = `Score: ${score}`;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("high-score", highScore);
    highScoreElement.innerText = `High Score: ${highScore}`;
    topScoreDisplay.innerText = highScore;
  }
}

function endGame() {
  clearInterval(gameInterval);
  finalScoreElement.innerText = score;
  gameOverModal.style.display = "flex";

  fetch("/submit-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score: score }),
  })
    .then((res) => res.json())
    .then((data) => console.log("Score submitted:", data))
    .catch((err) => console.error("Score submission error:", err));
}

function restartGame() {
  gameOverModal.style.display = "none";
  difficultyModal.style.display = "flex";
  document.removeEventListener("keydown", changeDirection);
}

function logout() {
  alert("Logging out...");
  // Add your logout logic here
}

window.onload = () => {
  difficultyModal.style.display = "flex";
};
