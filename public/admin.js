const socket = io();
const $pending = document.getElementById("pending");
const $approved = document.getElementById("approved");
const $token = document.getElementById("token");

socket.emit("subscribe:admin");

socket.on("pending:init", (list) => renderPending(list));
socket.on("approved:init", (list) => renderApproved(list));
socket.on("pending:update", (list) => renderPending(list));
socket.on("approved:update", (list) => renderApproved(list));

function card(item, actions = true) {
  const wrapper = document.createElement("div");
  wrapper.className = "bg-white rounded-xl shadow overflow-hidden border";

  const img = document.createElement("img");
  img.src = item.url;
  img.alt = item.caption || "photo";
  img.className = "w-full h-40 object-cover";

  const body = document.createElement("div");
  body.className = "p-3";

  const cap = document.createElement("div");
  cap.className = "text-sm text-slate-700 line-clamp-2";
  cap.textContent = item.caption || "—";

  const meta = document.createElement("div");
  meta.className = "text-xs text-slate-500 mt-1";
  meta.textContent = `Par ${item.uploader || "?"} · ${new Date(
    item.createdAt
  ).toLocaleString()}`;

  body.appendChild(cap);
  body.appendChild(meta);

  wrapper.appendChild(img);
  wrapper.appendChild(body);

  if (actions) {
    const row = document.createElement("div");
    row.className = "p-3 flex gap-2";
    const approveBtn = document.createElement("button");
    approveBtn.className =
      "px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700";
    approveBtn.textContent = "Approuver";
    approveBtn.onclick = () => approve(item.id);

    const rejectBtn = document.createElement("button");
    rejectBtn.className =
      "px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700";
    rejectBtn.textContent = "Rejeter";
    rejectBtn.onclick = () => reject(item.id);

    row.appendChild(approveBtn);
    row.appendChild(rejectBtn);
    wrapper.appendChild(row);
  }

  return wrapper;
}

function renderPending(list = []) {
  $pending.innerHTML = "";
  list.forEach((i) => $pending.appendChild(card(i, true)));
}

function renderApproved(list = []) {
  $approved.innerHTML = "";
  list.forEach((i) => $approved.appendChild(card(i, false)));
}

async function approve(id) {
  await fetch(`/api/approve/${id}`, {
    method: "POST",
    headers: { "x-admin-token": $token.value || "" },
  }).then((r) => {
    if (!r.ok) alert("Erreur d'approbation (token ?)");
  });
}

async function reject(id) {
  await fetch(`/api/reject/${id}`, {
    method: "POST",
    headers: { "x-admin-token": $token.value || "" },
  }).then((r) => {
    if (!r.ok) alert("Erreur de rejet (token ?)");
  });
}
