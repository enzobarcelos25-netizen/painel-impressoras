/* app.js — Painel Profissional OFFLINE
   - Persistência: localStorage
   - Fonte inicial: impressoras.json (first load)
   - Simulação de status (ping) com delays realistas
   - Config: CRUD (add/edit/delete)
   - Logs: grava ações + checks, export CSV
*/

// --- Keys localStorage
const LS_PRINTERS = "ti_impressoras_v1";
const LS_LOGS = "ti_impressoras_logs_v1";

// --- Utilitários
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const now = () => new Date().toLocaleString();

// show toast
function toast(msg, ms = 2200) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(()=> t.classList.add("hidden"), ms);
}

// logs
function pushLog(level, text) {
  try {
    const logs = JSON.parse(localStorage.getItem(LS_LOGS) || "[]");
    logs.unshift({ ts: new Date().toISOString(), level, text });
    localStorage.setItem(LS_LOGS, JSON.stringify(logs));
    renderLogs();
  } catch(e){ console.error(e); }
}

// load printers: localStorage or impressoras.json (first time)
async function loadPrinters() {
  const local = localStorage.getItem(LS_PRINTERS);
  if (local) return JSON.parse(local);
  // fetch default file (must be in same folder)
  try {
    const res = await fetch("impressoras.json");
    if (!res.ok) throw new Error("no default json");
    const data = await res.json();
    localStorage.setItem(LS_PRINTERS, JSON.stringify(data));
    pushLog("info", "Carga inicial de impressoras do JSON");
    return data;
  } catch (e) {
    // fallback minimal list if file missing
    const fallback = [
      { nome:"PAF", ip:"172.22.192.34", sector:"Críticos", tipo:"MS812", urgente:true, online:true }
    ];
    localStorage.setItem(LS_PRINTERS, JSON.stringify(fallback));
    pushLog("warn", "Arquivo impressoras.json não encontrado — usando fallback");
    return fallback;
  }
}

function savePrinters(list) {
  localStorage.setItem(LS_PRINTERS, JSON.stringify(list));
}

// simulate ping with delay + probability (no CORS issues)
function fakePing(ip, options={timeoutMin:500, timeoutMax:1600, failureRate:0.22}) {
  const ms = options.timeoutMin + Math.floor(Math.random() * (options.timeoutMax - options.timeoutMin));
  return new Promise(resolve => setTimeout(()=>{
    const ok = Math.random() > options.failureRate;
    resolve({ ip, alive: ok, time: ok ? Math.floor(20 + Math.random()*200) : null, delay: ms });
  }, ms));
}

// render summary boxes
function renderSummary(list) {
  const s = $("#summary");
  const total = list.length;
  const online = list.filter(p=>p.online).length;
  const offline = total - online;
  const urgent = list.filter(p=>p.urgente).length;
  s.innerHTML = `
    <div class="box"><div>Total</div><strong>${total}</strong></div>
    <div class="box"><div>Online</div><strong style="color:var(--ok)">${online}</strong></div>
    <div class="box"><div>Offline</div><strong style="color:var(--err)">${offline}</strong></div>
    <div class="box"><div>Urgente</div><strong style="color:gold">${urgent}</strong></div>
  `;
}

// render grid of printers based on current filters/search
function renderGrid(list) {
  const grid = $("#grid");
  grid.innerHTML = "";
  // ordering: urgente -> offline -> online
  list.sort((a,b)=>{
    if (a.urgente && !b.urgente) return -1;
    if (!a.urgente && b.urgente) return 1;
    if (!a.online && b.online) return -1;
    if (a.online && !b.online) return 1;
    return a.nome.localeCompare(b.nome);
  });

  list.forEach(p=>{
    const card = document.createElement("div");
    card.className = "card";
    if (!p.online) card.classList.add("offline");
    if (p.urgente) card.classList.add("urgent");

    const statusBadge = p.online ? `<span class="badge online">ONLINE</span>` : `<span class="badge offline">OFFLINE</span>`;
    const urgentBadge = p.urgente ? ` <span class="badge urgent">URGENTE</span>` : "";

    card.innerHTML = `
      <div class="title">${p.nome}</div>
      <div class="meta">${p.ip} • ${p.sector || '—'} • ${p.tipo || '—'}</div>
      <div>${statusBadge}${urgentBadge}</div>
      <div class="actions">
        <button class="btn open" data-ip="${p.ip}">Abrir</button>
        <button class="btn copy" data-ip="${p.ip}">Copiar IP</button>
        <button class="btn urg" data-ip="${p.ip}">${p.urgente ? 'Desmarcar Urgente' : 'Marcar Urgente'}</button>
        <button class="btn edit" data-ip="${p.ip}">Editar</button>
      </div>
    `;

    // actions wiring
    card.querySelector(".open").onclick = ()=> window.open(`http://${p.ip}`, "_blank");
    card.querySelector(".copy").onclick = async (e)=>{
      try { await navigator.clipboard.writeText(p.ip); toast("IP copiado"); pushLog("info", `Copiou IP ${p.ip}`); } catch { toast("Copy falhou"); }
    };
    card.querySelector(".urg").onclick = ()=>{
      toggleUrgent(p.ip);
    };
    card.querySelector(".edit").onclick = ()=> openEditForm(p.ip);

    grid.appendChild(card);
  });
}

