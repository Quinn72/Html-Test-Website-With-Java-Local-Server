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
                document.getElementById("login-button").style.display = "none";
                document.getElementById("user-info").innerHTML = `
                    <span>👤 ${data.username}</span> 
                    <button id="logout-button" class="logout-button">Logout</button>
                `;
                document.getElementById("logout-button").addEventListener("click", logout);
            }
        })
        .catch(error => console.error("Error checking login status:", error));
}

function login(event) {
    event.preventDefault(); // Prevent form submission

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
            window.location.href = data.redirect; // ✅ Redirect to welcome.html
        } else {
            alert("Invalid login credentials");
        }
    })
    .catch(error => console.error("Error logging in:", error));
}

function logout() {
    fetch("/logout", { method: "POST" })
        .then(response => response.json())
        .then(data => {
            if (data.redirect) {
                window.location.href = data.redirect; // ✅ Redirect to home.html
            }
        })
        .catch(error => console.error("Error logging out:", error));
}
