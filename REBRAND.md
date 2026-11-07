# BurgerJay POS & KDS — Complete Rebrand & Database Transfer Guide

This document records the complete transfer and rebranding process from **Route98 POS** into **BurgerJay POS & Kitchen Display System (KDS)**, including visual identity, fast-food burger station workflows, staff/cashier cleanup, menu asset import, database isolation, Firebase setup, Android/PWA configuration, and Git safety verification.

---

## 1. Brand Identity & Color Tokens (`css/tokens.css`, `css/base.css`, `css/views.css`, `css/mobile-fixes.css`)

Replaced the previous Emerald Green / Royal Blue palette with the **BurgerJay Crimson Red & Gold** palette inspired by the BurgerJay mascot logo:

### Light Mode (`:root` in `css/tokens.css`)
| Token Name | BurgerJay Value | Role / Usage |
|---|---|---|
| `--brand` | `#C5161D` | Primary BurgerJay Crimson Red (buttons, active nav, badges) |
| `--brand-deep` | `#7D0E13` | Deep Crimson (hero figures, prices, active labels, headings) |
| `--brand-bright` | `#F5B800` | BurgerJay Golden Yellow (highlights, secondary accents) |
| `--brand-gold` | `#D4971A` | Warm Gold border and badge accent |
| `--brand-tint` | `#FDECEC` | Soft Warm Blush tint for active rows, pills, and selected states |
| `--shadow-brand` | `0 8px 20px rgba(197,22,29,.26)` | Crimson glow shadow under primary checkout and KDS actions |
| `--paper` | `#FAF6F5` | Main background with warm cream undertone |
| `--paper-dim` | `#F3ECEA` | Subtle card header and chip surface |
| `--paper-raised` | `#FFFFFF` | Pure white card, slip, and modal surface |
| `--line` | `#E8DCD9` | Hairline borders and dividers |
| `--line-strong` | `#D6C3BE` | Input and card outlines |

### Dark Mode (`[data-theme="dark"]` in `css/tokens.css`)
| Token Name | BurgerJay Value | Role / Usage |
|---|---|---|
| `--paper` | `#160D0E` | Dark espresso-crimson main background |
| `--paper-raised` | `#211315` | Elevated dark card and modal surface |
| `--paper-dim` | `#10090A` | Sunken dark surface |
| `--brand-tint` | `#3A1518` | Subtle crimson tint behind active dark-mode elements |
| `--line` | `#382224` | Dark mode hairlines |
| `--line-strong` | `#523134` | Dark mode strong borders |

---

## 2. Graphic Assets, PWA, Build Scripts & Android Rebranding

1. **Logos & Icon Generation (`scripts/build.js`, `scripts/copy_icons.js`, `scripts/process_icons.ps1`)**:
   - Saved the BurgerJay mascot logo to `burgerjay_logo.png` and deleted `route98_logo.png`.
   - Updated `scripts/copy_icons.js` and `scripts/process_icons.ps1` to generate `icon.png`, `logo.png`, Android launcher mipmaps, and splash screens directly from `burgerjay_logo.png`.
   - Updated `scripts/build.js` to copy `assets/` and `burgerjay_logo.png` into `www/`.
2. **HTML, Manifest, Package & Service Worker**:
   - `index.html`: Title set to `BurgerJay — POS & Inventory System` and `meta[name="theme-color"]` set to `#C5161D`.
   - `manifest.json`: `name: "BurgerJay POS"`, `short_name: "BurgerJay"`, `theme_color: "#C5161D"`, `background_color: "#7D0E13"`.
   - `sw.js`: Cache name updated to `burgerjay-pos-v2` and shell cache updated with `./burgerjay_logo.png` and all 13 `./assets/*.png` menu images.
   - `package.json`: `"name": "burgerjay-pos"`, `"description": "BurgerJay POS and Kitchen Display System"`.
