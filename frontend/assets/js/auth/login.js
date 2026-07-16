const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", login);

const API =
    window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://quickart-steel.vercel.app";

function getHomePath() {
    return window.location.hostname === "localhost" ? "/user/home" : "/home";
}

async function login(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Email and Password are required.");
        return;
    }

    try {
        const response = await fetch(`${API}/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert(data.message);

        window.location.href = getHomePath();

    } catch (error) {
        console.error(error);
        alert("Unable to connect to server.");
    }
}