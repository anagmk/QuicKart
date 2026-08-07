const form = document.getElementById("editProductForm");
const editId = location.pathname.includes("/edit/") ? location.pathname.split("/").pop() : null;

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("h2.fw-bold").textContent = editId ? "Edit Product" : "Add Product";
  await loadCategories();
  if (editId) await loadProduct();
  document.getElementById("cancelProductBtn").onclick = () => location.assign("/admin/products");
  document.getElementById("variantsBtn").onclick = handleVariantsClick;
  form.addEventListener("submit", saveProduct);
});
async function loadCategories() { const r = await fetch("/admin/category/all", { credentials: "include" }); const data = await r.json(); document.getElementById("categoryId").innerHTML += data.filter((c) => c.isListed).map((c) => `<option value="${c._id}">${c.name}</option>`).join(""); }
async function loadProduct() { const r = await fetch(`/admin/products/${editId}`, { credentials: "include" }); const p = await r.json(); if (!r.ok) return; productName.value = p.name; description.value = p.description; categoryId.value = p.categoryId?._id || p.categoryId; originalPrice.value = p.originalPrice; offerPrice.value = p.offerPrice ?? ""; }
async function saveProduct(e) { e.preventDefault(); const payload = { name: productName.value.trim(), description: description.value.trim(), categoryId: categoryId.value, originalPrice: originalPrice.value, offerPrice: offerPrice.value }; const r = await fetch(editId ? `/admin/products/${editId}` : "/admin/products/add", { method: editId ? "PUT" : "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (r.ok) location.assign("/admin/products"); else { const d = await r.json(); form.querySelector("button[type=submit]").insertAdjacentText("afterend", ` ${d.message || "Unable to save"}`); } }

async function handleVariantsClick(e) {
  // If editing an existing product, go directly to variants page
  if (editId) {
    location.assign(`/admin/products/${editId}/variants`);
    return;
  }
  // Create product first, then navigate to variants page with new id
  const btn = document.getElementById('variantsBtn');
  btn.disabled = true;
  try {
    const payload = { name: productName.value.trim(), description: description.value.trim(), categoryId: categoryId.value, originalPrice: originalPrice.value, offerPrice: offerPrice.value };
    const r = await fetch('/admin/products/add', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(data.message || 'Unable to create product');
      btn.disabled = false;
      return;
    }
    const prodId = data._id;
    if (!prodId) {
      alert('Created product missing id');
      btn.disabled = false;
      return;
    }
    location.assign(`/admin/products/${prodId}/variants`);
  } catch (err) {
    alert(err.message || 'Failed to create product');
    btn.disabled = false;
  }
}
