const apiBaseUrl = window.location.port && window.location.port !== "3000" ? `http://${window.location.hostname}:3000` : "";
const apiFetch = (path, options = {}) => fetch(`${apiBaseUrl}${path}`, {
  credentials: "include",
  ...options,
});

const state = { product: null, selectedSize: null, selectedColor: null, selectedVariant: null };
const byId = (id) => document.getElementById(id);
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));
const formatPrice = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(Number(value) || 0);
const productIdFromUrl = () => {
  const match = window.location.pathname.match(/\/user\/product\/([^/]+)/);
  return match?.[1] || new URLSearchParams(window.location.search).get("id");
};
const activeVariants = () => (state.product?.variants || []).filter((variant) => variant.isActive !== false);
const availableVariants = () => activeVariants().filter((variant) => Number(variant.stock) > 0);
const ratingStars = (rating) => "★".repeat(Math.round(Number(rating) || 0)) + "☆".repeat(5 - Math.round(Number(rating) || 0));

function enableImagePan() {
  const imageWrap = byId("mainImageWrap");
  const image = byId("mainImage");
  imageWrap.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const bounds = imageWrap.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    image.style.transformOrigin = `${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`;
  });
  imageWrap.addEventListener("pointerleave", () => {
    image.style.transformOrigin = "center";
  });
}

function setStatus(message, isError = false) {
  const status = byId("stockStatus");
  status.textContent = message;
  status.classList.toggle("text-danger", isError);
}

function useVariant(variants) {
  state.selectedVariant = variants.find((variant) => Number(variant.stock) > 0) || variants[0] || null;
  if (state.selectedVariant) {
    state.selectedSize = state.selectedVariant.size;
    state.selectedColor = state.selectedVariant.color;
  }
}

function selectColor(color) {
  useVariant(activeVariants().filter((variant) => variant.color === color));
}

function selectSize(size) {
  useVariant(activeVariants().filter((variant) =>
    variant.size === size && variant.color === state.selectedColor,
  ));
}

function renderGallery() {
  const images = state.selectedVariant?.imageUrls?.filter(Boolean) || [];
  const mainImage = byId("mainImage");
  const thumbnails = byId("productThumbnails");
  mainImage.src = images[0] || "";
  mainImage.alt = state.product.name;
  thumbnails.innerHTML = images.map((url, index) => `<img src="${escapeHtml(url)}" alt="${escapeHtml(state.product.name)}" class="${index === 0 ? "active" : ""}" data-image="${escapeHtml(url)}">`).join("");
  thumbnails.querySelectorAll("img").forEach((image) => image.addEventListener("click", () => {
    mainImage.src = image.dataset.image;
    thumbnails.querySelectorAll("img").forEach((thumb) => thumb.classList.toggle("active", thumb === image));
  }));
}

function renderSelectors() {
  const variants = activeVariants();
  const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))];
  const colors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))];
  const sizeOptions = byId("sizeOptions");
  const colorOptions = byId("colourOptions");
  sizeOptions.innerHTML = sizes.map((size) => {
    const enabled = variants.some((variant) => variant.size === size && (!state.selectedColor || variant.color === state.selectedColor) && Number(variant.stock) > 0);
    return `<button class="size-btn ${size === state.selectedSize ? "active" : ""}" data-size="${escapeHtml(size)}" ${enabled ? "" : "disabled"}>${escapeHtml(size)}</button>`;
  }).join("");
  colorOptions.innerHTML = colors.map((color) => {
    const enabled = variants.some((variant) => variant.color === color && Number(variant.stock) > 0);
    return `<button class="swatch ${color === state.selectedColor ? "active" : ""}" data-color="${escapeHtml(color)}" title="${escapeHtml(color)}" aria-label="${escapeHtml(color)}" ${enabled ? "" : "disabled"}></button>`;
  }).join("");
  colorOptions.querySelectorAll(".swatch").forEach((button) => { button.style.background = button.dataset.color; });
  sizeOptions.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    selectSize(button.dataset.size); renderVariant();
  }));
  colorOptions.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    selectColor(button.dataset.color); renderVariant();
  }));
}

function renderVariant() {
  const variant = state.selectedVariant;
  const originalPrice = variant?.originalPrice ?? state.product.originalPrice;
  const sellingPrice = variant?.offerPrice ?? state.product.offerPrice ?? originalPrice;
  const discount = originalPrice > sellingPrice ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;
  byId("productPrice").textContent = formatPrice(sellingPrice);
  byId("originalPrice").textContent = discount ? `MRP: ${formatPrice(originalPrice)}` : "";
  byId("originalPrice").hidden = !discount;
  byId("discountBadge").textContent = discount ? `${discount}% OFF` : "";
  byId("discountBadge").hidden = !discount;
  byId("colourName").textContent = variant?.color || "—";
  byId("colourAvailability").textContent = `${availableVariants().length} variant${availableVariants().length === 1 ? "" : "s"} in stock`;
  byId("productDescription").textContent = variant?.description || state.product.description || "";
  byId("variantSku").textContent = variant?.sku ? `SKU: ${variant.sku}` : "";
  byId("variantSku").hidden = !variant?.sku;
  const stock = Number(variant?.stock) || 0;
  const stockMessage = !variant || stock <= 0 ? "Out of Stock" : stock <= 3 ? `Only ${stock} left` : "In Stock";
  setStatus(stockMessage, !variant || stock <= 0);
  byId("cartButton").disabled = !variant || variant.stock <= 0;
  renderGallery();
  renderSelectors();
}