// toggle urgent flag and persist + log
function toggleUrgent(ip) {
  const list = JSON.parse(localStorage.getItem(LS_PRINTERS) || "[]");
  const idx = list.findIndex(x=>x.ip===ip);
  if (idx===-1) return;
  list[idx].urgente = !list[idx].urgente;
  savePrinters(list);
  pushLog("info", `${list[idx].urgente ? 'Marcou' : 'Desmarcou'} urgente: ${list[idx].nome} (${ip})`);
  refreshUI();
}

// open edit form in config view with values filled
function openEditForm(ip) {
  // switch to config view
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.querySelector('[data-view="config"]').classList.add("active"); // this is button, but simpler: trigger click
  document.querySelector('.nav-btn[data-view="config"]').classList.add('active');
  switchView("config");

  const list = JSON.parse(localStorage.getItem(LS_PRINTERS) || "[]");
  const p = list.find(x=>x.ip===ip);
  if (!p) return;
  const form = document.getElementById("formAdd");
  form.nome.value = p.nome;
  form.ip.value = p.ip;
  form.sector.value = p.sector || '';
  form.tipo.value = p.tipo || '';
  form.urgent.checked = !!p.urgente;
  form.dataset.editing = p.ip; // flag editing
  toast("Editando: " + p.nome, 1800);
}

// render config list
function renderConfigList() {
  const ul = $("#configList");
  ul.innerHTML = "";
  const list = JSON.parse(localStorage.getItem(LS_PRINTERS) || "[]");
  list.forEach(p=>{
    const li = document.createElement("li");
    li.innerHTML = `<span>${p.nome} — ${p.ip}</span>
      <div>
        <button class="btn copy small" data-ip="${p.ip}">Copiar</button>
        <button class="btn edit small" data-ip="${p.ip}">Editar</button>
        <button class="btn urg small" data-ip="${p.ip}">Remover</button>
      </div>`;
    li.querySelector(".copy").onclick = async ()=>{ await navigator.clipboard.writeText(p.ip); toast("IP copiado"); };
    li.querySelector(".edit").onclick = ()=> openEditForm(p.ip);
    li.querySelector(".urg").onclick = ()=> {
      if (!confirm(`Remover ${p.nome}?`)) return;
      removePrinter(p.ip);
    };
    ul.appendChild(li);
  });
}

// remove printer
function removePrinter(ip) {
  let list = JSON.parse(localStorage.getItem(LS_PRINTERS) || "[]");
  const idx = list.findIndex(x=>x.ip===ip);
  if (idx!==-1) {
    const removed = list.splice(idx,1)[0];
    savePrinters(list);
    pushLog("warn", `Removida impressora ${removed.nome} (${ip})`);
    refreshUI();
  }
}

// add or update from form
function handleFormSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const nome = f.nome.value.trim();
  const ip = f.ip.value.trim();
  const sector = f.sector.value.trim();
  const tipo = f.tipo.value.trim();
  const urgente = f.urgent.checked;

  if (!nome || !ip) { toast("Nome e IP obrigatórios"); return; }

  let list = JSON.parse(localStorage.getItem(LS_PRINTERS) || "[]");
  if (f.dataset.editing) {
    // update existing by ip (editing)
    const editingIp = f.dataset.editing;
    const idx = list.findIndex(x=>x.ip===editingIp);
    if (idx!==-1) {
      list[idx] = { nome, ip, sector, tipo, urgente, online: list[idx].online ?? true };
      pushLog("info", `Editada impressora ${nome} (${ip})`);
    }
    delete f.dataset.editing;
  } else {
    // ensure IP unique
    if (list.some(x=>x.ip===ip)) { toast("Já existe impressora com esse IP"); return; }
    list.push({ nome, ip, sector, tipo, urgente, online:true });
    pushLog("info", `Adicionada impressora ${nome} (${ip})`);
  }

  savePrinters(list);
  f.reset();
  renderConfigList();
  refreshUI();
  toast("Salvo");
}

// render logs
function renderLogs() {
  const dom = $("#logList");
  dom.innerHTML = "";
  const logs = JSON.parse(localStorage.getItem(LS_LOGS) || "[]");
  if (!logs.length) dom.innerHTML = "<div class='log-item'>Sem logs ainda.</div>";
  logs.slice(0,200).forEach(l=>{
    const div = document.createElement("div");
    div.className = "log-item";
    div.innerHTML = `<strong>[${new Date(l.ts).toLocaleString()}]</strong> ${l.level.toUpperCase()} — ${l.text}`;
    dom.appendChild(div);
  });
}

