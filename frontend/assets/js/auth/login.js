const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.querySelectorAll(".toggle-password").forEach((icon) => {
        icon.addEventListener("click", () => {
            const targetId = icon.getAttribute("data-target");
            const targetInput = document.getElementById(targetId);

            if (!targetInput) return;

            const isPassword = targetInput.type === "password";
            targetInput.type = isPassword ? "text" : "password";
            icon.classList.toggle("bi-eye", !isPassword);
            icon.classList.toggle("bi-eye-slash", isPassword);
            icon.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
        });

        icon.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                icon.click();
            }
        });
    });

    loginForm.addEventListener("submit", login);
}

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

<<<<<<< HEAD
        window.location.href = getHomePath();
=======
        sessionStorage.removeItem("signupEmail");
        sessionStorage.removeItem("resetEmail");
        sessionStorage.removeItem("otpFlow");
        window.location.replace("/user/home");
>>>>>>> 8aff475 (week 8 completed)

    } catch (error) {
        console.error(error);
        alert("Unable to connect to server.");
    }
}