# 🧪 How to Test PatternFlow

Follow these steps to run and test your new Web3 AI Forecasting Platform.

## 1. Start the Development Server
Open your terminal in the project directory (`workspace-99190f76...`) and run:
```bash
npm run dev
```
Once started, open your browser to [http://localhost:3000](http://localhost:3000).

---

## 2. Testing the Neural Signal Feed (Bot Integration)
**Goal:** Verify that the app is reading your local bot files.

1.  **Look at the top of the dashboard.** You should see the "Neural Signal Feed" section.
2.  **Toggle the Tabs:**
    *   **Bounty Seeker**: You should see a table of trades. These mimic the data from your `/bounty seeker/bounty_seeker_status.json` file.
    *   **Short Hunter**: Click the tab to see the latest "Market Update" card, pulled from your `/short hunter/discord_update.json`.
3.  **Active Verification**: If you want to verify it's live:
    *   Open one of the JSON files in a text editor.
    *   Change a value (e.g., change the `price` of a trade).
    *   Save the file.
    *   Watch the web app—it should auto-update within 60 seconds (or refresh the page to see it immediately).

---

## 3. Testing the Payment System ($ZOID Focus)
**Goal:** specific pricing for ZOID/CLAWNCH vs USDC.

1.  **Initial State**: The "Structural Forecasting AI" section (bottom half) should be **blurred/locked**.
2.  **Connect Wallet**: Click the **"Connect Wallet"** button in the top right or on the overlay. It will simulate a connection (address: `0x742d...`).
3.  **Open Payment Modal**: Click **"Unlock Access"**.
4.  **Select Currency**:
    *   **USDC**: Note the price is **$3.00**.
    *   **$ZOID**: Click this option. Note the price changes to **$1.50** (50% Discount).
    *   **$CLAWNCH**: Click this option. Note the price is also **$1.50**.
5.  **Complete Payment**:
    *   Click the "Pay" button.
    *   Wait for the "Confirming Transaction" animation.
    *   Wait for "Access Granted".
6.  **Verify Unlock**:
    *   The modal closes.
    *   The "Structural Forecasting AI" section is now **visible** and interactive.
    *   The timer in the header starts counting down.

---

## 4. Visual & UI Checks
1.  **Dark Mode**: The app should be in dark mode by default with "Aurora" (glowing green/teal) text effects on the logo.
2.  **Responsiveness**: Resize your browser window to mobile size.
    *   The Signal Feed should stack vertically.
    *   The Navigation bar should adapt.
3.  **Interactive Charts**: Click on any of the now-unlocked "Forecast Cards" (e.g., Bitcoin/Ethereum).
    *   A Detailed Analysis view should appear on the right.
    *   The price chart should load.

## ⚠️ Troubleshooting
- **"Failed to fetch signals"**: If you see this, ensure the paths in `api/signals/route.ts` exactly match where your bot files are on your computer. Currently set to:
  - `/Users/bishop/Desktop/output/short hunter/discord_update.json`
  - `/Users/bishop/Desktop/output/bounty seeker/bounty_seeker_status.json`
