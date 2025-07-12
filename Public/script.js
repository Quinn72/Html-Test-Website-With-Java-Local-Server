document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", login);
    }
});

function checkLoginStatus() {
    fetch("/check-login")
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                const loginBtn = document.getElementById("login-button");
                if (loginBtn) loginBtn.style.display = "none";

                const userInfo = document.getElementById("user-info");
                if (userInfo) {
                    userInfo.innerHTML = `
                        <span>👤 ${data.username}</span>
                        <button id="logout-button" class="logout-button">Logout</button>
                    `;
                    document.getElementById("logout-button").addEventListener("click", logout);
                }

                if (window.location.pathname.endsWith("/login.html") || window.location.pathname === "/") {
                    window.location.href = "welcome.html";
                }
            }
        })
        .catch(error => console.error("Login status check failed:", error));
}

function login(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                alert("Invalid credentials");
            }
        })
        .catch(error => console.error("Login failed:", error));
}

function logout() {
    fetch("/logout", { method: "POST" })
        .then(response => response.json())
        .then(data => {
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        })
        .catch(error => console.error("Logout failed:", error));
}
