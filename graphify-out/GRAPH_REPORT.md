# Graph Report - Minimart POS  (2026-10-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1859 nodes · 4507 edges · 131 communities (62 shown, 69 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `080bdc42`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Components & Modals
- Chart.Umd.Min Module
- POS & Cart Management
- POS & Cart Management
- Barcode Scanner & Hardware
- Barcode Scanner & Hardware
- Database & Cloud Sync
- UI Components & Modals
- UI Components & Modals
- UI Components & Modals
- UI Components & Modals
- An() Module
- POS & Cart Management
- UI Components & Modals
- Inventory & Products
- UI Components & Modals
- . Drawdataset() Module
- POS & Cart Management
- UI Components & Modals
- Ae() Module
- POS & Cart Management
- POS & Cart Management
- Database & Cloud Sync
- POS & Cart Management
- Inventory & Products
- UI Components & Modals
- Authentication & Access Control
- Authentication & Access Control
- Addelements() Module
- UI Components & Modals
- .Register() Module
- Inventory & Products
- UI Components & Modals
- UI Components & Modals
- Bn Module
- .Constructor() Module
- .Isfortype() Module
- Transactions & Receipts
- Sales & Analytics Reporting
- Ce() Module
- UI Components & Modals
- UI Components & Modals
- Jn Module
- UI Components & Modals
- Authentication & Access Control
- UI Components & Modals
- .Constructor() Module
- Ce() Module
- UI Components & Modals
- . Computelabelarea() Module
- Jn Module
- .Clear() Module
- Android & Capacitor Bridge
- UI Components & Modals
- UI Components & Modals
- UI Components & Modals
- Authentication & Access Control
- Fe() Module
- Database & Cloud Sync
- Aa() Module
- UI Components & Modals
- Getbasepixel() Module
- Ref Http Module
- UI Components & Modals
- UI Components & Modals
- Android & Capacitor Bridge
- Gradlew Module
- Transactions & Receipts
- Labelcolor() Module
- .Getdatavisibility() Module
- Check Admin Status Module
- App Module
- App Module
- UI Components & Modals
- Csv-Importer Module
- Db Module
- Icons Module
- Importexport Module
- Core Utilities & Helpers
- Mobile-Touch-Fix Module
- UI Components & Modals
- Sales & Analytics Reporting
- Core Utilities & Helpers
- Process Icons.Ps1 Module
- Sw Module
- Sales & Analytics Reporting
- Catalog Seed Module
- Csv-Importer Module
- Db Module
- Icons Module
- Importexport Module
- Inventory & Products
- Core Utilities & Helpers
- Mobile-Touch-Fix Module
- UI Components & Modals
- Sales & Analytics Reporting
- Core Utilities & Helpers
- A.Ps1 Module
- UI Components & Modals
- UI Components & Modals
- Android & Capacitor Bridge
- Settings.Gradle Module
- Variables.Gradle Module
- Authentication & Access Control
- Database & Cloud Sync
- G.Ps1 Module
- www/js/icons.js
- www/js/importExport.js
- www/js/inventory-importer.js
- www/js/mobile.js
- www/js/mobile-touch-fix.js
- www/js/modal.js
- www/js/reports.js
- www/js/sales_seed.js
- www/js/settings.js
- www/js/shift.js
- www/js/utils.js

## God Nodes (most connected - your core abstractions)
1. `an()` - 64 edges
2. `an()` - 64 edges
3. `ns()` - 57 edges
4. `ns()` - 57 edges
5. `s()` - 43 edges
6. `s()` - 43 edges
7. `n()` - 37 edges
8. `n()` - 37 edges
9. `no` - 35 edges
10. `no` - 35 edges

## Surprising Connections (you probably didn't know these)
- `runFullFlowTest()` --calls--> `logHeader()`  [EXTRACTED]
  tests/full-flow/test-full-flow.js → tests/helpers/test-runner.js
- `runFullFlowTest()` --calls--> `logPass()`  [EXTRACTED]
  tests/full-flow/test-full-flow.js → tests/helpers/test-runner.js
- `runFullFlowTest()` --calls--> `logStep()`  [EXTRACTED]
  tests/full-flow/test-full-flow.js → tests/helpers/test-runner.js
- `runAllSuites()` --calls--> `runFullFlowTest()`  [EXTRACTED]
  tests/run-all.js → tests/full-flow/test-full-flow.js
