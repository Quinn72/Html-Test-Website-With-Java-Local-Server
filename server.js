const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const session = require("express-session");

const app = express();
const db = new sqlite3.Database("users.db");

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // Serve static files

app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Change to true if using HTTPS
}));

// **🔥 Ensure Users Table Exists**
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, 
    username TEXT UNIQUE, 
    password TEXT
)`);

// **🔥 Serve Home Page**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "home.html"));
});

// **🔥 Register User**
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], (err) => {
            if (err) return res.status(500).json({ message: "User already exists" });
            res.json({ message: "User registered successfully" });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// **🔥 Login Route (Fixing Redirect)**
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // **🔥 Store User in Session**
        req.session.user = username;

        // **🔥 Send Redirect Response**
        res.json({ message: "Login successful", redirect: "welcome.html" });
    });
});

// **🔥 Logout Route**
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.json({ message: "Logged out successfully", redirect: "home.html" });
    });
});

// **🔥 Check Login Status**
app.get("/check-login", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, username: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// **🔥 Start Server**
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
