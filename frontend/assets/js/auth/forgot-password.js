import { validateEmail } from "./validation.js";

const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const message = document.getElementById("formMessage");
const submitButton = form.querySelector('button[type="submit"]');

function showMessage(text, isError = true) {
  message.textContent = text;
  message.className = isError ? "small text-center text-danger" : "small text-center text-success";
  emailInput.classList.toggle("is-invalid", isError);
  if (!isError) emailInput.classList.remove("is-invalid");
}

emailInput.addEventListener("input", () => {
  emailInput.classList.remove("is-invalid");
  message.textContent = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const validationError = validateEmail(email);

  if (validationError) {
    showMessage(validationError);
    emailInput.focus();
    return;
  }

  submitButton.disabled = true;
  try {
    const API = window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://quickkart-api.onrender.com";
    const response = await fetch(`${API}/user/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Unable to send OTP");

    showMessage(data.message || "OTP sent. Check your email.", false);
    sessionStorage.setItem("resetEmail", email);
    sessionStorage.setItem("otpFlow", "reset-password");
    window.location.href = window.location.hostname === "localhost" ? "/user/verify-otp" : "/verify-otp";
  } catch (error) {
    showMessage(error.message || "Unable to send OTP");
  } finally {
    submitButton.disabled = false;
  }
});
