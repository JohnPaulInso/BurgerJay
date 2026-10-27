# Minimart POS Rebranding & Dark Green Theme Plan

This document is a comprehensive guide to rebranding this POS application from the current **Royal Blue ("Royal Counter")** brand into a **Dark Green ("Emerald Counter")** brand identity (or any other minimart theme in the future).

---

## 1. Design System Architecture

The application styling follows a centralized CSS Token architecture defined primarily in `css/tokens.css`, but also has component styles in `css/base.css`, `css/views.css`, and localized inline styles in key JavaScript view modules (`js/app.js`, `js/auth.js`, `js/pos.js`, `js/gasoline.js`, `js/shift.js`, and `js/venue.js`).

To rebrand successfully without breaking UI contrast, you need to update:
1. **CSS Design Tokens** (`css/tokens.css`)
2. **Hardcoded CSS Brand Classes & Accent Overrides** (`css/base.css`, `css/views.css`, `css/mobile-fixes.css`)
3. **Hardcoded Inline Colors in JavaScript** (`js/gasoline.js`, `js/venue.js`, `js/shift.js`, `js/reports.js`)
4. **App Metadata & Business Profile** (`js/db.js`, `index.html`, `manifest.json`, `sw.js`)
5. **Brand Graphic Assets & Icons** (`route98_logo.png`, `logo.png`, `icon.png`, favicons)

---

## 2. Dark Green Palette Tokens (Drop-in Replacement)

### Light Mode (`:root` in `css/tokens.css`)
| Token Name | Current Value (Royal Blue) | Rebrand Value (Dark Green) | Role / Usage |
|---|---|---|---|
| `--brand` | `#2F42D8` | `#0A6C3E` (or `#0F5132`) | Primary action buttons, active navigation indicator, focus outlines |
| `--brand-deep` | `#1E2C9C` | `#074526` | Hero figures, bold price labels, high-contrast totals, active state text |
| `--brand-bright` | `#5C74FF` | `#10B981` (Emerald-500) | Secondary highlight accents, badges, interactive toggles |
| `--brand-tint` | `#E9ECFC` | `#E6F7EF` (Mint Ice) | Background tint for active table rows, cart thumbnails, selected pills |
| `--shadow-brand` | `0 8px 20px rgba(47,66,216,.28)` | `0 8px 20px rgba(10,108,62,.24)` | Drop-shadow under primary checkout buttons and modals |
| `--paper` | `#F5F7FC` | `#F4F8F5` | Main viewport background with subtle cool sage undertone |
| `--paper-dim` | `#ECF0FA` | `#E9F1EC` | Inactive table headers, card borders, subtle chip fills |
| `--paper-raised` | `#FFFFFF` | `#FFFFFF` | Pure white surface for cards, modals, drawer inputs |
| `--line` | `#E1E5F2` | `#D8E5DD` | Primary hairline separators and table row borders |
| `--line-strong` | `#CBD1E8` | `#BED1C6` | Form input borders and card dividers |

### Dark Mode (`[data-theme="dark"]` in `css/tokens.css`)
| Token Name | Current Value (Royal Blue) | Rebrand Value (Dark Green) | Role / Usage |
|---|---|---|---|
| `--paper` | `#10131F` | `#0C1410` | Dark mode main background |
| `--paper-raised` | `#171B2C` | `#121E18` | Dark mode card & modal backgrounds |
| `--paper-dim` | `#0C0F19` | `#080E0B` | Dark mode sunken surfaces |
| `--brand-tint` | `#1B2050` | `#132B20` | Subtle green tint behind active dark-mode elements |
| `--line` | `#262C44` | `#1E3328` | Hairlines in dark mode |
| `--line-strong` | `#363E5C` | `#2B4738` | Strong outlines in dark mode |

---

## 3. CSS Classes & Specific Elements to Update

### A. Global & Navigation (`css/base.css`)
- `.brand-text strong`:
  - Current: `color: #182B68;` (Dark mode: `#AFC0FF;`)
  - Change to: `color: var(--brand-deep);` or `#074526;` (Dark mode: `#A7F3D0;`)
