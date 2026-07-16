function getFieldValue(input) {
  if (!input) return "";

  if (input.type === "checkbox") {
    return input.checked ? "true" : "false";
  }

  return (input.value || "").trim();
}

function setFieldError(input, message = "") {
  if (!input) return;

  input.setCustomValidity(message);
  input.toggleAttribute("aria-invalid", Boolean(message));
  input.dataset.validationMessage = message;

  const errorContainer = input.parentElement?.querySelector(".field-error");
  if (errorContainer) {
    errorContainer.textContent = message;
  }
}

export function validateName(name) {
  if (!name || !name.trim()) {
    return "Name is required";
  }

  if (name.trim().length < 3) {
    return "Name must be at least 3 characters";
  }

  if (!/^[A-Za-z ]+$/.test(name.trim())) {
    return "Name can contain only letters and spaces";
  }

  return "";
}

export function validateEmail(email) {
  if (!email || !email.trim()) {
    return "Email is required";
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email.trim())) {
    return "Please enter a valid email address";
  }

  return "";
}

export function validateMobile(mobile) {
  if (!mobile || !mobile.trim()) {
    return "Mobile number is required";
  }

  if (!/^\d{10}$/.test(mobile.trim())) {
    return "Mobile number must contain exactly 10 digits";
  }

  return "";
}

export function validateRole(role) {
  if (!role) {
    return "Role is required";
  }

  const allowedRoles = ["user", "admin"];
  if (!allowedRoles.includes(role)) {
    return "Role must be user or admin";
  }

  return "";
}

export function validateStatus(status) {
  if (status === "" || status === null || status === undefined) {
    return "Status is required";
  }

  if (status !== "true" && status !== "false") {
    return "Status must be active or inactive";
  }

  return "";
}

export function validateReferral(referral) {
  if (!referral || !referral.trim()) {
    return "";
  }

  if (!/^[A-Za-z0-9]+$/.test(referral.trim())) {
    return "Referral code can contain only letters and numbers";
  }

  return "";
}

export function validateUserField(input) {
  if (!input) return true;

  const name = (input.name || input.id || "").toLowerCase();
  const value = getFieldValue(input);
  let errorMessage = "";

  if (name.includes("name") || input.id === "name") {
    errorMessage = validateName(value);
  } else if (name.includes("email")) {
    errorMessage = validateEmail(value);
  } else if (name.includes("mobile") || name.includes("phone")) {
    errorMessage = validateMobile(value);
  } else if (name.includes("role")) {
    errorMessage = validateRole(value);
  } else if (name.includes("status") || name.includes("active")) {
    errorMessage = validateStatus(value);
  } else if (name.includes("referral")) {
    errorMessage = validateReferral(value);
  }

  setFieldError(input, errorMessage);
  return !errorMessage;
}

export function validateUserManagementForm(form) {
  if (!form) return true;

  const fields = form.querySelectorAll("input, select, textarea");
  let isValid = true;

  fields.forEach((field) => {
    const fieldValid = validateUserField(field);
    if (!fieldValid) {
      isValid = false;
    }
  });

  return isValid;
}

function attachUserValidation(form) {
  if (!form) return;

  const userFields = form.querySelectorAll("input, select, textarea");
  const hasUserFields = Array.from(userFields).some((field) => {
    const fieldName = (field.name || field.id || "").toLowerCase();
    return ["name", "email", "mobile", "phone", "role", "status", "active", "referral"].some((token) => fieldName.includes(token));
  });

  if (!hasUserFields) return;

  form.addEventListener("submit", (event) => {
    if (!validateUserManagementForm(form)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  userFields.forEach((field) => {
    field.addEventListener("input", () => validateUserField(field));
    field.addEventListener("change", () => validateUserField(field));
    field.addEventListener("blur", () => validateUserField(field));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form").forEach((form) => attachUserValidation(form));
});

window.QuickartUserManagementValidation = {
  validateName,
  validateEmail,
  validateMobile,
  validateRole,
  validateStatus,
  validateReferral,
  validateUserField,
  validateUserManagementForm,
};
