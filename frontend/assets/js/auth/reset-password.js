import { validatePassword, validateConfirmPassword } from "./validation.js";

const email = sessionStorage.getItem("resetEmail");
const form = document.getElementById("resetPasswordForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const message = document.getElementById("formMessage");

if (!email || sessionStorage.getItem("otpFlow") !== "reset-password") {
  window.location.replace(window.location.hostname === "localhost" ? "/forgot-password" : "/forgot-password");
}

function showMessage(text, isError = true) {
  message.textContent = text;
  message.className = isError ? "small text-center text-danger" : "small text-center text-success";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const validationError = validatePassword(password) || validateConfirmPassword(password, confirmPassword);
  if (validationError) return showMessage(validationError);

  try {
    const API = window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://quickkart-api.onrender.com";
    const response = await fetch(`${API}/user/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to reset password");

    showMessage(data.message, false);
    sessionStorage.removeItem("resetEmail");
    sessionStorage.removeItem("otpFlow");
    window.location.assign(window.location.hostname === "localhost" ? "/login" : "/login");
  } catch (error) {
    showMessage(error.message || "Unable to reset password");
  }
});