3. **Android & Capacitor (`capacitor.config.json`, `android/`, `a.bat`)**:
   - `capacitor.config.json`: `"appId": "com.burgerjay.pos"`, `"appName": "BurgerJay"`.
   - `android/app/build.gradle`: `namespace "com.burgerjay.pos"`, `applicationId "com.burgerjay.pos"`, `outputFileName = "burgerjay.apk"`.
   - `android/app/src/main/res/values/strings.xml`: `app_name` and `title_activity_main` set to `BurgerJay`, package set to `com.burgerjay.pos`.
   - `android/app/src/main/java/com/burgerjay/pos/MainActivity.java`: Moved package from `com.route98.pos` to `com.burgerjay.pos`.
   - `a.bat`: Updated Explorer target to `burgerjay.apk`.
4. **Exports, Receipts & Importers (`js/pos.js`, `js/shift.js`, `js/settings.js`, `js/expenses.js`, `js/dashboard.js`, `js/reports.js`)**:
   - Replaced all `Route 98` / `route98_` fallback store names, receipt headers, JSON backup filenames (`burgerjay_${id}.json`), CSV export filenames (`BurgerJay_...csv`), and report range keys (`bj_reports_range_state`).

---

## 3. Fast-Food Burger Station POS & KDS Features (`js/kitchen.js`, `css/kitchen.css`, `js/pos.js`, `css/views.css`)

1. **Register POS Refinements (`js/pos.js`, `css/views.css`)**:
   - **Taller Current Sale Widget Card**: Moved `.category-chips` (`#cat-chips`) inside `.pos-catalog` so the `Current Sale` widget card (`.pos-cart`) extends up to align directly beneath the `Scan Mode` / `Held` bar, maximizing cart height.
   - **Clean Product Cards Without Stock Badges**: Removed the green stock count badge (`100`) from POS product cards so menu tiles focus cleanly on food photos, names, and prices.
2. **Kitchen Display System (KDS) Layout & Workflow**:
   - **All Slips First**: Moved `All Slips` to the first tab position and made it the default view, sorting active orders (`queued`, `cooking`, `ready`) ahead of `completed` orders.
   - **Stress-Free Compact Tablet Tickets**: Scaled KDS cards so 3–4 slips fit side-by-side on a tablet screen. Removed redundant text (`MAIN BRANCH`, `Slip #...`, `Staff: ...`, `On the Grill / Fryer`, `ORDER ITEMS (TAP TO CHECK OFF)`, and the bottom `Slip` print button) leaving only the bold order code, Dine-In/Take-Out badge, elapsed timer, item rows, and status action button.
   - **2-Digit Table & Take-Out Codes**: Enforced 2-digit formatting (`T-01` to `T-99` for Dine-In, `TO-01` to `TO-99` for Take-Out — never 3-digit `TO-003`).
   - **One-Tap Batch Check-Off (`TO COOK NOW` Bar)**: Tapping any batch card in the top `TO COOK NOW` bar automatically checks off all matching unplated items across all active orders at once, with a quick `Undo` toast button.
