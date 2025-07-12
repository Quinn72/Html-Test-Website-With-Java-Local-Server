const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const db = new sqlite3.Database("users.db", (err) => {
    if (err) {
        return console.error("❌ Failed to connect to database:", err.message);
    }
    console.log("✅ Connected to users.db");
});

const adminUsername = "admin";
const adminPassword = "admin1!";

// Step 1: Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
)`, (err) => {
    if (err) {
        console.error("❌ Failed to create table:", err.message);
        return db.close();
    }

    console.log("✅ Users table ensured.");

    // Step 2: Check if admin already exists
    db.get("SELECT * FROM users WHERE username = ?", [adminUsername], (err, user) => {
        if (err) {
            console.error("❌ Failed to query users:", err.message);
            return db.close();
        }

        if (user) {
            console.log("ℹ️ Admin user already exists. No changes made.");
            return db.close();
        }

        // Step 3: Create admin if not found
        bcrypt.hash(adminPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error("❌ Failed to hash password:", err.message);
                return db.close();
            }

            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [adminUsername, hashedPassword], (err) => {
                if (err) {
                    console.error("❌ Failed to insert admin user:", err.message);
                } else {
                    console.log("✅ Admin user created successfully!");
                }
                db.close();
            });
        });
    });
});
