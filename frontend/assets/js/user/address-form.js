const form = document.getElementById("addressForm");
const addressId = new URLSearchParams(window.location.search).get("id");
const pageTitle = document.getElementById("addressPageTitle");
const fieldIds = ["name", "phone", "pincode", "locality", "address", "city", "state", "landmark", "alternatePhone"];

function setFormData(address) {
  fieldIds.forEach((id) => { document.getElementById(id).value = address[id] || ""; });
  const type = address.addressType || "Home";
  const radio = document.querySelector(`input[name="addressType"][value="${type}"]`);
  if (radio) radio.checked = true;
}

async function loadAddress() {
  if (!addressId) return;
  pageTitle.textContent = "EDIT ADDRESS";
  try {
    const response = await fetch(`/user/addresses/${encodeURIComponent(addressId)}`, { credentials: "include" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load address");
    setFormData(data.address);
  } catch (error) {
    alert(error.message || "Unable to load address");
    window.location.replace("/user/address");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(fieldIds.map((id) => [id, document.getElementById(id).value.trim()]));
  payload.addressType = document.querySelector('input[name="addressType"]:checked')?.value || "Home";

  try {
    const response = await fetch(addressId ? `/user/addresses/${encodeURIComponent(addressId)}` : "/user/addresses", {
      method: addressId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to save address");
    window.location.assign("/user/address");
  } catch (error) {
    alert(error.message || "Unable to save address");
  }
});

document.getElementById("cancelAddressBtn").addEventListener("click", () => {
  window.location.assign("/user/address");
});

loadAddress();