- `runInventorySyncTest()` --calls--> `launchMultiDeviceSession()`  [EXTRACTED]
  tests/inventory/test-live-inventory.js → tests/helpers/test-runner.js

## Import Cycles
- None detected.

## Communities (131 total, 69 thin omitted)

### Community 0 - "UI Components & Modals"
Cohesion: 0.04
Nodes (23): be(), beforeLayout(), cn(), d(), destroy(), dn(), es(), getMaxOverflow() (+15 more)

### Community 1 - "Chart.Umd.Min Module"
Cohesion: 0.04
Nodes (32): at(), beforeLayout(), cn(), configure(), destroy(), es(), fe(), _generate() (+24 more)

### Community 2 - "POS & Cart Management"
Cohesion: 0.05
Nodes (38): at(), b(), ct(), e(), ei(), fs(), g(), ge() (+30 more)

### Community 3 - "POS & Cart Management"
Cohesion: 0.06
Nodes (16): Scanner, bt, color(), Cs, Ft(), It(), kt(), mt() (+8 more)

### Community 4 - "Barcode Scanner & Hardware"
Cohesion: 0.06
Nodes (15): Scanner, bt, color(), Cs, Ft(), It(), kt(), mt() (+7 more)

### Community 5 - "Barcode Scanner & Hardware"
Cohesion: 0.09
Nodes (3): As(), ns(), rt()

### Community 6 - "Database & Cloud Sync"
Cohesion: 0.07
Nodes (12): Ae(), buildLookupTable(), _calculateBarValuePixels(), _generate(), _getTimestampsForTable(), getValueForPixel(), initOffsets(), lt() (+4 more)

### Community 7 - "UI Components & Modals"
Cohesion: 0.10
Nodes (6): an(), ke(), wn(), Inventory, Restaurant, UISelect

### Community 8 - "UI Components & Modals"
Cohesion: 0.07
Nodes (11): buildLookupTable(), En, Fo(), _getTimestampsForTable(), init(), initOffsets(), lt(), no (+3 more)

### Community 9 - "UI Components & Modals"
Cohesion: 0.08
Nodes (35): ai(), ao(), average(), beforeDraw(), dataset(), draw(), getCenterPoint(), getRange() (+27 more)

### Community 10 - "UI Components & Modals"
Cohesion: 0.08
Nodes (35): ai(), ao(), average(), beforeDraw(), dataset(), draw(), getCenterPoint(), getRange() (+27 more)

### Community 11 - "An() Module"
Cohesion: 0.08
Nodes (31): aa(), b(), be(), e(), ei(), fs(), g(), ge() (+23 more)

### Community 12 - "POS & Cart Management"
Cohesion: 0.05
Nodes (34): catalogSeed, categoriesSet, dataDir, existingCatalog, existingCatalogPath, existingProdByBarcode, existingProdById, existingProdByName (+26 more)

### Community 13 - "UI Components & Modals"
Cohesion: 0.07
Nodes (16): a(), aa(), afterDatasetsUpdate(), buildTicks(), determineDataLimits(), Di(), En, ia() (+8 more)

### Community 14 - "Inventory & Products"
Cohesion: 0.09
Nodes (3): d(), Xs(), Y()

### Community 15 - "UI Components & Modals"
Cohesion: 0.09
Nodes (26): bo, _calculateBarIndexPixels(), et(), Fn(), Fo(), getPixelForTick(), getPixelForValue(), _getRuler() (+18 more)

### Community 16 - ". Drawdataset() Module"
Cohesion: 0.10
Nodes (4): As(), ns(), rt(), zs()

### Community 17 - "POS & Cart Management"
Cohesion: 0.11
Nodes (4): addElements(), nn(), sn, tn

### Community 18 - "UI Components & Modals"
Cohesion: 0.15
Nodes (12): afterUpdate(), Ee(), ki(), Le(), oa(), Oi(), p(), Si() (+4 more)

### Community 19 - "Ae() Module"
Cohesion: 0.15
Nodes (25): playwright, { logPass, logFail, logStep, logHeader }, { test, expect }, { chromium }, { logPass, logFail, logStep, logHeader, isServerRunning, startServer }, runFullFlowTest(), isServerRunning(), launchMultiDeviceSession() (+17 more)