// export logs to CSV
function exportLogsCSV() {
  const logs = JSON.parse(localStorage.getItem(LS_LOGS) || "[]");
  if (!logs.length) { toast("Sem logs"); return; }
  const header = "timestamp,level,text\n";
  const rows = logs.map(l=>`"${l.ts}","${l.level}","${l.text.replace(/"/g,'""')}"`).join("\n");
  const blob = new Blob([header+rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `logs_impressoras_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  pushLog("info", "Exportou logs (CSV)");
  toast("Exportado");
}

// clear logs
function clearLogs() {
  if (!confirm("Limpar todos os logs?")) return;
  localStorage.removeItem(LS_LOGS);
  renderLogs();
  toast("Logs limpos");
}

// refresh all statuses (simulate ping for every printer)
async function refreshStatuses() {
  const list = JSON.parse(localStorage.getItem(LS_PRINTERS) || "[]");
  if (!list.length) return;
  $("#refreshBtn").disabled = true;
  $("#refreshBtn").textContent = "Verificando...";

  for (let i=0;i<list.length;i++){
    const p = list[i];
    // simulate ping
    const res = await fakePing(p.ip);
    p.online = !!res.alive;
    // record log
    pushLog("info", `Check ${p.nome} (${p.ip}) → ${p.online ? 'ONLINE' : 'OFFLINE'} (${res.time?res.time+'ms':'n/a'})`);
    // small delay between items for UX
    await new Promise(r=>setTimeout(r, 120));
  }

  savePrinters(list);
  $("#refreshBtn").disabled = false;
  $("#refreshBtn").textContent = "🔄 Atualizar";
  toast("Atualizado");
  refreshUI();
}

// UI refresh for panel
async function refreshUI() {
  const list = JSON.parse(localStorage.getItem(LS_PRINTERS) || "[]");
  renderSummary(list);
  // apply search & filter
  const q = $("#search").value.trim().toLowerCase();
  const filter = $("#filter").value;
  let filtered = list.filter(p => (p.nome.toLowerCase().includes(q) || p.ip.includes(q) || (p.sector||'').toLowerCase().includes(q)));
  if (filter === "online") filtered = filtered.filter(p=>p.online);
  if (filter === "offline") filtered = filtered.filter(p=>!p.online);
  if (filter === "urgent") filtered = filtered.filter(p=>p.urgente);
  renderGrid(filtered);
  renderConfigList();
  renderLogs();
  // update alert area if urgent/offline present
  const hasUrgent = list.some(p=>p.urgente);
  const hasOffline = list.some(p=>!p.online);
  const ab = $("#alertBox");
  if (hasUrgent || hasOffline) {
    ab.classList.remove("hidden");
    ab.innerHTML = (hasUrgent ? `<div>⚠ Há impressoras com TONER BAIXO (urgente)</div>` : "") +
                   (hasOffline ? `<div>🔴 Há impressoras OFFLINE</div>` : "");
  } else {
    ab.classList.add("hidden");
  }
}

// switch view
function switchView(name) {
  // nav buttons
  $$(".nav-btn").forEach(b=> b.classList.toggle("active", b.dataset.view===name));
  // title
  $("#pageTitle").textContent = name==="panel" ? "Impressoras" : name==="config" ? "Configurações" : "Logs";
  // views
  $$(".view").forEach(v=> v.classList.remove("active"));
  $(`#view-${name}`).classList.add("active");
}

// initial wiring
async function init() {
  // wire nav buttons
  $$(".nav-btn").forEach(b=> b.addEventListener("click", ()=>{
    const v = b.dataset.view;
    switchView(v);
  }));
  // load printers (localStorage or JSON)
  await loadPrinters();
  await refreshUI();

  // form
  $("#formAdd").addEventListener("submit", handleFormSubmit);
  $("#resetForm").addEventListener("click", ()=> { $("#formAdd").reset(); delete $("#formAdd").dataset.editing; });

  // search/filter/refresh
  $("#search").addEventListener("input", refreshUI);
  $("#filter").addEventListener("change", refreshUI);
  $("#refreshBtn").addEventListener("click", async ()=>{
    pushLog("info", "Iniciada verificação manual");
    await refreshStatuses();
  });

  // quick add button opens config view
  $("#addQuick").addEventListener("click", ()=>{
    switchView("config");
    $("#formAdd").reset();
    delete $("#formAdd").dataset.editing;
    toast("Adicionar nova impressora");
  });

  // logs buttons
  $("#clearLogs").addEventListener("click", clearLogs);
  $("#exportLogs").addEventListener("click", exportLogsCSV);

  // initial periodic auto-refresh every 90s (optional)
  setInterval(()=> {
    pushLog("info","Auto-refresh agendado");
    refreshStatuses();
  }, 90_000);
}

// start
init();
