const form = document.getElementById("changeEmailForm");
const currentEmailInput = document.getElementById("currentEmail");
const newEmailInput = document.getElementById("newEmail");
const message = document.getElementById("formMessage");
const submitButton = form.querySelector('button[type="submit"]');

function showMessage(text, isError = true) {
  message.textContent = text;
  message.className = `small text-center ${isError ? "text-danger" : "text-success"}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentEmail = currentEmailInput.value.trim();
  const newEmail = newEmailInput.value.trim();

  if (!currentEmail || !newEmail) return showMessage("Enter both email addresses.");
  if (currentEmail.toLowerCase() === newEmail.toLowerCase()) {
    return showMessage("Your new email must be different from your current email.");
  }

  submitButton.disabled = true;
  try {
    const response = await fetch("/user/change-email/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentEmail, newEmail }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to send OTP");

    sessionStorage.setItem("otpFlow", "change-email");
    sessionStorage.setItem("changeEmail", newEmail);
    window.location.assign("/user/change-email/verify");
  } catch (error) {
    showMessage(error.message || "Unable to send OTP");
  } finally {
    submitButton.disabled = false;
  }
});
