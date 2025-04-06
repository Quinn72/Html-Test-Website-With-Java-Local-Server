const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const db = new sqlite3.Database("users.db");

// **🔥 First, Ensure the Users Table Exists**
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, 
    username TEXT UNIQUE, 
    password TEXT
)`, (err) => {
    if (err) {
        console.error("Error creating users table:", err);
        return db.close();
    }

    console.log("✅ Users table ensured.");

    const adminUsername = "admin";
    const adminPassword = "admin1!";

    // **🔥 Now, Check If Admin Exists**
    db.get("SELECT * FROM users WHERE username = ?", [adminUsername], (err, user) => {
        if (err) {
            console.error("Error checking for existing admin user:", err);
            return db.close();
        }

        if (user) {
            console.log("✅ Admin user already exists. No changes made.");
            return db.close();
        }

        // **🔥 Create Admin If Not Exists**
        bcrypt.hash(adminPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Error hashing password:", err);
                return;
            }

            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [adminUsername, hashedPassword], (err) => {
                if (err) {
                    console.error("Error inserting admin user:", err);
                } else {
                    console.log("✅ Admin user created successfully!");
                }
                db.close();
            });
        });
    });
});
