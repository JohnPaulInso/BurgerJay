# Firebase Project Setup & Database Rebrand Guide

Use this reusable step-by-step checklist whenever cloning or rebranding this POS system for a new business or client.

---

## Step 1: Isolate Local Browser Storage (`js/db.js`)
Before connecting a new Firebase project, update the local storage namespace so the new app does not share browser cache with any previous project:
1. Open `js/db.js`.
2. Change `const NS = "bj_";` to a unique prefix for the new brand (e.g., `"newbrand_"`).
3. Change `const IDB_NAME = "burgerjay_pos_idb";` to a unique IndexedDB name (e.g., `"newbrand_pos_idb"`).
4. In `js/realtime-sync.js`, update `SYNC_QUEUE_KEY` and the `mm:dirty` key checks to match the new prefix.

---

## Step 2: Create the New Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com) and sign in.
2. Click **Create a project** (or **Add project**).
3. Enter the project name (e.g., `BurgerJay-POS`) and click **Continue**.
4. Disable **Google Analytics** (not required for POS operations) and click **Create project**.
5. Once provisioned, click **Continue**.

---

## Step 3: Register the Web App
1. On the **Project Overview** page, click the **Web** icon (`</>`) under *Get started by adding Firebase to your app*.
2. Enter an app nickname (e.g., `BurgerJay Web POS`).
3. Leave **Firebase Hosting** unchecked and click **Register app**.
4. Copy the `firebaseConfig` object values (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
5. Click **Continue to console**.

---

## Step 4: Enable Cloud Firestore Database
1. In the left sidebar, open **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Select the closest region (e.g., `asia-southeast1` Singapore) and click **Next**.
4. Choose **Start in test mode** and click **Create**.
5. Open the **Rules** tab at the top of Firestore, update the rule so it does not expire after 30 days:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
6. Click **Publish**.

---

## Step 5: Enable Realtime Database (Instant Multi-Device & Kitchen Sync)
1. In the left sidebar, open **Build** -> **Realtime Database**.
2. Click **Create Database**.
3. Choose **Singapore (`asia-southeast1`)** and click **Next**.
4. Select **Start in test mode** and click **Enable**.
5. Copy the **Database URL** shown at the top of the data view (e.g., `https://burgerjay-bogo-default-rtdb.asia-southeast1.firebasedatabase.app`).
6. Open the **Rules** tab in Realtime Database and set unrestricted POS sync rules:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
7. Click **Publish**.

---

## Step 6: Save Credentials into `js/db.js`
1. Open `js/db.js` and locate `DEFAULT_SETTINGS.firebaseConfig`.
2. Paste the new values:
   ```javascript
   firebaseConfig: {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.firebasestorage.app",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID",
     databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app"
   }
   ```
3. Run `node scripts/build.js` to compile the updated configuration to `www/`.

