const API_BASE = "https://YOUR_DOMAIN_HERE"; // change this
const AUTH_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ADMIN_KEY_HERE" // change this
};

async function loadApprovals() {
  const res = await fetch(`${API_BASE}/approvals`, {
    headers: AUTH_HEADERS
  });
  const data = await res.json();

  const pending = data.filter(a => a.status === "pending");
  const tbody = document.querySelector("#approvals-body");
  tbody.innerHTML = "";

  pending.forEach(a => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(a.created_at).toLocaleString()}</td>
      <td>${a.request_type}</td>
      <td>${a.risk_level}</td>
      <td>
        <button onclick="approve('${a.id}')">Approve</button>
        <button onclick="deny('${a.id}')">Deny</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function approve(id) {
  await fetch(`${API_BASE}/approve`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ approval_id: id })
  });
  loadApprovals();
}

async function deny(id) {
  const reason = prompt("Reason for denial:");
  if (!reason) return;

  await fetch(`${API_BASE}/deny`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ approval_id: id, reason })
  });
  loadApprovals();
}

document.addEventListener("DOMContentLoaded", loadApprovals);
