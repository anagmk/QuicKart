import {
    validateName,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateReferral
} from "./validation.js";

const form = document.getElementById("signupForm");

if (!form) {
    console.error("Signup form not found");
} else {
    const clearFieldError = (input) => {
        input.classList.remove("is-invalid");
        const error = document.getElementById(`${input.id}Error`);
        if (error) error.textContent = "";
    };

    form.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", () => clearFieldError(input));
    });

    form.querySelectorAll(".toggle-password").forEach((icon) => {
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

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const name = document.getElementById("name")?.value.trim() ?? "";
            const email = document.getElementById("email")?.value.trim() ?? "";
            const password = document.getElementById("password")?.value ?? "";
            const confirmPassword = document.getElementById("confirmPassword")?.value ?? "";
            const referral = document.getElementById("referral")?.value.trim() ?? "";

            const errors = {
                name: validateName(name),
                email: validateEmail(email),
                password: validatePassword(password),
                confirmPassword: validateConfirmPassword(password, confirmPassword),
                referral: validateReferral(referral),
            };

            let firstInvalidInput = null;
            Object.entries(errors).forEach(([field, error]) => {
                const input = document.getElementById(field);
                const errorElement = document.getElementById(`${field}Error`);
                if (!input || !errorElement) return;

                input.classList.toggle("is-invalid", Boolean(error));
                errorElement.textContent = error;
                if (error && !firstInvalidInput) firstInvalidInput = input;
            });

            if (firstInvalidInput) {
                firstInvalidInput.focus();
                return;
            }

            console.log("Validation Passed");

            const userData = {
                name,
                email,
                password,
                referredBy: referral || undefined,
            };

            const API = window.location.hostname === "localhost"
                ? "http://localhost:3000"
                : "https://quickkart-api.onrender.com";

            const response = await fetch(
                `${API}/user/signup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(userData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Signup failed");
                return;
            }

            alert(data.message || "Signup successful");

            sessionStorage.removeItem("resetEmail");
            sessionStorage.removeItem("otpFlow");
            sessionStorage.setItem("signupEmail", userData.email);
            window.location.replace("/user/verify-otp");
        } catch (error) {
            console.log(error);
            alert("Server Error");
        }
    });
}