### Community 20 - "POS & Cart Management"
Cohesion: 0.12
Nodes (8): Bi(), ca(), Ci(), Do(), eo(), Fi(), getBasePixel(), Oe()

### Community 21 - "POS & Cart Management"
Cohesion: 0.11
Nodes (3): an(), generateLabels(), ts()

### Community 22 - "Database & Cloud Sync"
Cohesion: 0.13
Nodes (6): ca(), Do(), Ee(), eo(), Le(), Oe()

### Community 23 - "POS & Cart Management"
Cohesion: 0.15
Nodes (8): a(), determineDataLimits(), Di(), ko, pi(), r(), ri(), v()

### Community 24 - "Inventory & Products"
Cohesion: 0.15
Nodes (4): afterDraw(), afterEvent(), f(), va

### Community 25 - "UI Components & Modals"
Cohesion: 0.14
Nodes (6): bn, dn(), on(), pn(), un(), xn()

### Community 26 - "Authentication & Access Control"
Cohesion: 0.10
Nodes (8): ke(), Expenses, Gas, Inventory, POS, Restaurant, UISelect, Venue

### Community 27 - "Authentication & Access Control"
Cohesion: 0.14
Nodes (5): beforeUpdate(), bn, initialize(), on(), pn()

### Community 28 - "Addelements() Module"
Cohesion: 0.09
Nodes (15): fixes, fs, filesToProcess, fs, replacements, fs, lines, c (+7 more)

### Community 29 - "UI Components & Modals"
Cohesion: 0.10
Nodes (18): barcodeMap, catalogSeed, categoriesSet, finalSales, fs, itemCatalogRows, itemRows, itemsByReceipt (+10 more)

### Community 30 - ".Register() Module"
Cohesion: 0.15
Nodes (7): Ae(), beforeDatasetDraw(), beforeDatasetsDraw(), da(), Ie(), na(), ze()

### Community 32 - "UI Components & Modals"
Cohesion: 0.10
Nodes (15): filesToProcess, fs, path, replacements, fs, logoSrc, path, resDir (+7 more)

### Community 33 - "UI Components & Modals"
Cohesion: 0.13
Nodes (9): bo, et(), is(), s(), ne(), numeric(), pt(), ss() (+1 more)

### Community 34 - "Bn Module"
Cohesion: 0.11
Nodes (16): detectedMisspells, duplicateReceipts, finalSales, fs, itemRows, itemsByReceipt, mergedSalesMap, outJsonPath (+8 more)

### Community 35 - ".Constructor() Module"
Cohesion: 0.18
Nodes (6): beforeDatasetDraw(), beforeDatasetsDraw(), da(), Ie(), na(), ze()

### Community 36 - ".Isfortype() Module"
Cohesion: 0.16
Nodes (11): buildTicks(), Fn(), go(), ii(), parse(), parseArrayData(), parseObjectData(), parsePrimitiveData() (+3 more)

### Community 37 - "Transactions & Receipts"
Cohesion: 0.18
Nodes (4): _calculateBarValuePixels(), getValueForPixel(), updateElements(), xo

### Community 38 - "Sales & Analytics Reporting"
Cohesion: 0.12
Nodes (16): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, description, devDependencies, playwright (+8 more)

### Community 40 - "UI Components & Modals"
Cohesion: 0.18
Nodes (5): ce(), de, dt(), he(), qs()

### Community 41 - "UI Components & Modals"
Cohesion: 0.19
Nodes (6): ce(), ct(), de, dt(), he(), ia()

### Community 42 - "Jn Module"
Cohesion: 0.12
Nodes (15): background_color, categories, description, dir, display, icons, lang, name (+7 more)

### Community 43 - "UI Components & Modals"
Cohesion: 0.19
Nodes (12): { chromium }, clickAction(), COLORS, evalAction(), fillAction(), fs, http, path (+4 more)

### Community 44 - "Authentication & Access Control"
Cohesion: 0.12
Nodes (15): background_color, categories, description, dir, display, icons, lang, name (+7 more)

### Community 47 - "Ce() Module"
Cohesion: 0.20
Nodes (6): addBox(), beforeUpdate(), initialize(), reset(), start(), u()

