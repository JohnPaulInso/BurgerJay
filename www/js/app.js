// ============================================================
// app.js — bootstraps the app: routing, shell, nav
// ============================================================
// (2026-07-13) Group sidebar by 4 businesses & overview; was single list
const App = (() => {
  // (2026-07-13) Set BurgerJay navigation sections and remove gas station; was Route98
  const NAV_SECTIONS = [
    {
      group: "OVERVIEW",
      views: [
        { id:"shift", label:"Shift", ic:"clock", mod:Shift, roles:["admin","cashier"], color:"#D4971A" }
      ]
    },
    {
      group: "BUSINESS UNITS",
      views: [
        /* (2026-07-13) Register POS and Kitchen KDS view in Business Units; was store only */
        { id:"pos", label:"Register POS", ic:"store", mod:POS, roles:["admin","cashier"], color:"#C5161D" },
        { id:"kitchen", label:"Kitchen View (KDS)", ic:"utensils", mod:Kitchen, roles:["admin","cashier"], color:"#F59E0B" }
      ]
    },
    {
      group: "OPERATIONS",
      views: [
        { id:"reports", label:"Reports", ic:"clipboard", mod:Reports, roles:["admin","cashier"], color:"#4B5563" },
        { id:"inventory", label:"Inventory", ic:"package", mod:Inventory, roles:["admin"], color:"#4B5563" },
        { id:"expenses", label:"Expenses (OPEX)", ic:"dollar-sign", mod:Expenses, roles:["admin"], color:"#DC2626" }
      ]
    },
    {
      group: "SYSTEM",
      views: [
        { id:"settings", label:"Settings", ic:"gear", mod:Settings, roles:["admin"], color:"#4B5563" }
      ]
    }
  ];
  // (2026-07-13) Restore VIEWS definition from NAV_SECTIONS; was missing
  const VIEWS = NAV_SECTIONS.flatMap(s => s.views);
  // (2026-07-13) Set BurgerJay bottom nav items with kitchen view; was route98
  const BOTTOM_NAV_IDS = ["pos","kitchen","shift","reports","inventory"];
  let currentView = "pos";

  function accessibleViews(){
    const role = Auth.currentUser()?.role || "cashier";
    return VIEWS.filter(v => v.roles.includes(role));
  }

  function lowStockCount(){
    return DB.getProducts().filter(p => p.stock <= p.lowStockThreshold).length;
  }

  // (2026-07-13) Auto-clear module search filters on navigation; was persistent
  function navigate(id){
    const view = VIEWS.find(v => v.id === id);
    if(!view) return;
    if(!view.roles.includes(Auth.currentUser()?.role)){ Utils.toast("You don't have access to this section.", "warn"); return; }
    currentView = id;
    const s = DB.getSettings();
    if(s.lastView !== id){ s.lastView = id; DB.setSettings(s); }
    Scanner.clearContext();
    POS.resetSearch?.();
    Inventory.resetSearch?.();
    if(id !== "reports"){ document.getElementById("back-to-top-btn")?.remove(); }
    paintNav();
    view.mod.render();
  }

  // (2026-07-13) Live refresh reports view on sync; was skipping all updates
  function rerenderCurrentView(){
    if(currentView === "reports"){
      if(typeof Reports !== "undefined" && Reports.render){
        Reports.render();
      }
      return;
    }
    // (2026-07-13) Live refresh inventory on input focus; was skipping update
    const active = document.activeElement;
    if(active && ["INPUT","TEXTAREA","SELECT"].includes(active.tagName)){
      if(active.id === "pos-search" && currentView === "pos"){
        POS.renderCatalog?.();
      }
      if(currentView === "inventory" && typeof Inventory !== "undefined"){
        Inventory.renderTable?.();
      }
      return;
    }
    if(currentView === "pos" && document.getElementById("product-grid")){
      POS.renderCatalog?.();
      return;
    }
    const winY = window.scrollY || document.documentElement.scrollTop;
    const vb = document.querySelector(".view-body");
    const vbScroll = vb ? vb.scrollTop : 0;
    const view = VIEWS.find(v => v.id === currentView);
    view?.mod.render();
    if(winY > 0) window.scrollTo(0, winY);
    if(vbScroll > 0){
      const newVb = document.querySelector(".view-body");
      if(newVb) newVb.scrollTop = vbScroll;
    }
  }

  function paintNav(){
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.nav === currentView));
    document.querySelectorAll(".bn-btn").forEach(b => b.classList.toggle("active", b.dataset.nav === currentView));
    const dot = document.getElementById("inv-badge-dot");
    const count = lowStockCount();
    if(dot){ dot.textContent = count; dot.style.display = count > 0 ? "inline-flex" : "none"; }
    const dotB = document.getElementById("inv-badge-dot-bn");
    if(dotB){ dotB.style.display = count > 0 ? "block" : "none"; }
    // (2026-07-13) Append live counts to topbar title; was static label text
    const titleViewEl = document.getElementById("topbar-title-view");
    if(titleViewEl){
      const baseLabel = VIEWS.find(v=>v.id===currentView)?.label || "";
      if(currentView === "inventory"){
        const prodCount = typeof DB !== "undefined" && DB.getProducts ? DB.getProducts().length : 0;
        titleViewEl.textContent = `${baseLabel} (${prodCount} Products)`;
      } else {
        titleViewEl.textContent = baseLabel;
      }
    }
    paintShiftIndicator();
  }

  // (2026-07-13) Responsive shift badge with extra text wrap; was static span
  function paintShiftIndicator(){
    const el = document.getElementById("topbar-shift-indicator");
    if(!el) return;
    const s = DB.getShift ? DB.getShift() : null;
    const isOpen = Boolean(s && s.status === "open");
    if(isOpen){
      // (2026-07-13) Distinguish shift owner and JP admin in topbar; was owner only
      const u = typeof Auth !== "undefined" && Auth.currentUser ? Auth.currentUser() : null;
      const isSameCashier = u && s.cashier && u.name.trim().toLowerCase() === s.cashier.trim().toLowerCase();
      const isJP = u && (u.name.trim().toLowerCase() === "jp" || u.id === "u_jp");
      const isOwner = Boolean(isSameCashier);
      el.className = "topbar-shift-badge shift-open";
      el.innerHTML = isOwner
        ? `<span class="shift-dot green"></span><span>Open<span class="shift-text-extra"> Shift</span></span>`
        : isJP
          ? `<span class="shift-dot green"></span><span>Open<span class="shift-text-extra"> (JP Admin)</span></span>`
          : `<span class="shift-dot green"></span><span>Open<span class="shift-text-extra"> (View Only)</span></span>`;
      el.title = isOwner
        ? `Shift is Open (${s.cashier || "Cashier"}) — Click to manage`
        : isJP
          ? `Shift is Open (${s.cashier || "Cashier"}) — Click to force close`
          : `Shift is Open (${s.cashier || "Cashier"}) — View Only`;
    } else {
      el.className = "topbar-shift-badge shift-closed";
      el.innerHTML = `<span class="shift-dot red"></span><span>Closed<span class="shift-text-extra"> Shift</span></span>`;
      el.title = "Shift is Closed — Click to open shift";
    }
  }

  function paintTopbar(){
    const s = DB.getSettings();
    const title = document.getElementById("topbar-title");
    /* (2026-07-13) Set BurgerJay brand name in topbar; was Route 98 */
    if(title) title.textContent = (s.businessName && s.businessName !== "Route 98") ? s.businessName : "BurgerJay";
    const user = Auth.currentUser();
    const chip = document.getElementById("user-chip-label");
    if(chip) chip.textContent = user?.name || "";
    const av = document.getElementById("user-chip-av");
    if(av) av.textContent = (user?.name||"?").slice(0,1).toUpperCase();
    paintShiftIndicator();
    // (2026-07-13) Paint active branch label in topbar selector; was single store
    const curBranch = DB.getCurrentBranch ? DB.getCurrentBranch() : null;
    const bNameEl = document.getElementById("topbar-branch-name");
    if(bNameEl && curBranch) bNameEl.textContent = curBranch.name;
  }

  // (2026-07-13) Manage branch dropdown open state & topbar z-index; was menu-only
  function closeBranchDropdown(){
    document.getElementById("branch-dropdown-menu")?.classList.add("hidden");
    document.getElementById("branch-dropdown-backdrop")?.classList.add("hidden");
    document.getElementById("branch-selector-wrap")?.classList.remove("open");
    document.querySelector(".topbar")?.classList.remove("branch-open");
  }

  // (2026-07-13) Topbar branch selector and management modals; was single store
  function paintBranchDropdown(){
    const menu = document.getElementById("branch-dropdown-menu");
    if(!menu) return;
    const branches = DB.getBranches ? DB.getBranches() : [{ id: "branch_main", name: "Main Branch", code: "MAIN", isDefault: true }];
    const curBranch = DB.getCurrentBranch ? DB.getCurrentBranch() : branches[0];
    const isAdmin = Auth.isAdmin ? Auth.isAdmin() : false;

    menu.innerHTML = `
      <div class="branch-dropdown-header">
        <span>Branches (${branches.length})</span>
        ${isAdmin ? `<button type="button" class="btn btn-xs btn-primary font-bold" id="btn-add-branch-quick" style="padding:2px 8px;font-size:0.68rem;">+ Add</button>` : ""}
      </div>
      <div class="branch-list-container">
        ${branches.map(b => {
          const isCur = String(b.id) === String(curBranch.id);
          return `
            <div class="branch-item-row ${isCur ? 'active' : ''}" data-branch-select="${b.id}">
              <div class="branch-item-info">
                <span class="branch-item-name">${Utils.escapeHtml(b.name || 'Branch')}</span>
                ${b.code ? `<span class="branch-item-code">${Utils.escapeHtml(b.code)}</span>` : ''}
              </div>
              <div class="branch-item-actions">
                ${isCur ? `<span class="branch-item-check">${Icons.get("check", {size: 14})}</span>` : ''}
                ${isAdmin ? `
                  <button type="button" class="branch-btn-edit" data-branch-edit="${b.id}" title="Rename branch">
                    ${Icons.get("edit", {size: 13})}
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    menu.querySelectorAll("[data-branch-select]").forEach(row => {
      row.addEventListener("click", (e) => {
        if(e.target.closest("[data-branch-edit]")) return;
        const bId = row.getAttribute("data-branch-select");
        if(bId && DB.setCurrentBranchId){
          DB.setCurrentBranchId(bId);
          // (2026-07-13) Close branch menu & restore topbar state; was partial hidden
          closeBranchDropdown();
          paintTopbar();
          const targetB = branches.find(b => String(b.id) === String(bId));
          Utils.toast(`Switched to ${targetB?.name || "branch"}.`, "success", 1200);
          rerenderCurrentView();
        }
      });
    });

    if(isAdmin){
      menu.querySelector("#btn-add-branch-quick")?.addEventListener("click", (e) => {
        e.stopPropagation();
        closeBranchDropdown();
        openAddBranchModal();
      });

      menu.querySelectorAll("[data-branch-edit]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const bId = btn.getAttribute("data-branch-edit");
          const target = branches.find(b => String(b.id) === String(bId));
          if(target){
            closeBranchDropdown();
            openEditBranchModal(target);
          }
        });
      });
    }
  }

  function openAddBranchModal(){
    Modalz.open({
      title: `${Icons.get("store", {size: 17})} Add New Branch`,
      body: `
        <div style="padding:4px 0 10px;">
          <div class="field" style="margin-bottom:12px;">
            <label style="font-weight:700;display:block;margin-bottom:6px;">Branch Name *</label>
            <input type="text" class="input" id="modal-branch-name" placeholder="e.g. Highway Branch" autofocus style="width:100%;height:40px;font-size:0.95rem;">
          </div>
          <div class="field" style="margin-bottom:12px;">
            <label style="font-weight:700;display:block;margin-bottom:6px;">Branch Code (Optional)</label>
            <input type="text" class="input" id="modal-branch-code" placeholder="e.g. HWY" style="width:100%;height:40px;font-size:0.95rem;text-transform:uppercase;">
          </div>
          <div class="field">
            <label style="font-weight:700;display:block;margin-bottom:6px;">Address / Location (Optional)</label>
            <input type="text" class="input" id="modal-branch-address" placeholder="e.g. Km 98 National Highway" style="width:100%;height:40px;font-size:0.95rem;">
          </div>
        </div>
      `,
      actions: [
        { label: "Cancel", cls: "btn-ghost" },
        {
          label: "Create Branch",
          cls: "btn-primary font-bold",
          onClick: () => {
            const nameInput = document.getElementById("modal-branch-name");
            const name = nameInput ? nameInput.value.trim() : "";
            if(!name){
              Utils.toast("Please enter a valid branch name.", "warn");
              return;
            }
            const code = document.getElementById("modal-branch-code")?.value.trim();
            const address = document.getElementById("modal-branch-address")?.value.trim();
            const created = DB.saveBranch ? DB.saveBranch({ name, code, address }) : null;
            if(created){
              DB.setCurrentBranchId(created.id);
              Modalz.close();
              paintTopbar();
              rerenderCurrentView();
              Utils.toast(`Branch "${created.name}" created and selected.`, "success");
              if(typeof Sync !== "undefined" && Sync.pushSnapshot) Sync.pushSnapshot(true).catch(e => console.warn(e));
            }
          }
        }
      ]
    });
  }

  function openEditBranchModal(branch){
    if(!branch) return;
    Modalz.open({
      title: `${Icons.get("edit", {size: 17})} Edit / Rename Branch`,
      body: `
        <div style="padding:4px 0 10px;">
          <div class="field" style="margin-bottom:12px;">
            <label style="font-weight:700;display:block;margin-bottom:6px;">Branch Name *</label>
            <input type="text" class="input" id="modal-edit-branch-name" value="${Utils.escapeHtml(branch.name || '')}" autofocus style="width:100%;height:40px;font-size:0.95rem;">
          </div>
          <div class="field" style="margin-bottom:12px;">
            <label style="font-weight:700;display:block;margin-bottom:6px;">Branch Code</label>
            <input type="text" class="input" id="modal-edit-branch-code" value="${Utils.escapeHtml(branch.code || '')}" style="width:100%;height:40px;font-size:0.95rem;text-transform:uppercase;">
          </div>
          <div class="field">
            <label style="font-weight:700;display:block;margin-bottom:6px;">Address / Location</label>
            <input type="text" class="input" id="modal-edit-branch-address" value="${Utils.escapeHtml(branch.address || '')}" style="width:100%;height:40px;font-size:0.95rem;">
          </div>
        </div>
      `,
      actions: [
        { label: "Cancel", cls: "btn-ghost" },
        {
          label: "Save Changes",
          cls: "btn-primary font-bold",
          onClick: () => {
            const nameInput = document.getElementById("modal-edit-branch-name");
            const name = nameInput ? nameInput.value.trim() : "";
            if(!name){
              Utils.toast("Branch name cannot be empty.", "warn");
              return;
            }
            const code = document.getElementById("modal-edit-branch-code")?.value.trim();
            const address = document.getElementById("modal-edit-branch-address")?.value.trim();
            const updated = DB.saveBranch ? DB.saveBranch({ ...branch, name, code, address }) : null;
            if(updated){
              Modalz.close();
              paintTopbar();
              rerenderCurrentView();
              Utils.toast(`Branch updated to "${updated.name}".`, "success");
              if(typeof Sync !== "undefined" && Sync.pushSnapshot) Sync.pushSnapshot(true).catch(e => console.warn(e));
            }
          }
        }
      ]
    });
  }

  // (2026-07-13) Check shift open/close timed reminders; was clock tick only
  function tickClock(){
    const now = new Date();
    const str = now.toLocaleString("en-PH", { weekday:"short", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" });
    const el = document.getElementById("topbar-clock");
    if(el) el.textContent = str;
    const posSub = document.getElementById("pos-view-sub");
    if(posSub){
      const user = Auth.currentUser();
      posSub.textContent = `${user?.name || "Cashier"} · ${now.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}, ${now.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;
    }
    if(typeof Shift !== "undefined" && Shift.checkReminders){
      Shift.checkReminders(now);
    }
  }

  // (2026-07-13) Full mobile navigation modal grid; was inaccessible modules
  function openMobileNav(){
    const role = Auth.currentUser()?.role || "cashier";
    const body = `
      <div class="mobile-nav-sheet">
        ${NAV_SECTIONS.map(sec => {
          const visible = sec.views.filter(v => v.roles.includes(role));
          if(!visible.length) return "";
          return `
            <div style="margin-bottom:14px;">
              <div style="font-size:.68rem;font-weight:800;letter-spacing:.06em;color:var(--ink-faint);text-transform:uppercase;margin-bottom:6px;">${sec.group}</div>
              <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;">
                ${visible.map(v => `
                  <button class="mobile-nav-tile ${v.id===currentView?'active':''}" data-mob-nav="${v.id}" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;border:1.5px solid ${v.id===currentView?'var(--brand)':'var(--line)'};background:${v.id===currentView?'var(--brand-tint)':'var(--paper-raised)'};color:${v.id===currentView?'var(--brand-deep)':'var(--ink)'};cursor:pointer;font-family:var(--font-body);text-align:left;">
                    <span style="color:${v.color||'inherit'};display:flex;align-items:center;">${Icons.get(v.ic,{size:20})}</span>
                    <div style="min-width:0;flex:1;">
                      <div style="font-weight:700;font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.label}</div>
                      ${v.id==="inventory"?`<span class="badge badge-rust text-xs" style="font-size:.60rem;padding:1px 4px;margin-top:2px;">${lowStockCount()} low stock</span>`:""}
                    </div>
                  </button>
                `).join("")}
              </div>
            </div>`;
        }).join("")}
      </div>`;
    const m = Modalz.open({
      title: `${Icons.get("grid",{size:18})} All Modules & Navigation`,
      body,
      actions: [{ label:"Close", cls:"btn-ghost" }]
    });
    m.querySelectorAll("[data-mob-nav]").forEach(btn => {
      btn.onclick = () => {
        Modalz.close();
        navigate(btn.dataset.mobNav);
      };
    });
  }

  // (2026-07-13) Define views in shell for bottom nav; was missing views var
  function shell(){
    const role = Auth.currentUser()?.role || "cashier";
    const views = accessibleViews();
    const root = document.getElementById("root");
    root.innerHTML = `
      <div id="app">
        <nav class="sidebar" style="overflow-y:auto;">
          <!-- (2026-07-13) Set BurgerJay brand logo & title; was Route 98 -->
          <div class="brand">
            <div class="brand-mark"><img src="burgerjay_logo.png?v=1" alt="BurgerJay" onerror="this.onerror=null;this.src='icon.png';"></div>
            <div class="brand-text"><strong id="topbar-title">BurgerJay</strong><span>POS & Inventory System</span></div>
          </div>
          ${NAV_SECTIONS.map(sec => {
            const visible = sec.views.filter(v => v.roles.includes(role));
            if(!visible.length) return "";
            return `
              <div class="nav-group" style="margin-bottom:12px;">
                <div class="nav-label" style="font-size:.66rem;font-weight:800;letter-spacing:.08em;color:#94A3B8;text-transform:uppercase;padding:4px 14px 6px;">${sec.group}</div>
                ${visible.map(v => `
                  <button class="nav-btn" data-nav="${v.id}" style="display:flex;align-items:center;gap:10px;">
                    <span class="ic" style="color:${v.color||'inherit'};display:flex;align-items:center;">${Icons.get(v.ic,{size:17})}</span>
                    <span>${v.label}</span>
                    ${v.id==="inventory"?`<span class="badge-dot" id="inv-badge-dot" style="display:none;">0</span>`:""}
                  </button>
                `).join("")}
              </div>
            `;
          }).join("")}
          <div class="sidebar-foot">
            <div class="sync-pill" id="sync-pill"><span class="sync-dot"></span><span class="lbl">Local only</span></div>
          </div>
        </nav>

        <div class="main-col">
          <header class="topbar">
            <!-- (2026-07-13) Add mobile menu button in topbar; was desktop title only -->
            <button class="icon-btn mobile-menu-btn" id="btn-topbar-menu" title="Navigation Menu" style="display:none;margin-right:6px;flex-shrink:0;">${Icons.get("menu",{size:18})}</button>
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <h1 id="topbar-title-view">${VIEWS.find(v=>v.id===currentView)?.label || ""}</h1>
              <!-- (2026-07-13) Topbar shift status indicator badge; was missing -->
              <button type="button" id="topbar-shift-indicator" class="topbar-shift-badge" title="Shift status"></button>
            </div>
            <span class="topbar-spacer"></span>
            <span class="topbar-clock" id="topbar-clock"></span>
            <!-- (2026-07-13) Add mobile branch backdrop overlay; was menu only -->
            <div class="branch-selector-wrap" id="branch-selector-wrap">
              <button type="button" class="branch-pill-btn" id="btn-branch-selector" title="Select or manage branch">
                <span class="branch-av">${Icons.get("store", {size: 13})}</span>
                <span class="branch-name" id="topbar-branch-name">Main Branch</span>
                <span class="branch-arrow">${Icons.get("chevron-down", {size: 11})}</span>
              </button>
              <div class="branch-dropdown-backdrop hidden" id="branch-dropdown-backdrop"></div>
              <div class="branch-dropdown-menu hidden" id="branch-dropdown-menu"></div>
            </div>
            <button class="icon-btn" id="theme-toggle-btn" title="Toggle theme"></button>
            <div class="user-chip" id="user-chip">
              <span class="av" id="user-chip-av"></span>
              <span id="user-chip-label"></span>
            </div>
          </header>
          <main class="view" id="view-root"></main>
        </div>
      </div>

      <nav class="bottom-nav">
        <!-- (2026-07-13) Render 6 bottom nav items; was 5 tabs with more -->
        <div class="bottom-nav-inner">
          ${BOTTOM_NAV_IDS.map(id => {
            const v = views.find(item => item.id === id);
            if(!v) return "";
            /* (2026-07-13) Set bottom nav labels for Register and Kitchen; was Store */
            const lbl = v.id === "dashboard" ? "Dashboard" : (v.id === "kitchen" ? "Kitchen" : (v.id === "pos" ? "Register" : v.label.split(" ")[0]));
            return `
            <button class="bn-btn" data-nav="${v.id}" title="${v.label}">
              <!-- (2026-07-13) Nav icons gray when inactive; was colored -->
              <span class="ic" style="position:relative;">${Icons.get(v.ic,{size:20})}${v.id==="inventory"?`<span id="inv-badge-dot-bn" style="display:none;position:absolute;top:-2px;right:-2px;width:6px;height:6px;border-radius:50%;background:var(--danger);"></span>`:""}</span>
              <span>${lbl}</span>
            </button>`;
          }).join("")}
        </div>
      </nav>

      <div id="toast-stack"></div>`;

    document.querySelectorAll(".nav-btn, .bn-btn[data-nav]").forEach(b => b.onclick = () => navigate(b.dataset.nav));
    // (2026-07-13) Toggle tablet sidebar on menu click; was openMobileNav only
    document.getElementById("btn-topbar-menu")?.addEventListener("click", () => {
      if(window.innerWidth >= 768){
        document.querySelector(".sidebar")?.classList.toggle("tablet-hidden");
      } else {
        openMobileNav();
      }
    });
    // (2026-07-13) Toggle tablet sidebar on brand logo; was non-clickable
    document.querySelector(".sidebar .brand")?.addEventListener("click", () => {
      if(window.innerWidth >= 768){
        const sb = document.querySelector(".sidebar");
        if(sb){
          sb.classList.remove("tablet-hidden");
          sb.classList.toggle("tablet-expanded");
        }
      }
    });
    document.getElementById("btn-bn-more")?.addEventListener("click", openMobileNav);
    // (2026-07-13) Click shift indicator to open shift management; was no handler
    document.getElementById("topbar-shift-indicator")?.addEventListener("click", () => navigate("shift"));
    // (2026-07-13) Guard logout only for shift owner on this device; was all users
    document.getElementById("user-chip").onclick = () => {
      const u = Auth.currentUser();
      const activeShift = (typeof Shift !== "undefined" && Shift.getActiveShift) ? Shift.getActiveShift() : (DB.getShift?.()?.status === "open" ? DB.getShift() : null);
      if(activeShift && activeShift.status === "open"){
        // (2026-07-13) Guard logout only for shift cashier; was any admin
        const isSameCashier = u && u.name && activeShift.cashier && u.name.trim().toLowerCase() === activeShift.cashier.trim().toLowerCase();
        if(isSameCashier){
          Modalz.alert({
            title: "Active Shift In Progress",
            message: "You must close your shift before logging out. Please close shift in Shift Management."
          });
          return;
        }
      }
      Modalz.confirm({ title:"Log out?", message:`Sign out ${u?.name || "user"}?`, onConfirm: () => Auth.logout() });
    };
    const themeBtn = document.getElementById("theme-toggle-btn");
    const paintThemeIcon = () => { themeBtn.innerHTML = Icons.get(document.documentElement.dataset.theme === "dark" ? "sun" : "moon", { size:16 }); };
    themeBtn.onclick = () => {
      const s = DB.getSettings();
      s.theme = s.theme === "dark" ? "light" : "dark";
      DB.setSettings(s);
      document.documentElement.dataset.theme = s.theme;
      paintThemeIcon();
    };
    paintThemeIcon();

    // (2026-07-13) Manage branch open state on click & backdrop; was menu-only
    document.getElementById("btn-branch-selector")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = document.getElementById("branch-dropdown-menu");
      const backdrop = document.getElementById("branch-dropdown-backdrop");
      if(menu){
        const isHidden = menu.classList.contains("hidden");
        if(isHidden){
          paintBranchDropdown();
          menu.classList.remove("hidden");
          backdrop?.classList.remove("hidden");
          document.getElementById("branch-selector-wrap")?.classList.add("open");
          document.querySelector(".topbar")?.classList.add("branch-open");
        } else {
          closeBranchDropdown();
        }
      }
    });
    document.getElementById("branch-dropdown-backdrop")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeBranchDropdown();
    });
    document.addEventListener("click", (e) => {
      const wrap = document.getElementById("branch-selector-wrap");
      if(wrap && !wrap.contains(e.target)){
        closeBranchDropdown();
      }
    });

    paintTopbar();
    tickClock();
    setInterval(tickClock, 1000);
    Sync.paintStatus();
  }

  function boot(){
    document.documentElement.dataset.theme = DB.getSettings().theme || "light";
    shell();
    const views = accessibleViews();
    const isMobile = (typeof MobileUtils !== "undefined" && MobileUtils.isMobile()) || window.innerWidth <= 768 || Boolean(window.Capacitor?.isNativePlatform?.());
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const isShiftTime = (h === 7) || (h === 8 && m <= 30);
    // (2026-07-13) Set shift 7-8:30am else minimart pos on mobile; was remembered
    if(isMobile){
      currentView = (isShiftTime && views.find(v => v.id === "shift")) ? "shift" : (views.find(v => v.id === "pos")?.id || "pos");
    } else {
      const remembered = DB.getSettings().lastView;
      if(remembered && !["dashboard","venue","restaurant"].includes(remembered) && views.find(v => v.id === remembered)) currentView = remembered;
      else currentView = views.find(v => v.id === "pos")?.id || views[0]?.id || "pos";
    }
    navigate(currentView);
  }

  // (2026-07-13) Init app without pull-to-refresh listeners; was initPullToRefresh
  function init(){
    DB.init();
    Auth.restoreSession();
    Sync.init();
    Scanner.init();
    // (2026-07-13) Subscribe to cloud branch updates; was single store
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.subscribeToBranches){
      RealtimeSync.subscribeToBranches(() => paintTopbar());
    }
    if(Auth.currentUser()) boot();
    else Auth.render();
  }

  // (2026-07-13) Export paintNav for live badge refreshes; was omitted
  return { init, boot, navigate, rerenderCurrentView, paintTopbar, paintNav, getCurrentView: () => currentView, get currentView() { return currentView; } };
})();

