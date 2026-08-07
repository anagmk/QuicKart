const grid = document.getElementById("productGrid");
const pagination = document.getElementById("productPagination");
const count = document.getElementById("productCount");
const searchInput = document.getElementById("productSearch");
const filters = document.getElementById("productFilters");
const categoryFilter = document.getElementById("categoryFilter");
const categoryTabs = document.getElementById("categoryTabs");
// When this page is opened with VS Code Live Server, its origin is port 5500
// while the Express API runs on port 3000. On the normal Express page this
// remains an empty string, so the existing same-origin URLs are used.
const apiBaseUrl = window.location.port === "5500"
  ? `http://${window.location.hostname}:3000`
  : "";
const apiFetch = (path) => fetch(`${apiBaseUrl}${path}`, {
  credentials: apiBaseUrl ? "omit" : "include",
});

let currentPage = 1;
let searchTimer;

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));

const productImage = (product) => product.displayImage || product.variants?.find((variant) => variant.imageUrls?.[0])?.imageUrls[0];
const formatPrice = (price) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number.isFinite(Number(price)) ? Number(price) : 0);

function renderProducts(products) {
  if (!products.length) {
    grid.innerHTML = '<div class="col-12"><p class="text-center text-muted py-5">No products match your search or filters.</p></div>';
    return;
  }

  grid.innerHTML = products.map((product) => {
    const image = productImage(product);
    const imageMarkup = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy">`
      : '<span class="material-icons product-placeholder" aria-hidden="true">image</span>';
    const price = product.displayPrice ?? product.offerPrice ?? product.originalPrice;
    const description = product.description ? product.description : "Premium product from our collection";
    const variants = product.variants || [];
    const availableSizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))].slice(0, 3).join(", ");
    return `<article class="col-xl-3 col-lg-4 col-md-6 col-sm-6 product-card shop-product-card" data-product-id="${escapeHtml(product._id)}" role="link" tabindex="0">
      <div class="card-img-wrap">${imageMarkup}</div>
      <div class="card-body px-0 py-3">
        <p class="card-label left mb-1">${escapeHtml(product.name)}</p>
        <p class="small text-muted mb-2">${escapeHtml(product.categoryId?.name || "Uncategorised")}</p>
        <p class="small text-muted mb-2">${escapeHtml(description)}</p>
        ${availableSizes ? `<p class="small text-muted mb-2">Sizes: ${escapeHtml(availableSizes)}</p>` : ""}
        <p class="card-price mb-0">${formatPrice(price)}</p>
      </div>
    </article>`;
  }).join("");
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1);
  const items = [];
  let previous = 0;
  for (const page of pages) {
    if (page - previous > 1) items.push('<li class="page-item disabled"><span class="page-link">…</span></li>');
    items.push(`<li class="page-item ${page === currentPage ? "active" : ""}"><button class="page-link" data-page="${page}">${page}</button></li>`);
    previous = page;
  }
  pagination.innerHTML = `<li class="page-item ${currentPage === 1 ? "disabled" : ""}"><button class="page-link" data-page="${currentPage - 1}" aria-label="Previous">&laquo;</button></li>${items.join("")}<li class="page-item ${currentPage === totalPages ? "disabled" : ""}"><button class="page-link" data-page="${currentPage + 1}" aria-label="Next">&raquo;</button></li>`;
}

async function loadProducts() {
  const params = new URLSearchParams({ page: currentPage, limit: 12, sort: document.getElementById("sortFilter").value });
  const values = {
    search: searchInput.value.trim(), category: categoryFilter.value,
    size: document.getElementById("sizeFilter").value.trim(), color: document.getElementById("colorFilter").value.trim(),
    price: document.getElementById("priceFilter").value,
  };
  Object.entries(values).forEach(([key, value]) => value && params.set(key, value));
  grid.innerHTML = '<div class="col-12 text-center py-5 text-muted">Loading products…</div>';
  try {
    const response = await apiFetch(`/user/products/data?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load products");
    // The API returns a paginated object. Supporting an array as well keeps the
    // card renderer compatible with the existing /pagination endpoint.
    const products = Array.isArray(data) ? data : (data.products || []);
    const totalProducts = Array.isArray(data) ? products.length : (data.totalProducts ?? products.length);
    renderProducts(products);
    count.textContent = `${totalProducts} product${totalProducts === 1 ? "" : "s"}`;
    renderPagination(Array.isArray(data) ? 1 : (data.totalPages || 1));
  } catch (error) {
    grid.innerHTML = `<div class="col-12"><p class="text-center text-danger py-5">${escapeHtml(error.message)}</p></div>`;
    count.textContent = "";
    pagination.innerHTML = "";
  }
}

async function loadCategories() {
  try {
    const response = await apiFetch("/user/products/categories");
    const categories = await response.json();
    if (!response.ok) return;

    categoryFilter.insertAdjacentHTML("beforeend", categories.map((category) => `<option value="${escapeHtml(category._id)}">${escapeHtml(category.name)}</option>`).join(""));

    if (categoryTabs) {
      categoryTabs.insertAdjacentHTML("beforeend", categories.map((category) => `<button type="button" class="category-tab" data-category="${escapeHtml(category._id)}">${escapeHtml(category.name)}</button>`).join(""));
    }
  } catch { /* The shop remains usable without category options. */ }
}

function setActiveCategory(categoryId) {
  categoryFilter.value = categoryId || "";
  if (categoryTabs) {
    categoryTabs.querySelectorAll(".category-tab").forEach((button) => {
      button.classList.toggle("active", button.dataset.category === (categoryId || ""));
    });
    const allButton = categoryTabs.querySelector("[data-category='']");
    if (allButton) {
      allButton.classList.toggle("active", !categoryId);
    }
  }
}

filters.addEventListener("submit", (event) => { event.preventDefault(); currentPage = 1; loadProducts(); });
filters.querySelectorAll("select").forEach((input) => input.addEventListener("change", () => { currentPage = 1; loadProducts(); }));
searchInput.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { currentPage = 1; loadProducts(); }, 300); });
pagination.addEventListener("click", (event) => { const page = Number(event.target.dataset.page); if (page && page !== currentPage) { currentPage = page; loadProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); } });
categoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  setActiveCategory(button.dataset.category);
  currentPage = 1;
  loadProducts();
});
categoryFilter.addEventListener("change", () => {
  setActiveCategory(categoryFilter.value);
  currentPage = 1;
  loadProducts();
});
grid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-product-id]");
  if (card) window.location.assign(`${apiBaseUrl}/user/product/${encodeURIComponent(card.dataset.productId)}`);
});
grid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const card = event.target.closest("[data-product-id]");
  if (card) window.location.assign(`${apiBaseUrl}/user/product/${encodeURIComponent(card.dataset.productId)}`);
});

loadCategories();
loadProducts();
