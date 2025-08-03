// Utility: Get random integer in range [min, max]
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + Math.ceil(min);
}

// Tetromino sequence for the "bag" system
const tetrominoSequence = [];

// Tetromino shapes
const tetrominos = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
};

// Tetromino colors
const colors = {
  I: "cyan", O: "yellow", T: "purple",
  S: "green", Z: "red", J: "blue", L: "orange"
};

// Canvas setup
const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const grid = 32;

const playfield = [];
for (let row = -2; row < 20; row++) {
  playfield[row] = new Array(10).fill(0);
}

let count = 0;
let rAF = null;
let gameOver = false;
let score = 0;
let tetromino = null;

const scoreDisplay = document.getElementById("score");
const highscoreDisplay = document.getElementById("highscore");

// Generate a shuffled bag of tetromino types
function generateSequence() {
  const sequence = ["I","J","L","O","S","T","Z"];
  while (sequence.length) {
    const name = sequence.splice(getRandomInt(0, sequence.length - 1), 1)[0];
    tetrominoSequence.push(name);
  }
}

function getNextTetromino() {
  if (tetrominoSequence.length < 5) generateSequence();
  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];
  const row = name === "I" ? -1 : -2;
  const col = Math.floor((10 - matrix[0].length) / 2);
  return { name, matrix, row, col };
}

function rotate(matrix) {
  const N = matrix.length - 1;
  return matrix.map((row, i) => row.map((_, j) => matrix[N - j][i]));
}

function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        const r = cellRow + row;
        const c = cellCol + col;
        if (c < 0 || c >= 10 || r >= 20 || playfield[r]?.[c]) {
          return false;
        }
      }
    }
  }
  return true;
}

function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        const r = tetromino.row + row;
        const c = tetromino.col + col;
        if (r < 0) return showGameOver();
        playfield[r][c] = tetromino.name;
      }
    }
  }

  let linesCleared = 0;
  for (let row = playfield.length - 1; row >= 0;) {
    if (playfield[row].every(cell => !!cell)) {
      linesCleared++;
      for (let r = row; r > 0; r--) {
        playfield[r] = [...playfield[r - 1]];
      }
      playfield[0] = new Array(10).fill(0);
      continue; // recheck same row
    } else {
      row--;
    }
  }

  if (linesCleared > 0) {
    score += linesCleared * 100;
    scoreDisplay.textContent = `Score: ${score}`;
  }

  spawnTetromino();
  drawPreview();
}

function spawnTetromino() {
  tetromino = getNextTetromino();
  if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
    showGameOver();
  }
}

function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;

  context.fillStyle = "black";
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = "white";
  context.font = "36px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2);

  submitScore();
}

async function submitScore() {
  try {
    const res = await fetch("/submit-tetris-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Submit failed");
    fetchHighscore();
  } catch (e) {
    console.error("Score submit error:", e);
  }
}

async function fetchHighscore() {
  try {
    const res = await fetch("/tetris-highscore");
    if (!res.ok) throw new Error("Failed to fetch highscore");
    const data = await res.json();
    highscoreDisplay.textContent = `High Score: ${data.highscore || 0}`;
  } catch (e) {
    console.error("Fetch highscore error:", e);
  }
}

const previewCanvases = [
  document.getElementById("preview1").getContext("2d"),
  document.getElementById("preview2").getContext("2d"),
  document.getElementById("preview3").getContext("2d"),
  document.getElementById("preview4").getContext("2d"),
];

function drawPreview() {
  for (let i = 0; i < 4; i++) {
    const ctx = previewCanvases[i];
    const name = tetrominoSequence[tetrominoSequence.length - 1 - i];
    ctx.clearRect(0, 0, 64, 64);
    if (!name) continue;

    const matrix = tetrominos[name];
    const color = colors[name];
    ctx.fillStyle = color;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          ctx.fillRect(col * 16, row * 16, 14, 14);
        }
      }
    }
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < playfield.length; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = playfield[row][col];
      if (cell) {
        context.fillStyle = colors[cell];
        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
  }

  if (tetromino) {
    context.fillStyle = colors[tetromino.name];
    tetromino.matrix.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val) {
          context.fillRect((tetromino.col + x) * grid, (tetromino.row + y) * grid, grid - 1, grid - 1);
        }
      });
    });
  }
}

function loop() {
  if (gameOver) return;
  if (count++ % 35 === 0) moveDown();
  draw();
  rAF = requestAnimationFrame(loop);
}

function moveDown() {
  if (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
    tetromino.row++;
  } else {
    placeTetromino();
  }
}

function moveLeft() {
  if (isValidMove(tetromino.matrix, tetromino.row, tetromino.col - 1)) {
    tetromino.col--;
  }
}

function moveRight() {
  if (isValidMove(tetromino.matrix, tetromino.row, tetromino.col + 1)) {
    tetromino.col++;
  }
}

function rotateTetromino() {
  const rotated = rotate(tetromino.matrix);
  if (isValidMove(rotated, tetromino.row, tetromino.col)) {
    tetromino.matrix = rotated;
  } else if (isValidMove(rotated, tetromino.row, tetromino.col - 1)) {
    tetromino.col--;
    tetromino.matrix = rotated;
  } else if (isValidMove(rotated, tetromino.row, tetromino.col + 1)) {
    tetromino.col++;
    tetromino.matrix = rotated;
  }
}

document.addEventListener("keydown", event => {
  if (gameOver) return;
  switch (event.key) {
    case "ArrowLeft": moveLeft(); break;
    case "ArrowRight": moveRight(); break;
    case "ArrowDown": moveDown(); break;
    case "ArrowUp": rotateTetromino(); break;
    case " ": while (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) tetromino.row++; placeTetromino(); break;
  }
});

// Mute button logic
const muteBtn = document.getElementById("mute-btn");
const bgMusic = document.getElementById("bg-music");
muteBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    muteBtn.textContent = "Mute";
    muteBtn.setAttribute("aria-pressed", "false");
  } else {
    bgMusic.pause();
    muteBtn.textContent = "Unmute";
    muteBtn.setAttribute("aria-pressed", "true");
  }
});

// Start game
generateSequence();
spawnTetromino();
drawPreview();
fetchHighscore();
loop();