### Community 48 - "UI Components & Modals"
Cohesion: 0.21
Nodes (9): _calculateBarIndexPixels(), getPixelForTick(), getPixelForValue(), _getRuler(), _getStackCount(), _getStackIndex(), _getStacks(), In() (+1 more)

### Community 49 - ". Computelabelarea() Module"
Cohesion: 0.16
Nodes (10): ea(), fa(), ga(), ha, la(), pa(), ra(), sa() (+2 more)

### Community 50 - "Jn Module"
Cohesion: 0.23
Nodes (4): getLabelAndValue(), getLabelForValue(), n(), resolveDataElementOptions()

### Community 52 - "Android & Capacitor Bridge"
Cohesion: 0.16
Nodes (10): ea(), fa(), ga(), ha, la(), pa(), ra(), sa() (+2 more)

### Community 56 - "Authentication & Access Control"
Cohesion: 0.20
Nodes (3): Mn(), removeBox(), stop()

### Community 57 - "Fe() Module"
Cohesion: 0.26
Nodes (3): getBasePixel(), update(), updateElements()

### Community 59 - "Aa() Module"
Cohesion: 0.25
Nodes (5): addBox(), configure(), start(), u(), vn()

### Community 60 - "UI Components & Modals"
Cohesion: 0.35
Nodes (4): afterDraw(), Oi(), Si(), x()

### Community 62 - "Ref Http Module"
Cohesion: 0.29
Nodes (4): fe(), ks(), nn(), sn

### Community 63 - "UI Components & Modals"
Cohesion: 0.27
Nodes (3): labelColor(), labelPointStyle(), onClick()

### Community 64 - "UI Components & Modals"
Cohesion: 0.28
Nodes (3): Mn(), removeBox(), stop()

### Community 65 - "Android & Capacitor Bridge"
Cohesion: 0.22
Nodes (4): RealtimeSync, Sync, RealtimeSync, Sync

### Community 66 - "Gradlew Module"
Cohesion: 0.22
Nodes (9): scripts, build, cap, sync, test:e2e, test:flow, test:inventory, test:receipts (+1 more)

### Community 67 - "Transactions & Receipts"
Cohesion: 0.31
Nodes (5): Bi(), Ci(), Fi(), f(), zi()

### Community 68 - "Labelcolor() Module"
Cohesion: 0.33
Nodes (4): getLabelAndValue(), getLabelForValue(), parsePrimitiveData(), resolveDataElementOptions()

### Community 69 - ".Getdatavisibility() Module"
Cohesion: 0.25
Nodes (4): { defineConfig, devices }, @playwright/test, { logPass, logSkip, logFail, logStep, tryAction }, { test, expect }

### Community 70 - "Check Admin Status Module"
Cohesion: 0.25
Nodes (7): androidPublicDir, copyRecursive(), fs, itemsToCopy, outDir, path, srcDir

### Community 71 - "App Module"
Cohesion: 0.33
Nodes (3): ki(), to(), wi()

## Knowledge Gaps
- **4 isolated node(s):** `@capacitor/android`, `@capacitor/app`, `@capacitor/cli`, `@capacitor/core`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 465 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `an()` connect `POS & Cart Management` to `UI Components & Modals`, `POS & Cart Management`, `.Constructor() Module`, `UI Components & Modals`, `UI Components & Modals`, `Authentication & Access Control`, `Authentication & Access Control`, `Aa() Module`, `Getbasepixel() Module`, `UI Components & Modals`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `s()` (e.g. with `ho()` and `ii()`) actually correct?**
  _`s()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@capacitor/android`, `@capacitor/app`, `@capacitor/cli` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components & Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.039304123711340205 - nodes in this community are weakly interconnected._
- **Why does `an()` connect `UI Components & Modals` to `UI Components & Modals`, `Chart.Umd.Min Module`, `UI Components & Modals`, `UI Components & Modals`, `UI Components & Modals`, `An() Module`, `Ce() Module`, `POS & Cart Management`, `UI Components & Modals`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Chart.Umd.Min Module` be split into smaller, more focused modules?**
  _Cohesion score 0.03751065643648764 - nodes in this community are weakly interconnected._
- **Why does `ns()` connect `Barcode Scanner & Hardware` to `Chart.Umd.Min Module`, `.Isfortype() Module`, `Transactions & Receipts`, `Barcode Scanner & Hardware`, `UI Components & Modals`, `UI Components & Modals`, `Jn Module`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._