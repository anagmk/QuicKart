const otpFlow = sessionStorage.getItem("otpFlow") || "signup";
const email = otpFlow === "reset-password"
  ? sessionStorage.getItem("resetEmail")
  : sessionStorage.getItem("signupEmail");
const form = document.getElementById("otpForm");
const inputs = [...document.querySelectorAll(".otp-input")];
const message = document.getElementById("otpMessage");
const resendButton = document.getElementById("resendOtp");
const timer = document.getElementById("timer");
let remainingSeconds = 49;
let expired = false;
let countdown;

if (!email) {
  window.location.replace(otpFlow === "reset-password" ? "/forgot-password" : "/signup");
}

function showMessage(text, isError = true) {
  message.textContent = text;
  message.className = isError ? "small text-center mt-3 text-danger" : "small text-center mt-3 text-success";
  inputs.forEach((input) => input.classList.toggle("is-invalid", isError));
  if (!isError) inputs.forEach((input) => input.classList.remove("is-invalid"));
}

function clearError() {
  message.textContent = "";
  inputs.forEach((input) => input.classList.remove("is-invalid"));
}

function startTimer() {
  clearInterval(countdown);
  remainingSeconds = 49;
  expired = false;
  timer.textContent = "00:49s";

  countdown = setInterval(() => {
    remainingSeconds -= 1;
    timer.textContent = `00:${String(Math.max(remainingSeconds, 0)).padStart(2, "0")}s`;
    if (remainingSeconds <= 0) {
      clearInterval(countdown);
      expired = true;
      timer.textContent = "Expired";
      showMessage("This OTP has expired. Please resend a new code.");
    }
  }, 1000);
}

inputs.forEach((input, index) => {
  input.addEventListener("input", (event) => {
    input.value = event.target.value.replace(/\D/g, "").slice(-1);
    clearError();
    if (input.value && index < inputs.length - 1) inputs[index + 1].focus();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && index > 0) inputs[index - 1].focus();
  });

  input.addEventListener("paste", (event) => {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    digits.split("").forEach((digit, digitIndex) => { inputs[digitIndex].value = digit; });
    inputs[Math.min(digits.length, 5)].focus();
    clearError();
  });
});

async function requestOtp(endpoint, body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const otp = inputs.map((input) => input.value).join("");

  if (expired) return showMessage("This OTP has expired. Please resend a new code.");
  if (!/^\d{6}$/.test(otp)) return showMessage("Enter the complete six-digit OTP.");

  try {
    const endpoint = otpFlow === "reset-password" ? "/user/verify-reset-otp" : "/user/verify-otp";
    const data = await requestOtp(endpoint, { email, otp });
    clearInterval(countdown);
    showMessage(data.message, false);
    if (otpFlow === "reset-password") {
      window.location.assign("/reset-password");
    } else {
      sessionStorage.removeItem("signupEmail");
      window.location.assign("/user/home");
    }
  } catch (error) {
    showMessage(error.message || "The OTP is invalid or expired.");
  }
});

resendButton.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    const endpoint = otpFlow === "reset-password" ? "/user/forgot-password" : "/user/resend-otp";
    const data = await requestOtp(endpoint, { email });
    inputs.forEach((input) => { input.value = ""; });
    inputs[0].focus();
    clearError();
    showMessage(data.message, false);
    startTimer();
  } catch (error) {
    showMessage(error.message);
  }
});

startTimer();
