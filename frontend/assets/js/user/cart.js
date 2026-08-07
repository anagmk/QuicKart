const cartApiBase = window.location.port && window.location.port !== "3000" ? `http://${window.location.hostname}:3000` : "";
const cartRequest = (path, options = {}) => fetch(`${cartApiBase}${path}`, { credentials: "include", ...options });
const cartItemsElement = document.getElementById("cartItems");
const cartMessage = document.getElementById("cartMessage");
const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const safe = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

function message(text, isError = false) {
  cartMessage.textContent = text;
  cartMessage.classList.toggle("text-danger", isError);
}

function itemTemplate(item) {
  const unavailable = !item.inStock;
  const image = item.image ? `<img class="cart-item-img" src="${safe(item.image)}" alt="${safe(item.name)}">` : '<div class="cart-item-img"></div>';
  return `<div class="cart-item-row" data-id="${item._id}">
    ${image}
    <div class="cart-item-body">
      <div class="cart-item-top"><div><div class="cart-item-name">${safe(item.name)}</div><div class="cart-item-meta">${safe(item.color)}<br>Size: ${safe(item.size)}</div></div>
      <div class="text-end"><button class="cart-remove" data-action="remove">Remove</button><div class="cart-item-price mt-2">${currency(item.unitPrice)}</div></div></div>
      <div class="cart-item-bottom"><button class="cart-wish-btn" aria-label="Move to wishlist" disabled>♡</button>
      <div class="qty-stepper"><button class="qty-btn" data-action="decrease" ${item.quantity <= 1 || unavailable ? "disabled" : ""}>−</button><span>Qty <span class="qty-val">${item.quantity}</span></span><button class="qty-btn" data-action="increase" ${unavailable || item.quantity >= item.maximumQuantity ? "disabled" : ""}>+</button></div></div>
      <div class="cart-shipping"><strong>Subtotal:</strong> ${currency(item.subtotal)} &nbsp; <span class="${unavailable ? "text-danger" : "in-stock"}">${safe(item.status)}</span></div>
    </div></div>`;
}

function renderCart(cart) {
  cartItemsElement.innerHTML = cart.items.length ? cart.items.map(itemTemplate).join("") : '<p class="text-muted">Your cart is empty.</p>';
  document.getElementById("summaryItems").innerHTML = cart.items.map((item) => `<div class="summary-line"><span>${item.quantity}x ${safe(item.name)}</span><span>${currency(item.subtotal)}</span></div>`).join("");
  document.getElementById("cartTotal").textContent = currency(cart.total);
  const checkout = document.getElementById("checkoutButton");
  checkout.disabled = !cart.checkoutAllowed;
  message(cart.message || (cart.items.length ? "" : "Your cart is empty."), Boolean(cart.message));
}

async function loadCart() {
  message("Loading cart…");
  try {
    const response = await cartRequest("/user/cart/items");
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load cart");
    renderCart(data);
  } catch (error) {
    cartItemsElement.innerHTML = "";
    document.getElementById("checkoutButton").disabled = true;
    message(error.message === "Authentication required." ? "Please log in to view your cart." : error.message, true);
  }
}

async function mutateCart(path, options) {
  try {
    const response = await cartRequest(path, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Cart update failed");
    await loadCart();
  } catch (error) { message(error.message, true); }
}

cartItemsElement.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  const row = event.target.closest("[data-id]");
  const quantity = Number(row.querySelector(".qty-val").textContent);
  event.target.disabled = true;
  if (action === "remove") mutateCart(`/user/cart/items/${row.dataset.id}`, { method: "DELETE" });
  if (action === "increase" || action === "decrease") mutateCart(`/user/cart/items/${row.dataset.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: quantity + (action === "increase" ? 1 : -1) }) });
});

document.getElementById("checkoutButton").addEventListener("click", async () => {
  const button = document.getElementById("checkoutButton");
  button.disabled = true;
  try {
    const response = await cartRequest("/user/cart/validate", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Checkout is unavailable");
    message(data.message);
  } catch (error) { message(error.message, true); } finally { await loadCart(); }
});

function toggleCoupon() { document.getElementById("couponPopup").classList.toggle("show"); }
window.toggleCoupon = toggleCoupon;
loadCart();
