// ============================================================
// db.js — localStorage-first data layer.
// Every write lands here FIRST. Firestore sync (sync.js) only
// ever pushes a snapshot of what's already safely on disk.
// ============================================================
const DB = (() => {
  // (2026-07-13) Set BurgerJay storage namespace; was minimart mm_
  const NS = "bj_"; // burgerjay namespace
  // (2026-07-13) Empty default cashiers for BurgerJay; was Rosella and Niño
  const DEFAULT_CASHIERS = [];
  const KEYS = {
    products: NS+"products", categories: NS+"categories", sales: NS+"sales",
    fuelSales: NS+"fuelSales", fuelConfig: NS+"fuelConfig", settings: NS+"settings",
    users: NS+"users", cashiers: NS+"cashiers", heldSales: NS+"heldSales", venueLeads: NS+"venueLeads",
    stockLog: NS+"stockLog", restockLogs: NS+"restockLogs", physicalAudits: NS+"physicalAudits", shift: NS+"shift", syncMeta: NS+"syncMeta",
    currentCart: NS+"currentCart", expenses: NS+"expenses", bookings: NS+"bookings",
    restaurantBookings: NS+"restaurantBookings", fuelDeliveries: NS+"fuelDeliveries", backups: NS+"backups",
    voidLogs: NS+"voidLogs", offlineQueue: NS+"offlineQueue", customItems: NS+"customItems", dayBalances: NS+"dayBalances",
    deletedSaleIds: NS+"deletedSaleIds", // (2026-09-24) Track deleted sale IDs to prevent re-sync
    // (2026-07-13) Add deletedProductIds tombstone key; was untracked deletes
    deletedProductIds: NS+"deletedProductIds",
    // (2026-07-13) Add deletedShiftLogIds tombstone; was unpersisted
    shiftLogs: NS+"shiftLogs", deletedShiftLogIds: NS+"deletedShiftLogIds", syncBaseline: NS+"syncBaseline",
    // (2026-07-13) Multi-branch support keys; was single store
    branches: NS+"branches", currentBranchId: NS+"currentBranchId",
    // (2026-07-13) Add kitchenOrders storage key; was missing
    kitchenOrders: NS+"kitchenOrders",
    // (2026-07-13) Product trash bin; 30-day soft-delete before permanent removal
    trash: NS+"trash"
  };

  // (2026-07-13) Set BurgerJay IndexedDB store name; was minimart_pos_idb
  const IDB_NAME = "burgerjay_pos_idb";
  const IDB_STORE = "kv_store";
  const IDB_ONLY_KEYS = new Set([KEYS.backups, KEYS.syncBaseline, KEYS.offlineQueue, KEYS.trash]);
  let idbInstance = null;

  function openIDB(){
    if(idbInstance) return Promise.resolve(idbInstance);
    if(typeof indexedDB === "undefined") return Promise.resolve(null);
    return new Promise((resolve) => {
      try{
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if(!db.objectStoreNames.contains(IDB_STORE)){
            db.createObjectStore(IDB_STORE);
          }
        };
        req.onsuccess = () => { idbInstance = req.result; resolve(idbInstance); };
        req.onerror = () => { resolve(null); };
      }catch(e){ resolve(null); }
    });
  }

  function idbGet(k){
    return openIDB().then(db => {
      if(!db) return null;
      return new Promise((resolve) => {
        try{
          const tx = db.transaction(IDB_STORE, "readonly");
          const req = tx.objectStore(IDB_STORE).get(k);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
        }catch(e){ resolve(null); }
      });
    });
  }

  function idbSet(k, v){
    return openIDB().then(db => {
      if(!db) return false;
      return new Promise((resolve) => {
        try{
          const tx = db.transaction(IDB_STORE, "readwrite");
          tx.objectStore(IDB_STORE).put(v, k);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        }catch(e){ resolve(false); }
      });
    });
  }

  function idbLoadAll(){
    return openIDB().then(db => {
      if(!db) return;
      return new Promise((resolve) => {
        try{
          const tx = db.transaction(IDB_STORE, "readonly");
          const req = tx.objectStore(IDB_STORE).openCursor();
          req.onsuccess = (e) => {
            const cursor = e.target.result;
            if(cursor){
              const k = cursor.key;
              const v = cursor.value;
              if(!memCache.has(k) || IDB_ONLY_KEYS.has(k) || k === KEYS.sales){
                memCache.set(k, v);
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
          req.onerror = () => resolve();
        }catch(e){ resolve(); }
      });
    });
  }

  function pruneLocalStorage(){
    try{
      IDB_ONLY_KEYS.forEach(k => {
        try{ localStorage.removeItem(k); }catch(e){}
      });
      const rawSales = localStorage.getItem(KEYS.sales);
      if(rawSales){
        try{
          const s = JSON.parse(rawSales);
          if(Array.isArray(s) && s.length > 50){
            localStorage.setItem(KEYS.sales, JSON.stringify(s.slice(0, 50)));
          }
        }catch(e){}
      }
      [KEYS.stockLog, KEYS.restockLogs, KEYS.voidLogs].forEach(k => {
        const raw = localStorage.getItem(k);
        if(raw){
          try{
            const arr = JSON.parse(raw);
            if(Array.isArray(arr) && arr.length > 50){
              localStorage.setItem(k, JSON.stringify(arr.slice(0, 50)));
            }
          }catch(e){}
        }
      });
    }catch(e){}
  }

  function migrateAndPruneStorage(){
    try{
      IDB_ONLY_KEYS.forEach(k => {
        const raw = localStorage.getItem(k);
        if(raw !== null && raw !== undefined){
          try{
            const parsed = JSON.parse(raw);
            memCache.set(k, parsed);
            idbSet(k, parsed);
          }catch(e){
            memCache.set(k, raw);
            idbSet(k, raw);
          }
          localStorage.removeItem(k);
        }
      });
      const rawSales = localStorage.getItem(KEYS.sales);
      if(rawSales){
        try{
          const s = JSON.parse(rawSales);
          if(Array.isArray(s) && s.length){
            idbSet(KEYS.sales, s);
            if(s.length > 150){
              localStorage.setItem(KEYS.sales, JSON.stringify(s.slice(0, 150)));
            }
          }
        }catch(e){}
      }
      [KEYS.stockLog, KEYS.restockLogs, KEYS.voidLogs].forEach(k => {
        const raw = localStorage.getItem(k);
        if(raw){
          try{
            const arr = JSON.parse(raw);
            if(Array.isArray(arr) && arr.length){
              idbSet(k, arr);
              if(arr.length > 100){
                localStorage.setItem(k, JSON.stringify(arr.slice(0, 100)));
              }
            }
          }catch(e){}
        }
      });
    }catch(e){}
  }

  const memCache = new Map();
  function invalidateCache(){
    memCache.clear();
    cachedProcessedSales = null;
    cachedProducts = null;
    cachedCategories = null;
  }

  // Eagerly migrate and load IDB
  migrateAndPruneStorage();
  idbLoadAll();

  // (2026-07-13) BroadcastChannel & storage event for split screen; was storage only
  let crossTabSync = null;
  if(typeof window !== "undefined"){
    const onRemoteChange = (key) => {
      if(key && IDB_ONLY_KEYS.has(key)){
        idbGet(key).then(val => {
          if(val !== null && val !== undefined) memCache.set(key, val);
          if(typeof App !== "undefined" && App.rerenderCurrentView) App.rerenderCurrentView();
        });
        return;
      }
      invalidateCache();
      if(typeof App !== "undefined" && App.rerenderCurrentView) App.rerenderCurrentView();
      if(key === KEYS.products || !key){
        // (2026-07-13) Guard remote render when modules mounted; was unguarded
        if(typeof Inventory !== "undefined" && Inventory.renderTable && document.getElementById("inv-tbody")) Inventory.renderTable();
        if(typeof POS !== "undefined" && POS.renderCatalog && document.getElementById("pos-catalog")) POS.renderCatalog();
      }
    };
    window.addEventListener("storage", (e) => onRemoteChange(e.key));
    if(typeof BroadcastChannel !== "undefined"){
      // (2026-07-13) Isolate BurgerJay BroadcastChannel from Route98; was mm_
      crossTabSync = new BroadcastChannel("bj_split_screen_channel");
      crossTabSync.onmessage = (e) => onRemoteChange(e.data?.key);
    }
  }
  let cachedProcessedSales = null;
  let cachedProducts = null;
  let cachedCategories = null;
  let isSyncRestoring = false;

  // (2026-07-13) Read from memCache, fallback to localStorage; was skipping cache
  function read(key, fallback = null){
    if(memCache.has(key)) return memCache.get(key);
    try{
      const raw = localStorage.getItem(key);
      if(raw === null || raw === undefined) return fallback;
      let val;
      try{
        val = JSON.parse(raw);
      }catch(_err){
        val = raw;
      }
      memCache.set(key, val);
      return val;
    }catch(e){ console.warn("DB read failed", key, e); return fallback; }
  }
  // (2026-07-13) Persist to IndexedDB & prune localStorage; was localStorage only
  function write(key, value, silent = false){
    memCache.set(key, value);
    if(key === KEYS.sales) cachedProcessedSales = null;
    if(key === KEYS.products) cachedProducts = null;
    if(key === KEYS.categories) cachedCategories = null;

    idbSet(key, value);

    if(IDB_ONLY_KEYS.has(key)){
      try{ localStorage.removeItem(key); }catch(e){}
    } else {
      let lsVal = value;
      if(key === KEYS.sales && Array.isArray(value) && value.length > 150){
        lsVal = value.slice(0, 150);
      } else if((key === KEYS.stockLog || key === KEYS.restockLogs || key === KEYS.voidLogs) && Array.isArray(value) && value.length > 100){
        lsVal = value.slice(0, 100);
      }
      try{
        localStorage.setItem(key, JSON.stringify(lsVal));
      }catch(e){
        pruneLocalStorage();
        try{
          if(key === KEYS.sales && Array.isArray(value) && value.length > 50){
            lsVal = value.slice(0, 50);
          }
          localStorage.setItem(key, JSON.stringify(lsVal));
        }catch(_err){}
      }
    }
    // (2026-07-13) Post message to crossTabSync channel; was local storage only
    crossTabSync?.postMessage({ key, ts: Date.now() });
    document.dispatchEvent(new CustomEvent("mm:dirty", { detail:{ key, silent: silent || isSyncRestoring } }));
    return value;
  }

  // ---------- category → icon (used as a product image fallback tile) ----------
  const CATEGORY_ICON = {
    "Snacks":"package", "Beverages":"droplet", "Canned Goods":"box",
    "Personal Care":"shield-check", "Household":"home", "Cigarettes & Liquor":"tag",
    "Rice & Staples":"package", "Frozen":"box", "Bread & Bakery":"package", "Misc":"tag"
  };
  function categoryIcon(cat){ return CATEGORY_ICON[cat] || "package"; }

  // ---------- defaults ----------
  // (2026-07-13) Seed default BurgerJay categories including DRINKS; was 5 cats
  const DEFAULT_CATEGORIES = ["BURGERS", "COMBOS", "FRIES", "HOTDOGS", "DRINKS", "ADD-ONS"];

  // (2026-07-13) Set default settings for BurgerJay; was Route 98
  const DEFAULT_SETTINGS = {
    businessName: "BurgerJay",
    address: "Cabangcalan, Dakit, Bogo City, Cebu",
    tin: "811-387-946-00000",
    receiptFooter: "Salamat sa inyong pagbisita sa BurgerJay! Come again",
    currencySymbol: "₱",
    vatEnabled: true,
    vatRate: 12,
    theme: "light",
    lowStockThreshold: 5,
    // (2026-07-13) Set BurgerJay burgerjay-bogo Firebase config; was blank/route98
    firebaseConfig: {
      apiKey: "AIzaSyBekg9E5Mf73kK74_kpyd8DN4Nd4OcliKo",
      authDomain: "burgerjay-bogo.firebaseapp.com",
      databaseURL: "https://burgerjay-bogo-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "burgerjay-bogo",
      storageBucket: "burgerjay-bogo.firebasestorage.app",
      messagingSenderId: "392777396149",
      appId: "1:392777396149:web:f1ff3febefd58cb43333fc",
      measurementId: "G-N6YRDNVZ97"
    },
    autoSync: true,
    // (2026-07-13) Default autoPrintReceipt to true; was unset in defaults
    autoPrintReceipt: true,
    // (2026-07-13) Add shift reminder configuration defaults; was none
    shiftRemindersEnabled: true,
    shiftReminderOpenTime: "08:10",
    shiftReminderCloseTime: "17:00",
    lastView: "pos"
  };

  // (2026-07-13) Keep only default Owner/Admin account; removed Route98 staff
  const DEFAULT_USERS = [
    { id:"u_admin", name:"Owner/Admin", role:"admin", pin:"9898" }
  ];

  // (2026-07-13) Set Regular (Gas) fuel name & changeable tanker cost; was Gasoline
  const DEFAULT_FUEL_CONFIG = {
    pumps: [
      { id:"pump1", label:"Pump 1", fuelType:"gasoline" },
      { id:"pump2", label:"Pump 2", fuelType:"diesel" },
      { id:"pump3", label:"Pump 3", fuelType:"premium" }
    ],
    fuels: {
      gasoline: { name:"Regular (Gas)", price:71.50, cost:65.00, tank:7200, capacity:10000, lowLevel:2000, color:"#10B981", cls:"fuel-gasoline", priceLog:[] },
      diesel:   { name:"Diesel (Auto Diesel)", price:64.50, cost:65.00, tank:8100, capacity:10000, lowLevel:2000, color:"#F59E0B", cls:"fuel-diesel", priceLog:[] },
      premium:  { name:"Premium (RON97)",     price:76.50, cost:65.00, tank:6400, capacity:10000, lowLevel:2000, color:"#EF4444", cls:"fuel-premium", priceLog:[] }
    }
  };

  // (2026-07-13) Import BurgerJay menu items from CATALOG_SEED; was blank reset
  function ensureBurgerJayCatalogSeeded(){
    if(typeof CATALOG_SEED === "undefined" || !Array.isArray(CATALOG_SEED.products) || !CATALOG_SEED.products.length) return false;
    const curProds = read(KEYS.products, []) || [];
    const curCats = read(KEYS.categories, []) || [];
    const deletedSet = new Set((read(KEYS.deletedProductIds, []) || []).map(x => String(x || "").trim()));
    const prodMap = new Map();
    curProds.forEach(p => { if(p && p.id) prodMap.set(String(p.id), p); });
    let changed = false;
    const isFirstImport = !localStorage.getItem(NS + "assets_menu_imported_v1");
    CATALOG_SEED.products.forEach(seedItem => {
      const sid = String(seedItem.id);
      if(!isFirstImport && deletedSet.has(sid)) return;
      const existing = prodMap.get(sid);
      if(!existing){
        prodMap.set(sid, { ...seedItem });
        changed = true;
      } else if(isFirstImport || (!existing.imageUrl && seedItem.imageUrl) || ((!Array.isArray(existing.choices) || !existing.choices.length) && Array.isArray(seedItem.choices) && seedItem.choices.length)){
        prodMap.set(sid, {
          ...existing,
          ...seedItem,
          stock: existing.stock ?? seedItem.stock,
          choices: (Array.isArray(existing.choices) && existing.choices.length) ? existing.choices : (seedItem.choices || [])
        });
        changed = true;
      }
    });
    const catSet = new Set(curCats.map(c => String(c || "").trim().toUpperCase()).filter(Boolean));
    (CATALOG_SEED.categories || DEFAULT_CATEGORIES).forEach(c => {
      const uc = String(c || "").trim().toUpperCase();
      if(uc && !catSet.has(uc)){
        catSet.add(uc);
        changed = true;
      }
    });
    if(changed || isFirstImport){
      if(isFirstImport){
        write(KEYS.deletedProductIds, []);
        try{ localStorage.setItem(NS + "assets_menu_imported_v1", "true"); }catch(e){}
      }
      write(KEYS.categories, Array.from(catSet));
      write(KEYS.products, Array.from(prodMap.values()));
      return true;
    }
    return false;
  }

  // (2026-07-13) Seed realistic 7-day BurgerJay sales, OPEX, shifts & KDS orders for demo; was blank
  function ensureBurgerJayDemoDataSeeded(){
    const demoFlagKey = NS + "demo_week_seeded_v2";
    const existingSales = read(KEYS.sales, []) || [];
    const existingKds = read(KEYS.kitchenOrders, []) || [];
    if(localStorage.getItem(demoFlagKey) && existingSales.length > 0 && existingKds.length > 0){
      return false;
    }
    const prods = getProducts();
    const findProd = (id, fallbackName) => prods.find(p => p && (p.id === id || p.name === fallbackName)) || (typeof CATALOG_SEED !== "undefined" ? CATALOG_SEED.products.find(p => p.id === id) : null);

    const pClassic   = findProd("BJ-BRG-001", "ChixBurg Classic") || { id:"BJ-BRG-001", name:"ChixBurg Classic", category:"BURGERS", price:79, cost:39.5, unit:"pc", imageUrl:"" };
    const pCheezo    = findProd("BJ-BRG-002", "ChixBurg Cheezo") || { id:"BJ-BRG-002", name:"ChixBurg Cheezo", category:"BURGERS", price:89, cost:44.5, unit:"pc", imageUrl:"" };
    const pFresno    = findProd("BJ-BRG-003", "ChixBurg Fresno") || { id:"BJ-BRG-003", name:"ChixBurg Fresno", category:"BURGERS", price:99, cost:49.5, unit:"pc", imageUrl:"" };
    const pHawaiian  = findProd("BJ-BRG-004", "Hawaiian Blast!") || { id:"BJ-BRG-004", name:"Hawaiian Blast!", category:"BURGERS", price:130, cost:65, unit:"pc", imageUrl:"assets/Hawaiian Blast.png" };
    const pEggChamp  = findProd("BJ-BRG-005", "Egg Champ") || { id:"BJ-BRG-005", name:"Egg Champ", category:"BURGERS", price:130, cost:65, unit:"pc", imageUrl:"assets/Egg Champ.png" };
    const pBacon     = findProd("BJ-BRG-006", "Baconarian") || { id:"BJ-BRG-006", name:"Baconarian", category:"BURGERS", price:150, cost:75, unit:"pc", imageUrl:"assets/Baconarian.png" };
    const pTwin      = findProd("BJ-BRG-007", "Twin Pounder") || { id:"BJ-BRG-007", name:"Twin Pounder", category:"BURGERS", price:170, cost:85, unit:"pc", imageUrl:"assets/Twin Pounder.png" };
    const pMagnum    = findProd("BJ-BRG-008", "Magnum Slam!") || { id:"BJ-BRG-008", name:"Magnum Slam!", category:"BURGERS", price:200, cost:100, unit:"pc", imageUrl:"assets/Magnum Slam.png" };
    const pTriple    = findProd("BJ-BRG-009", "Triple Decker") || { id:"BJ-BRG-009", name:"Triple Decker", category:"BURGERS", price:230, cost:115, unit:"pc", imageUrl:"assets/Triple Decker.png" };
    const pCheezdog  = findProd("BJ-HDG-001", "Cheezdog") || { id:"BJ-HDG-001", name:"Cheezdog", category:"HOTDOGS", price:80, cost:40, unit:"pc", imageUrl:"assets/Cheezdog.png" };
    const pFries     = findProd("BJ-FRS-001", "Fries") || { id:"BJ-FRS-001", name:"Fries", category:"FRIES", price:50, cost:25, unit:"order", imageUrl:"assets/Fries.png" };
    const pBaconFry  = findProd("BJ-FRS-002", "Bacon with Fries") || { id:"BJ-FRS-002", name:"Bacon with Fries", category:"FRIES", price:150, cost:75, unit:"order", imageUrl:"assets/Bacon with Fries.png" };
    const pAddCombo  = findProd("BJ-ADD-001", "Add Combo Meal (Fries & Drink)") || { id:"BJ-ADD-001", name:"Add Combo Meal (Fries & Drink)", category:"ADD-ONS", price:70, cost:35, unit:"set", imageUrl:"" };
    const pCombo1    = findProd("BJ-CMB-001", "Combo 1 (Cheezdog + Fries & Drink)") || { id:"BJ-CMB-001", name:"Combo 1 (Cheezdog + Fries & Drink)", category:"COMBOS", price:100, cost:50, unit:"combo", imageUrl:"assets/Combo1.png" };
    const pCombo2    = findProd("BJ-CMB-002", "Combo 2 (Meat Burger + Fries & Drink)") || { id:"BJ-CMB-002", name:"Combo 2 (Meat Burger + Fries & Drink)", category:"COMBOS", price:130, cost:65, unit:"combo", imageUrl:"assets/Combo2.png" };
    const pCombo3    = findProd("BJ-CMB-003", "Combo 3 (Egg Champ + Fries & Drink)") || { id:"BJ-CMB-003", name:"Combo 3 (Egg Champ + Fries & Drink)", category:"COMBOS", price:170, cost:85, unit:"combo", imageUrl:"assets/Combo3.png" };
    const pCombo4    = findProd("BJ-CMB-004", "Combo 4 (Twin Pounder + Fries & Drink)") || { id:"BJ-CMB-004", name:"Combo 4 (Twin Pounder + Fries & Drink)", category:"COMBOS", price:220, cost:110, unit:"combo", imageUrl:"assets/Combo4.png" };

    const makeLine = (p, qty, notes = "") => ({
      productId: p.id,
      name: notes ? `${p.name} (${notes})` : p.name,
      price: Number(p.price),
      cost: Number(p.cost),
      qty: Number(qty),
      unit: p.unit || "pc",
      unitType: "piece",
      category: p.category || "BURGERS",
      imageUrl: p.imageUrl || "",
      notes
    });

    const basketTemplates = [
      [makeLine(pCombo4, 2, "Iced Tea, Cheese"), makeLine(pBaconFry, 1, "Cheese")],
      [makeLine(pCombo2, 2, "Coke, BBQ"), makeLine(pCheezdog, 1)],
      [makeLine(pMagnum, 1, "Extra Cheese"), makeLine(pAddCombo, 1, "Blue Lemonade, Sour Cream"), makeLine(pCombo1, 1, "Sprite, Cheese")],
      [makeLine(pTriple, 1), makeLine(pCombo3, 1, "Cucumber, Cheese")],
      [makeLine(pBacon, 2), makeLine(pFries, 2, "Cheese")],
      [makeLine(pHawaiian, 2), makeLine(pAddCombo, 2, "Iced Tea, BBQ")],
      [makeLine(pCombo3, 2, "Blue Lemonade, Cheese"), makeLine(pCheezo, 1)],
      [makeLine(pTwin, 1), makeLine(pEggChamp, 1), makeLine(pBaconFry, 1, "Sour Cream")],
      [makeLine(pCombo1, 3, "Iced Tea, Cheese")],
      [makeLine(pFresno, 2), makeLine(pClassic, 1), makeLine(pFries, 2, "BBQ")],
      [makeLine(pCombo4, 1, "Coke, Sour Cream"), makeLine(pCombo2, 1, "Sprite, Cheese")],
      [makeLine(pMagnum, 2), makeLine(pBaconFry, 1, "Cheese"), makeLine(pAddCombo, 2, "Cucumber, BBQ")]
    ];

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const demoSales = [];
    const demoShiftLogs = [];
    let txnCounter = 1;

    // Generate realistic orders across the past 7 days (6 days ago -> today)
    const dailyOrderCounts = [11, 10, 12, 11, 13, 14, 9]; // 80 orders total across 7 days
    for(let daysAgo = 6; daysAgo >= 0; daysAgo--){
      const dayDate = new Date(todayStart.getTime() - daysAgo * 86400000);
      const countForDay = dailyOrderCounts[6 - daysAgo] || 11;
      let dayCashTotal = 0;
      let dayGCashTotal = 0;
      let dayCardTotal = 0;

      for(let i = 0; i < countForDay; i++){
        // Spread orders between 10:30 AM and 8:45 PM, but for today keep timestamps before `now`
        const baseMinutes = 10 * 60 + 30 + i * 42 + ((daysAgo * 7 + i * 13) % 19);
        let orderTs = dayDate.getTime() + baseMinutes * 60000;
        if(daysAgo === 0 && orderTs > now - 120000){
          orderTs = now - (countForDay - i) * 14 * 60000;
        }

        const tpl = basketTemplates[(daysAgo * 5 + i) % basketTemplates.length];
        const items = tpl.map(it => ({ ...it }));
        const subtotal = Utils.round2(items.reduce((s, l) => s + l.price * l.qty, 0));
        const vat = Utils.round2(subtotal - (subtotal / 1.12));
        const grand = subtotal;

        const methodRoll = (daysAgo + i) % 10;
        const method = methodRoll < 7 ? "Cash" : (methodRoll < 9 ? "GCash" : "Card");
        const tendered = method === "Cash" ? (Math.ceil(grand / 100) * 100) : grand;
        const change = Utils.round2(tendered - grand);
        const refCode = method === "Cash" ? "" : `REF-${839201 + txnCounter * 17}`;

        if(method === "Cash") dayCashTotal = Utils.round2(dayCashTotal + grand);
        else if(method === "GCash") dayGCashTotal = Utils.round2(dayGCashTotal + grand);
        else dayCardTotal = Utils.round2(dayCardTotal + grand);

        const cardNum = String(((i + daysAgo) % 8) + 1).padStart(2, "0");
        const orderType = (i % 3 === 0) ? "Take-Out" : "Dine-In";
        const receiptStr = String(txnCounter).padStart(4, "0");

        demoSales.push({
          id: `TXN-${receiptStr}`,
          receiptNo: receiptStr,
          ts: orderTs,
          items,
          subtotal,
          discountType: "percent",
          discountValue: 0,
          discountAmt: 0,
          vat,
          total: grand,
          method,
          refCode,
          tendered,
          change,
          cashier: "Owner/Admin",
          tableNumber: cardNum,
          orderType,
          branchId: "branch_main",
          branchName: "Main Branch"
        });
        txnCounter++;
      }

      // Create closed shift logs for the previous 6 days
      if(daysAgo > 0){
        const openTs = dayDate.getTime() + 9 * 3600000 + 30 * 60000; // 9:30 AM
        const closeTs = dayDate.getTime() + 21 * 3600000 + 30 * 60000; // 9:30 PM
        const openingCash = 3000;
        const expectedCash = Utils.round2(openingCash + dayCashTotal);
        demoShiftLogs.push({
          id: `shift_demo_d${daysAgo}`,
          openedAt: openTs,
          closedAt: closeTs,
          updatedAt: closeTs,
          openedBy: "Owner/Admin",
          closedBy: "Owner/Admin",
          openingCash,
          expectedCash,
          actualCash: expectedCash,
          variance: 0,
          cashSales: dayCashTotal,
          gcashSales: dayGCashTotal,
          cardSales: dayCardTotal,
          totalSales: Utils.round2(dayCashTotal + dayGCashTotal + dayCardTotal),
          txCount: countForDay,
          branchId: "branch_main",
          branchName: "Main Branch"
        });
      }
    }

    demoSales.sort((a, b) => b.ts - a.ts);
    demoShiftLogs.sort((a, b) => b.openedAt - a.openedAt);

    // Seed realistic past-week operating expenses (OPEX)
    const fmtDateLocal = (ms) => new Date(ms).toLocaleDateString("en-CA");
    const demoExpenses = [
      {
        id: "exp_demo_1",
        date: fmtDateLocal(now - 5 * 86400000),
        ts: now - 5 * 86400000,
        category: "Ingredients & Produce",
        description: "Fresh lettuce, tomatoes, white onions & burger buns delivery",
        amount: 1250,
        method: "Cash",
        recipient: "Bogo Public Market Produce",
        refNo: "OR-4412",
        loggedBy: "Owner/Admin"
      },
      {
        id: "exp_demo_2",
        date: fmtDateLocal(now - 4 * 86400000),
        ts: now - 4 * 86400000,
        category: "Utilities",
        description: "Commercial LPG tank refill for burger grill & deep fryer",
        amount: 1100,
        method: "Cash",
        recipient: "PryceGas Bogo",
        refNo: "SI-8820",
        loggedBy: "Owner/Admin"
      },
      {
        id: "exp_demo_3",
        date: fmtDateLocal(now - 3 * 86400000),
        ts: now - 3 * 86400000,
        category: "Packaging & Supplies",
        description: "Burger wrappers, clam boxes, paper bags & 16oz drink cups",
        amount: 850,
        method: "GCash",
        recipient: "Cebu FoodPack Supplies",
        refNo: "GC-992831",
        loggedBy: "Owner/Admin"
      },
      {
        id: "exp_demo_4",
        date: fmtDateLocal(now - 2 * 86400000),
        ts: now - 2 * 86400000,
        category: "Ingredients & Produce",
        description: "Palm frying oil (17L) & cheese/BBQ/sour cream seasoning packs",
        amount: 980,
        method: "Cash",
        recipient: "Metro Wholesale Bogo",
        refNo: "OR-5519",
        loggedBy: "Owner/Admin"
      },
      {
        id: "exp_demo_5",
        date: fmtDateLocal(now - 1 * 86400000),
        ts: now - 1 * 86400000,
        category: "Supplies",
        description: "Tube ice sacks, tissues, hand soap & kitchen sanitizer",
        amount: 420,
        method: "Cash",
        recipient: "Dakit Ice & Mart",
        refNo: "OR-6014",
        loggedBy: "Owner/Admin"
      }
    ];

    // Seed 6 live Kitchen Display System (KDS) orders for today's demo
    const demoKitchenOrders = [
      {
        id: "kds_demo_01",
        saleId: "TXN-0080",
        orderNumber: "80",
        tableNumber: "01",
        orderType: "Dine-In",
        cashier: "Owner/Admin",
        status: "new",
        timestamp: now - 2 * 60000,
        items: [
          { name: pCombo4.name, qty: 2, price: pCombo4.price, notes: "Iced Tea, Cheese", imageUrl: pCombo4.imageUrl, category: pCombo4.category, done: false },
          { name: pBaconFry.name, qty: 1, price: pBaconFry.price, notes: "Cheese", imageUrl: pBaconFry.imageUrl, category: pBaconFry.category, done: false }
        ]
      },
      {
        id: "kds_demo_02",
        saleId: "TXN-0079",
        orderNumber: "79",
        tableNumber: "02",
        orderType: "Take-Out",
        cashier: "Owner/Admin",
        status: "new",
        timestamp: now - 3 * 60000,
        items: [
          { name: pMagnum.name, qty: 1, price: pMagnum.price, notes: "Extra Cheese", imageUrl: pMagnum.imageUrl, category: pMagnum.category, done: false },
          { name: pCombo1.name, qty: 2, price: pCombo1.price, notes: "Blue Lemonade, BBQ", imageUrl: pCombo1.imageUrl, category: pCombo1.category, done: false }
        ]
      },
      {
        id: "kds_demo_03",
        saleId: "TXN-0078",
        orderNumber: "78",
        tableNumber: "03",
        orderType: "Dine-In",
        cashier: "Owner/Admin",
        status: "cooking",
        timestamp: now - 5 * 60000,
        items: [
          { name: pTriple.name, qty: 1, price: pTriple.price, notes: "", imageUrl: pTriple.imageUrl, category: pTriple.category, done: false },
          { name: pCombo3.name, qty: 2, price: pCombo3.price, notes: "Coke, Sour Cream", imageUrl: pCombo3.imageUrl, category: pCombo3.category, done: true }
        ]
      },
      {
        id: "kds_demo_04",
        saleId: "TXN-0077",
        orderNumber: "77",
        tableNumber: "04",
        orderType: "Dine-In",
        cashier: "Owner/Admin",
        status: "cooking",
        timestamp: now - 7 * 60000,
        items: [
          { name: pBacon.name, qty: 2, price: pBacon.price, notes: "", imageUrl: pBacon.imageUrl, category: pBacon.category, done: false },
          { name: pFries.name, qty: 2, price: pFries.price, notes: "Cheese", imageUrl: pFries.imageUrl, category: pFries.category, done: true }
        ]
      },
      {
        id: "kds_demo_05",
        saleId: "TXN-0076",
        orderNumber: "76",
        tableNumber: "05",
        orderType: "Take-Out",
        cashier: "Owner/Admin",
        status: "ready",
        timestamp: now - 9 * 60000,
        items: [
          { name: pCombo2.name, qty: 2, price: pCombo2.price, notes: "Cucumber, Cheese", imageUrl: pCombo2.imageUrl, category: pCombo2.category, done: true },
          { name: pCheezdog.name, qty: 1, price: pCheezdog.price, notes: "", imageUrl: pCheezdog.imageUrl, category: pCheezdog.category, done: true }
        ]
      },
      {
        id: "kds_demo_06",
        saleId: "TXN-0075",
        orderNumber: "75",
        tableNumber: "06",
        orderType: "Dine-In",
        cashier: "Owner/Admin",
        status: "completed",
        timestamp: now - 16 * 60000,
        completedAt: now - 6 * 60000,
        items: [
          { name: pHawaiian.name, qty: 1, price: pHawaiian.price, notes: "", imageUrl: pHawaiian.imageUrl, category: pHawaiian.category, done: true },
          { name: pCheezo.name, qty: 1, price: pCheezo.price, notes: "", imageUrl: pCheezo.imageUrl, category: pCheezo.category, done: true },
          { name: pAddCombo.name, qty: 1, price: pAddCombo.price, notes: "Sprite, BBQ", imageUrl: pAddCombo.imageUrl, category: pAddCombo.category, done: true }
        ]
      }
    ];

    write(KEYS.deletedSaleIds, []);
    write(KEYS.sales, demoSales);
    write(KEYS.expenses, demoExpenses);
    write(KEYS.kitchenOrders, demoKitchenOrders);
    write(KEYS.shiftLogs, demoShiftLogs);
    write(KEYS.shift, {
      id: "shift_demo_today",
      status: "open",
      openedAt: todayStart.getTime() + 9 * 3600000,
      updatedAt: now,
      openedBy: "Owner/Admin",
      openingCash: 3000,
      cashIn: 0,
      cashOut: 0,
      branchId: "branch_main",
      branchName: "Main Branch"
    });

    try{ localStorage.setItem(demoFlagKey, "true"); }catch(e){}
    return true;
  }

  function init(){
    // (2026-07-13) One-time blank slate reset for non-menu sales/orders; was wiping catalog
    const blankFlagKey = NS + "blank_database_reset_v2";
    if(!localStorage.getItem(blankFlagKey)){
      [
        KEYS.products, KEYS.categories, KEYS.sales, KEYS.kitchenOrders,
        KEYS.expenses, KEYS.shifts, KEYS.stockLog, KEYS.restockLogs,
        KEYS.voidLogs, KEYS.heldSales, KEYS.cart, KEYS.customItems,
        KEYS.deletedProductIds, KEYS.deletedSaleIds, KEYS.fuelSales, KEYS.venueBookings
      ].forEach(k => {
        if(!k) return;
        write(k, []);
      });
      try{ localStorage.setItem(blankFlagKey, "true"); }catch(e){}
    }
    migrateAndPruneStorage();
    ensureBurgerJayCatalogSeeded();
    ensureBurgerJayDemoDataSeeded();
    idbLoadAll().then(() => {
      const catSeeded = ensureBurgerJayCatalogSeeded();
      const demoSeeded = ensureBurgerJayDemoDataSeeded();
      if(catSeeded || demoSeeded){
        if(typeof POS !== "undefined" && POS.renderCatalog) POS.renderCatalog();
        if(typeof Inventory !== "undefined" && Inventory.renderTable) Inventory.renderTable();
        if(typeof App !== "undefined" && App.rerenderCurrentView) App.rerenderCurrentView();
      }
    });
    if(read(KEYS.categories) === null) write(KEYS.categories, DEFAULT_CATEGORIES);
    // (2026-07-13) Sync full burgerjay-bogo Firebase config in settings; was partial
    const curSettings = read(KEYS.settings);
    if(curSettings === null){
      write(KEYS.settings, DEFAULT_SETTINGS);
    } else if(!curSettings.firebaseConfig || curSettings.firebaseConfig.projectId !== "burgerjay-bogo" || !curSettings.firebaseConfig.measurementId || !curSettings.firebaseConfig.databaseURL){
      curSettings.firebaseConfig = DEFAULT_SETTINGS.firebaseConfig;
      curSettings.autoSync = true;
      write(KEYS.settings, curSettings);
    }
    // (2026-07-13) Strip Route98 staff and keep only Owner/Admin; was seeding Route98 staff
    const LEGACY_R98_IDS = new Set(["u_jp", "u_sharon", "u_ike", "u_rosella", "u_nino"]);
    const LEGACY_R98_NAMES = new Set(["cashier", "jp", "sharon", "elaicka / ike", "rosella", "niño", "nino"]);
    let curUsers = read(KEYS.users);
    if(curUsers === null){
      write(KEYS.users, DEFAULT_USERS);
    } else {
      let uChanged = false;
      const filteredUsers = curUsers.filter(u => {
        const uid = String(u?.id || "").trim();
        const nm = String(u?.name || "").trim().toLowerCase();
        return !LEGACY_R98_IDS.has(uid) && !LEGACY_R98_NAMES.has(nm);
      });
      if(filteredUsers.length !== curUsers.length){
        curUsers = filteredUsers;
        uChanged = true;
      }
      if(!curUsers.some(u => u.id === "u_admin" || String(u?.name || "").toLowerCase() === "owner/admin")){
        curUsers.unshift({ id:"u_admin", name:"Owner/Admin", role:"admin", pin:"9898" });
        uChanged = true;
      }
      const adminAcc = curUsers.find(u => u.id === "u_admin" || u.name.toLowerCase() === "owner/admin");
      if(adminAcc && adminAcc.pin === "1234"){
        adminAcc.pin = "9898";
        uChanged = true;
      }
      if(uChanged) write(KEYS.users, curUsers);
    }
    const curFuelCfg = read(KEYS.fuelConfig);
    // (2026-07-13) Fix duplicate premium pump; enforce 3 distinct fuels
    if(curFuelCfg === null || !curFuelCfg.fuels || !curFuelCfg.fuels.premium || (curFuelCfg.pumps && curFuelCfg.pumps.length < 3)){
      write(KEYS.fuelConfig, DEFAULT_FUEL_CONFIG);
    } else {
      let changed = false;
      if(curFuelCfg.pumps && curFuelCfg.pumps.length >= 3){
        if(curFuelCfg.pumps[0].fuelType === curFuelCfg.pumps[2].fuelType || curFuelCfg.pumps[0].fuelType === "premium"){
          curFuelCfg.pumps[0].fuelType = "gasoline";
          curFuelCfg.pumps[1].fuelType = "diesel";
          curFuelCfg.pumps[2].fuelType = "premium";
          changed = true;
        }
      }
      Object.keys(curFuelCfg.fuels).forEach(k => {
        if(curFuelCfg.fuels[k].capacity !== 10000){
          curFuelCfg.fuels[k].capacity = 10000;
          changed = true;
        }
        if(k === "diesel" && curFuelCfg.fuels[k].color !== "#F59E0B"){
          curFuelCfg.fuels[k].color = "#F59E0B";
          changed = true;
        }
      });
      if(changed) write(KEYS.fuelConfig, curFuelCfg);
    }
    // (2026-07-13) Initialize blank products and sales if null; was merging Loyverse seed
    if(read(KEYS.products) === null) write(KEYS.products, []);
    if(read(KEYS.sales) === null) write(KEYS.sales, []);
    if(read(KEYS.kitchenOrders) === null) write(KEYS.kitchenOrders, []);
    // (2026-07-13) Repair sales totals & normalize timestamps; was zero-only check
    const currentSales = read(KEYS.sales) || [];
    let salesRepaired = false;
    currentSales.forEach(s => {
      if(s.ts === undefined || typeof s.ts !== "number"){
        const parsed = (typeof Analytics !== "undefined" && Analytics.parseTs) ? Analytics.parseTs(s.ts ?? s.timestamp ?? s.date ?? s.createdAt) : (new Date(s.ts ?? s.timestamp ?? s.date ?? s.createdAt).getTime() || Date.now());
        if(!isNaN(parsed) && parsed > 0){ s.ts = parsed; salesRepaired = true; }
      }
      if((!s.total || s.total === 0) && s.items && s.items.length){
        const sum = Utils.round2(s.items.reduce((acc, it) => acc + ((Number(it.qty) || 1) * (Number(it.price) || 0)), 0));
        if(sum > 0){
          s.total = sum;
          s.subtotal = sum;
          s.tendered = sum;
          salesRepaired = true;
        }
      }
    });
    if(salesRepaired) write(KEYS.sales, currentSales);
    if(read(KEYS.fuelSales) === null) write(KEYS.fuelSales, []);
    if(read(KEYS.heldSales) === null) write(KEYS.heldSales, []);
    if(read(KEYS.venueLeads) === null) write(KEYS.venueLeads, []);
    if(read(KEYS.stockLog) === null) write(KEYS.stockLog, []);
    // (2026-07-13) Strip Route98 cashiers from stored cashiers list; was keeping Rosella/Niño
    const curCashiers = read(KEYS.cashiers);
    if(curCashiers === null){
      write(KEYS.cashiers, DEFAULT_CASHIERS);
    } else if(Array.isArray(curCashiers)){
      const cleanCashiers = curCashiers.filter(c => !LEGACY_R98_NAMES.has(String(c || "").trim().toLowerCase()));
      if(cleanCashiers.length !== curCashiers.length) write(KEYS.cashiers, cleanCashiers);
    }
    // (2026-07-13) Default closed shift state; was dummy open timestamp
    if(read(KEYS.shift) === null) write(KEYS.shift, { status: "closed", openedAt: null, openingCash: 0 });
    if(read(KEYS.syncMeta) === null) write(KEYS.syncMeta, { lastSynced:null, status:"idle" });
    // merge in any NEW default settings keys added in later app versions without clobbering user edits
    const s = read(KEYS.settings);
    const updatedSettings = { ...DEFAULT_SETTINGS, ...s };
    // (2026-07-13) Set BurgerJay business name and receipt footer; was Route 98
    if(updatedSettings.businessName === "The Good Minimart" || updatedSettings.businessName === "Route 98" || !updatedSettings.businessName){
      updatedSettings.businessName = "BurgerJay";
      updatedSettings.receiptFooter = "Salamat sa inyong pagbisita sa BurgerJay! Come again";
    }
    // (2026-07-13) Ensure burgerjay-bogo Firebase config is applied; was empty/route98
    if(!updatedSettings.firebaseConfig || !updatedSettings.firebaseConfig.projectId || updatedSettings.firebaseConfig.projectId === "route98-bogo"){
      updatedSettings.firebaseConfig = { ...DEFAULT_SETTINGS.firebaseConfig };
    }
    if(!updatedSettings.address || updatedSettings.address === "Cebu City, Philippines"){
      updatedSettings.address = "Cabangcalan, Dakit, Bogo City, Cebu";
    }
    // (2026-07-13) Migrate TIN to Route 98 TIN; was empty
    if(!updatedSettings.tin){
      updatedSettings.tin = "811-387-946-00000";
    }
    write(KEYS.settings, updatedSettings);
    // backfill fuel cost/priceLog fields for stores upgrading from an older version
    const fc = read(KEYS.fuelConfig);
    if(fc){
      let changed = false;
      Object.keys(fc.fuels).forEach(k => {
        if(fc.fuels[k].cost === undefined){ fc.fuels[k].cost = Utils.round2(fc.fuels[k].price * 0.88); changed = true; }
        if(!fc.fuels[k].priceLog){ fc.fuels[k].priceLog = []; changed = true; }
      });
      if(changed) write(KEYS.fuelConfig, fc);
    }
    // (2026-07-13) Uppercase categories normalization & deduplication; was mixed
    const currentCats = read(KEYS.categories, []);
    if(currentCats && currentCats.length) write(KEYS.categories, dedupeCats(currentCats));
    // (2026-07-13) Sanitize barcodes to unshortened whole numbers. Prev: unsanitized
    const currentProds = read(KEYS.products, []);
    if(currentProds && currentProds.length){
      let pChanged = false;
      currentProds.forEach(p => {
        if(p.category && p.category !== p.category.trim().toUpperCase()){
          p.category = p.category.trim().toUpperCase();
          pChanged = true;
        }
        if(p.barcode){
          let bStr = String(p.barcode).trim();
          if(/[eE][+-]?\d+/.test(bStr)){
            const num = Number(bStr);
            if(!isNaN(num) && num > 0){
              try{ bStr = BigInt(Math.round(num)).toString(); }catch(e){}
            }
          }
          if(bStr.includes(".")){
            bStr = bStr.split(".")[0];
          }
          const cleanB = bStr.replace(/[^0-9]/g, "");
          if(cleanB !== p.barcode){
            p.barcode = cleanB;
            pChanged = true;
          }
        }
      });
      if(pChanged) write(KEYS.products, currentProds);
    }
    // (2026-07-13) Auto-populate past daily backups history; was 2 recent only
    populateHistoricalBackups();
    // (2026-07-13) Auto-deduplicate sales on init; was seed-only load
    deduplicateSales();
  }

  // (2026-07-13) Auto-deduplicate products by id, barcode & name; was raw push
  function dedupeProductList(list){
    if(!Array.isArray(list) || list.length <= 1) return list || [];
    const map = new Map();
    const barcodeMap = new Map();

    list.forEach(p => {
      // (2026-07-13) Normalize product name fallback; was dropping products without name
      if(!p) return;
      if(!p.name && (p.title || p.productName)) p.name = p.title || p.productName;
      if(!p.name) return;
      const cleanName = String(p.name).trim().toLowerCase();
      const rawCode = String(p.barcode || "").trim();
      const cleanCode = (rawCode === "—" || rawCode === "-" || rawCode === "N/A" || rawCode === "0") ? "" : rawCode;

      let existing = null;
      if(p.id && map.has(`id:${p.id}`)) existing = map.get(`id:${p.id}`);
      if(!existing && cleanCode && barcodeMap.has(cleanCode)) existing = barcodeMap.get(cleanCode);
      if(!existing && cleanName && map.has(`name:${cleanName}`)) existing = map.get(`name:${cleanName}`);

      // (2026-07-13) Set stock & cost on newer item; was Math.max overwriting new
      if(existing){
        const isNewer = (p.updatedAt || p.createdAt || 0) >= (existing.updatedAt || existing.createdAt || 0);
        if(isNewer){
          if(p.name) existing.name = p.name;
          if(p.imageUrl !== undefined) existing.imageUrl = p.imageUrl;
          if(p.category) existing.category = p.category;
          if(cleanCode) existing.barcode = cleanCode;
          if(p.price !== undefined) existing.price = Number(p.price);
          if(p.cost !== undefined) existing.cost = Number(p.cost);
          if(p.brand !== undefined) existing.brand = p.brand;
          if(p.distributor !== undefined) existing.distributor = p.distributor;
          if(p.unit) existing.unit = p.unit;
          if(p.lowStockThreshold !== undefined) existing.lowStockThreshold = p.lowStockThreshold;
          if(p.piecesPerPack !== undefined) existing.piecesPerPack = p.piecesPerPack;
          if(p.packPrice !== undefined) existing.packPrice = p.packPrice;
          if(p.packCost !== undefined) existing.packCost = p.packCost;
          if(p.packBarcode !== undefined) existing.packBarcode = p.packBarcode;
          if(Array.isArray(p.choices)) existing.choices = p.choices;
          if(p.stock !== undefined && !isNaN(Number(p.stock))) existing.stock = Number(p.stock);
          if(p.updatedAt) existing.updatedAt = p.updatedAt;
        } else {
          if(!existing.barcode && cleanCode) existing.barcode = cleanCode;
          if(!existing.imageUrl && p.imageUrl) existing.imageUrl = p.imageUrl;
          if(p.brand && !existing.brand) existing.brand = p.brand;
          if(p.distributor && !existing.distributor) existing.distributor = p.distributor;
          if(existing.stock === undefined && p.stock !== undefined) existing.stock = Number(p.stock);
        }
      } else {
        const item = { ...p, barcode: cleanCode };
        if(p.id) map.set(`id:${p.id}`, item);
        if(cleanCode) barcodeMap.set(cleanCode, item);
        if(cleanName) map.set(`name:${cleanName}`, item);
      }
    });

    return Array.from(new Set(Array.from(map.values())));
  }

  // (2026-07-13) Sort products with # items first then A-Z; was unsorted
  function sortProductsList(list){
    return (list || []).sort((a,b) => {
      const aName = String(a?.name || "").trim();
      const bName = String(b?.name || "").trim();
      const aHash = aName.startsWith("#");
      const bHash = bName.startsWith("#");
      if(aHash && !bHash) return -1;
      if(!aHash && bHash) return 1;
      return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: "base" });
    });
  }

  // (2026-07-13) Filter deleted products from getProducts; was returning all
  const getProducts   = () => {
    if(!cachedProducts){
      const prods = read(KEYS.products, []);
      const delIds = getDeletedProductIds();
      cachedProducts = delIds.size ? prods.filter(p => {
        const pId = String(p?.id ?? p?._id ?? "").trim();
        return pId && !delIds.has(pId);
      }) : prods;
    }
    return cachedProducts;
  };
  const setProducts   = (v) => {
    cachedProducts = null;
    const delIds = getDeletedProductIds();
    const filtered = (v || []).filter(p => {
      const pId = String(p?.id ?? p?._id ?? "").trim();
      return pId && !delIds.has(pId);
    });
    return write(KEYS.products, sortProductsList(dedupeProductList(filtered)));
  };
  function deduplicateProducts(){
    const current = getProducts();
    const deduped = dedupeProductList(current);
    if(deduped.length !== current.length){
      write(KEYS.products, deduped);
    }
    return deduped;
  }
  const dedupeCats = (list) => {
    const set = new Set();
    (list || []).forEach(c => {
      if(!c || typeof c !== "string") return;
      const t = c.trim().toUpperCase();
      if(t) set.add(t);
    });
    return [...set];
  };
  const getCategories = () => {
    if(!cachedCategories) cachedCategories = dedupeCats(read(KEYS.categories, []));
    return cachedCategories;
  };
  const setCategories = (v) => { cachedCategories = null; return write(KEYS.categories, dedupeCats(v)); };
  // (2026-07-13) Dedupe sales & purge imported duplicates; was simple receipt map
  function dedupeSalesList(list){
    if(!Array.isArray(list) || list.length <= 1) return list || [];
    const map = new Map();
    const sigMap = new Map();
    const normalizeTxn = (str) => String(str || "").replace(/^TXN-/i, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    list.forEach(s => {
      if(!s) return;
      if(s.ts === undefined || typeof s.ts !== "number"){
        const parsed = (typeof Analytics !== "undefined" && Analytics.parseTs) ? Analytics.parseTs(s.ts ?? s.timestamp ?? s.date ?? s.createdAt) : (new Date(s.ts ?? s.timestamp ?? s.date ?? s.createdAt).getTime() || Date.now());
        if(!isNaN(parsed) && parsed > 0) s.ts = parsed;
      }
      const rawKey = String(s.receiptNo || s.id || '').trim();
      const normId = normalizeTxn(s.id);
      const normRc = normalizeTxn(s.receiptNo);
      const isImp = Boolean(s.isImported || s.source === "imported");

      const sigKey = `${Math.floor((s.ts || 0) / 1000)}_${Utils.round2(s.total || 0)}_${(s.items || []).length}_${normId || normRc}`;
      const altSigKey = `${Math.floor((s.ts || 0) / 1000)}_${Utils.round2(s.total || 0)}_${(s.items || []).length}`;

      let existing = null;
      if(rawKey && map.has(rawKey)) existing = map.get(rawKey);
      else if(sigMap.has(sigKey)) existing = sigMap.get(sigKey);
      else if(sigMap.has(altSigKey)) existing = sigMap.get(altSigKey);

      if(existing){
        const exImp = Boolean(existing.isImported || existing.source === "imported");
        if(exImp && !isImp){
          if(!s.items || !s.items.length) s.items = existing.items;
          if(rawKey) map.set(rawKey, s);
          sigMap.set(sigKey, s);
          sigMap.set(altSigKey, s);
        } else {
          if((!existing.items || !existing.items.length) && (s.items && s.items.length)) existing.items = s.items;
        }
      } else {
        if(rawKey) map.set(rawKey, s);
        sigMap.set(sigKey, s);
        sigMap.set(altSigKey, s);
      }
    });
    return Array.from(new Set(sigMap.values())).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }
  // (2026-07-13) Deduplicate sales and sync clean store; was products only
  function deduplicateSales(){
    const current = read(KEYS.sales, []);
    const deduped = dedupeSalesList(current);
    if(current && deduped.length !== current.length){
      write(KEYS.sales, deduped);
      cachedProcessedSales = null;
    }
    return deduped;
  }
  // (2026-07-13) Memoize getSales and auto-save dedupe; was parsing per call
  const getSales = () => {
    if(cachedProcessedSales) return cachedProcessedSales;
    const rawSales = read(KEYS.sales, []);
    const allSales = dedupeSalesList(rawSales);
    if(rawSales && allSales.length !== rawSales.length){
      write(KEYS.sales, allSales);
    }
    // (2026-07-13) Filter sales by deletedIds without mutating set; was deleting IDs
    const deletedIds = getDeletedSaleIds();
    cachedProcessedSales = allSales.filter(s => {
      const sId = String(s.id || "").trim();
      const rId = String(s.receiptNo || "").trim();
      const clean = sId.replace(/^TXN-/i, "");
      return !deletedIds.has(sId) && !deletedIds.has(sId.toLowerCase()) &&
             !deletedIds.has(rId) && !deletedIds.has(rId.toLowerCase()) &&
             !deletedIds.has(clean) && !deletedIds.has(clean.toLowerCase());
    });
    return cachedProcessedSales;
  };
  const setSales       = (v) => { cachedProcessedSales = null; return write(KEYS.sales, dedupeSalesList(v)); };
  // (2026-07-13) Store multi-format deleted keys to prevent reload resync; was single
  const getDeletedSaleIds = () => new Set(read(KEYS.deletedSaleIds, []));
  const getDeletedProductIds = () => new Set(read(KEYS.deletedProductIds, []));
  const markProductDeleted = (id) => {
    if(!id) return;
    const s = getDeletedProductIds();
    s.add(String(id));
    write(KEYS.deletedProductIds, Array.from(s), true);
  };
  const unmarkProductDeleted = (id) => {
    if(!id) return;
    const s = getDeletedProductIds();
    s.delete(String(id));
    s.delete(String(id).toLowerCase());
    write(KEYS.deletedProductIds, Array.from(s), true);
  };
  const unmarkSaleDeleted = (saleId) => {
    cachedProcessedSales = null;
    const deleted = getDeletedSaleIds();
    if(saleId){
      const sId = String(saleId).trim();
      deleted.delete(sId);
      deleted.delete(sId.toLowerCase());
      const clean = sId.replace(/^TXN-/i, "");
      deleted.delete(clean);
      deleted.delete(clean.toLowerCase());
      deleted.delete("TXN-" + clean);
    }
    write(KEYS.deletedSaleIds, Array.from(deleted), true);
  };
  const markSaleDeleted = (saleId, receiptNo = null) => {
    cachedProcessedSales = null;
    const deleted = getDeletedSaleIds();
    if(saleId){
      const sId = String(saleId).trim();
      deleted.add(sId);
      deleted.add(sId.toLowerCase());
      const clean = sId.replace(/^TXN-/i, "");
      deleted.add(clean);
      deleted.add(clean.toLowerCase());
      deleted.add("TXN-" + clean);
    }
    if(receiptNo){
      const rId = String(receiptNo).trim();
      deleted.add(rId);
      deleted.add(rId.toLowerCase());
      const cleanR = rId.replace(/^TXN-/i, "");
      deleted.add(cleanR);
      deleted.add(cleanR.toLowerCase());
    }
    write(KEYS.deletedSaleIds, Array.from(deleted), true);
  };
  const getFuelSales   = () => read(KEYS.fuelSales, []);
  const setFuelSales   = (v) => write(KEYS.fuelSales, v);
  // (2026-07-13) Support custom tanker cost & Regular (Gas) name; was forced 65.00
  function getFuelConfig(){
    let cfg = read(KEYS.fuelConfig, DEFAULT_FUEL_CONFIG);
    if(!cfg || !cfg.fuels || !cfg.fuels.premium || !cfg.pumps || cfg.pumps.length < 3){
      cfg = DEFAULT_FUEL_CONFIG;
      write(KEYS.fuelConfig, cfg);
    } else {
      let needsFix = false;
      if(cfg.pumps[0].fuelType !== "gasoline"){
        cfg.pumps[0].fuelType = "gasoline";
        needsFix = true;
      }
      if(cfg.pumps[1].fuelType !== "diesel"){
        cfg.pumps[1].fuelType = "diesel";
        needsFix = true;
      }
      if(cfg.pumps[2].fuelType !== "premium"){
        cfg.pumps[2].fuelType = "premium";
        needsFix = true;
      }
      if(cfg.fuels.gasoline && (cfg.fuels.gasoline.name.includes("RON91") || cfg.fuels.gasoline.name === "Gasoline")){
        cfg.fuels.gasoline.name = "Regular (Gas)";
        needsFix = true;
      }
      Object.keys(cfg.fuels).forEach(k => {
        if(cfg.fuels[k].cost === undefined || isNaN(cfg.fuels[k].cost)){
          cfg.fuels[k].cost = 65.00;
          needsFix = true;
        }
      });
      if(needsFix) write(KEYS.fuelConfig, cfg);
    }
    return cfg;
  }
  const setFuelConfig  = (v) => write(KEYS.fuelConfig, v);
  const getSettings    = () => read(KEYS.settings, DEFAULT_SETTINGS);
  // (2026-07-13) Attach updatedAt to settings writes; was untracked
  const setSettings    = (v) => write(KEYS.settings, { ...v, updatedAt: v?.updatedAt || Date.now() });
  // (2026-07-13) Always filter out Route98 staff and cashiers in getters/setters; was raw read
  const R98_BANNED_IDS = new Set(["u_jp", "u_sharon", "u_ike", "u_rosella", "u_nino"]);
  const R98_BANNED_NAMES = new Set(["cashier", "jp", "sharon", "elaicka / ike", "rosella", "niño", "nino"]);
  const cleanUsersList = (arr) => (Array.isArray(arr) ? arr : []).filter(u => {
    const uid = String(u?.id || "").trim();
    const nm = String(u?.name || "").trim().toLowerCase();
    return !R98_BANNED_IDS.has(uid) && !R98_BANNED_NAMES.has(nm);
  });
  const cleanCashiersList = (arr) => (Array.isArray(arr) ? arr : []).filter(c => {
    const nm = String(c || "").trim().toLowerCase();
    return nm && !R98_BANNED_NAMES.has(nm);
  });
  const getUsers       = () => {
    const raw = read(KEYS.users, DEFAULT_USERS);
    const cleaned = cleanUsersList(raw);
    if(Array.isArray(raw) && cleaned.length !== raw.length) write(KEYS.users, cleaned);
    return cleaned.length ? cleaned : DEFAULT_USERS;
  };
  const setUsers       = (v) => write(KEYS.users, cleanUsersList(v));
  const getCashiers    = () => {
    const cu = getUsers().filter(u => u.role === "cashier").map(u => u.name);
    const rawStored = read(KEYS.cashiers, DEFAULT_CASHIERS);
    const cleanedStored = cleanCashiersList(rawStored);
    if(Array.isArray(rawStored) && cleanedStored.length !== rawStored.length) write(KEYS.cashiers, cleanedStored);
    return cu.length ? cu : cleanedStored;
  };
  const setCashiers    = (v) => write(KEYS.cashiers, cleanCashiersList(v));
  // (2026-07-13) Manage kitchen display orders; was missing
  const getKitchenOrders = () => read(KEYS.kitchenOrders, []);
  const setKitchenOrders = (v) => write(KEYS.kitchenOrders, Array.isArray(v) ? v : []);
  const addKitchenOrder = (order) => {
    const list = getKitchenOrders();
    const branchId = getCurrentBranchId ? getCurrentBranchId() : "branch_main";
    const newOrder = {
      id: order.id || ("kord_" + Date.now() + "_" + Math.floor(Math.random()*1000)),
      saleId: order.saleId || null,
      orderNumber: order.orderNumber || (list.length + 1),
      tableNumber: order.tableNumber || "",
      orderType: order.orderType || "Dine-In",
      cashier: order.cashier || (typeof Auth !== "undefined" && Auth.currentUser ? Auth.currentUser()?.name : "Cashier"),
      timestamp: order.timestamp || Date.now(),
      status: order.status || "new",
      statusHistory: order.statusHistory || [{ status: "new", ts: Date.now() }],
      items: order.items || [],
      notes: order.notes || "",
      branchId: order.branchId || branchId
    };
    list.unshift(newOrder);
    setKitchenOrders(list);
    return newOrder;
  };
  const updateKitchenOrderStatus = (orderId, newStatus) => {
    const list = getKitchenOrders();
    const idx = list.findIndex(o => o.id === orderId);
    if(idx !== -1){
      list[idx].status = newStatus;
      if(!list[idx].statusHistory) list[idx].statusHistory = [];
      list[idx].statusHistory.push({ status: newStatus, ts: Date.now() });
      setKitchenOrders(list);
      return list[idx];
    }
    return null;
  };
  const clearCompletedKitchenOrders = () => {
    const list = getKitchenOrders().filter(o => o.status !== "completed");
    setKitchenOrders(list);
    return list;
  };
  const getHeldSales   = () => read(KEYS.heldSales, []);
  const setHeldSales   = (v) => write(KEYS.heldSales, v);
  const getVenueLeads  = () => read(KEYS.venueLeads, []);
  const setVenueLeads  = (v) => write(KEYS.venueLeads, v);
  const getStockLog    = () => read(KEYS.stockLog, []);
  const setStockLog    = (v) => write(KEYS.stockLog, v);
  // (2026-07-13) Auto-recover restock logs & prevent wipe; was empty array wipe
  const getRestockLogs = () => {
    let logs = read(KEYS.restockLogs, []);
    if(!Array.isArray(logs) || logs.length === 0){
      const baseline = read(KEYS.syncBaseline, null);
      if(baseline && Array.isArray(baseline.restockLogs) && baseline.restockLogs.length > 0){
        logs = baseline.restockLogs;
        write(KEYS.restockLogs, logs);
        return logs;
      }
      const backups = read(KEYS.backups, []);
      if(Array.isArray(backups)){
        for(const b of backups){
          if(b?.data?.restockLogs && Array.isArray(b.data.restockLogs) && b.data.restockLogs.length > 0){
            logs = b.data.restockLogs;
            write(KEYS.restockLogs, logs);
            return logs;
          }
        }
      }
      const stockLogs = read(KEYS.stockLog, []);
      if(Array.isArray(stockLogs) && stockLogs.length > 0){
        const prods = getProducts();
        const pMap = new Map(prods.map(p => [p.id, p]));
        const recovered = [];
        stockLogs.forEach(sl => {
          const delta = Number(sl.delta || 0);
          if(delta !== 0){
            const p = pMap.get(sl.productId);
            const cost = p?.cost || 0;
            const rawTs = sl.ts ?? sl.timestamp;
            const ts = typeof rawTs === "number" ? rawTs : (rawTs ? new Date(rawTs).getTime() : Date.now());
            recovered.push({
              id: sl.id || Utils.uid("rstk"),
              product_id: sl.productId || "",
              product_name: sl.productName || p?.name || "Unknown Product",
              quantity_added: delta,
              unit_cost: cost,
              total_cost: Math.abs(delta) * cost,
              supplier_name: delta > 0 ? (p?.distributor || p?.brand || "Stock Adjustment") : "Shrinkage / Audit",
              reason: sl.reason || "Stock Adjustment",
              ts: ts,
              timestamp: ts,
              updatedAt: ts
            });
          }
        });
        if(recovered.length > 0){
          write(KEYS.restockLogs, recovered);
          return recovered;
        }
      }
    }
    return Array.isArray(logs) ? logs : [];
  };
  const setRestockLogs = (v) => write(KEYS.restockLogs, v);
  function addRestockLog(entry){
    const logs = getRestockLogs();
    const qty = Number(entry.quantity_added ?? entry.quantity ?? 0);
    const unitCost = Number(entry.unit_cost ?? entry.unitCost ?? 0);
    const totalCost = Number(entry.total_cost ?? (qty * unitCost));
    const now = Date.now();
    const record = {
      id: entry.id || Utils.uid("rstk"),
      product_id: entry.product_id || entry.productId || "",
      product_name: entry.product_name || entry.productName || "Unknown Product",
      quantity_added: qty,
      unit_cost: unitCost,
      total_cost: totalCost,
      supplier_name: entry.supplier_name || entry.supplierName || "Direct Supplier",
      ts: entry.timestamp || entry.ts || now,
      updatedAt: now,
      timestamp: entry.timestamp || entry.ts || now
    };
    logs.unshift(record);
    setRestockLogs(logs.slice(0, 1000));
    
    // Immediate realtime sync
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.syncRestockLog){
      RealtimeSync.syncRestockLog(record);
    }
    
    return record;
  }
  function updateRestockLog(logId, updated){
    const logs = getRestockLogs();
    const idx = logs.findIndex(l => l.id === logId);
    if(idx === -1) return null;
    const oldLog = logs[idx];
    const oldQty = Number(oldLog.quantity_added || 0);
    const newQty = Number(updated.quantity_added ?? oldQty);
    const diff = newQty - oldQty;
    if(diff !== 0){
      const prods = getProducts();
      const p = prods.find(x => x.id === oldLog.product_id || x.name === oldLog.product_name || x.barcode === oldLog.product_id);
      if(p){
        p.stock = Math.max(0, Utils.round2(p.stock + diff));
        p.updatedAt = Date.now();
        setProducts(prods);
        // (2026-07-13) Sync product stock on restock edit; was unsynced
        if(typeof RealtimeSync !== "undefined" && RealtimeSync.syncSingleProduct){
          RealtimeSync.syncSingleProduct(p);
        }
      }
    }
    const merged = { ...oldLog, ...updated, updatedAt: Date.now(), ts: Date.now(), total_cost: newQty * Number(updated.unit_cost ?? oldLog.unit_cost) };
    logs[idx] = merged;
    setRestockLogs(logs);
    // (2026-07-13) Sync restock log edit to cloud; was unsynced
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.syncRestockLog){
      RealtimeSync.syncRestockLog(merged);
    }
    return merged;
  }
  function deleteRestockLog(logId){
    const logs = getRestockLogs();
    const oldLog = logs.find(l => l.id === logId);
    if(oldLog){
      const rollQty = Number(oldLog.quantity_added || 0);
      if(rollQty !== 0){
        const prods = getProducts();
        const p = prods.find(x => x.id === oldLog.product_id || x.name === oldLog.product_name || x.barcode === oldLog.product_id);
        if(p){
          p.stock = Math.max(0, Utils.round2(p.stock - rollQty));
          p.updatedAt = Date.now();
          setProducts(prods);
          
          // Sync updated product
          if(typeof RealtimeSync !== "undefined" && RealtimeSync.syncSingleProduct){
            RealtimeSync.syncSingleProduct(p);
          }
        }
      }
      setRestockLogs(logs.filter(l => l.id !== logId));
      
      // Immediate realtime sync
      if(typeof RealtimeSync !== "undefined" && RealtimeSync.deleteRestockLogFromCloud){
        RealtimeSync.deleteRestockLogFromCloud(logId);
      }
    }
  }
  // (2026-07-13) Use BurgerJay bj_deviceId and bj_terminalTag; was mm_
  function getDeviceId(){
    let deviceId = localStorage.getItem("bj_deviceId");
    if(!deviceId){
      deviceId = "device_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("bj_deviceId", deviceId);
    }
    return deviceId;
  }
  function getNextTransactionId(prefix = "TXN"){
    let devId = localStorage.getItem("bj_terminalTag");
    if(!devId){
      const raw = getDeviceId();
      devId = raw.replace(/[^a-zA-Z0-9]/g, "").slice(-3).toUpperCase();
      localStorage.setItem("bj_terminalTag", devId);
    }
    const sales = read(KEYS.sales, []);
    const fuelSales = read(KEYS.fuelSales, []);
    const voidLogs = read(KEYS.voidLogs, []);
    const deletedIds = read(KEYS.deletedSaleIds, []);
    let max = 0;
    const re = new RegExp(`^${prefix}-?(?:${devId}-)?(\\d+)$`, "i");
    [...sales, ...fuelSales, ...voidLogs, ...deletedIds].forEach(item => {
      const raw = typeof item === "string" ? item : (item?.id || item?.origTxnId || item?.receiptNo || "");
      const match = String(raw || "").match(re);
      if(match){
        const num = parseInt(match[1], 10);
        if(num > max) max = num;
      }
    });
    if(max === 0) max = Math.max(1000, sales.length + fuelSales.length);
    return `${prefix}-${devId}-${String(max + 1).padStart(4, "0")}`;
  }
  // (2026-07-13) Sort void logs descending; was unsorted array
  const getVoidLogs    = () => read(KEYS.voidLogs, []).sort((a,b)=>(b.ts||0)-(a.ts||0));
  const setVoidLogs    = (v) => write(KEYS.voidLogs, v);
  function addVoidLog(entry){
    const logs = getVoidLogs();
    const item = {
      id: Utils.uid("void"),
      origTxnId: entry.origTxnId || "UNKNOWN",
      itemSummary: entry.itemSummary || "Altered item",
      priceDiff: Number(entry.priceDiff || 0),
      reason: entry.reason || "Admin Void/Modification",
      admin: entry.admin || (typeof Auth !== "undefined" ? Auth.currentUser()?.name : "Admin"),
      ts: Date.now()
    };
    logs.unshift(item);
    // (2026-07-13) Retain all void logs in database; was limited to 500 records
    setVoidLogs(logs);
    return item;
  }
  const getOfflineQueue = () => read(KEYS.offlineQueue, []);
  const setOfflineQueue = (v) => write(KEYS.offlineQueue, v);
  // (2026-07-13) Queue offline txn to IndexedDB & cap to 100; was 50 in storage
  function queueOfflineTransaction(txn){
    const q = getOfflineQueue();
    q.push({ ...txn, queuedAt: Date.now() });
    if(q.length > 100) q.splice(0, q.length - 100);
    setOfflineQueue(q);
  }
  const getShift       = () => {
    const shift = read(KEYS.shift, null);
    // (2026-07-13) Strict open shift status check; was status === 'closed'
    if(!shift || shift.status !== 'open') return null;
    return shift;
  };
  const setShift       = (v) => write(KEYS.shift, v);
  // (2026-07-13) Robust shift log persistence & un-tombstone; was strict equality
  const getDeletedShiftLogIds = () => new Set(read(KEYS.deletedShiftLogIds, []).filter(Boolean).map(x => String(x).trim()));
  const markShiftLogDeleted = (id) => {
    if(!id) return;
    const s = getDeletedShiftLogIds();
    s.add(String(id).trim());
    write(KEYS.deletedShiftLogIds, Array.from(s), true);
  };
  const getShiftLogs   = () => {
    const deleted = getDeletedShiftLogIds();
    const raw = read(KEYS.shiftLogs, []);
    return deleted.size ? raw.filter(l => l && l.id && !deleted.has(String(l.id).trim())) : (raw || []).filter(l => l && l.id);
  };
  const setShiftLogs   = (v) => {
    const deleted = getDeletedShiftLogIds();
    const clean = (v || []).filter(l => l && l.id && !deleted.has(String(l.id).trim()));
    return write(KEYS.shiftLogs, clean);
  };
  // (2026-07-13) Add mergeShiftLogs helper; was overwriting logs array
  const mergeShiftLogs = (incoming) => {
    const deleted = getDeletedShiftLogIds();
    const current = getShiftLogs();
    const map = new Map();
    (current || []).forEach(l => {
      if(l && l.id && !deleted.has(String(l.id).trim())){
        map.set(String(l.id).trim(), l);
      }
    });
    (incoming || []).forEach(l => {
      if(l && l.id && !deleted.has(String(l.id).trim())){
        const existing = map.get(String(l.id).trim());
        if(!existing){
          map.set(String(l.id).trim(), l);
        } else {
          const exTs = existing.updatedAt || existing.closedAt || existing.openedAt || 0;
          const incTs = l.updatedAt || l.closedAt || l.openedAt || 0;
          map.set(String(l.id).trim(), incTs >= exTs ? { ...existing, ...l } : { ...l, ...existing });
        }
      }
    });
    const merged = Array.from(map.values()).sort((a,b) => (b.openedAt || b.closedAt || 0) - (a.openedAt || a.closedAt || 0));
    setShiftLogs(merged);
    return merged;
  };
  // (2026-07-13) Auto-sync saved shift log to cloud; was local save only
  const saveShiftLog   = (item) => {
    if(!item) return null;
    item.id = item.id || Utils.uid("shift");
    const sId = String(item.id).trim();
    const deleted = getDeletedShiftLogIds();
    if(deleted.has(sId)){
      deleted.delete(sId);
      write(KEYS.deletedShiftLogIds, Array.from(deleted), true);
    }
    const logs = getShiftLogs().filter(l => l && String(l.id).trim() !== sId);
    logs.unshift(item);
    setShiftLogs(logs);
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.saveShiftLogToCloud){
      RealtimeSync.saveShiftLogToCloud(item).catch(() => {});
    }
    return item;
  };
  // (2026-07-13) Delete shift log and mark tombstone; was local filter only
  const deleteShiftLog = (id) => {
    if(!id) return;
    const sId = String(id).trim();
    markShiftLogDeleted(sId);
    const logs = getShiftLogs().filter(l => l && String(l.id).trim() !== sId);
    setShiftLogs(logs);
  };
  // (2026-07-13) Store daily starting and ending balances; was transient shift
  const getDayBalances = () => read(KEYS.dayBalances, {});
  const setDayBalances = (v) => write(KEYS.dayBalances, v || {});
  const getSyncMeta    = () => read(KEYS.syncMeta, { lastSynced:null, status:"idle" });
  const setSyncMeta    = (v) => write(KEYS.syncMeta, v);
  // (2026-07-13) Sync baseline in memory & IndexedDB; was filling localStorage
  let inMemorySyncBaseline = null;
  const getSyncBaseline = () => {
    if(inMemorySyncBaseline) return inMemorySyncBaseline;
    if(memCache.has(KEYS.syncBaseline)) return memCache.get(KEYS.syncBaseline);
    try {
      const stored = sessionStorage.getItem(KEYS.syncBaseline);
      if(stored) inMemorySyncBaseline = JSON.parse(stored);
    } catch(e){}
    return inMemorySyncBaseline;
  };
  const setSyncBaseline = (v) => {
    inMemorySyncBaseline = v;
    memCache.set(KEYS.syncBaseline, v);
    idbSet(KEYS.syncBaseline, v);
    try {
      localStorage.removeItem(KEYS.syncBaseline);
      sessionStorage.setItem(KEYS.syncBaseline, JSON.stringify(v));
    } catch(e){}
    return v;
  };
  // (2026-07-13) Add current cart persistence methods; was in-memory only
  const getSavedCart   = () => read(KEYS.currentCart, { cart: [], discount: { type:"percent", value:0 } });
  const saveCart       = (v) => write(KEYS.currentCart, v);

  // (2026-07-13) Multi-branch CRUD and scoping methods; was single-branch
  const DEFAULT_BRANCHES = [
    { id: "branch_main", name: "Main Branch", code: "MAIN", isDefault: true, createdAt: 1729000000000, updatedAt: 1729000000000 }
  ];
  const getBranches = () => {
    const list = read(KEYS.branches, null);
    if(!list || !Array.isArray(list) || !list.length){
      write(KEYS.branches, DEFAULT_BRANCHES);
      return DEFAULT_BRANCHES;
    }
    return list;
  };
  const setBranches = (list) => {
    const arr = Array.isArray(list) && list.length ? list : DEFAULT_BRANCHES;
    write(KEYS.branches, arr);
    return arr;
  };
  // (2026-07-13) Store branch ID through write helper; was writing unquoted raw
  const getCurrentBranchId = () => {
    const val = read(KEYS.currentBranchId, null);
    return (val && typeof val === "string") ? val : "branch_main";
  };
  const setCurrentBranchId = (id) => {
    if(!id) return "branch_main";
    const cleanId = String(id).trim();
    write(KEYS.currentBranchId, cleanId);
    return cleanId;
  };
  const getCurrentBranch = () => {
    const branches = getBranches();
    const curId = getCurrentBranchId();
    return branches.find(b => String(b.id) === String(curId)) || branches[0] || DEFAULT_BRANCHES[0];
  };
  const saveBranch = (branchData) => {
    if(!branchData || !branchData.name) return null;
    const branches = [...getBranches()];
    const now = Date.now();
    let bId = branchData.id ? String(branchData.id).trim() : `branch_${now}`;
    const idx = branches.findIndex(b => String(b.id) === bId);
    const item = {
      id: bId,
      name: branchData.name.trim(),
      code: (branchData.code || branchData.name.slice(0, 4).toUpperCase()).trim(),
      address: (branchData.address || "").trim(),
      isDefault: Boolean(branchData.isDefault || bId === "branch_main"),
      status: "active",
      createdAt: idx >= 0 ? (branches[idx].createdAt || now) : now,
      updatedAt: now
    };
    if(idx >= 0){
      branches[idx] = { ...branches[idx], ...item };
    } else {
      branches.push(item);
    }
    setBranches(branches);
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.saveBranchToCloud){
      RealtimeSync.saveBranchToCloud(item).catch(err => console.warn(err));
    }
    return item;
  };
  const deleteBranch = (branchId) => {
    if(!branchId || branchId === "branch_main") return false;
    const branches = getBranches().filter(b => String(b.id) !== String(branchId));
    setBranches(branches);
    if(getCurrentBranchId() === branchId){
      setCurrentBranchId("branch_main");
    }
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.deleteBranchFromCloud){
      RealtimeSync.deleteBranchFromCloud(branchId).catch(err => console.warn(err));
    }
    return true;
  };
  const getBranchSales = (bId) => {
    const target = bId || getCurrentBranchId();
    return getSales().filter(s => (s.branchId || "branch_main") === target);
  };
  const getBranchShiftLogs = (bId) => {
    const target = bId || getCurrentBranchId();
    return getShiftLogs().filter(l => (l.branchId || "branch_main") === target);
  };

  // (2026-07-13) Add operating expenses and venue bookings DB stores; was none
  const getExpenses    = () => read(KEYS.expenses, []);
  const setExpenses    = (v) => write(KEYS.expenses, v);
  // (2026-07-13) Upsert expense by ID on edits; was creating duplicates
  function addExpense(e){
    let items = getExpenses();
    const item = {
      id: e.id || Utils.uid("exp"),
      date: e.date || new Date().toLocaleDateString("en-CA"),
      ts: e.ts || Date.now(),
      category: e.category || "Other",
      description: e.description || "",
      amount: Number(e.amount || 0),
      method: e.method || "Cash",
      recipient: e.recipient || "",
      refNo: e.refNo || "",
      loggedBy: e.loggedBy || Auth.currentUser()?.name || "Admin"
    };
    const existIdx = e.id ? items.findIndex(x => x.id === e.id) : -1;
    if(existIdx >= 0) items[existIdx] = item;
    else items.unshift(item);
    setExpenses(items);
    
    // Immediate realtime sync
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.syncExpense){
      RealtimeSync.syncExpense(item);
    }
    
    return item;
  }
  function deleteExpense(id){
    setExpenses(getExpenses().filter(x => x.id !== id));
    
    // Immediate realtime sync
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.deleteExpenseFromCloud){
      RealtimeSync.deleteExpenseFromCloud(id);
    }
  }

  const getBookings    = () => read(KEYS.bookings, []);
  const setBookings    = (v) => write(KEYS.bookings, v);
  function addBooking(b){
    const items = getBookings();
    // (2026-07-13) Use local date formatting; was toISOString previous-day split
    const item = {
      id: b.id || Utils.uid("bk"),
      clientName: b.clientName || "Customer",
      phone: b.phone || "",
      eventType: b.eventType || "Celebration / Event",
      date: b.date || new Date().toLocaleDateString("en-CA"),
      startTime: b.startTime || "08:00",
      endTime: b.endTime || "12:00",
      fee: Number(b.fee || 0),
      paid: Number(b.paid || 0),
      balance: Math.max(0, Number(b.fee || 0) - Number(b.paid || 0)),
      status: b.status || "Confirmed",
      method: b.method || "Cash",
      refNo: b.refNo || "",
      notes: b.notes || "",
      createdAt: b.createdAt || Date.now(),
      createdBy: b.createdBy || Auth.currentUser()?.name || "Cashier"
    };
    items.unshift(item);
    setBookings(items);
    return item;
  }
  function updateBooking(id, patch){
    const items = getBookings().map(b => {
      if(b.id !== id) return b;
      const updated = { ...b, ...patch };
      if(updated.fee !== undefined || updated.paid !== undefined){
        updated.balance = Math.max(0, Number(updated.fee || 0) - Number(updated.paid || 0));
      }
      return updated;
    });
    setBookings(items);
  }
  function deleteBooking(id){
    setBookings(getBookings().filter(b => b.id !== id));
  }

  // (2026-07-13) Add restaurant dining reservations CRUD; was venue bookings only
  function getRestaurantBookings(){ return read(KEYS.restaurantBookings, []); }
  function setRestaurantBookings(list){ return write(KEYS.restaurantBookings, list); }
  function addRestaurantBooking(b){
    const items = getRestaurantBookings();
    const item = {
      id: Utils.uid("tbl_bk"),
      guestName: b.guestName || "Walk-in Guest",
      phone: b.phone || "",
      pax: Number(b.pax) || 2,
      tableName: b.tableName || "Table 1",
      diningArea: b.diningArea || "Main Dining Hall",
      date: b.date || new Date().toISOString().split("T")[0],
      startTime: b.startTime || "12:00",
      endTime: b.endTime || "14:00",
      deposit: Number(b.deposit) || 0,
      minSpend: Number(b.minSpend) || 0,
      status: b.status || "Confirmed",
      method: b.method || "Cash",
      refNo: b.refNo || "",
      specialRequests: b.specialRequests || "",
      createdAt: b.createdAt || Date.now(),
      createdBy: b.createdBy || Auth.currentUser()?.name || "Admin"
    };
    items.unshift(item);
    setRestaurantBookings(items);
    return item;
  }
  function updateRestaurantBooking(id, patch){
    const items = getRestaurantBookings().map(b => {
      if(b.id !== id) return b;
      return { ...b, ...patch };
    });
    setRestaurantBookings(items);
  }
  function deleteRestaurantBooking(id){
    setRestaurantBookings(getRestaurantBookings().filter(b => b.id !== id));
  }

  // (2026-07-13) Add bulk fuel truck delivery tracking; was not present
  function getFuelDeliveries(){ return read(KEYS.fuelDeliveries, []); }
  function setFuelDeliveries(list){ return write(KEYS.fuelDeliveries, list); }
  function addFuelDelivery(d){
    const items = getFuelDeliveries();
    // (2026-07-13) Use local date formatting; was toISOString previous-day split
    const item = {
      id: Utils.uid("deliv"),
      date: d.date || new Date().toLocaleDateString("en-CA"),
      ts: Date.now(),
      truckCapacity: Number(d.truckCapacity) || 4000,
      supplierPricePerL: Number(d.supplierPricePerL) || 65.00,
      fuelType: d.fuelType || "gasoline",
      litersOffloaded: Number(d.litersOffloaded) || 0,
      totalCost: Number(d.totalCost) || (Number(d.litersOffloaded || 0) * Number(d.supplierPricePerL || 65.00)),
      supplierName: d.supplierName || "Bulk Fuel Supplier",
      invoiceRef: d.invoiceRef || "",
      loggedBy: d.loggedBy || Auth.currentUser()?.name || "Admin"
    };
    items.unshift(item);
    setFuelDeliveries(items);
    return item;
  }

  // ---------- product helpers ----------
  // (2026-07-13) Guarantee timestamps on new product; was overwritten by spread
  function addProduct(p){
    const products = getProducts();
    const now = Date.now();
    const newProduct = { id: Utils.uid("prod"), ...p, createdAt: p?.createdAt || now, updatedAt: now };
    products.push(newProduct);
    setProducts(products);
    
    // Immediate realtime sync
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.syncSingleProduct){
      RealtimeSync.syncSingleProduct(newProduct);
    }
  }
  function updateProduct(id, patch){
    const products = getProducts();
    const oldProduct = products.find(p => p.id === id);
    if(!oldProduct) return;
    
    // Check if stock is changing
    const hasStockChange = patch.stock !== undefined && patch.stock !== oldProduct.stock;
    const oldStock = oldProduct.stock || 0;
    const newStock = patch.stock !== undefined ? patch.stock : oldStock;
    const stockDelta = newStock - oldStock;
    
    // Update product
    const updatedProducts = products.map(p => 
      p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
    );
    setProducts(updatedProducts);

    // (2026-07-13) Invalidate image cache when image changes; was unpurged
    if(patch.imageUrl !== undefined && oldProduct.imageUrl && patch.imageUrl !== oldProduct.imageUrl){
      if(typeof Utils !== "undefined" && Utils.purgeImageCache){
        Utils.purgeImageCache(oldProduct.imageUrl, patch.imageUrl);
      }
    }
    
    // If stock changed, log it
    if(hasStockChange && stockDelta !== 0){
      console.log(`[DB] 📊 Stock changed: ${oldProduct.name} from ${oldStock} to ${newStock} (${stockDelta > 0 ? '+' : ''}${stockDelta})`);
      
      const qty = Math.abs(stockDelta);
      const unitCost = oldProduct.cost || 0;
      const totalCost = stockDelta > 0 ? qty * unitCost : -(qty * unitCost);
      
      addRestockLog({
        product_id: id,
        product_name: oldProduct.name,
        quantity_added: stockDelta,
        unit_cost: unitCost,
        total_cost: totalCost,
        supplier_name: stockDelta > 0 ? (oldProduct.distributor || oldProduct.brand || "Direct Supplier") : "N/A",
        reason: stockDelta > 0 ? "Stock Updated" : "Stock Reduced",
        oldStock: oldStock,
        newStock: newStock,
        timestamp: Date.now()
      });
    }
    
    // Immediate realtime sync
    const updatedProduct = updatedProducts.find(p => p.id === id);
    if(updatedProduct && typeof RealtimeSync !== "undefined" && RealtimeSync.syncSingleProduct){
      console.log('[DB] 🚀 Syncing product update to Firebase...');
      RealtimeSync.syncSingleProduct(updatedProduct);
    }
  }
  // (2026-07-13) Fix trash restore string ID matching; was strict equal failure
  function getTrash(){
    return read(KEYS.trash, []);
  }
  function trashProduct(product){
    if(!product) return;
    const prodId = String(product.id ?? product._id ?? "").trim();
    if(!prodId) return;
    markProductDeleted(prodId);
    if(product.barcode) markProductDeleted(product.barcode);
    const bin = getTrash().filter(p => String(p.id ?? p._id ?? "").trim() !== prodId);
    bin.unshift({ ...product, _trashedAt: Date.now() });
    write(KEYS.trash, bin);
    setProducts(getProducts().filter(p => String(p.id ?? p._id ?? "").trim() !== prodId));
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.deleteProductFromCloud){
      RealtimeSync.deleteProductFromCloud(prodId);
    }
    if(typeof Sync !== "undefined" && Sync.pushSnapshot){
      Sync.pushSnapshot(true).catch(() => {});
    }
  }
  // (2026-07-13) Support index & barcode in trash restore; was strict ID fail
  function restoreProductFromTrash(id, fallbackIdx = -1){
    const bin = getTrash();
    if(!bin || !bin.length) return false;
    let idx = -1;
    const cleanId = (id !== undefined && id !== null) ? String(id).trim() : "";
    if(cleanId && cleanId !== "undefined" && cleanId !== "null"){
      idx = bin.findIndex(p => 
        String(p.id ?? p._id ?? "").trim() === cleanId ||
        (p.barcode && String(p.barcode).trim() === cleanId) ||
        (p.name && String(p.name).trim().toLowerCase() === cleanId.toLowerCase())
      );
    }
    if(idx === -1 && typeof fallbackIdx === "number" && fallbackIdx >= 0 && fallbackIdx < bin.length){
      idx = fallbackIdx;
    }
    if(idx === -1) return false;
    const product = { ...bin[idx] };
    delete product._trashedAt;
    product.updatedAt = Date.now();
    // (2026-07-13) Unmark before save and restore title fallback; was reversed
    if(!product.name && (product.title || product.productName)) product.name = product.title || product.productName;
    if(!product.id){
      product.id = Utils.uid("prod");
    }
    const targetId = String(product.id).trim();
    unmarkProductDeleted(targetId);
    if(cleanId && cleanId !== "undefined") unmarkProductDeleted(cleanId);
    if(product.barcode) unmarkProductDeleted(product.barcode);
    const prods = getProducts().filter(p => String(p.id ?? p._id ?? "").trim() !== targetId);
    prods.push(product);
    setProducts(prods);
    const newBin = bin.filter((_, i) => i !== idx);
    write(KEYS.trash, newBin);
    cachedProducts = null;
    if(typeof RealtimeSync !== "undefined" && RealtimeSync.syncSingleProduct){
      RealtimeSync.syncSingleProduct(product);
    }
    if(typeof Sync !== "undefined" && Sync.pushSnapshot){
      Sync.pushSnapshot(true).catch(() => {});
    }
    return true;
  }
  function permanentlyDeleteFromTrash(id, fallbackIdx = -1){
    const bin = getTrash();
    if(!bin || !bin.length) return;
    let idx = -1;
    const cleanId = (id !== undefined && id !== null) ? String(id).trim() : "";
    if(cleanId && cleanId !== "undefined" && cleanId !== "null"){
      idx = bin.findIndex(p => 
        String(p.id ?? p._id ?? "").trim() === cleanId ||
        (p.barcode && String(p.barcode).trim() === cleanId) ||
        (p.name && String(p.name).trim().toLowerCase() === cleanId.toLowerCase())
      );
    }
    if(idx === -1 && typeof fallbackIdx === "number" && fallbackIdx >= 0 && fallbackIdx < bin.length){
      idx = fallbackIdx;
    }
    if(idx !== -1){
      write(KEYS.trash, bin.filter((_, i) => i !== idx));
    }
  }
  function purgeExpiredTrash(){
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    write(KEYS.trash, getTrash().filter(p => (now - (p._trashedAt || 0)) < THIRTY_DAYS));
  }
  function deleteProduct(id){
    // (2026-07-13) Delegate to trashProduct; was permanent removal
    const cleanId = String(id ?? "").trim();
    const product = getProducts().find(p => String(p.id ?? p._id ?? "").trim() === cleanId);
    if(product) trashProduct(product);
    else{
      if(id) markProductDeleted(id);
      setProducts(getProducts().filter(p => String(p.id ?? p._id ?? "").trim() !== cleanId));
      if(typeof RealtimeSync !== "undefined" && RealtimeSync.deleteProductFromCloud){
        RealtimeSync.deleteProductFromCloud(id);
      }
    }
  }
  // (2026-07-13) Support pack & piece barcodes; was single barcode match
  function findByBarcode(code){
    if(!code) return null;
    const clean = String(code).trim();
    return getProducts().find(p => p.barcode === clean || (p.piecesPerPack > 1 && p.packBarcode === clean));
  }
  function adjustStock(id, delta, reason = "Adjustment", supplier = ""){
    const products = getProducts();
    const p = products.find(x => x.id === id);
    if(!p) return;
    const oldStock = p.stock;
    p.stock = Math.max(0, Utils.round2(p.stock + delta));
    const newStock = p.stock;
    p.updatedAt = Date.now();
    setProducts(products);
    
    console.log(`[DB] 📊 Stock adjusted: ${p.name} from ${oldStock} to ${newStock} (${delta > 0 ? '+' : ''}${delta}) - Reason: ${reason}`);
    
    // (2026-08-26) Log ALL stock changes including negatives to track theft/damage; was positive only
    const log = getStockLog();
    log.unshift({ id: Utils.uid("log"), productId:id, productName:p.name, delta, reason, ts: Date.now() });
    setStockLog(log.slice(0,500));
    
    // Enhanced restock logging with negative quantity support
    if(delta !== 0){
      const qty = Math.abs(delta);
      const unitCost = p.cost || 0;
      const totalCost = delta > 0 ? qty * unitCost : -(qty * unitCost);
      
      addRestockLog({
        product_id: p.id,
        product_name: p.name,
        quantity_added: delta, // Can be negative for theft/damage
        unit_cost: unitCost,
        total_cost: totalCost,
        supplier_name: delta > 0 ? (supplier || p.distributor || p.brand || "Direct Supplier") : "N/A",
        reason: reason,
        oldStock: oldStock,
        newStock: newStock,
        timestamp: Date.now()
      });
      
      // Also sync the updated product
      if(typeof RealtimeSync !== "undefined" && RealtimeSync.syncSingleProduct){
        console.log('[DB] 🚀 Syncing stock adjustment to Firebase...');
        RealtimeSync.syncSingleProduct(p);
      }
    }
  }

  // (2026-07-13) Save custom items for autofill & stock; was unsaved
  function getCustomItems(){
    let items = read(KEYS.customItems, null);
    if(items === null){
      items = [];
      const sales = read(KEYS.sales, []);
      const seen = new Set();
      sales.forEach(s => {
        (s.items || []).forEach(it => {
          if(it.isCustom && it.name && it.name.trim().toLowerCase() !== "custom item" && !seen.has(it.name.trim().toLowerCase())){
            seen.add(it.name.trim().toLowerCase());
            items.push({ id: Utils.uid("cust"), name: it.name.trim(), price: it.price || 0, unit: it.unit || "pc" });
          }
        });
      });
      write(KEYS.customItems, items);
    }
    return items;
  }
  const setCustomItems = (v) => write(KEYS.customItems, v || []);
  function saveCustomItem(item){
    if(!item || !item.name) return null;
    const cleanName = item.name.trim();
    if(!cleanName || cleanName.toLowerCase() === "custom item") return null;
    const items = getCustomItems();
    const existingIdx = items.findIndex(x => x.name.toLowerCase() === cleanName.toLowerCase());
    const data = {
      name: cleanName,
      price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
      unit: item.unit || "pc",
      updatedAt: Date.now()
    };
    if(existingIdx >= 0){
      items[existingIdx] = { ...items[existingIdx], ...data };
    } else {
      items.push({ id: Utils.uid("cust"), ...data });
    }
    setCustomItems(items);

    const prods = getProducts();
    let prod = prods.find(p => p.name.trim().toLowerCase() === cleanName.toLowerCase());
    if(!prod){
      prod = {
        id: Utils.uid("prod"),
        name: cleanName,
        price: data.price,
        cost: 0,
        stock: 0,
        category: "Custom",
        unit: data.unit,
        unitType: "piece",
        piecesPerPack: 1,
        barcode: item.barcode || "",
        isCustom: true,
        createdAt: Date.now()
      };
      prods.push(prod);
      setProducts(prods);
    } else {
      let updated = false;
      if(data.price > 0 && prod.isCustom && prod.price !== data.price){
        prod.price = data.price;
        updated = true;
      }
      if(!prod.isCustom){
        prod.isCustom = true;
        updated = true;
      }
      if(updated) setProducts(prods);
    }
    return prod;
  }

  function getBackups(){ return read(KEYS.backups, []); }
  // (2026-07-13) Cap backups to 30 & prune >60d in IndexedDB; was 10 in storage
  function setBackups(b){
    const seen = new Set();
    const sanitized = [];
    const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
    (b || []).forEach(x => {
      if(!x || !x.id || seen.has(x.id)) return;
      if((x.createdAt || 0) < sixtyDaysAgo && sanitized.length >= 10) return;
      seen.add(x.id);
      const copy = { ...x };
      delete copy.data;
      sanitized.push(copy);
    });
    const capped = sanitized.slice(0, 30);
    return write(KEYS.backups, capped);
  }

  // (2026-07-13) Fix recursive backup nesting & add buildSnapshotAt; was bloat
  function saveBackup(rec){
    if(rec && rec.data && rec.data.backups){
      delete rec.data.backups;
    }
    const list = getBackups().filter(x => x.id !== rec.id);
    list.unshift(rec);
    return setBackups(list);
  }
  function deleteBackup(id){
    const list = getBackups().filter(x => x.id !== id);
    return setBackups(list);
  }

  // (2026-07-13) Limit historical backups to recent 7 days; was all history
  function populateHistoricalBackups(){
    const currentBackups = getBackups();
    if(currentBackups && currentBackups.length >= 7) return;
    const allSales = getSales();
    if(!allSales || !allSales.length) return;
    const salesByDay = new Map();
    allSales.forEach(s => {
      const d = new Date(s.ts).toLocaleDateString("en-CA");
      if(!salesByDay.has(d)) salesByDay.set(d, []);
      salesByDay.get(d).push(s);
    });
    const sortedDays = Array.from(salesByDay.keys()).sort().slice(-7);
    const existingDates = new Set(currentBackups.map(b => new Date(b.createdAt || 0).toLocaleDateString("en-CA")));
    let addedAny = false;
    let cumulativeCount = 0;
    sortedDays.forEach(dayStr => {
      const daySales = salesByDay.get(dayStr);
      cumulativeCount += daySales.length;
      if(!existingDates.has(dayStr)){
        const [y, m, d] = dayStr.split("-");
        const eodDate = new Date(Number(y), Number(m)-1, Number(d), 23, 59, 0, 0);
        const dateStr = eodDate.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " 11:59 PM";
        const bId = "backup_" + y + "-" + m + "-" + d + "_235900";
        currentBackups.push({
          id: bId,
          createdAt: eodDate.getTime(),
          dateStr,
          exportType: "automatic_1159",
          summary: {
            products: getProducts().length,
            sales: cumulativeCount,
            expenses: 0,
            fuelSales: 0
          }
        });
        existingDates.add(dayStr);
        addedAny = true;
      }
    });
    if(addedAny){
      currentBackups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setBackups(currentBackups.slice(0, 7));
    }
  }

  function buildSnapshotAt(timestamp){
    const prods = getProducts();
    const pastSales = getSales().filter(s => (s.ts || 0) <= timestamp);
    return {
      products: prods,
      categories: getCategories(),
      sales: pastSales,
      fuelSales: getFuelSales().filter(s => (s.ts || 0) <= timestamp),
      fuelConfig: getFuelConfig(),
      fuelDeliveries: getFuelDeliveries(),
      settings: getSettings(),
      users: getUsers(),
      cashiers: getCashiers(),
      heldSales: [],
      venueLeads: getVenueLeads(),
      bookings: getBookings(),
      restaurantBookings: getRestaurantBookings(),
      expenses: getExpenses().filter(e => (e.ts || 0) <= timestamp),
      stockLog: getStockLog(),
      restockLogs: getRestockLogs(),
      physicalAudits: getPhysicalAudits(),
      voidLogs: getVoidLogs(),
      shift: getShift(),
      backups: [],
      exportedAt: timestamp,
      version: 3
    };
  }

  // (2026-07-13) Manage physical count audits & snapshots; was missing audits
  function getPhysicalAudits(){ return read(KEYS.physicalAudits, []); }
  function setPhysicalAudits(list){ return write(KEYS.physicalAudits, list); }
  function savePhysicalAudit(audit){
    const list = getPhysicalAudits();
    list.unshift(audit);
    return setPhysicalAudits(list.slice(0, 100));
  }

  // ---------- full snapshot (for export + firestore sync) ----------
  // (2026-07-13) Include deletedSaleIds & customItems in snapshot. Prev: omitted
  function snapshot(){
    return {
      products:getProducts(), categories:getCategories(), sales:getSales(), fuelSales:getFuelSales(),
      fuelConfig:getFuelConfig(), fuelDeliveries:getFuelDeliveries(), settings:getSettings(), users:getUsers(),
      heldSales:getHeldSales(), kitchenOrders:getKitchenOrders(), venueLeads:getVenueLeads(), bookings:getBookings(),
      restaurantBookings:getRestaurantBookings(), expenses:getExpenses(),
      stockLog:getStockLog(), restockLogs:getRestockLogs(), physicalAudits:getPhysicalAudits(),
      // (2026-07-13) Include backup metadata in snapshot; was hardcoded empty array
      dayBalances:getDayBalances(), backups:getBackups().map(b=>{const c={...b};delete c.data;return c;}).slice(0,30), voidLogs:getVoidLogs(), shift:read(KEYS.shift, null), shiftLogs:getShiftLogs(), cashiers:getCashiers(),
      customItems: getCustomItems ? getCustomItems() : [],
      deletedSaleIds: Array.from(getDeletedSaleIds ? getDeletedSaleIds() : []),
      deletedProductIds: Array.from(getDeletedProductIds ? getDeletedProductIds() : []),
      // (2026-07-13) Include deletedShiftLogIds in DB snapshot; was omitted
      deletedShiftLogIds: Array.from(getDeletedShiftLogIds ? getDeletedShiftLogIds() : []),
      // (2026-07-13) Include branches and current branch in snapshot; was omitted
      branches: getBranches(), currentBranchId: getCurrentBranchId(),
      exportedAt: Date.now(), version:3
    };
  }
  // (2026-07-13) Timestamp merge products & sync deletedSaleIds. Prev: resurrect
  // (2026-07-13) Add forceOverwrite param; was always merging (older backups kept newer extras)
  function restoreSnapshot(snap, forceOverwrite = false){
    if(!snap) return;
    isSyncRestoring = true;
    try{
    if(snap.deletedProductIds && Array.isArray(snap.deletedProductIds)){
      // (2026-07-13) Ingest all snapshot deletedProductIds; was skipping active
      const curDeletedProds = getDeletedProductIds();
      snap.deletedProductIds.forEach(id => {
        if(id) curDeletedProds.add(String(id).trim());
      });
      write(KEYS.deletedProductIds, Array.from(curDeletedProds), true);
    }
    if(snap.deletedSaleIds && Array.isArray(snap.deletedSaleIds)){
      const curDeleted = getDeletedSaleIds();
      snap.deletedSaleIds.forEach(id => { if(id) curDeleted.add(String(id)); });
      write(KEYS.deletedSaleIds, Array.from(curDeleted), true);
    }
    if(snap.products && snap.products.length){
      if(forceOverwrite){
        // (2026-07-13) Full overwrite on manual restore; was merge (kept extras not in backup)
        setProducts(snap.products);
      } else {
        const delProds = getDeletedProductIds();
        const pMap = new Map();
        getProducts().forEach(p => { if(p?.id && !delProds.has(p.id)) pMap.set(p.id, p); });
        snap.products.forEach(p => {
          if(p?.id && !delProds.has(p.id)){
            const ex = pMap.get(p.id);
            pMap.set(p.id, !ex || (p.updatedAt || 0) >= (ex.updatedAt || 0) ? { ...ex, ...p } : { ...p, ...ex });
          }
        });
        setProducts(Array.from(pMap.values()));
      }
    } else if(forceOverwrite && snap.products && snap.products.length === 0){
      setProducts([]);
    }
    if(snap.categories && snap.categories.length) setCategories(snap.categories);
    if(snap.sales && snap.sales.length){
      if(forceOverwrite){
        // (2026-07-13) Full overwrite sales on manual restore; was merge (kept newer extras)
        setSales(snap.sales);
      } else {
        const existing = getSales();
        const deletedIds = getDeletedSaleIds();
        const sMap = new Map();
        const normalizeKey = (s) => String(s.receiptNo || s.id || "").trim().replace(/^TXN-/i, "");
        existing.forEach(s => {
          const k = normalizeKey(s);
          const sId = String(s.id || '').trim();
          if(k && !deletedIds.has(sId) && !deletedIds.has(sId.toLowerCase()) && !deletedIds.has(k) && !deletedIds.has(k.toLowerCase())){
            sMap.set(k, s);
          }
        });
        snap.sales.forEach(s => { 
          const k = normalizeKey(s); 
          const sId = String(s.id || "").trim();
          const rId = String(s.receiptNo || "").trim();
          const clean = sId.replace(/^TXN-/i, "");
          const isDeleted = deletedIds.has(sId) || deletedIds.has(sId.toLowerCase()) ||
                            deletedIds.has(rId) || deletedIds.has(rId.toLowerCase()) ||
                            deletedIds.has(clean) || deletedIds.has(clean.toLowerCase());
          if(k && !isDeleted){
            const curS = sMap.get(k);
            if(!curS || (s.ts || 0) >= (curS.ts || 0)){
              sMap.set(k, s);
            }
          }
        });
        const merged = Array.from(sMap.values()).sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setSales(merged);
      }
    } else if(forceOverwrite && snap.sales && snap.sales.length === 0){
      setSales([]);
    }
    if(snap.fuelSales) setFuelSales(snap.fuelSales);
    if(snap.fuelConfig){
      const curCfg = getFuelConfig();
      if(!curCfg){
        setFuelConfig(snap.fuelConfig);
      } else {
        const mergedCfg = { ...curCfg, ...snap.fuelConfig };
        mergedCfg.fuels = { ...(curCfg.fuels || {}) };
        if(snap.fuelConfig.fuels){
          Object.keys(snap.fuelConfig.fuels).forEach(ft => {
            const curFuel = mergedCfg.fuels[ft] || {};
            const remoteFuel = snap.fuelConfig.fuels[ft] || {};
            // (2026-07-13) Preserve tank delivery via recency; was Math.min erasing restock
            const remUpdated = remoteFuel.updatedAt || 0;
            const curUpdated = curFuel.updatedAt || 0;
            mergedCfg.fuels[ft] = {
              ...curFuel,
              ...remoteFuel,
              tank: remUpdated > curUpdated ? (remoteFuel.tank ?? curFuel.tank) : (curFuel.tank ?? remoteFuel.tank)
            };
          });
        }
        setFuelConfig(mergedCfg);
      }
    }
    if(snap.fuelDeliveries) setFuelDeliveries(snap.fuelDeliveries);
    if(snap.settings) setSettings({ ...DEFAULT_SETTINGS, ...snap.settings });
    if(snap.users) setUsers(snap.users);
    if(snap.cashiers) setCashiers(snap.cashiers);
    if(snap.heldSales) setHeldSales(snap.heldSales);
    // (2026-07-13) Restore kitchenOrders from snapshot; was omitted
    if(snap.kitchenOrders && Array.isArray(snap.kitchenOrders)) setKitchenOrders(snap.kitchenOrders);
    if(snap.venueLeads) setVenueLeads(snap.venueLeads);
    if(snap.bookings) setBookings(snap.bookings);
    if(snap.restaurantBookings) setRestaurantBookings(snap.restaurantBookings);
    if(snap.expenses) setExpenses(snap.expenses);
    // (2026-07-13) Safely merge restockLogs; was overwriting with empty remote
    if(snap.restockLogs && Array.isArray(snap.restockLogs) && snap.restockLogs.length){
      const curLogs = getRestockLogs();
      const rMap = new Map();
      curLogs.forEach(l => { if(l && l.id) rMap.set(l.id, l); });
      snap.restockLogs.forEach(l => {
        if(l && l.id){
          if(!rMap.has(l.id)) rMap.set(l.id, l);
          else {
            const old = rMap.get(l.id);
            if((l.updatedAt || l.ts || 0) >= (old.updatedAt || old.ts || 0)) rMap.set(l.id, { ...old, ...l });
          }
        }
      });
      setRestockLogs(Array.from(rMap.values()).sort((a,b)=>(b.ts||b.timestamp||0)-(a.ts||a.timestamp||0)));
    }
    if(snap.physicalAudits) setPhysicalAudits(snap.physicalAudits);
    if(snap.customItems && setCustomItems) setCustomItems(snap.customItems);
    // (2026-07-13) Safely merge backups in restoreSnapshot; was overwriting array
    if(snap.backups && Array.isArray(snap.backups) && snap.backups.length){
      const localBackups = getBackups();
      const bMap = new Map();
      localBackups.forEach(b => { if(b && b.id) bMap.set(b.id, b); });
      snap.backups.forEach(b => {
        if(b && b.id){
          if(!bMap.has(b.id)) bMap.set(b.id, b);
          else {
            const old = bMap.get(b.id);
            if(b.data && !old.data) bMap.set(b.id, { ...old, data: b.data });
          }
        }
      });
      setBackups(Array.from(bMap.values()).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }
    // (2026-07-13) Safely merge voidLogs; was overwriting array
    if(snap.voidLogs && Array.isArray(snap.voidLogs)){
      const localVoids = getVoidLogs();
      const vMap = new Map();
      localVoids.forEach(v => { if(v && v.id) vMap.set(String(v.id), v); });
      snap.voidLogs.forEach(v => { if(v && v.id && !vMap.has(String(v.id))) vMap.set(String(v.id), v); });
      setVoidLogs(Array.from(vMap.values()).sort((a,b)=>(b.ts||0)-(a.ts||0)));
    }
    // (2026-07-13) Safely merge shift and shiftLogs without wipe; was overwrite
    if(snap.shift){
      const curShift = read(KEYS.shift, null);
      if(!curShift || (snap.shift.updatedAt || snap.shift.closedAt || snap.shift.openedAt || 0) >= (curShift.updatedAt || curShift.closedAt || curShift.openedAt || 0)){
        setShift(snap.shift);
      }
    }
    // (2026-07-13) Merge deletedShiftLogIds and filter shiftLogs; was resurrecting
    if(snap.deletedShiftLogIds && Array.isArray(snap.deletedShiftLogIds)){
      const curDel = getDeletedShiftLogIds();
      snap.deletedShiftLogIds.forEach(id => { if(id) curDel.add(String(id).trim()); });
      write(KEYS.deletedShiftLogIds, Array.from(curDel), true);
    }
    if(snap.shiftLogs && Array.isArray(snap.shiftLogs)){
      const deletedIds = getDeletedShiftLogIds();
      const localLogs = getShiftLogs();
      // (2026-07-13) Update existing shift logs on snapshot merge; was omit if exists
      const logMap = new Map();
      localLogs.forEach(l => { if(l?.id && !deletedIds.has(String(l.id).trim())) logMap.set(String(l.id).trim(), l); });
      snap.shiftLogs.forEach(l => {
        if(!l?.id || deletedIds.has(String(l.id).trim())) return;
        const sId = String(l.id).trim();
        const existing = logMap.get(sId);
        if(!existing){
          logMap.set(sId, l);
        } else {
          const exTs = existing.updatedAt || existing.closedAt || existing.openedAt || 0;
          const incTs = l.updatedAt || l.closedAt || l.openedAt || 0;
          logMap.set(sId, incTs >= exTs ? { ...existing, ...l } : { ...l, ...existing });
        }
      });
      setShiftLogs(Array.from(logMap.values()).sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0)));
    }
    // (2026-07-13) Restore dayBalances from snapshot; was omitted
    if(snap.dayBalances) setDayBalances(snap.dayBalances);
    // (2026-07-13) Ingest and merge branches from snapshot; was omitted
    if(snap.branches && Array.isArray(snap.branches) && snap.branches.length){
      const curBranches = getBranches();
      const bMap = new Map();
      curBranches.forEach(b => { if(b && b.id) bMap.set(String(b.id), b); });
      snap.branches.forEach(b => {
        if(!b || !b.id) return;
        const bId = String(b.id);
        const existing = bMap.get(bId);
        bMap.set(bId, !existing || (b.updatedAt || 0) >= (existing.updatedAt || 0) ? { ...(existing || {}), ...b } : { ...b, ...existing });
      });
      setBranches(Array.from(bMap.values()));
    }
    } finally {
      isSyncRestoring = false;
    }
  }
  // (2026-07-13) Wipe IDB, memory & localStorage on wipeAll; was storage only
  function wipeAll(){
    memCache.clear();
    cachedProcessedSales = null;
    cachedProducts = null;
    cachedCategories = null;
    Object.values(KEYS).forEach(k => {
      try{ localStorage.removeItem(k); }catch(e){}
    });
    openIDB().then(db => {
      if(!db) return;
      try{
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).clear();
      }catch(e){}
    });
    init();
  }

  return {
    KEYS, init, categoryIcon, getDeviceId, getNextTransactionId,
    getProducts, setProducts, deduplicateProducts, addProduct, updateProduct, deleteProduct, findByBarcode, adjustStock,
    getTrash, trashProduct, restoreProductFromTrash, permanentlyDeleteFromTrash, purgeExpiredTrash,
    getCategories, setCategories,
    // (2026-07-13) Expose unmarkSaleDeleted & product tombstone APIs; was missing
    getSales, setSales, getDeletedSaleIds, markSaleDeleted, unmarkSaleDeleted, getDeletedProductIds, markProductDeleted, unmarkProductDeleted, getFuelSales, setFuelSales,
    getFuelConfig, setFuelConfig,
    getSettings, setSettings,
    getUsers, setUsers,
    getCashiers, setCashiers,
    // (2026-07-13) Export kitchen order management methods; was missing
    getKitchenOrders, setKitchenOrders, addKitchenOrder, updateKitchenOrderStatus, clearCompletedKitchenOrders,
    getHeldSales, setHeldSales,
    getVenueLeads, setVenueLeads,
    getStockLog, setStockLog,
    getRestockLogs, setRestockLogs, addRestockLog, updateRestockLog, deleteRestockLog,
    getPhysicalAudits, setPhysicalAudits, savePhysicalAudit,
    getVoidLogs, setVoidLogs, addVoidLog,
    getOfflineQueue, setOfflineQueue, queueOfflineTransaction,
    getExpenses, setExpenses, addExpense, deleteExpense,
    getBookings, setBookings, addBooking, updateBooking, deleteBooking,
    getRestaurantBookings, setRestaurantBookings, addRestaurantBooking, updateRestaurantBooking, deleteRestaurantBooking,
    getFuelDeliveries, setFuelDeliveries, addFuelDelivery,
    getBackups, setBackups, saveBackup, deleteBackup, buildSnapshotAt, populateHistoricalBackups,
    // (2026-07-13) Export mergeShiftLogs; was omitted
    getShift, setShift, getShiftLogs, setShiftLogs, mergeShiftLogs, saveShiftLog, deleteShiftLog,
    getDeletedShiftLogIds, markShiftLogDeleted,
    getDayBalances, setDayBalances,
    getSyncMeta, setSyncMeta,
    // (2026-07-13) Export sync baseline methods; was omitted from return
    getSyncBaseline, setSyncBaseline,
    getSavedCart, saveCart,
    getCustomItems, setCustomItems, saveCustomItem,
    // (2026-07-13) Export deduplicateSales for manual & auto dedupe; was omitted
    deduplicateSales,
    // (2026-07-13) Export branch CRUD and scoping APIs; was omitted
    getBranches, setBranches, getCurrentBranchId, setCurrentBranchId, getCurrentBranch, saveBranch, deleteBranch, getBranchSales, getBranchShiftLogs,
    // (2026-07-13) Export invalidateCache to clear in-memory state; was omitted
    snapshot, restoreSnapshot, wipeAll, invalidateCache
  };
})();