3. **Four Core Burger Station Features**:
   - **Quick Flavor, Drink & Add-On Picker at POS (`js/pos.js`, `js/inventory.js`)**: Tapping Fries, Drinks, or Burger Combos (`Combo 1` to `Combo 4` and `Add Combo Meal`) opens a 1-tap modifier popup for Fries Flavor (`Cheese`, `BBQ`, `Sour Cream`, `Plain Salted`), Drink Choice (`Iced Tea`, `Cucumber`, `Blue Lemonade`, `Coke`, `Sprite`, `Royal`, `Mountain Dew`, `Bottled Water` — with an inline `✎ Edit / Add Drinks` manager), and Burger/Drink Add-Ons (`Extra Cheese`, `Extra Patty`, `No Onions`, `Extra Crispy`, `No Mayo`, `Spicy`, `Less Ice`, `Extra Ice`). Also added inline `+ Add Custom Category` and Drink/Flavor Choices editors directly inside the Add/Edit Product modal.
   - **Active / Occupied Table Indicator at Checkout (`js/pos.js`)**: Dine-In checkout checks active KDS orders, marks occupied tables (`04•`) with an amber busy indicator, defaults to the first free table, and warns the cashier if an occupied table is selected.
   - **Raw Ingredient / Recipe (BOM) Stock Deduction (`js/pos.js`)**: When a sale is finalized, products with a `recipe` array automatically deduct their raw ingredients (buns, patties, cheese slices, fries portions, cups, plus flavor powders and extra add-ons) from inventory and log each deduction in the stock log.
   - **Customer Order Status Screen (`js/kitchen.js`, `css/kitchen.css`)**: Added a `Customer Screen` tab with a `Full Screen TV` mode showing a split-screen `Preparing` vs. `Now Serving / Ready to Pick Up` number monitor for waiting customers.

---

## 4. BurgerJay Menu & Asset Import (`js/catalog_seed.js`, `js/db.js`, `js/utils.js`, `assets/`)

Imported all **17 BurgerJay menu items** across **5 categories** (`BURGERS`, `COMBOS`, `FRIES`, `HOTDOGS`, `ADD-ONS`) linked to the images in `assets/`:

| ID | Name | Category | Cost | Price | Stock | Unit | Image |
|---|---|---|---|---|---|---|---|
| `BJ-BRG-001` | ChixBurg Classic | BURGERS | ₱39.50 | ₱79.00 | 100 | pc | *(SVG Burger Illustration)* |
| `BJ-BRG-002` | ChixBurg Cheezo | BURGERS | ₱44.50 | ₱89.00 | 100 | pc | *(SVG Burger Illustration)* |
| `BJ-BRG-003` | ChixBurg Fresno | BURGERS | ₱49.50 | ₱99.00 | 100 | pc | *(SVG Burger Illustration)* |
| `BJ-BRG-004` | Hawaiian Blast! | BURGERS | ₱65.00 | ₱130.00 | 100 | pc | `assets/Hawaiian Blast.png` |
| `BJ-BRG-005` | Egg Champ | BURGERS | ₱65.00 | ₱130.00 | 100 | pc | `assets/Egg Champ.png` |
| `BJ-BRG-006` | Baconarian | BURGERS | ₱75.00 | ₱150.00 | 100 | pc | `assets/Baconarian.png` |
| `BJ-BRG-007` | Twin Pounder | BURGERS | ₱85.00 | ₱170.00 | 100 | pc | `assets/Twin Pounder.png` |
| `BJ-BRG-008` | Magnum Slam! | BURGERS | ₱100.00 | ₱200.00 | 100 | pc | `assets/Magnum Slam.png` |
| `BJ-BRG-009` | Triple Decker | BURGERS | ₱115.00 | ₱230.00 | 100 | pc | `assets/Triple Decker.png` |
| `BJ-HDG-001` | Cheezdog | HOTDOGS | ₱40.00 | ₱80.00 | 100 | pc | `assets/Cheezdog.png` |
| `BJ-FRS-001` | Fries | FRIES | ₱25.00 | ₱50.00 | 100 | order | `assets/Fries.png` |
| `BJ-FRS-002` | Bacon with Fries | FRIES | ₱75.00 | ₱150.00 | 100 | order | `assets/Bacon with Fries.png` |
| `BJ-ADD-001` | Add Combo Meal (Fries & Drink) | ADD-ONS | ₱35.00 | ₱70.00 | 100 | set | *(SVG Fries Illustration)* |
| `BJ-CMB-001` | Combo 1 (Cheezdog + Fries & Drink) | COMBOS | ₱50.00 | ₱100.00 | 100 | combo | `assets/Combo1.png` |
| `BJ-CMB-002` | Combo 2 (Meat Burger + Fries & Drink) | COMBOS | ₱65.00 | ₱130.00 | 100 | combo | `assets/Combo2.png` |
| `BJ-CMB-003` | Combo 3 (Egg Champ + Fries & Drink) | COMBOS | ₱85.00 | ₱170.00 | 100 | combo | `assets/Combo3.png` |
| `BJ-CMB-004` | Combo 4 (Twin Pounder + Fries & Drink) | COMBOS | ₱110.00 | ₱220.00 | 100 | combo | `assets/Combo4.png` |