function renderRelated(products) {
  byId("relatedProducts").innerHTML = products.length ? products.map((product) => {
    const image = product.displayImage || product.variants?.find((variant) => variant.imageUrls?.[0])?.imageUrls[0];
    return `<a class="col-4 related-card text-decoration-none text-dark" href="${apiBaseUrl}/user/product/${encodeURIComponent(product._id)}">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}">` : ""}
      <div class="related-name">${escapeHtml(product.name)}</div>
      <div class="related-fit">${escapeHtml(product.categoryId?.name || "")}</div>
      <div class="related-price">${formatPrice(product.displayPrice ?? product.offerPrice ?? product.originalPrice)}</div>
      ${product.rating?.count ? `<div class="related-fit">${ratingStars(product.rating.average)} (${product.rating.count})</div>` : ""}
    </a>`;
  }).join("") : '<p class="text-muted small">No related products available.</p>';
}

function renderCommerceDetails(product) {
  byId("productBreadcrumb").innerHTML = ["Home", product.categoryId?.name, product.name]
    .filter(Boolean).map((item, index, items) => index === items.length - 1
      ? `<span>${escapeHtml(item)}</span>`
      : `${index ? "" : '<a href="/user/home">'}${escapeHtml(item)}${index ? "" : "</a>"}`)
    .join(" &gt; ");
  const rating = product.rating || {};
  byId("productRating").hidden = !rating.count;
  byId("ratingStars").textContent = ratingStars(rating.average);
  byId("ratingText").textContent = rating.count ? `${rating.average} (${rating.count} review${rating.count === 1 ? "" : "s"})` : "";
  const offers = Array.isArray(product.offers) ? product.offers.filter((offer) => offer?.title || offer?.description || offer?.code) : [];
  byId("offersSection").hidden = !offers.length;
  byId("productOffers").innerHTML = offers.map((offer) => `<p class="mb-1"><strong>${escapeHtml(offer.code || offer.title || "Offer")}</strong>${offer.description ? ` — ${escapeHtml(offer.description)}` : ""}</p>`).join("");
  const highlights = (product.highlights || []).filter(Boolean);
  if (!highlights.length) [product.fit, product.material, product.fabric].filter(Boolean).forEach((value) => highlights.push(value));
  byId("highlightsSection").hidden = !highlights.length;
  byId("productHighlights").innerHTML = highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("");
}

function renderReviews(reviews) {
  const section = byId("reviewsSection");
  if (!Array.isArray(reviews) || !reviews.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  section.innerHTML = `<div class="section-heading">Reviews</div>${reviews.map((review) => {
    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
    const stars = "★".repeat(Math.round(rating));
    return `<div class="reviewer text-start w-100"><div><div class="reviewer-name">${escapeHtml(review.userName || review.user?.name || "Customer")}</div><div class="review-stars mb-1">${stars}</div><div class="reviewer-text">${escapeHtml(review.comment || review.text || "")}</div></div></div>`;
  }).join("")}`;
}

function renderProduct(product, relatedProducts) {
  state.product = product;
  useVariant(availableVariants().length ? availableVariants() : activeVariants());
  byId("productName").textContent = product.name;
  byId("productCategory").textContent = product.categoryId?.name || "";
  byId("productDescription").textContent = product.description || state.selectedVariant?.description || "";
  const fit = product.fit || state.selectedVariant?.fit || "";
  const material = product.material || state.selectedVariant?.material || "";
  byId("productFit").textContent = fit;
  byId("fitHeading").hidden = !fit;
  byId("productFit").hidden = !fit;
  byId("productMaterial").textContent = material;
  byId("materialHeading").hidden = !material;
  byId("productMaterial").hidden = !material;
  renderCommerceDetails(product);
  renderReviews(product.reviews);
  renderVariant();
  renderRelated(relatedProducts);
}

async function sendShoppingRequest(path, button) {
  const payload = path.includes("cart")
    ? { productId: state.product._id, variantId: state.selectedVariant?._id, quantity: 1 }
    : { productId: state.product._id };
  try {
    button.disabled = true;
    const response = await apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    setStatus(data.message);
  } catch (error) {
    setStatus(error.message === "Authentication required." ? "Please log in to continue" : error.message, true);
  } finally {
    if (button.id !== "cartButton" || state.selectedVariant?.stock > 0) button.disabled = false;
  }
}

async function loadProduct() {
  const productId = productIdFromUrl();
  if (!productId) return setStatus("Product ID is missing", true);
  setStatus("Loading product…");
  try {
    const response = await apiFetch(`/user/product/${encodeURIComponent(productId)}/data`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load product");
    renderProduct(data.product, data.relatedProducts || []);
  } catch (error) {
    byId("productName").textContent = "Product unavailable";
    setStatus("This product is no longer available. Returning to the shop…", true);
    window.setTimeout(() => window.location.assign(`${apiBaseUrl}/user/products`), 1200);
  }
}

byId("wishlistButton").addEventListener("click", () => sendShoppingRequest("/user/wishlist/items", byId("wishlistButton")));
byId("cartButton").addEventListener("click", () => sendShoppingRequest("/user/cart/items", byId("cartButton")));
enableImagePan();
loadProduct();
