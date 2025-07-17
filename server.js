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
const PORT = 3000;

// ✅ Optional livereload
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

// ✅ Logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "w" });
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms :remote-addr :user-agent', { stream: accessLogStream }));
app.use(morgan('dev'));

// ✅ Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ✅ Init DBs
userDB.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
)`);

scoreDB.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY,
    username TEXT,
    score INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ✅ Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "home.html")));

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

// ✅ Protected pages
app.get("/Landing_Page.html", (req, res) => {
    if (!req.session.user) return res.redirect("/");
    res.sendFile(path.join(__dirname, "public", "Landing_Page.html"));
});

app.get("/snake.html", (req, res) => {
    if (!req.session.user) return res.redirect("/");
    res.sendFile(path.join(__dirname, "public", "snake.html"));
});

// ✅ Score submission
app.post("/submit-score", (req, res) => {
    const { score } = req.body;
    const username = req.session.user;

    if (!username || typeof score !== "number") {
        return res.status(400).json({ message: "Invalid score or user not logged in" });
    }

    scoreDB.run("INSERT INTO scores (username, score) VALUES (?, ?)", [username, score], err => {
        if (err) return res.status(500).json({ message: "Failed to submit score" });
        res.json({ message: "Score submitted" });
    });
});

// ✅ Leaderboard
app.get("/leaderboard", (req, res) => {
    scoreDB.all("SELECT username, score, timestamp FROM scores ORDER BY score DESC LIMIT 10", (err, rows) => {
        if (err) return res.status(500).json({ message: "Failed to get leaderboard" });
        res.json(rows);
    });
});

// ✅ Start
app.listen(PORT, '0.0.0.0', () => {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }

    console.log(`✅ Server running locally:   http://localhost:${PORT}`);
    addresses.forEach(addr => console.log(`🌐 LAN access available at: http://${addr}:${PORT}`));
});
