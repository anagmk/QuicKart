const table = document.getElementById("productTable");
const search = document.getElementById("productSearch");

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  document.getElementById("addProductBtn")?.addEventListener("click", () => location.assign("/admin/products/add"));
  search?.addEventListener("input", debounce(loadProducts, 250));
});

async function loadProducts() {
  try {
    const query = search?.value.trim();
    const response = await fetch(query ? `/admin/products/search?name=${encodeURIComponent(query)}` : "/admin/products/all", { credentials: "include" });
    const products = await response.json();
    if (!response.ok) throw new Error(products.message);
    table.innerHTML = products.length ? products.map((p) => `<tr><td class="${p.isActive ? '' : 'text-danger'}">${safe(p.name)}</td><td class="text-primary small">${p._id}</td><td>₹${p.offerPrice ?? p.originalPrice}</td><td>${safe(p.categoryId?.name || "-")}</td><td>${p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0}</td><td>${new Date(p.createdAt).toLocaleDateString()}</td><td class="text-center"><button class="btn btn-sm btn-success" data-edit="${p._id}">Edit</button> <button class="btn btn-sm btn-outline-dark" data-variants="${p._id}">Variants</button> <button class="btn btn-sm btn-warning" data-block="${p._id}" data-active="${p.isActive}">${p.isActive ? 'Block' : 'Unblock'}</button> <button class="btn btn-sm btn-danger" data-delete="${p._id}">Delete</button></td></tr>`).join("") : '<tr><td colspan="7" class="text-center text-muted">No products found.</td></tr>';
    table.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => location.assign(`/admin/products/edit/${b.dataset.edit}`));
    table.querySelectorAll("[data-variants]").forEach((b) => b.onclick = () => location.assign(`/admin/products/${b.dataset.variants}/variants`));
    table.querySelectorAll("[data-delete]").forEach((b) => b.onclick = () => removeProduct(b.dataset.delete));
    table.querySelectorAll('[data-block]').forEach(b => b.onclick = async () => {
      const id = b.dataset.block;
      const isActive = b.dataset.active === 'true';
      const action = isActive ? 'block' : 'unblock';
      if (!confirm(`Are you sure you want to ${action} this product?`)) return;
      try {
        const r = await fetch(`/admin/products/${id}/block`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocked: isActive }) });
        if (!r.ok) {
          const d = await r.json().catch(()=>({}));
          alert(d.message || 'Unable to update product status');
        }
        loadProducts();
      } catch (err) { alert(err.message || 'Failed to update product status'); }
    });
  } catch (error) { table.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${safe(error.message || "Unable to load products.")}</td></tr>`; }
}
async function removeProduct(id) { const r = await fetch(`/admin/products/${id}`, { method: "DELETE", credentials: "include" }); if (r.ok) loadProducts(); }
function safe(value) { const d = document.createElement("div"); d.textContent = value ?? ""; return d.innerHTML; }
function debounce(fn, ms) { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; }
