const form = document.getElementById("editCategoryForm");
const nameInput = document.getElementById("categoryName");
const formError = document.getElementById("formError");
const cancelButton = document.getElementById("cancelEditBtn");
const pathParts = window.location.pathname.split("/").filter(Boolean);
const isEditMode = pathParts.includes("edit");
const categoryId = isEditMode ? pathParts.at(-1) : null;
let category;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("formTitle").textContent = isEditMode ? "Edit Category" : "Add Category";
  document.title = isEditMode ? "Edit Category | QuickKart" : "Add Category | QuickKart";
  if (isEditMode) loadCategory();
  else nameInput.focus();
  form?.addEventListener("submit", saveCategory);
  cancelButton?.addEventListener("click", () => window.location.assign("/admin/category"));
});

async function loadCategory() {
  try {
    const response = await fetch(`/admin/category/${encodeURIComponent(categoryId)}`, {
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to load category");

    category = data;
    nameInput.value = category.name || "";
    nameInput.focus();
  } catch (error) {
    showError(error.message || "Unable to load category.");
    form?.querySelector("button[type='submit']")?.setAttribute("disabled", "disabled");
  }
}

async function saveCategory(event) {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return showError("Category name is required.");

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";
  clearError();

  try {
    const response = await fetch(
      isEditMode ? `/admin/category/${encodeURIComponent(categoryId)}` : "/admin/category/add",
      {
      method: isEditMode ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEditMode ? { name, isListed: category?.isListed } : { name }),
      },
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Unable to ${isEditMode ? "update" : "add"} category`);

    window.location.assign("/admin/category");
  } catch (error) {
    showError(error.message || `Unable to ${isEditMode ? "update" : "add"} category.`);
    submitButton.disabled = false;
    submitButton.textContent = "Save";
  }
}

function showError(message) {
  formError.textContent = message;
  nameInput.classList.add("is-invalid");
}

function clearError() {
  formError.textContent = "";
  nameInput.classList.remove("is-invalid");
}
