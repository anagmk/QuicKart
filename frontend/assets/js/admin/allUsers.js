const tableBody = document.getElementById("userTable");

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
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

function toggleStatus(userId) {
    console.log("Toggle user status:", userId);
}