import {
    validateName,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateReferral
} from "./validation.js";

const form = document.getElementById("signupForm");
const formMessage = document.getElementById("formMessage");

if (!form) {
    console.error("Signup form not found");
} else {
    const clearMessage = () => {
        if (formMessage) {
            formMessage.textContent = "";
        }
    };

    form.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", clearMessage);
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

            const error =
                validateName(name) ||
                validateEmail(email) ||
                validatePassword(password) ||
                validateConfirmPassword(password, confirmPassword) ||
                validateReferral(referral);

            if (error) {
                if (formMessage) {
                    formMessage.textContent = error;
                }

                if (error.includes("Password") && document.getElementById("password")) {
                    document.getElementById("password").focus();
                } else if (error.includes("Confirm") && document.getElementById("confirmPassword")) {
                    document.getElementById("confirmPassword").focus();
                } else if (document.getElementById("name")) {
                    document.getElementById("name").focus();
                }
                return;
            }

            if (formMessage) {
                formMessage.textContent = "";
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
<<<<<<< HEAD
            window.location.href = window.location.hostname === "localhost" ? "/user/verify-otp" : "/verify-otp";
=======
            window.location.replace("/user/verify-otp");
>>>>>>> 8aff475 (week 8 completed)
        } catch (error) {
            console.log(error);
            alert("Server Error");
        }
    });
}