---

## 5. Database Isolation, Staff Cleanup & Safety Verification (`js/db.js`, `js/sync.js`, `js/realtime-sync.js`)

Verified 100% isolation between **BurgerJay** and **Route 98** across Git, Firebase, IndexedDB, and LocalStorage:

| Layer | Route 98 (Untouched) | BurgerJay (Isolated) |
|---|---|---|
| **Git Remote (`origin`)** | `JohnPaulInso/Route98Pos.git` | `https://github.com/JohnPaulInso/BurgerJay.git` |
| **Firebase Project ID** | `route98-bogo` | `burgerjay-bogo` |
| **Realtime Database URL** | `route98-bogo-default-rtdb...` | `https://burgerjay-bogo-default-rtdb.asia-southeast1.firebasedatabase.app` |
| **Firestore Snapshot Collection** | `minimart_snapshots` | `burgerjay_snapshots` |
| **Firestore Sales Chunks** | `minimart_sales_chunks` | `burgerjay_sales_chunks` |
| **LocalStorage Prefix (`NS`)** | `minimart_` | `bj_` |
| **IndexedDB Name (`IDB_NAME`)** | `route98_pos_idb` | `burgerjay_pos_idb` |
| **BroadcastChannel** | `route98_pos_live_channel` | `burgerjay_pos_live_channel` |
| **Live Server Port** | `5515` | `5516` |
| **Default Staff & Cashiers** | Route98 Staff (`Rosella`, `Niño`, `Sharon`, `Ike`) | Only `Owner/Admin` (Route98 cashiers/staff stripped in getters/setters & sync) |

---

## 6. Register POS, Custom Categories & Drink Choice Enhancements (`js/pos.js`, `js/inventory.js`, `css/views.css`)

1. **Taller Current Sale Card & Cleaner Product Cards**:
   - Moved `#cat-chips` inside `.pos-catalog` so the right-hand `Current Sale` cart panel spans the full height of the catalog column.
   - Removed the stock badge (`<span class="stock-tag">`) from Register POS product cards for a clean restaurant menu appearance.
2. **Inline Custom Category Creation**:
   - Added a `+ Add Custom Category` button directly inside the `Add / Edit Product` modal (`js/inventory.js`) so new categories (such as `DRINKS`) can be created on the fly.
3. **Configurable Drink & Flavor Choices (Drinks & Combos 1–4)**:
   - Added editable `Drink / Flavor Choices` (`choices` array on products) with one-tap presets (`Iced Tea`, `Cucumber`, `Blue Lemonade`, `Coke`, `Sprite`, `Royal`, `Mountain Dew`, `Bottled Water`) in `Add / Edit Product`.
   - Pre-configured `Combo 1` through `Combo 4` and `Add Combo Meal (Fries & Drink)` with drink choices so cashiers are prompted to select the customer's drink alongside fries flavor and add-ons at checkout, forwarding all selections to the Kitchen Display System (KDS).
4. **Unified 2-Digit Card # System for Dine-In & Take-Out**:
   - Replaced `Table #` with a 2-digit `Card #` (`01`–`08` quick pills + `01`–`99` input with automatic leading-zero formatting) across Checkout (`js/pos.js`), printed receipts, and the Kitchen Display System (`js/kitchen.js`) so physical number cards can be handed out for both `Dine-In` and `Take-Out` orders.
