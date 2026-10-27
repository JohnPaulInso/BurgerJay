# Multi-Branch System Implementation Plan

This document outlines the complete architectural design and rollout plan for introducing the **Multi-Branch Dropdown & Management System** to the Route 98 Minimart POS application.

---

## 1. Overview & Goals

- **Navbar Placement**: A modern, interactive branch selector chip and dropdown positioned in the topbar (between the clock and theme toggle / user profile).
- **Default State**: Initial default branch will be **Main Branch** (`branch_main`). All existing data seamlessly maps to Main Branch without loss or disruption.
- **Admin Management**: Admins (such as JP) can:
  - Add new branches (e.g., "Highway Branch", "Town Plaza Branch").
  - Rename and edit branch details.
- **Cashier Access**: Cashiers can easily switch between existing branches to record sales and shifts for their current assigned location.
- **Cloud Database Sync**: Branches and updates sync in real-time via Firebase Realtime Database (`branches/` node) and cloud Firestore snapshots.
- **Full Branch Isolation**: Inventory stock levels, cashier shifts, drawer balances, and daily transactions are scoped to the selected branch.

---

## 2. Data Model & Storage Design (`js/db.js`)

### A. Branch Schema
```json
{
  "id": "branch_main",
  "name": "Main Branch",
  "code": "MAIN",
  "address": "Route 98 Highway, Station 1",
  "isDefault": true,
  "status": "active",
  "createdAt": 1729000000000,
  "updatedAt": 1729000000000
}
```

### B. LocalStorage Keys (`DB.KEYS`)
- `mm_branches`: Array of branch objects. Defaults to `[{ id: "branch_main", name: "Main Branch", code: "MAIN", isDefault: true }]`.
- `mm_current_branch_id`: String ID of currently active branch (e.g., `"branch_main"`).

### C. Helper Methods in `DB`
- `DB.getBranches()`: Returns all active branches from memory/storage.
- `DB.getCurrentBranch()`: Returns the currently selected branch object (falls back to Main Branch).
- `DB.setCurrentBranch(branchId)`: Sets active branch ID, triggers topbar update, and refreshes the view.
- `DB.saveBranch(branchData)`: Creates a new branch or updates an existing one (name, code, address), setting `updatedAt`.
- `DB.deleteBranch(branchId)`: Marks branch as deleted or inactive (Main Branch cannot be deleted).

### D. Data Scoping & Backward Compatibility
- **Sales & Fuel Sales**: Stamped with `branchId: currentBranch.id`. Existing sales without a `branchId` implicitly belong to `"branch_main"`.
- **Shifts & Drawers**: Current shift (`DB.getShift()`) and logs (`DB.getShiftLogs()`) are filtered by `branchId`. Switching branches smoothly switches the active drawer context.
- **Inventory Quantities**: Product definitions remain accessible, while stock on hand is tracked per branch (`stockByBranch: { "branch_main": 120, "branch_2": 45 }`).

---

## 3. Real-Time Cloud Synchronization (`js/realtime-sync.js`)

1. **Firebase Realtime Database Path**:
   - `branches/{branchId}`: Real-time listener keeps branch names and additions synchronized across all connected terminals, tablets, and phones instantly.
2. **Sync Methods**:
   - `RealtimeSync.saveBranchToCloud(branch)`: Pushes branch creation or rename to `branches/${branch.id}`.
   - `RealtimeSync.listenToBranches(callback)`: Real-time watcher updating local `DB` whenever an admin adds or renames a branch on another device.
   - `RealtimeSync.deleteBranchFromCloud(branchId)`: Removes or tombstones branch in cloud.
3. **Firestore Snapshots**:
   - `branches` array included in full state snapshots (`Sync.pushSnapshot` / `pullSnapshot`).

---

## 4. UI / UX Design in Topbar (`js/app.js` & `css/base.css`)

### A. Topbar Dropdown Location
Positioned in `header.topbar`:
```html
<div class="branch-selector-wrap" id="branch-selector-wrap">
  <button class="branch-pill-btn" id="btn-branch-selector" title="Select Branch">
    <span class="branch-icon">${Icons.get("store", {size: 14})}</span>
    <span class="branch-current-name" id="topbar-branch-name">Main Branch</span>
    <span class="branch-arrow">${Icons.get("chevron-down", {size: 12})}</span>
  </button>
  
  <div class="branch-dropdown-menu hidden" id="branch-dropdown-menu">
    <div class="branch-dropdown-header">
      <span>Branches</span>
      ${isAdmin ? `<button class="btn btn-xs btn-primary font-bold" id="btn-add-branch-quick">+ Add</button>` : ""}
    </div>
    <div class="branch-list-container" id="branch-list-container">
      <!-- Dynamically generated list of branches with checkmarks and edit pencils for admins -->
    </div>
  </div>
</div>
```

### B. Interactive Features
- **Click to Switch**: Instant switch with active checkmark icon. Shows toast: *"Switched to [Branch Name]"*.
- **Admin Edit Action**: Pencil icon beside branch name in dropdown opens the **Edit Branch Modal**.
- **Admin Add Action**: `+ Add Branch` button opens the **New Branch Modal**.
- **Outside Click Dismiss**: Auto-closes dropdown when clicking anywhere outside.

---

## 5. Branch Management Modals (`Modalz.open`)

### A. Add Branch Modal
- Fields:
  - Branch Name (Required, e.g. "Highway Branch")
  - Branch Code / Tag (Optional, e.g. "HWY")
  - Address / Notes (Optional)
- Actions: `Cancel` and `Create Branch` (Primary).

### B. Edit / Rename Branch Modal
- Fields:
  - Branch Name (Pre-filled with current name)
  - Branch Code (Pre-filled)
  - Address (Pre-filled)
- Actions: `Cancel` and `Save Changes` (Primary).
- Validation: Name cannot be empty; Main Branch ID cannot be renamed into an empty string.

---

## 6. Implementation Checklist & Phases

- [ ] **Phase 1: Database & Storage Engine**
  - Add branch keys and CRUD methods to `js/db.js`.
  - Ensure safe fallback to Main Branch for legacy data.
- [ ] **Phase 2: Realtime Cloud Sync Integration**
  - Add `saveBranchToCloud` and real-time RTDB listener in `js/realtime-sync.js`.
- [ ] **Phase 3: Topbar UI & Dropdown Component**
  - Add branch selector pill & dropdown menu to `js/app.js`.
  - Style in `css/base.css` using theme variables (`--brand`, `--paper-raised`, `--line`).
- [ ] **Phase 4: Modals for Add & Rename**
  - Wire Admin modals for adding new branches and renaming existing ones.
- [ ] **Phase 5: Data Scoping Hookup**
  - Ensure POS sales, shifts, and drawer records respect the active branch.
- [ ] **Phase 6: Build & Test**
  - Run `node scripts/build.js` to compile assets to `www/`.
  - Verify branch switching, renaming, adding, and persistence.
