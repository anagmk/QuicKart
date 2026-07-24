const tableBody = document.getElementById("userTable");
const searchInput = document.getElementById("userSearch");
const clearSearchBtn = document.getElementById("clearSearchBtn");
let allUsersData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();

    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
                renderUsers(allUsersData);
            }
        });
    }
});

async function loadUsers() {
    try {
        const response = await fetch("/admin/users", {
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load users");
        }

        const users = Array.isArray(data) ? data : data.users || [];
        allUsersData = users;
        renderUsers(users);
    } catch (error) {
        console.error("Error loading users:", error);

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        ${error.message || "Unable to load users."}
                    </td>
                </tr>
            `;
        }
    }
}

async function handleSearch() {
    const query = searchInput?.value?.trim() || "";

    if (!query) {
        renderUsers(allUsersData);
        return;
    }

    try {
        const response = await fetch(`/admin/users/search?q=${encodeURIComponent(query)}`, {
            credentials: "include"
        });

        const data = await response.json().catch(() => []);

        if (!response.ok) {
            throw new Error(data.message || "Search failed");
        }

        const users = Array.isArray(data) ? data : data.users || [];
        renderUsers(users);
    } catch (error) {
        console.error("Search error:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">${error.message || "Unable to search users."}</td>
            </tr>
        `;
    }
}

function renderUsers(users) {
    if (!tableBody) {
        console.error("User table body not found");
        return;
    }

    tableBody.innerHTML = "";

    if (!users.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No users found.</td>
            </tr>
        `;
        return;
    }

    users.forEach((user) => {
        const orders = user.orders && user.orders.length ? user.orders.length : "0";
        const balance = user.balance ?? 0;

        tableBody.innerHTML += `
            <tr>
                <td>${user.name || "N/A"}</td>
                <td>${user._id || "N/A"}</td>
                <td>${orders} </td>
                <td>${balance}</td>
                <td>
                    <span class="badge ${user.isActive ? "bg-success" : "bg-danger"}">
                        ${user.isActive ? "Active" : "Blocked"}
                    </span>
                </td>
                <td>
                    <button
                        class="btn btn-sm ${user.isActive ? "btn-outline-danger" : "btn-outline-success"}"
                        onclick="toggleStatus('${user._id}')">
                        ${user.isActive ? "Block" : "Unblock"}
                    </button>
                </td>
            </tr>
        `;
    });
}

    async function toggleStatus(userId) {
    const userRow = Array.from(tableBody?.children || []).find((row) =>
        row.querySelector("button")?.getAttribute("onclick")?.includes(userId)
    );
    const statusText = userRow?.querySelector(".badge")?.textContent?.trim() || "";
    const action = statusText === "Blocked" ? "unblock" : "block";
    const confirmed = window.confirm(`Are you sure you want to ${action} this user?`);

    if (!confirmed) return;

    try {
        const response = await fetch(`/admin/users/${userId}/block`, {
            method: "PATCH",
            credentials: "include"
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || `Failed to ${action} user`);
        }

        alert(data.message || `User ${action}ed successfully`);
        loadUsers();
    } catch (error) {
        console.error("Error updating user status:", error);
        alert(error.message || "Unable to update user status");
    }
}