- `.nav-btn.active`:
  - Current: `background: linear-gradient(90deg, var(--brand-tint), transparent); color: var(--brand-deep); border-left-color: var(--brand);`
  - Dark mode: Change `color: #AFC0FF;` to `color: #A7F3D0;`
- `.btn-primary`:
  - Uses `background: var(--brand);` (will automatically inherit `#0A6C3E`)
- `.badge-brand`:
  - Uses `background: var(--brand-tint); color: var(--brand-deep);`
- `::selection`:
  - Change highlight color from blue tint to `rgba(16, 185, 129, 0.25)`

### B. POS & Cart Management (`css/views.css`)
- `.pos-search-wrap .input:focus`:
  - `border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-tint);`
- `.product-card .price`:
  - `color: var(--brand-deep);`
- `.product-card.custom-charge-card`:
  - `border: 1.5px dashed var(--brand); background: color-mix(in srgb, var(--brand-tint) 45%, var(--paper-raised));`
- `.custom-cart-price-input`:
  - `color: var(--brand-deep);`
- `.cart-head h3 .ic-svg`:
  - `color: var(--brand);`
- `.cart-line .thumb-sm`:
  - `background: var(--brand-tint);`
- `.cart-line .lt`:
  - `color: var(--brand-deep);`
- `.totals-row.grand`:
  - `color: var(--brand-deep);`
- `.btn-pay.is-ready`:
  - Change glow shadow `box-shadow: 0 14px 34px rgba(47,66,216,0.45), 0 0 0 2.5px var(--brand);` to `rgba(10,108,62,0.45)`.
- `.cash-preset-btn:hover`:
  - `background: var(--brand-tint); color: var(--brand-deep); border-color: var(--brand);`
- `.loy-cal-cell.is-selected .loy-cal-day-bubble`:
  - Remove hardcoded `#2F42D8` fallback: change `var(--brand, #2F42D8)` to `var(--brand, #0A6C3E)`.

### C. Cashier PIN Pad & Roles (`css/views.css`)
- `.role-toggle button.active`:
  - `background: var(--brand); box-shadow: 0 2px 8px rgba(10,108,62,0.3);`
- `.pin-dots .d.filled`:
  - `background: var(--brand); border-color: var(--brand); box-shadow: 0 0 10px rgba(10,108,62,0.35);`

### D. Mobile Overrides (`css/mobile-fixes.css`)
- Search for instances of `#2f42d8`:
  - Lines ~4103–4109: Update to `var(--brand)` or `#0A6C3E`.

---

## 4. DOM IDs & View Selectors to Check

| Element ID | File | Function | Change Required |
|---|---|---|---|
| `#topbar-title` | `js/app.js`, `www/index.html` | Top navigation branding title | Update text to new Minimart store name |
| `#sidebar-brand-title` | `js/app.js` | Sidebar brand name | Update brand header text |
| `#app-logo` / `.brand-mark img` | `js/app.js`, `js/auth.js` | Logo icon display | Point to new logo file or update `src="logo.png"` |
| `#receipt-logo` | `js/pos.js` | Printed thermal receipt logo | Replace graphic file `logo.png` |
| `#setting-business-name` | `js/settings.js` | Settings store name field | Set new store name in default config |
| `#setting-receipt-footer` | `js/settings.js` | Settings receipt greeting | Update "Salamat sa inyong pagbisita" text |

---

## 5. Hardcoded Hex Colors in JavaScript (Replace with CSS Tokens)

Several JavaScript view modules contain inline `#4F46E5` (Indigo) or `#2F42D8` that should be replaced with `var(--brand)` or Dark Green:

