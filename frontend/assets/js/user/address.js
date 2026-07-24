const addressList = document.getElementById("addressList");
const message = document.getElementById("addressMessage");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = `small ${isError ? "text-danger" : "text-success"}`;
}

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderAddresses(addresses) {
  addressList.replaceChildren();
  if (!addresses.length) {
    addressList.append(createTextElement("p", "text-muted mb-0", "No addresses saved yet."));
    return;
  }

  addresses.forEach((address) => {
    const card = document.createElement("div");
    card.className = "card border-0 bg-light mb-3";
    const body = document.createElement("div");
    body.className = "card-body d-flex justify-content-between gap-3";
    const details = document.createElement("div");
    details.append(
      createTextElement("h6", "fw-bold mb-2", address.name),
      createTextElement("p", "mb-1 text-muted", `${address.address}, ${address.locality}`),
      createTextElement("p", "mb-2 text-muted", `${address.city}, ${address.state} - ${address.pincode}`),
      createTextElement("p", "mb-2 text-muted", `Phone: ${address.phone}`),
    );
    if (address.landmark) details.append(createTextElement("p", "mb-2 text-muted", `Landmark: ${address.landmark}`));
    details.append(createTextElement("span", "badge bg-secondary", address.addressType));

    const actions = document.createElement("div");
    actions.className = "text-end flex-shrink-0";
    const editButton = createTextElement("button", "btn btn-outline-secondary btn-sm mb-2 d-block", "Edit");
    editButton.type = "button";
    editButton.addEventListener("click", () => {
      window.location.assign(`/user/address/edit?id=${encodeURIComponent(address._id)}`);
    });
    const deleteButton = createTextElement("button", "btn btn-outline-danger btn-sm", "Delete");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => deleteAddress(address._id));
    actions.append(editButton, deleteButton);
    body.append(details, actions);
    card.append(body);
    addressList.append(card);
  });
}

async function loadAddresses() {
  try {
    const response = await fetch("/user/addresses", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load addresses");
    renderAddresses(data.addresses);
  } catch (error) {
    showMessage(error.message || "Unable to load addresses", true);
  }
}

async function deleteAddress(id) {
  if (!window.confirm("Delete this address?")) return;
  try {
    const response = await fetch(`/user/addresses/${id}`, { method: "DELETE", credentials: "include" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to delete address");
    showMessage(data.message);
    loadAddresses();
  } catch (error) {
    showMessage(error.message || "Unable to delete address", true);
  }
}

document.getElementById("addAddressBtn").addEventListener("click", () => {
  window.location.assign("/user/address/edit");
});

loadAddresses();
