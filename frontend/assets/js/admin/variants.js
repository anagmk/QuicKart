const productId = location.pathname.split("/").filter(Boolean).at(-2);
const form = document.getElementById("variantForm"),
  imageInput = document.getElementById("variantImages"),
  dialog = document.getElementById("cropDialog"),
  cropImage = document.getElementById("cropImage");
const imageFiles = [null, null, null];
let activeSlot = 0,
  cropper;

document.addEventListener("DOMContentLoaded", () => {
  loadProduct();
  form.addEventListener("submit", saveVariant);
  imageInput.addEventListener("change", cropImageFile);
  document.querySelectorAll(".image-select-btn").forEach(
    (button) =>
      (button.onclick = () => {
        activeSlot = Number(button.dataset.slot);
        imageInput.click();
      }),
  );
  document.getElementById("cancelVariantBtn").onclick = () =>
    location.assign(`/admin/products/edit/${productId}`);
});
async function loadProduct() {
  const r = await fetch(`/admin/products/${productId}`, {
      credentials: "include",
    }),
    p = await r.json();
  if (!r.ok) return;
  document.querySelector("h2.fw-bold").textContent = `${p.name} Variants`;
  renderVariants(p.variants || []);
}
function cropImageFile() {
  const file = imageInput.files[0];
  imageInput.value = "";
  if (!file || !window.Cropper) return;
  const url = URL.createObjectURL(file);
  cropImage.src = url;
  dialog.showModal();
  cropImage.onload = () => {
    cropper?.destroy();
    cropper = new Cropper(cropImage, {
      viewMode: 1,
      aspectRatio: 1,
      autoCropArea: 1,
    });
  };
  const close = () => {
    cropper?.destroy();
    cropper = null;
    URL.revokeObjectURL(url);
    dialog.close();
  };
  document.getElementById("applyCropBtn").onclick = () =>
    cropper.getCroppedCanvas({ width: 1200, height: 1200 }).toBlob(
      (blob) => {
        imageFiles[activeSlot] = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, ".webp"),
          { type: "image/webp" },
        );
        renderSlot(activeSlot);
        close();
      },
      "image/webp",
      0.9,
    );
  document.getElementById("cancelCropBtn").onclick = close;
}
function renderSlot(slot) {
  const file = imageFiles[slot],
    container = document.getElementById(`imageSlot${slot}`);
  if (!file) return;
  container.innerHTML = `<img class="img-fluid rounded" style="height:100px;object-fit:cover" src="${URL.createObjectURL(file)}" alt="Selected product image"><div class="mt-3"><button type="button" class="btn btn-outline-primary btn-sm image-select-btn" data-slot="${slot}">Change Image</button></div>`;
  container.querySelector("button").onclick = () => {
    activeSlot = slot;
    imageInput.click();
  };
}
async function saveVariant(e) {
  e.preventDefault();
  const errorBox = document.getElementById("variantError"),
    submit = form.querySelector("button[type=submit]");
  errorBox.textContent = "";
  const data = new FormData();
  const fields = {
    color: "variantColor",
    size: "variantSize",
    stock: "variantStock",
    originalPrice: "variantOriginalPrice",
    offerPrice: "variantOfferPrice",
    description: "variantDescription",
  };
  Object.entries(fields).forEach(([key, id]) =>
    data.append(key, document.getElementById(id).value),
  );
  imageFiles.filter(Boolean).forEach((file) => data.append("images", file));
  submit.disabled = true;
  try {
    const r = await fetch(`/admin/products/${productId}/variants`, {
      method: "POST",
      credentials: "include",
      body: data,
    });
    const result = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(result.message || "Unable to save variant");
    form.reset();
    imageFiles.fill(null);
    location.reload();
  } catch (error) {
    errorBox.textContent = error.message;
    submit.disabled = false;
  }
}
function renderVariants(items) {
  const list = document.getElementById("variantList");
  list.innerHTML = items.length
    ? items
        .map(
          (v) =>
            `<div class="list-group-item d-flex justify-content-between"><span>${v.color} · ${v.size} — Stock: ${v.stock} — ₹${v.offerPrice ?? v.originalPrice}</span><button class="btn btn-sm btn-danger" data-id="${v._id}">Delete</button></div>`,
        )
        .join("")
    : '<div class="list-group-item text-muted">No variants added.</div>';
  list.querySelectorAll("button").forEach(
    (b) =>
      (b.onclick = async () => {
        const r = await fetch(
          `/admin/products/${productId}/variants/${b.dataset.id}`,
          { method: "DELETE", credentials: "include" },
        );
        if (r.ok) loadProduct();
      }),
  );
}
