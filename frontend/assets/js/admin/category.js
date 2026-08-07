const categoryTable = document.getElementById("categoryTable");
const categorySearch = document.getElementById("categorySearch");
const pagination = document.getElementById("categoryPagination");
const addCategoryBtn = document.getElementById("addCategoryBtn");

const PAGE_SIZE = 10;
let categories = [];
let currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  categorySearch?.addEventListener("input", debounce(searchCategories, 250));
  addCategoryBtn?.addEventListener("click", () => window.location.assign("/admin/category/add"));
});

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function loadCategories() {
  try {
    categories = await request("/admin/category/all");
    currentPage = 1;
    renderCategories();
  } catch (error) {
    showError(error.message || "Unable to load categories.");
  }
}

async function searchCategories() {
  const query = categorySearch?.value.trim() || "";
  try {
    categories = await request(`/admin/category/search?q=${encodeURIComponent(query)}`);
    currentPage = 1;
    renderCategories();
  } catch (error) {
    showError(error.message || "Unable to search categories.");
  }
}

function renderCategories() {
  if (!categoryTable) return;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageCategories = categories.slice(start, start + PAGE_SIZE);

  if (!pageCategories.length) {
    categoryTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No categories found.</td></tr>';
  } else {
    categoryTable.innerHTML = pageCategories.map((category, index) => `
      <tr>
        <td>${start + index + 1}</td>
        <td>${escapeHtml(category.name)}</td>
        <td><span class="badge ${category.isListed ? "bg-success" : "bg-secondary"}">${category.isListed ? "Listed" : "Blocked"}</span></td>
        <td class="text-center">
          <button class="btn btn-success btn-sm" data-action="edit" data-id="${category._id}">Edit</button>
          <button class="btn btn-warning btn-sm" data-action="toggle" data-id="${category._id}">${category.isListed ? "Block" : "Unblock"}</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${category._id}">Delete</button>
        </td>
      </tr>`).join("");
  }

  categoryTable.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.id));
  });
  renderPagination();
}

function renderPagination() {
  if (!pagination) return;
  const pages = Math.ceil(categories.length / PAGE_SIZE);
  if (pages <= 1) return pagination.innerHTML = "";
  pagination.innerHTML = Array.from({ length: pages }, (_, index) => {
    const page = index + 1;
    return `<li class="page-item ${page === currentPage ? "active" : ""}"><button class="page-link" data-page="${page}">${page}</button></li>`;
  }).join("");
  pagination.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    currentPage = Number(button.dataset.page);
    renderCategories();
  }));
}

async function handleAction(action, id) {
  const category = categories.find((item) => item._id === id);
  if (!category) return;
  try {
    if (action === "edit") {
      window.location.assign(`/admin/category/edit/${id}`);
      return;
    } else if (action === "toggle") {
      const actionName = category.isListed ? "block" : "unblock";
      if (!window.confirm(`Are you sure you want to ${actionName} this category?`)) return;
      await request(`/admin/category/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: category.name, isListed: !category.isListed }) });
    } else if (action === "delete") {
      if (!window.confirm(`Delete “${category.name}”? This cannot be undone.`)) return;
      await request(`/admin/category/${id}`, { method: "DELETE" });
    }
    await searchCategories();
  } catch (error) {
    showError(error.message || "Unable to update category.");
  }
}

function showError(message) {
  if (categoryTable) categoryTable.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${escapeHtml(message)}</td></tr>`;
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value || "";
  return element.innerHTML;
}

function debounce(callback, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
}