// (2026-07-13) Horizontal mouse wheel scroll for category-chips; was default vertical
document.addEventListener("wheel", (e) => {
  const chips = e.target.closest(".category-chips");
  if(chips && e.deltaY !== 0){
    e.preventDefault();
    e.stopPropagation();
    chips.scrollLeft += e.deltaY;
  }
}, { passive: false, capture: true });

// ✅ Desktop-only drag-to-scroll for category-chips (skip on mobile/APK)
(function initCategoryChipsDragScroll(){
  // ✅ Check if mobile/Capacitor - skip drag-scroll entirely on mobile
  const isMobileContext = () =>
    Boolean(window.Capacitor?.isNativePlatform?.()) ||
    window.matchMedia("(max-width: 768px)").matches ||
    /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobileContext()) {
    console.log("✅ Mobile/Capacitor detected - skipping drag-scroll listeners");
    // Still setup gradient fade without drag handlers
    function updateGradientFade(chips){
      if(!chips) return;
      const isAtEnd = chips.scrollLeft + chips.clientWidth >= chips.scrollWidth - 5;
      chips.classList.toggle("scrolled-end", isAtEnd);
    }

    const sharedResizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(entries => {
      for(const entry of entries) updateGradientFade(entry.target);
    }) : null;

    const observer = new MutationObserver(() => {
      document.querySelectorAll(".category-chips, .rpt-subnav-tabs").forEach(chips => {
        if(chips.dataset.dragScrollInit) return;
        chips.dataset.dragScrollInit = "true";
        updateGradientFade(chips);
        chips.addEventListener("scroll", () => updateGradientFade(chips), { passive: true });
        sharedResizeObserver?.observe(chips);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    document.querySelectorAll(".category-chips, .rpt-subnav-tabs").forEach(chips => {
      updateGradientFade(chips);
      chips.addEventListener("scroll", () => updateGradientFade(chips), { passive: true });
    });
    return; // ✅ EXIT - no drag handlers
  }

  // ✅ Desktop only: full drag-scroll implementation
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;
  let targetChips = null;
  let hasDragged = false;

  document.addEventListener("mousedown", (e) => {
    hasDragged = false;
    if(e.button !== 0) return;
    const chips = e.target.closest(".category-chips");
    if(!chips) return;

    isDragging = true;
    targetChips = chips;
    startX = e.pageX - chips.offsetLeft;
    scrollLeft = chips.scrollLeft;
    chips.style.scrollBehavior = "auto";
  });

  document.addEventListener("mousemove", (e) => {
    if(!isDragging || !targetChips) return;
    e.preventDefault();
    const x = e.pageX - targetChips.offsetLeft;
    const walk = (x - startX) * 1.5;

    if(Math.abs(walk) > 5){
      hasDragged = true;
    }

    targetChips.scrollLeft = scrollLeft - walk;
  });

  document.addEventListener("mouseup", (e) => {
    if(isDragging && targetChips){
      targetChips.style.scrollBehavior = "";
      if(hasDragged){
        e.preventDefault();
        e.stopPropagation();
      }
    }
    isDragging = false;
    targetChips = null;
    hasDragged = false;
  }, true);

  document.addEventListener("click", (e) => {
    if(hasDragged && e.target.closest(".category-chips .chip")){
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
      return false;
    }
  }, true);

  document.addEventListener("mouseleave", () => {
    if(isDragging && targetChips){
      targetChips.style.scrollBehavior = "";
    }
    isDragging = false;
    targetChips = null;
    hasDragged = false;
  });

  // Update gradient fade visibility on scroll
  function updateGradientFade(chips){
    if(!chips) return;
    const isAtEnd = chips.scrollLeft + chips.clientWidth >= chips.scrollWidth - 5;
    chips.classList.toggle("scrolled-end", isAtEnd);
  }

  const sharedResizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(entries => {
    for(const entry of entries) updateGradientFade(entry.target);
  }) : null;

  const observer = new MutationObserver(() => {
    document.querySelectorAll(".category-chips, .rpt-subnav-tabs").forEach(chips => {
      if(chips.dataset.dragScrollInit) return;
      chips.dataset.dragScrollInit = "true";
      updateGradientFade(chips);
      chips.addEventListener("scroll", () => updateGradientFade(chips), { passive: true });
      sharedResizeObserver?.observe(chips);
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  
  document.querySelectorAll(".category-chips, .rpt-subnav-tabs").forEach(chips => {
    updateGradientFade(chips);
    chips.addEventListener("scroll", () => updateGradientFade(chips), { passive: true });
  });
})();
// (2026-07-13) Attach App to window for global cross-module access; was local const
if(typeof window !== "undefined") window.App = App;

document.addEventListener("DOMContentLoaded", App.init);