1. **`js/gasoline.js`**:
   - Change `border: 1.5px solid #4F46E5` to `border: 1.5px solid var(--brand);`
   - Change `background: #4F46E5` on `.btn-save-live-price`, `.btn-apply-srp`, and pump badges to `background: var(--brand);`
   - Change `color: #4F46E5` on `#preview-amount` to `color: var(--brand-deep);`
   - Change `.btn-srp-preset` pill colors from `#4F46E5; background: #EEF2FF; border: 1px solid #C7D2FE;` to `color: var(--brand-deep); background: var(--brand-tint); border: 1px solid var(--line-strong);`
2. **`js/shift.js`**:
   - Line ~934 View-only badge: Change `background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE;` to `background: var(--brand-tint); color: var(--brand-deep); border: 1px solid var(--line);`
3. **`js/venue.js`**:
   - Lines ~87, 125, 157, 203: Change `border-top: 2px solid #4F46E5;` and icon color `#4F46E5` to `var(--brand)`.
4. **`js/reports.js`**:
   - Chart color arrays for Top Selling Products: Replace blue/purple palette (`#3B82F6`, `#6366F1`, `#4F46E5`, `#2563EB`) with a harmonious dark emerald & forest green palette:
     - `['#0A6C3E', '#10B981', '#059669', '#34D399', '#047857', '#6EE7B7', '#065F46', '#A7F3D0']`

---

## 6. Business Data & Config Defaults (`js/db.js`)

In `js/db.js` under `DEFAULT_SETTINGS`:
```javascript
businessName: "Your Minimart Name", // e.g. "Emerald Minimart"
businessAddress: "Your Address",
businessPhone: "09XX-XXX-XXXX",
businessTin: "000-000-000-000",
receiptFooter: "Salamat sa inyong pagbisita! Come again.",
```

Also check the automated migration block in `js/db.js` (~line 315-325) where `updatedSettings.businessName` is set on first boot.

---

## 7. App Manifest, Service Worker & HTML Headers

1. **`index.html`**:
   - `<title>`: Change `Route 98 — Route98 POS System` to your new store name.
   - `<meta name="description">`: Update store description.
   - `<meta name="theme-color" content="#2F42D8">`: Update to `#0A6C3E`.
2. **`www/manifest.json`**:
   - `"name"`: Set to new Minimart full name.
   - `"short_name"`: Set to short name (e.g. for Android home screen icon).
   - `"theme_color"`: Update to `#0A6C3E`.
   - `"background_color"`: Update to `#0C1410` (or `#F4F8F5`).
3. **`www/sw.js`**:
   - Update cache version string `const CACHE_NAME = 'minimart-v1';` to force clients to invalidate old blue assets.

---

## 8. Graphic Assets Checklist

Replace the following files in the project root and `www/` directory with your new Dark Green logo and branding:

| Asset Path | Resolution / Format | Where Used |
|---|---|---|
| `route98_logo.png` | 512x512 PNG (transparent or circular) | App topbar, Lock/Login screen PIN pad |
| `logo.png` | High-res monochrome or green PNG | Thermal printed receipts |
| `icon.png` | 512x512 PNG | PWA install icon / fallback logo |
| `favicon.ico` | 32x32 / 48x48 ICO | Browser tab icon |
| `icon-192.png` | 192x192 PNG | Mobile home screen icon |
| `icon-512.png` | 512x512 PNG | Android splash / PWA full icon |
| `apple-touch-icon.png` | 180x180 PNG | iOS Safari home screen icon |

---

## 9. Rebrand Execution Steps

1. **Update `css/tokens.css`**: Paste in the Dark Green token values for `:root` and `[data-theme="dark"]`.
2. **Update `css/base.css` and `css/views.css`**: Replace the hardcoded `#182B68`, `#2F42D8`, and blue RGBA box-shadows.
3. **Replace Images**: Place the new green PNG logos in the project root (`route98_logo.png`, `logo.png`, `icon.png`).
4. **Update `js/db.js` & `index.html`**: Update the store title, TIN, receipt greetings, and default business settings.
5. **Compile Assets**:
   Run the build script:
   ```powershell
   node scripts/build.js
   ```
6. **Verify in Browser**: Test Light Mode, Dark Mode, Receipt Preview, POS Cart, Shift Management, and PIN login screen.
