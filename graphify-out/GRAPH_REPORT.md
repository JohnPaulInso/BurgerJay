# Graph Report - Minimart POS  (2026-10-27)

## Corpus Check
- Large corpus: 255 files · ~1,502,641 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1860 nodes · 4523 edges · 110 communities (51 shown, 59 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 146 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Database & Seeders
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- POS & Sales Operations
- Subsystem 24
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Realtime Cloud Sync
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- UI Modals & Dialogs
- POS & Sales Operations
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Subsystem 43
- Subsystem 44
- Subsystem 45
- Reports & Analytics Engine
- Reports & Analytics Engine
- UI Modals & Dialogs
- Reports & Analytics Engine
- Reports & Analytics Engine
- Subsystem 52
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Inventory & Stock Control
- Reports & Analytics Engine
- Realtime Cloud Sync
- Reports & Analytics Engine
- Reports & Analytics Engine
- Reports & Analytics Engine
- Subsystem 62
- UI Modals & Dialogs
- Reports & Analytics Engine
- POS & Sales Operations
- Subsystem 67
- Reports & Analytics Engine
- Reports & Analytics Engine
- Authentication & User Session
- Subsystem 71
- Subsystem 72
- Reports & Analytics Engine
- Database & Seeders
- Subsystem 76
- Database & Seeders
- Utilities & Icons
- Subsystem 79
- Inventory & Stock Control
- Utilities & Icons
- Subsystem 82
- UI Modals & Dialogs
- POS & Sales Operations
- Utilities & Icons
- Subsystem 87
- Reports & Analytics Engine
- Database & Seeders
- Subsystem 90
- Database & Seeders
- Utilities & Icons
- Subsystem 93
- Inventory & Stock Control
- Utilities & Icons
- Subsystem 96
- UI Modals & Dialogs
- POS & Sales Operations
- Utilities & Icons

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
- `runInventorySyncTest()` --calls--> `logPass()`  [EXTRACTED]
  tests/inventory/test-live-inventory.js → tests/helpers/test-runner.js

## Import Cycles
- None detected.

## Communities (110 total, 59 thin omitted)

### Community 0 - "Reports & Analytics Engine"
Cohesion: 0.04
Nodes (38): ai(), be(), beforeDraw(), beforeLayout(), cn(), d(), destroy(), Di() (+30 more)

### Community 1 - "Reports & Analytics Engine"
Cohesion: 0.04
Nodes (48): addElements(), ai(), at(), be(), beforeDatasetDraw(), beforeDatasetsDraw(), beforeDraw(), beforeLayout() (+40 more)

### Community 2 - "Reports & Analytics Engine"
Cohesion: 0.07
Nodes (20): afterDraw(), afterEvent(), afterUpdate(), Bi(), Ci(), Ee(), Fi(), f() (+12 more)

### Community 3 - "Reports & Analytics Engine"
Cohesion: 0.07
Nodes (19): afterEvent(), afterUpdate(), Bi(), Ci(), Ee(), Fi(), f(), Ie() (+11 more)

### Community 4 - "Reports & Analytics Engine"
Cohesion: 0.05
Nodes (16): Scanner, bt, color(), Cs, Ft(), It(), kt(), mt() (+8 more)

### Community 5 - "Reports & Analytics Engine"
Cohesion: 0.05
Nodes (17): Scanner, bt, color(), Cs, Ft(), It(), kt(), mt() (+9 more)

### Community 6 - "Reports & Analytics Engine"
Cohesion: 0.08
Nodes (6): As(), getBasePixel(), ns(), rt(), updateElements(), zs()

### Community 8 - "Reports & Analytics Engine"
Cohesion: 0.07
Nodes (11): buildLookupTable(), En, _generate(), _getTimestampsForTable(), init(), initOffsets(), lt(), no (+3 more)

### Community 9 - "Reports & Analytics Engine"
Cohesion: 0.07
Nodes (11): buildLookupTable(), En, _generate(), _getTimestampsForTable(), init(), initOffsets(), lt(), no (+3 more)

### Community 10 - "Reports & Analytics Engine"
Cohesion: 0.09
Nodes (4): an(), labelColor(), labelPointStyle(), onClick()

### Community 11 - "Reports & Analytics Engine"
Cohesion: 0.09
Nodes (5): an(), generateLabels(), ke(), removeBox(), stop()

### Community 12 - "Reports & Analytics Engine"
Cohesion: 0.08
Nodes (10): ca(), Do(), eo(), Gn(), n(), ne(), numeric(), Oe() (+2 more)

### Community 13 - "Reports & Analytics Engine"
Cohesion: 0.09
Nodes (27): buildTicks(), _calculateBarIndexPixels(), _calculateBarValuePixels(), determineDataLimits(), Fn(), Fo(), getLabelAndValue(), getLabelForValue() (+19 more)

### Community 14 - "Database & Seeders"
Cohesion: 0.05
Nodes (34): catalogSeed, categoriesSet, dataDir, existingCatalog, existingCatalogPath, existingProdByBarcode, existingProdById, existingProdByName (+26 more)

### Community 15 - "Reports & Analytics Engine"
Cohesion: 0.08
Nodes (13): a(), Ae(), Di(), getValueForPixel(), j(), ko, pi(), r() (+5 more)

### Community 16 - "Reports & Analytics Engine"
Cohesion: 0.07
Nodes (25): at(), beforeDatasetDraw(), beforeDatasetsDraw(), da(), dn(), e(), ei(), gi() (+17 more)

### Community 17 - "Reports & Analytics Engine"
Cohesion: 0.09
Nodes (8): Do(), eo(), n(), ne(), numeric(), Oe(), parsePrimitiveData(), resolveDataElementOptions()

### Community 18 - "Reports & Analytics Engine"
Cohesion: 0.11
Nodes (17): a(), aa(), afterDatasetsUpdate(), b(), g(), j(), ko, m() (+9 more)

### Community 19 - "Reports & Analytics Engine"
Cohesion: 0.09
Nodes (4): Ae(), _calculateBarValuePixels(), getValueForPixel(), xo

### Community 20 - "Reports & Analytics Engine"
Cohesion: 0.11
Nodes (25): ao(), average(), dataset(), getCenterPoint(), ho(), Hs, _i(), index() (+17 more)

### Community 21 - "Reports & Analytics Engine"
Cohesion: 0.11
Nodes (25): ao(), average(), dataset(), getCenterPoint(), ho(), Hs, _i(), index() (+17 more)

### Community 23 - "POS & Sales Operations"
Cohesion: 0.17
Nodes (23): playwright, { logPass, logFail, logStep, logHeader }, { test, expect }, { chromium }, { logPass, logFail, logStep, logHeader, isServerRunning, startServer }, runFullFlowTest(), isServerRunning(), launchMultiDeviceSession() (+15 more)

### Community 24 - "Subsystem 24"
Cohesion: 0.08
Nodes (25): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, description, devDependencies, playwright (+17 more)

### Community 25 - "Reports & Analytics Engine"
Cohesion: 0.13
Nodes (17): bo, et(), Fn(), Fo(), Gn(), go(), H(), ii() (+9 more)

### Community 26 - "Reports & Analytics Engine"
Cohesion: 0.08
Nodes (12): Auth, wn(), Dashboard, Expenses, Gas, Inventory, POS, Reports (+4 more)

### Community 27 - "Reports & Analytics Engine"
Cohesion: 0.08
Nodes (12): Auth, wn(), Dashboard, Expenses, Gas, Inventory, POS, Reports (+4 more)

### Community 29 - "Reports & Analytics Engine"
Cohesion: 0.13
Nodes (9): addBox(), afterDraw(), beforeUpdate(), configure(), initialize(), reset(), start(), u() (+1 more)

### Community 30 - "Reports & Analytics Engine"
Cohesion: 0.13
Nodes (17): b(), dn(), e(), ei(), g(), gi(), je(), m() (+9 more)

### Community 31 - "Realtime Cloud Sync"
Cohesion: 0.10
Nodes (18): barcodeMap, catalogSeed, categoriesSet, finalSales, fs, itemCatalogRows, itemRows, itemsByReceipt (+10 more)

### Community 32 - "Reports & Analytics Engine"
Cohesion: 0.15
Nodes (13): ct(), dt(), fs(), ge(), gs(), ms(), pa(), ps() (+5 more)

### Community 33 - "Reports & Analytics Engine"
Cohesion: 0.14
Nodes (16): buildTicks(), ca(), _calculateBarIndexPixels(), determineDataLimits(), getLabelAndValue(), getLabelForValue(), getPixelForTick(), getPixelForValue() (+8 more)

### Community 34 - "Reports & Analytics Engine"
Cohesion: 0.16
Nodes (5): bn, on(), pn(), xn(), Ye()

### Community 35 - "Reports & Analytics Engine"
Cohesion: 0.15
Nodes (4): bn, Mn(), on(), pn()

### Community 37 - "UI Modals & Dialogs"
Cohesion: 0.10
Nodes (15): filesToProcess, fs, path, replacements, fs, logoSrc, path, resDir (+7 more)

### Community 38 - "POS & Sales Operations"
Cohesion: 0.11
Nodes (16): detectedMisspells, duplicateReceipts, finalSales, fs, itemRows, itemsByReceipt, mergedSalesMap, outJsonPath (+8 more)

### Community 39 - "Reports & Analytics Engine"
Cohesion: 0.16
Nodes (7): ce(), de, dt(), he(), ia(), pa(), qs()

### Community 40 - "Reports & Analytics Engine"
Cohesion: 0.17
Nodes (11): ct(), fs(), ge(), gs(), ms(), ps(), i(), vs() (+3 more)

### Community 41 - "Reports & Analytics Engine"
Cohesion: 0.14
Nodes (10): addBox(), beforeUpdate(), configure(), initialize(), removeBox(), reset(), start(), stop() (+2 more)

### Community 43 - "Subsystem 43"
Cohesion: 0.12
Nodes (15): background_color, categories, description, dir, display, icons, lang, name (+7 more)

### Community 44 - "Subsystem 44"
Cohesion: 0.19
Nodes (12): { chromium }, clickAction(), COLORS, evalAction(), fillAction(), fs, http, path (+4 more)

### Community 45 - "Subsystem 45"
Cohesion: 0.12
Nodes (15): background_color, categories, description, dir, display, icons, lang, name (+7 more)

### Community 46 - "Reports & Analytics Engine"
Cohesion: 0.23
Nodes (4): fe(), ks(), nn(), sn

### Community 47 - "Reports & Analytics Engine"
Cohesion: 0.20
Nodes (4): ce(), de, he(), qs()

### Community 48 - "UI Modals & Dialogs"
Cohesion: 0.14
Nodes (9): fixes, fs, filesToProcess, fs, replacements, fs, lines, c (+1 more)

### Community 56 - "Inventory & Stock Control"
Cohesion: 0.18
Nodes (6): { defineConfig, devices }, @playwright/test, { logPass, logSkip, logFail, logStep, tryAction }, { test, expect }, { logPass, logSkip, logFail, logStep, tryAction }, { test, expect }

### Community 57 - "Reports & Analytics Engine"
Cohesion: 0.29
Nodes (4): fe(), ks(), nn(), sn

### Community 58 - "Realtime Cloud Sync"
Cohesion: 0.27
Nodes (4): RealtimeSync, Sync, RealtimeSync, Sync

### Community 59 - "Reports & Analytics Engine"
Cohesion: 0.29
Nodes (3): aa(), afterDatasetsUpdate(), onClick()

### Community 60 - "Reports & Analytics Engine"
Cohesion: 0.24
Nodes (4): bo, et(), H(), mo()

### Community 62 - "Subsystem 62"
Cohesion: 0.25
Nodes (6): fs, http, MIME, path, ROOT, server

### Community 63 - "UI Modals & Dialogs"
Cohesion: 0.25
Nodes (7): androidPublicDir, copyRecursive(), fs, itemsToCopy, outDir, path, srcDir

## Knowledge Gaps
- **4 isolated node(s):** `@capacitor/android`, `@capacitor/app`, `@capacitor/cli`, `@capacitor/core`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 451 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `an()` connect `Reports & Analytics Engine` to `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `s()` (e.g. with `ho()` and `ii()`) actually correct?**
  _`s()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@capacitor/android`, `@capacitor/app`, `@capacitor/cli` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Reports & Analytics Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.035474234503360715 - nodes in this community are weakly interconnected._
- **Why does `an()` connect `Reports & Analytics Engine` to `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Reports & Analytics Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.03732001175433441 - nodes in this community are weakly interconnected._
- **Why does `ns()` connect `Reports & Analytics Engine` to `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`, `Reports & Analytics Engine`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._