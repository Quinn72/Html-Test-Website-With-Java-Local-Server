const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const session = require("express-session");
const os = require("os");
const fs = require("fs");
const morgan = require("morgan");

const useLiveReload = process.argv.includes("--livereload");

const app = express();
const userDB = new sqlite3.Database("users.db");
const scoreDB = new sqlite3.Database("snake_scores.db");
const tetrisDB = new sqlite3.Database("teteris_score.db");

const PORT = 3000;

// Clear log on startup and increment server start count
const logFile = path.join(__dirname, "link_log.txt");
const serverStartFile = path.join(__dirname, "server_start_count.txt");

fs.writeFileSync(logFile, ""); // clear log

let startCount = 0;
if (fs.existsSync(serverStartFile)) {
  startCount = parseInt(fs.readFileSync(serverStartFile, "utf8")) || 0;
}
startCount++;
fs.writeFileSync(serverStartFile, startCount.toString());
console.log(`🔁 Server has been started ${startCount} time(s)`);

// Livereload setup
if (useLiveReload) {
  const livereload = require("livereload");
  const connectLivereload = require("connect-livereload");

  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, "public"));
  app.use(connectLivereload());

  liveReloadServer.server.once("connection", () => {
    setTimeout(() => liveReloadServer.refresh("/"), 100);
  });

  console.log("🔁 Live reload is ENABLED");
}

// Logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "w" });
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms :remote-addr :user-agent', { stream: accessLogStream }));
app.use(morgan("dev"));

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// DB setup
userDB.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT
)`);

scoreDB.run(`CREATE TABLE IF NOT EXISTS snake_scores (
  id INTEGER PRIMARY KEY,
  username TEXT,
  score INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

tetrisDB.run(`CREATE TABLE IF NOT EXISTS tetris_scores (
  id INTEGER PRIMARY KEY,
  username TEXT,
  score INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Username and password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    userDB.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], err => {
      if (err) return res.status(500).json({ message: "User already exists" });
      res.json({ message: "Registered successfully" });
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  userDB.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    req.session.user = username;
    res.json({ message: "Login successful", redirect: "Landing_Page.html" });
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.json({ message: "Logged out", redirect: "home.html" });
  });
});

app.get("/check-login", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, username: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

app.get("/Landing_Page.html", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Landing_Page.html"));
});

app.get("/snake.html", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "snake.html"));
});

app.get("/teteris.html", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "teteris.html"));
});

// Link tracking endpoint
app.post("/log-link", (req, res) => {
  const { type } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (type === "rick" || type === "midget") {
    const entry = `${new Date().toISOString()} - ${type.toUpperCase()} clicked by ${ip}\n`;
    fs.appendFile(logFile, entry, err => {
      if (err) console.error("Failed to write to log file:", err);
    });
  }

  res.sendStatus(200);
});

// Optional: view link log (dev only)
app.get("/view-log", (req, res) => {
  fs.readFile(logFile, "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading log");
    res.type("text/plain").send(data);
  });
});

// Snake score submission
app.post("/submit-score", (req, res) => {
  const { score } = req.body;
  const username = req.session.user;

  if (!username || typeof score !== "number") {
    return res.status(400).json({ message: "Invalid score or user not logged in" });
  }

  scoreDB.run("INSERT INTO snake_scores (username, score) VALUES (?, ?)", [username, score], err => {
    if (err) return res.status(500).json({ message: "Failed to submit score" });
    res.json({ message: "Score submitted" });
  });
});

// Tetris score submission
app.post("/submit-tetris-score", (req, res) => {
  const { score } = req.body;
  const username = req.session.user;

  if (!username || typeof score !== "number") {
    return res.status(400).json({ message: "Invalid score or user not logged in" });
  }

  tetrisDB.run("INSERT INTO tetris_scores (username, score) VALUES (?, ?)", [username, score], err => {
    if (err) return res.status(500).json({ message: "Failed to submit tetris score" });
    res.json({ message: "Tetris score submitted" });
  });
});

// Leaderboards
app.get("/leaderboard", (req, res) => {
  scoreDB.all("SELECT username, score, timestamp FROM snake_scores ORDER BY score DESC LIMIT 10", (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to get leaderboard" });
    res.json(rows);
  });
});

app.get("/tetris-leaderboard", (req, res) => {
  tetrisDB.all("SELECT username, score, timestamp FROM tetris_scores ORDER BY score DESC LIMIT 10", (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to get tetris leaderboard" });
    res.json(rows);
  });
});

app.get("/tetris-highscore", (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not logged in" });

  tetrisDB.get("SELECT MAX(score) AS highscore FROM tetris_scores WHERE username = ?", [req.session.user], (err, row) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json({ highscore: row ? row.highscore || 0 : 0 });
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  console.log(`✅ Server running locally:   http://localhost:${PORT}`);
  addresses.forEach(addr => console.log(`🌐 LAN access available at: http://${addr}:${PORT}`));
});
