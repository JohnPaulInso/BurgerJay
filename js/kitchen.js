// ============================================================
// BURGERJAY KITCHEN DISPLAY SYSTEM (KDS) & RECEIPT TICKETS
// Perforated restaurant order slips, custom SVG food drawings,
// interactive per-item cook checkoffs, and batch production bar.
// ============================================================

const Kitchen = (() => {
  // (2026-07-13) Default active tab to first tab all; was active
  let activeTab = "all"; // "all" | "active" (new+cooking) | "ready" | "completed"
  let activeBatchFilter = null; // item name filter when clicking a batch card
  let soundEnabled = localStorage.getItem("kds_sound") !== "0";
  let timerInterval = null;
  let pollInterval = null;
  let lastKnownOrderCount = 0;
  // (2026-07-13) Track stage & item animations for eye-friendly transitions; was instant redraw
  let lastAnimatedOrderId = null;
  let lastAnimationType = null; // "step-forward" | "step-back"
  let lastPopItemKey = null;
  let lastPopBatchName = null;
  let shouldAnimateTabEntrance = false;

  // (2026-07-13) Custom multi-color SVG food illustrations for BurgerJay menu; was emoji
  function getFoodIllustration(name = ""){
    const n = String(name || "").toLowerCase();

    // 1. Cheezdog / Hotdog Combo
    if(n.includes("cheezdog") || n.includes("hotdog") || n.includes("combo 1")){
      return `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="38" y="10" width="16" height="24" rx="3" fill="#C5161D"/>
          <path d="M40 10L42 4H46L44 10" stroke="#F5B800" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="37" y="9" width="18" height="4" rx="2" fill="#FFFFFF"/>
          <path d="M8 42C8 35 16 32 32 32C48 32 56 35 56 42C56 49 48 54 32 54C16 54 8 49 8 42Z" fill="#F59E0B"/>
          <rect x="6" y="36" width="52" height="10" rx="5" fill="#B91C1C"/>
          <path d="M12 35C16 28 20 38 24 31C28 25 32 37 36 30C40 25 44 37 48 31C50 28 52 33 53 35" stroke="#FACC15" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M15 38C19 32 23 40 27 34C31 29 35 39 39 33C43 29 47 38 50 34" stroke="#FDE047" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M10 45C10 51 18 55 32 55C46 55 54 51 54 45" fill="#FBBF24"/>
        </svg>`;
    }

    // 2. Twin Pounder / Double Cheeseburger (Combo 4)
    if(n.includes("twin") || n.includes("pounder") || n.includes("double") || n.includes("combo 4")){
      return `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 24C12 13 20 8 32 8C44 8 52 13 52 24H12Z" fill="#F59E0B"/>
          <ellipse cx="24" cy="15" rx="2" ry="1" fill="#FEF3C7"/>
          <ellipse cx="32" cy="13" rx="2" ry="1" fill="#FEF3C7"/>
          <ellipse cx="40" cy="15" rx="2" ry="1" fill="#FEF3C7"/>
          <path d="M9 26C13 23 17 29 21 26C25 23 29 29 33 26C37 23 41 29 45 26C49 23 53 28 55 26" stroke="#22C55E" stroke-width="4" stroke-linecap="round"/>
          <rect x="10" y="28" width="44" height="8" rx="4" fill="#78350F"/>
          <path d="M12 29H52L46 35L40 29H26L20 35L12 29Z" fill="#FACC15"/>
          <rect x="10" y="37" width="44" height="8" rx="4" fill="#5C280B"/>
          <path d="M14 38H50L43 44L36 38H22L14 38Z" fill="#F59E0B"/>
          <rect x="12" y="46" width="40" height="8" rx="4" fill="#D97706"/>
        </svg>`;
    }

    // 3. Egg Champ Burger (Combo 3)
    if(n.includes("egg") || n.includes("champ") || n.includes("combo 3")){
      return `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 25C12 14 20 9 32 9C44 9 52 14 52 25H12Z" fill="#F59E0B"/>
          <ellipse cx="26" cy="16" rx="2" ry="1" fill="#FEF3C7"/>
          <ellipse cx="36" cy="15" rx="2" ry="1" fill="#FEF3C7"/>
          <path d="M10 28C10 25 18 24 32 24C46 24 54 25 54 28C54 31 46 33 32 33C18 33 10 31 10 28Z" fill="#FFFFFF"/>
          <circle cx="32" cy="28" r="5" fill="#F59E0B"/>
          <path d="M13 33L51 35" stroke="#B91C1C" stroke-width="3.5" stroke-linecap="round"/>
          <rect x="11" y="36" width="42" height="9" rx="4.5" fill="#78350F"/>
          <path d="M13 37H51L44 43L37 37H13Z" fill="#FACC15"/>
          <rect x="12" y="46" width="40" height="8" rx="4" fill="#D97706"/>
        </svg>`;
    }

    // 4. Bacon & Fries
    if(n.includes("bacon")){
      return `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="44" rx="24" ry="10" fill="#1E293B"/>
          <path d="M14 40L24 22M18 43L32 20M25 45L42 22M32 45L48 26M20 32L44 38M16 36L46 32" stroke="#FACC15" stroke-width="5" stroke-linecap="round"/>
          <path d="M18 34C24 29 28 38 34 32C40 27 43 36 47 32" stroke="#FEF08A" stroke-width="4" stroke-linecap="round"/>
          <circle cx="24" cy="31" r="2.5" fill="#991B1B"/>
          <circle cx="33" cy="28" r="2.5" fill="#B91C1C"/>
          <circle cx="38" cy="34" r="2.5" fill="#991B1B"/>
          <circle cx="28" cy="36" r="2.2" fill="#B91C1C"/>
          <circle cx="42" cy="29" r="2" fill="#7F1D1D"/>
        </svg>`;
    }

    // 5. French Fries (Regular / Large / Fam Size)
    if(n.includes("fries")){
      return `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="19" y="10" width="5" height="24" rx="2" transform="rotate(-10 19 10)" fill="#F59E0B"/>
          <rect x="25" y="7" width="5" height="26" rx="2" transform="rotate(-3 25 7)" fill="#FACC15"/>
          <rect x="31" y="6" width="5" height="27" rx="2" fill="#FDE047"/>
          <rect x="37" y="8" width="5" height="25" rx="2" transform="rotate(5 37 8)" fill="#FACC15"/>
          <rect x="42" y="11" width="5" height="23" rx="2" transform="rotate(12 42 11)" fill="#F59E0B"/>
          <path d="M16 26H48L44 54C44 55.5 42.5 56 41 56H23C21.5 56 20 55.5 20 54L16 26Z" fill="#C5161D"/>
          <path d="M22 26C25 31 39 31 42 26" fill="#991B1B"/>
          <circle cx="32" cy="41" r="6" fill="#FACC15"/>
          <text x="32" y="44" text-anchor="middle" fill="#7D0E13" font-size="9" font-weight="900" font-family="sans-serif">J</text>
        </svg>`;
    }

    // 6. Default: Classic Meat Burger / Combo 2
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 27C12 15 20 10 32 10C44 10 52 15 52 27H12Z" fill="#F59E0B"/>
        <ellipse cx="25" cy="17" rx="2" ry="1" fill="#FEF3C7"/>
        <ellipse cx="33" cy="15" rx="2" ry="1" fill="#FEF3C7"/>
        <ellipse cx="40" cy="18" rx="2" ry="1" fill="#FEF3C7"/>
        <path d="M10 30C14 27 18 33 22 30C26 27 30 33 34 30C38 27 42 33 46 30C50 27 52 32 54 30" stroke="#22C55E" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="10" y="33" width="44" height="10" rx="5" fill="#78350F"/>
        <path d="M13 33H51L44 40L37 33H24L18 39L13 33Z" fill="#FACC15"/>
        <rect x="12" y="44" width="40" height="9" rx="4.5" fill="#D97706"/>
      </svg>`;
  }

  // (2026-07-13) Enforce 2-digit table and order numbers (01-99); was 3-digit 001/003
  function formatTwoDigit(val){
    const digits = String(val || "").replace(/\D/g, "");
    if(!digits) return "01";
    const num = parseInt(digits.slice(-2), 10) || 1;
    return String(num).padStart(2, "0");
  }

  // (2026-07-13) Format 2-digit Card # call code (#01-#99) for Dine-In & Take-Out; was T-/TO-
  function formatCallCode(order){
    const rawNum = (order?.tableNumber && order.tableNumber !== "TO") ? order.tableNumber : (order?.orderNumber || "01");
    const twoDigit = formatTwoDigit(rawNum);
    return `#${twoDigit}`;
  }

  // (2026-07-13) Keep kitchen orders blank by default for fresh database; was demo orders
  function seedInitialDemoOrdersIfEmpty(){
    // Intentionally blank so BurgerJay starts with a clean slate
  }

  function init(){
    seedInitialDemoOrdersIfEmpty();
    const orders = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
    lastKnownOrderCount = orders.filter(o => o.status === "new" || o.status === "cooking").length;
  }

  // (2026-07-13) Shorten verbose menu names for fast kitchen scanning; was full name
  function shortDishName(name = ""){
    return String(name || "")
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/,\s*Fries\s*&\s*Drink/i, "")
      .trim();
  }

  function formatElapsed(ts){
    const diffSec = Math.max(0, Math.floor((Date.now() - (ts || Date.now())) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return mins > 0 ? `${mins}m ${String(secs).padStart(2, "0")}s` : `${secs}s`;
  }

  function formatOrderClock(ts){
    try {
      const d = new Date(ts || Date.now());
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch(e){
      return "";
    }
  }

  function getTimerClass(ts){
    const mins = Math.floor((Date.now() - (ts || Date.now())) / 60000);
    if(mins < 5) return "timer-fresh";
    if(mins < 10) return "timer-medium";
    return "timer-late";
  }

  function computeBatchSummary(orders){
    const activeOrders = orders.filter(o => o.status === "new" || o.status === "cooking");
    const summaryMap = {};

    activeOrders.forEach(o => {
      // (2026-07-13) Use 2-digit call code in batch summary; was raw tableNumber
      const tbl = formatCallCode(o);
      (o.items || []).forEach(item => {
        if(item.done) return; // Only count unplated items still needing cooking
        const name = (item.name || "Item").trim();
        const qty = Number(item.qty || 1);
        if(!summaryMap[name]){
          summaryMap[name] = {
            name,
            totalQty: 0,
            orderCount: 0,
            orderIds: new Set(),
            tables: new Set(),
            flavors: {}
          };
        }
        summaryMap[name].totalQty += qty;
        summaryMap[name].tables.add(tbl);
        if(item.notes){
          summaryMap[name].flavors[item.notes] = (summaryMap[name].flavors[item.notes] || 0) + qty;
        }
        if(!summaryMap[name].orderIds.has(o.id)){
          summaryMap[name].orderIds.add(o.id);
          summaryMap[name].orderCount += 1;
        }
      });
    });

    return Object.values(summaryMap).map(entry => ({
      ...entry,
      tableList: Array.from(entry.tables).join(", "),
      flavorSummary: Object.entries(entry.flavors).map(([f, q]) => `${q}x ${f}`).join(" · ")
    })).sort((a, b) => b.totalQty - a.totalQty);
  }

  // (2026-07-13) Render perforated customer/kitchen order ticket modal; was plain alert
  function openTicketSlipModal(order){
    if(!order) return;
    const branchName = (DB.getCurrentBranch && DB.getCurrentBranch()?.name) ? DB.getCurrentBranch().name.toUpperCase() : "MAIN BRANCH";
    const isDineIn = (order.orderType || "Dine-In") === "Dine-In";
    // (2026-07-13) Format modal call code to 2 digits; was 3-digit orderNumber
    const callCode = formatCallCode(order);
    const totalQty = (order.items || []).reduce((sum, i) => sum + Number(i.qty || 1), 0);
    const totalAmt = (order.items || []).reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 1), 0);
    const status = order.status || "new";
    const stepCount = status === "new" ? 1 : status === "cooking" ? 2 : status === "ready" ? 3 : 4;

    const body = `
      <div style="padding:4px 0;">
        <div class="kds-step-bars" style="max-width:380px;margin:0 auto 10px;">
          ${[1, 2, 3, 4].map(step => `<div class="kds-step-seg ${step <= stepCount ? 'filled-red' : ''}"></div>`).join("")}
        </div>
        <div class="OrderSlipTicket">
          <div style="font-size:0.78rem;font-weight:850;letter-spacing:0.1em;color:var(--ink-soft);text-transform:uppercase;">
            ${Utils.escapeHtml(branchName)}
          </div>
          <div style="font-size:0.75rem;color:var(--ink-faint);font-weight:600;margin-top:2px;">
            ${Utils.fmtDate ? Utils.fmtDate(order.timestamp) : new Date(order.timestamp).toLocaleString()}
          </div>

          <!-- (2026-07-13) Make slip preview modal compact for tablet; was 3.4rem -->
          <div style="font-size:2.1rem;font-weight:900;color:var(--brand);letter-spacing:-0.03em;line-height:1.05;margin:4px 0 3px;">
            ${Utils.escapeHtml(callCode)}
          </div>

          <div style="font-size:0.88rem;font-weight:850;color:var(--ink);">
            ${isDineIn ? "Dine-In" : "Take-Out"} · Card #${Utils.escapeHtml(formatTwoDigit(order.tableNumber || order.orderNumber || "01"))}
          </div>
          <div style="font-size:0.8rem;font-weight:800;color:var(--brand-deep);margin-top:2px;">
            Order #${Utils.escapeHtml(String(order.orderNumber || order.id.slice(-4)))} · ${totalQty} Item(s) ${totalAmt > 0 ? `· ${Utils.money(totalAmt)}` : ""}
          </div>
          <div style="font-size:0.72rem;color:var(--ink-soft);font-weight:600;margin-top:4px;">
            Cashier: ${Utils.escapeHtml(order.cashier || "Staff")} · Status: <strong style="text-transform:uppercase;color:var(--brand);">${status}</strong>
          </div>

          <div class="kds-tear-line" style="margin:8px -16px;">
            <div class="kds-tear-dashes"></div>
          </div>

          <div style="text-align:left;display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
            ${(order.items || []).map(it => `
              <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:8px;background:var(--paper);border:1px solid var(--line);">
                <div style="width:28px;height:28px;flex-shrink:0;">${getFoodIllustration(it.name)}</div>
                <div class="mono" style="font-weight:900;font-size:0.9rem;color:var(--brand-deep);">${it.qty}x</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:800;font-size:0.78rem;color:var(--ink);">${Utils.escapeHtml(it.name)}</div>
                  ${it.notes ? `<div style="font-size:0.66rem;font-weight:700;color:#B45309;">${Utils.escapeHtml(it.notes)}</div>` : ""}
                </div>
              </div>
            `).join("")}
          </div>

          <div style="font-size:0.8rem;color:var(--ink-soft);font-weight:600;line-height:1.4;">
            Please display or place this slip at the table. Thank you for dining at <strong>BurgerJay</strong>!
          </div>
        </div>
      </div>
    `;

    Modalz.open({
      title: `${Icons.get("receipt", {size: 18})} Restaurant Order Slip`,
      body,
      actions: [
        { label: "Done", cls: "btn-ghost" },
        {
          label: "Print Ticket",
          cls: "btn-primary",
          onClick: () => {
            printKitchenSlip(order);
          }
        }
      ]
    });
  }

  function printKitchenSlip(order){
    const settings = DB.getSettings ? DB.getSettings() : {};
    const callCode = `CARD #${formatTwoDigit(order.tableNumber || order.orderNumber || "01")}`;
    let win = document.getElementById("receipt-print");
    if(!win){
      win = document.createElement("div");
      win.id = "receipt-print";
      document.body.appendChild(win);
    }
    win.innerHTML = `
      <div class="receipt">
        <div class="center">
          <strong style="font-size:1.2em;">${Utils.escapeHtml(settings.businessName || "BurgerJay")}</strong><br>
          <span>KITCHEN ORDER SLIP</span><br>
          <strong style="font-size:1.6em;display:block;margin:6px 0;">${Utils.escapeHtml(callCode)}</strong>
          <span>Order #${Utils.escapeHtml(String(order.orderNumber || ""))} · ${Utils.escapeHtml(order.orderType || "Dine-In")}</span>
        </div>
        <hr>
        <div class="row"><span>Time: ${formatOrderClock(order.timestamp)}</span><span>Staff: ${Utils.escapeHtml(order.cashier || "Cashier")}</span></div>
        <hr>
        ${(order.items || []).map(l => `
          <div class="row" style="font-weight:700;font-size:1.05em;margin-bottom:4px;">
            <span>[ ] ${l.qty}x ${Utils.escapeHtml(l.name)}${l.notes ? ` (${Utils.escapeHtml(l.notes)})` : ""}</span>
          </div>
        `).join("")}
        <hr>
        <div class="center">Prepare fresh & hot — BurgerJay KDS</div>
      </div>`;
    setTimeout(() => window.print(), 150);
  }

  function render(){
    const root = document.getElementById("view-root");
    if(!root) return;

    if(timerInterval) clearInterval(timerInterval);
    if(pollInterval) clearInterval(pollInterval);
    seedInitialDemoOrdersIfEmpty();

    const allOrders = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
    const products = DB.getProducts ? DB.getProducts() : [];

    // (2026-07-13) Sort All Slips active-first; was raw array order
    let filtered = [];
    if(activeTab === "active") filtered = allOrders.filter(o => o.status === "new" || o.status === "cooking");
    else if(activeTab === "ready") filtered = allOrders.filter(o => o.status === "ready");
    else if(activeTab === "completed") filtered = allOrders.filter(o => o.status === "completed");
    else {
      const rank = { new: 1, cooking: 2, ready: 3, completed: 4 };
      filtered = [...allOrders].sort((a, b) => (rank[a.status] || 9) - (rank[b.status] || 9));
    }

    if(activeBatchFilter){
      filtered = filtered.filter(o => (o.items || []).some(it => (it.name || "").trim() === activeBatchFilter));
    }

    const countActive = allOrders.filter(o => o.status === "new" || o.status === "cooking").length;
    const countReady = allOrders.filter(o => o.status === "ready").length;
    const countCompleted = allOrders.filter(o => o.status === "completed").length;

    const batchSummary = computeBatchSummary(allOrders);

    root.innerHTML = `
      <div class="kitchen-view">
        <!-- 1. Top Aggregated Batch Grill & Fry Production Bar -->
        <!-- (2026-07-13) Remove noisy subtitle & shorten batch names; was cluttered -->
        <div class="kds-batch-bar">
          <div class="kds-batch-head">
            <div class="kds-batch-title">
              <span class="kds-batch-title-icon">${Icons.get("flame", {size: 15})}</span>
              <span>TO COOK NOW (${countActive} ACTIVE)</span>
            </div>
            ${activeBatchFilter ? `
              <div class="kds-batch-subtitle">
                <span>Filter: <strong style="color:var(--brand);">${Utils.escapeHtml(shortDishName(activeBatchFilter))}</strong></span>
                <button type="button" class="btn btn-xs btn-outline font-bold" id="kds-clear-batch-filter" style="padding:2px 8px;border-radius:99px;">Show All</button>
              </div>
            ` : ""}
          </div>

          <!-- (2026-07-13) Make batch cards check off all matching items on click; was filter-only -->
          <div class="kds-batch-items">
            ${batchSummary.length ? batchSummary.map(item => `
              <button type="button" class="kds-batch-card" data-batch-item="${Utils.escapeHtml(item.name)}" title="Tap to check off all ${item.totalQty}x ${Utils.escapeHtml(shortDishName(item.name))}">
                <div class="kds-batch-illust">
                  ${getFoodIllustration(item.name)}
                </div>
                <div class="kds-batch-info">
                  <div class="kds-batch-top-row">
                    <span class="kds-batch-qty">${item.totalQty}x</span>
                    <span class="kds-batch-name">${Utils.escapeHtml(shortDishName(item.name))}</span>
                  </div>
                  <div class="kds-batch-meta">
                    <span class="kds-batch-tables">${Utils.escapeHtml(item.tableList)}</span>
                    ${item.flavorSummary ? `<span>${Utils.escapeHtml(item.flavorSummary)}</span>` : ""}
                  </div>
                </div>
                <div class="kds-item-check" style="margin-left:2px;" title="Check all">
                  ${Icons.get("check", {size: 13, strokeWidth: 3})}
                </div>
              </button>
            `).join("") : `
              <div style="display:flex;align-items:center;gap:8px;padding:4px;color:var(--ink-soft);font-size:0.84rem;font-weight:700;">
                <span style="color:#10B981;display:inline-flex;">${Icons.get("check-circle", {size: 17})}</span>
                <span>All active items plated!</span>
              </div>
            `}
          </div>
        </div>

        <!-- 2. Controls & Status Filter Bar -->
        <div class="kds-controls">
          <!-- (2026-07-13) Move All Slips tab to first position; was third tab -->
          <div class="kds-filter-tabs" id="kds-tabs">
            <button class="kds-tab-btn ${activeTab==='all'?'active':''}" data-tab="all">
              All Slips <span class="badge-count">${allOrders.length}</span>
            </button>
            <button class="kds-tab-btn ${activeTab==='active'?'active':''}" data-tab="active">
              <span class="kds-tab-dot" style="background:#DC2626;"></span>
              Active Cooking <span class="badge-count">${countActive}</span>
            </button>
            <button class="kds-tab-btn ${activeTab==='ready'?'active':''}" data-tab="ready">
              <span class="kds-tab-dot" style="background:#10B981;"></span>
              Ready to Serve <span class="badge-count">${countReady}</span>
            </button>
            <button class="kds-tab-btn ${activeTab==='completed'?'active':''}" data-tab="completed">
              Completed <span class="badge-count">${countCompleted}</span>
            </button>
            <!-- (2026-07-13) Add Customer Now-Serving split screen tab; was missing -->
            <button class="kds-tab-btn ${activeTab==='monitor'?'active':''}" data-tab="monitor">
              ${Icons.get("bell", {size: 13})} Customer Screen
            </button>
          </div>

          <div style="display:flex;align-items:center;gap:8px;">
            ${activeTab === "monitor" ? `
              <button type="button" class="btn btn-sm btn-primary font-bold" id="kds-fullscreen-monitor" title="Toggle Fullscreen TV Display">
                Full Screen TV
              </button>
            ` : ""}
            <button type="button" class="btn btn-sm btn-outline font-bold" id="kds-go-register" title="Create new order at Register">
              ${Icons.get("plus", {size: 15})} New Order
            </button>
            <button type="button" class="btn btn-sm btn-outline font-bold" id="kds-sound-toggle" title="Toggle kitchen chime">
              ${soundEnabled ? Icons.get("volume-2", {size: 15}) : Icons.get("volume-x", {size: 15})}
              <span>${soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>
            ${countCompleted > 0 ? `
              <button type="button" class="btn btn-sm btn-ghost text-danger font-bold" id="kds-clear-completed" title="Clear completed slips">
                ${Icons.get("trash", {size: 14})} Clear Done
              </button>
            ` : ""}
          </div>
        </div>

        <!-- 3. Perforated Restaurant Order Tickets Grid or Customer Queue Monitor -->
        <div class="kds-tickets-container">
          ${activeTab === "monitor" ? renderCustomerMonitor(allOrders) : filtered.length ? `
            <div class="kds-tickets-grid">
              ${filtered.map(order => renderTicket(order, products)).join("")}
            </div>
          ` : `
            <div class="kds-empty">
              <div class="kds-empty-icon">${Icons.get("utensils", {size: 34})}</div>
              <h3 style="font-size:1.2rem;font-weight:850;margin:0 0 6px;color:var(--ink);">No order slips in this view</h3>
              <p style="margin:0 0 14px;font-size:0.88rem;color:var(--ink-soft);">
                ${activeTab === 'active' ? 'Orders punched at the Register POS will appear here automatically with table numbers.' : 'Switch tabs above to view other order stages.'}
              </p>
              <button type="button" class="btn btn-primary font-bold" id="kds-empty-new-order">
                ${Icons.get("store", {size: 16})} Open Register POS
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    bindEvents();

    // Update elapsed timers every 1 second for live kitchen accuracy
    timerInterval = setInterval(() => {
      document.querySelectorAll("[data-kds-timer]").forEach(el => {
        const ts = Number(el.dataset.kdsTimer);
        if(ts){
          el.textContent = `⏱ ${formatElapsed(ts)}`;
          el.className = `kds-ticket-timer ${getTimerClass(ts)}`;
        }
      });
    }, 1000);

    // Auto-polling for new orders from Register
    pollInterval = setInterval(() => {
      const latestOrders = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
      const currentActive = latestOrders.filter(o => o.status === "new" || o.status === "cooking").length;
      if(currentActive > lastKnownOrderCount){
        if(soundEnabled) Utils.Sound?.cashChime?.();
        lastKnownOrderCount = currentActive;
        render();
      } else if(latestOrders.length !== allOrders.length){
        lastKnownOrderCount = currentActive;
        render();
      }
    }, 3000);
  }

  // (2026-07-13) Render split-screen Customer Now-Serving Queue view; was none
  function renderCustomerMonitor(allOrders){
    const preparing = allOrders.filter(o => o.status === "new" || o.status === "cooking");
    const ready = allOrders.filter(o => o.status === "ready");
    return `
      <div class="kds-customer-monitor" id="kds-customer-monitor">
        <!-- Left Column: Preparing -->
        <div class="kds-mon-col kds-mon-preparing">
          <div class="kds-mon-head">
            <span class="kds-mon-icon">${Icons.get("flame", {size: 20})}</span>
            <span>PREPARING</span>
            <span class="kds-mon-count">${preparing.length}</span>
          </div>
          <div class="kds-mon-grid">
            ${preparing.length ? preparing.map(o => `
              <div class="kds-mon-card mon-card-prep" data-action="ready" data-id="${o.id}" title="Tap to mark Ready to Serve">
                <div class="kds-mon-code">${Utils.escapeHtml(formatCallCode(o))}</div>
                <div class="kds-mon-sub">${(o.orderType || "Dine-In") === "Dine-In" ? "Dine-In" : "Take-Out"}</div>
              </div>
            `).join("") : `
              <div class="kds-mon-empty">No orders currently cooking</div>
            `}
          </div>
        </div>

        <!-- Right Column: Now Serving / Ready to Pick Up -->
        <div class="kds-mon-col kds-mon-ready">
          <div class="kds-mon-head">
            <span class="kds-mon-icon">${Icons.get("bell", {size: 20})}</span>
            <span>NOW SERVING / READY</span>
            <span class="kds-mon-count">${ready.length}</span>
          </div>
          <div class="kds-mon-grid">
            ${ready.length ? ready.map(o => `
              <div class="kds-mon-card mon-card-ready" data-action="completed" data-id="${o.id}" title="Tap to mark Served & Completed">
                <div class="kds-mon-code">${Utils.escapeHtml(formatCallCode(o))}</div>
                <div class="kds-mon-sub">${(o.orderType || "Dine-In") === "Dine-In" ? "Dine-In" : "Take-Out"} · Card #${formatTwoDigit(o.tableNumber || o.orderNumber)}</div>
              </div>
            `).join("") : `
              <div class="kds-mon-empty">Waiting for ready orders…</div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderTicket(order, products){
    const isDineIn = (order.orderType || "Dine-In") === "Dine-In";
    // (2026-07-13) Format ticket call code to 2 digits (T-01 / TO-03); was 3-digit TO-003
    const callCode = formatCallCode(order);

    const status = order.status || "new";
    const stepCount = status === "new" ? 1 : status === "cooking" ? 2 : status === "ready" ? 3 : 4;
    const segClass = status === "new" ? "filled-red" : status === "cooking" ? "filled-gold" : "filled-green";

    const items = order.items || [];
    const doneCount = items.filter(i => i.done).length;
    const totalUnits = items.reduce((s, i) => s + Number(i.qty || 1), 0);

    const statusLabel = status === "new"
      ? "New Order · Waiting to Cook"
      : status === "cooking"
      ? "On the Grill / Fryer"
      : status === "ready"
      ? "Ready for Pickup / Serving"
      : "Order Served & Completed";

    const stepMeta = [
      { step: 1, key: "new", label: "Step 1: New Order (Waiting)" },
      { step: 2, key: "cooking", label: "Step 2: Cooking / On Grill" },
      { step: 3, key: "ready", label: "Step 3: Ready to Serve" },
      { step: 4, key: "completed", label: "Step 4: Served & Completed" }
    ];

    const animClass = (lastAnimatedOrderId === order.id && lastAnimationType)
      ? `kds-anim-${lastAnimationType}`
      : (shouldAnimateTabEntrance ? "kds-ticket-enter" : "");

    return `
      <div class="kds-ticket-wrap ${animClass}" data-order-id="${order.id}">
        <!-- (2026-07-13) Clickable 4-step progress segments to jump back/forward; was static divs -->
        <div class="kds-step-bars" title="Tap any bar to switch stage (${statusLabel})">
          ${stepMeta.map(s => `<button type="button" class="kds-step-seg ${s.step <= stepCount ? segClass : ''}" data-action="${s.key}" data-id="${order.id}" title="${s.label}"></button>`).join("")}
        </div>

        <div class="kds-ticket status-${status}">
          <!-- (2026-07-13) Strip redundant ticket header lines for instant reading; was 5 text rows -->
          <div class="kds-ticket-hero">
            <div class="kds-ticket-header-bar">
              <div class="kds-ticket-id-group">
                <span class="kds-ticket-call-number">${Utils.escapeHtml(callCode)}</span>
                <span class="kds-ticket-type-pill ${isDineIn ? 'pill-dinein' : 'pill-takeout'}">
                  ${isDineIn ? 'Dine-In' : 'Take-Out'}
                </span>
              </div>
              <span class="kds-ticket-timer ${getTimerClass(order.timestamp)}" data-kds-timer="${order.timestamp}">
                ⏱ ${formatElapsed(order.timestamp)}
              </span>
            </div>
          </div>

          <!-- Perforated Tear Line with Side Cutouts -->
          <div class="kds-tear-line">
            <div class="kds-tear-dashes"></div>
          </div>

          <!-- Interactive Order Items with Vector Food Illustrations -->
          <div class="kds-ticket-body">
            ${items.map((item, idx) => {
              const p = products.find(x => x && (x.name||'').trim().toLowerCase() === (item.name||'').trim().toLowerCase());
              const img = item.imageUrl || p?.imageUrl || "";
              const isDone = Boolean(item.done);
              const popClass = (lastPopItemKey === `${order.id}_${idx}` || (lastPopBatchName && (item.name || "").trim() === lastPopBatchName)) ? "kds-item-pop" : "";
              const displayName = shortDishName(item.name);
              return `
                <div class="kds-item-row ${isDone ? 'item-done' : ''} ${popClass}" data-toggle-item="${order.id}" data-item-idx="${idx}" title="Tap to check off">
                  <div class="kds-item-img">
                    ${img ? `<img src="${img}" alt="${Utils.escapeHtml(displayName)}" onerror="this.onerror=null;this.parentElement.innerHTML=Kitchen.getFoodIllustration('${Utils.escapeHtml(item.name).replace(/'/g, "\\'")}');">` : getFoodIllustration(item.name)}
                  </div>
                  <div class="kds-item-qty">${item.qty}x</div>
                  <div class="kds-item-details">
                    <div class="kds-item-name">${Utils.escapeHtml(displayName)}</div>
                    ${item.notes ? `<span class="kds-item-flavor">${Utils.escapeHtml(item.notes)}</span>` : ""}
                  </div>
                  <div class="kds-item-check">
                    ${Icons.get("check", {size: 14, strokeWidth: 3})}
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <!-- (2026-07-13) Remove print slip button from KDS footer to reduce clutter; was 3 buttons -->
          <div class="kds-ticket-foot">
            <div class="kds-ticket-actions-row">
              ${status === 'new' ? `
                <button type="button" class="kds-btn-action kds-btn-start" data-action="cooking" data-id="${order.id}">
                  ${Icons.get("flame", {size: 16})} Start Cooking
                </button>
              ` : status === 'cooking' ? `
                <button type="button" class="kds-btn-secondary" data-action="new" data-id="${order.id}" title="Back to New">
                  ${Icons.get("corner-up-left", {size: 15})} Back
                </button>
                <button type="button" class="kds-btn-action kds-btn-ready" data-action="ready" data-id="${order.id}">
                  ${Icons.get("bell", {size: 16})} Mark Ready
                </button>
              ` : status === 'ready' ? `
                <button type="button" class="kds-btn-secondary" data-action="cooking" data-id="${order.id}" title="Back to Cooking">
                  ${Icons.get("corner-up-left", {size: 15})} Back
                </button>
                <button type="button" class="kds-btn-action kds-btn-complete" data-action="completed" data-id="${order.id}">
                  ${Icons.get("check-circle", {size: 16})} Serve Done
                </button>
              ` : `
                <button type="button" class="kds-btn-secondary" style="flex:1;" data-action="ready" data-id="${order.id}" title="Back to Ready">
                  ${Icons.get("corner-up-left", {size: 15})} Back to Ready
                </button>
                <button type="button" class="kds-btn-secondary" style="flex:1;" data-action="cooking" data-id="${order.id}" title="Return to Cooking">
                  ${Icons.get("flame", {size: 15})} Re-Cook
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // (2026-07-13) Spawn flying ticket badge arcing into destination tab; was abrupt vanish
  function spawnFlyingGhost(sourceEl, targetTabKey, labelText, nextStatus, isForward){
    try {
      if(!sourceEl) return;
      const targetBtn = document.querySelector(`#kds-tabs .kds-tab-btn[data-tab="${targetTabKey}"]`);
      if(!targetBtn) return;

      const sRect = sourceEl.getBoundingClientRect();
      const tRect = targetBtn.getBoundingClientRect();

      const ghost = document.createElement("div");
      ghost.className = "kds-flying-ghost";
      const bg = nextStatus === "ready" ? "#10B981" : nextStatus === "completed" ? "#64748B" : nextStatus === "cooking" ? "#F59E0B" : "#C5161D";
      ghost.style.background = bg;
      ghost.innerHTML = `${isForward ? "➔" : "↩"} <span>${Utils.escapeHtml(labelText)}</span>`;

      const startX = sRect.left + sRect.width / 2 - 60;
      const startY = sRect.top + 40;
      const endX = tRect.left + tRect.width / 2 - 45;
      const endY = tRect.top + tRect.height / 2 - 16;

      ghost.style.left = `${startX}px`;
      ghost.style.top = `${startY}px`;
      ghost.style.transform = "translate(0, 0) scale(1)";
      ghost.style.opacity = "1";
      document.body.appendChild(ghost);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const dx = endX - startX;
          const dy = endY - startY;
          ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.55)`;
          ghost.style.opacity = "0.2";
        });
      });

      setTimeout(() => {
        ghost.remove();
        const refreshedTab = document.querySelector(`#kds-tabs .kds-tab-btn[data-tab="${targetTabKey}"]`);
        if(refreshedTab){
          refreshedTab.classList.add("kds-tab-bounce");
          setTimeout(() => refreshedTab.classList.remove("kds-tab-bounce"), 460);
        }
      }, 400);
    } catch(e){}
  }

  function toggleOrderItemDone(orderId, itemIdx){
    const list = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
    const ord = list.find(o => o.id === orderId);
    if(!ord || !Array.isArray(ord.items) || !ord.items[itemIdx]) return;
    ord.items[itemIdx].done = !ord.items[itemIdx].done;

    if(ord.status === "new" && ord.items[itemIdx].done){
      ord.status = "cooking";
    }
    if(DB.setKitchenOrders) DB.setKitchenOrders(list);
    lastPopItemKey = `${orderId}_${itemIdx}`;
    lastAnimatedOrderId = null;
    shouldAnimateTabEntrance = false;
    Utils.Sound?.tap?.();
    render();
    setTimeout(() => { lastPopItemKey = null; }, 350);
  }

  function bindEvents(){
    const root = document.getElementById("view-root");
    if(!root) return;

    // Filter tabs
    root.querySelectorAll("#kds-tabs .kds-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        lastAnimatedOrderId = null;
        shouldAnimateTabEntrance = true;
        render();
        setTimeout(() => { shouldAnimateTabEntrance = false; }, 380);
      });
    });

    // (2026-07-13) Check off all matching items across active orders on batch click; was filter
    root.querySelectorAll(".kds-batch-card").forEach(card => {
      card.addEventListener("click", () => {
        const itemName = (card.dataset.batchItem || "").trim();
        if(!itemName) return;
        const list = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
        const touched = [];
        let totalUnitsChecked = 0;

        list.forEach(ord => {
          if(ord.status !== "new" && ord.status !== "cooking") return;
          const prevStatus = ord.status;
          let anyInOrder = false;
          (ord.items || []).forEach((it, idx) => {
            if(!it.done && (it.name || "").trim() === itemName){
              it.done = true;
              anyInOrder = true;
              totalUnitsChecked += Number(it.qty || 1);
              touched.push({ orderId: ord.id, idx, prevStatus });
            }
          });
          if(anyInOrder && ord.status === "new"){
            ord.status = "cooking";
          }
        });

        if(!touched.length) return;
        if(DB.setKitchenOrders) DB.setKitchenOrders(list);
        lastPopBatchName = itemName;
        lastAnimatedOrderId = null;
        shouldAnimateTabEntrance = false;
        Utils.Sound?.tap?.();
        render();
        setTimeout(() => { lastPopBatchName = null; }, 380);

        Utils.toast(`Checked off ${totalUnitsChecked}x ${shortDishName(itemName)}`, "success", 5000, {
          label: "Undo",
          onClick: () => {
            const curList = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
            touched.forEach(t => {
              const o = curList.find(x => x.id === t.orderId);
              if(o){
                if(o.items && o.items[t.idx]) o.items[t.idx].done = false;
                o.status = t.prevStatus;
              }
            });
            if(DB.setKitchenOrders) DB.setKitchenOrders(curList);
            render();
            Utils.toast(`Unchecked ${shortDishName(itemName)}`, "info", 2000);
          }
        });
      });
    });

    root.querySelector("#kds-clear-batch-filter")?.addEventListener("click", () => {
      activeBatchFilter = null;
      shouldAnimateTabEntrance = true;
      render();
      setTimeout(() => { shouldAnimateTabEntrance = false; }, 380);
    });

    // Go to Register POS
    const goPos = () => {
      if(typeof App !== "undefined" && App.navigate) App.navigate("pos");
    };
    root.querySelector("#kds-go-register")?.addEventListener("click", goPos);
    root.querySelector("#kds-empty-new-order")?.addEventListener("click", goPos);
    // (2026-07-13) Bind fullscreen toggle for Customer Now-Serving screen; was missing
    root.querySelector("#kds-fullscreen-monitor")?.addEventListener("click", () => {
      const mon = document.getElementById("kds-customer-monitor") || root;
      if(!document.fullscreenElement && mon.requestFullscreen){
        mon.requestFullscreen().catch(() => {});
      } else if(document.exitFullscreen){
        document.exitFullscreen().catch(() => {});
      }
    });

    // Sound toggle
    root.querySelector("#kds-sound-toggle")?.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem("kds_sound", soundEnabled ? "1" : "0");
      render();
    });

    // Clear completed
    root.querySelector("#kds-clear-completed")?.addEventListener("click", () => {
      if(DB.clearCompletedKitchenOrders){
        DB.clearCompletedKitchenOrders();
        Utils.toast("Completed kitchen slips cleared.", "info");
        render();
      }
    });

    // Toggle individual item done state
    root.querySelectorAll("[data-toggle-item]").forEach(row => {
      row.addEventListener("click", () => {
        const orderId = row.dataset.toggleItem;
        const idx = Number(row.dataset.itemIdx);
        toggleOrderItemDone(orderId, idx);
      });
    });

    // View / Print slip modal
    root.querySelectorAll("[data-print-slip]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.printSlip;
        const all = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
        const ord = all.find(o => o.id === id);
        if(ord) openTicketSlipModal(ord);
      });
    });

    // (2026-07-13) Animate flying transitions forward/backward on stage change; was instant render
    const stageRank = { new: 1, cooking: 2, ready: 3, completed: 4 };
    const stageToTab = { new: "active", cooking: "active", ready: "ready", completed: "completed" };

    root.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const nextStatus = btn.dataset.action;
        if(id && nextStatus && DB.updateKitchenOrderStatus){
          const list = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
          const ord = list.find(o => o.id === id);
          if(!ord || ord.status === nextStatus) return;

          const prevStatus = ord.status;
          const prevItemDone = (ord.items || []).map(it => Boolean(it.done));
          const isForward = (stageRank[nextStatus] || 1) >= (stageRank[prevStatus] || 1);
          // (2026-07-13) Use 2-digit call code in toast & flying ghost; was raw orderNumber
          const callName = formatCallCode(ord);

          const staysInCurrentTab =
            activeTab === "all" ||
            (activeTab === "active" && (nextStatus === "new" || nextStatus === "cooking")) ||
            (activeTab === nextStatus);

          const applyUpdateAndRender = () => {
            if(nextStatus === "ready" || nextStatus === "completed"){
              (ord.items || []).forEach(it => { it.done = true; });
              DB.setKitchenOrders(list);
            } else if(nextStatus === "new" || (nextStatus === "cooking" && (prevStatus === "ready" || prevStatus === "completed"))){
              (ord.items || []).forEach(it => { it.done = false; });
              DB.setKitchenOrders(list);
            }

            DB.updateKitchenOrderStatus(id, nextStatus);
            if(staysInCurrentTab){
              lastAnimatedOrderId = id;
              lastAnimationType = isForward ? "step-forward" : "step-back";
            } else {
              lastAnimatedOrderId = null;
              lastAnimationType = null;
            }
            shouldAnimateTabEntrance = false;
            render();
            setTimeout(() => {
              lastAnimatedOrderId = null;
              lastAnimationType = null;
            }, 460);

            if(Utils.snackbarWithUndo){
              Utils.snackbarWithUndo(`${callName} moved to ${nextStatus.toUpperCase()}`, () => {
                const curList = DB.getKitchenOrders ? DB.getKitchenOrders() : [];
                const target = curList.find(o => o.id === id);
                if(target){
                  (target.items || []).forEach((it, idx) => { it.done = Boolean(prevItemDone[idx]); });
                  DB.setKitchenOrders(curList);
                }
                DB.updateKitchenOrderStatus(id, prevStatus);
                lastAnimatedOrderId = id;
                lastAnimationType = "step-back";
                render();
              });
            }
          };

          Utils.Sound?.tap?.();

          const ticketWrap = root.querySelector(`.kds-ticket-wrap[data-order-id="${id}"]`);
          if(!staysInCurrentTab && ticketWrap){
            const destTabKey = stageToTab[nextStatus] || "all";
            spawnFlyingGhost(ticketWrap, destTabKey, `${callName} • ${nextStatus.toUpperCase()}`, nextStatus, isForward);
            ticketWrap.classList.add(isForward ? "kds-anim-fly-forward" : "kds-anim-fly-back");
            setTimeout(applyUpdateAndRender, 340);
          } else {
            applyUpdateAndRender();
          }
        }
      });
    });
  }

  return { init, render, getFoodIllustration, openTicketSlipModal };
})();
