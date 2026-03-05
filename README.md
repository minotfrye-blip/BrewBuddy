# Brew Buddy

A single-page coffee brewing app built around the Hoffmann Method / Clever Dripper / Oxo Grinder. Snap a photo of your coffee bag and it reads the label, generates an AI-powered brew recipe, and guides you through each brew with a step-by-step timer.

---

## Features

- **Bag scanner** — photo scans your coffee bag and auto-fills bean details
- **AI recipe generation** — generates a starting grind, temp, and steep time tuned to the specific bean
- **Brew timer** — full-screen step-by-step Hoffmann method timer with strobe alert and wake lock (screen stays on)
- **Tasting notes + AI analysis** — log notes after a brew, get grind adjustment recommendations
- **Brew history** — per-bean history on the recipe card, plus a unified log across all beans
- **Stats** — total brews, coffee consumed, caffeine, streak, most brewed bean, and more
- **My Beans** — manage your collection with freshness badges, photos, and date added

---

## What's in here

```
index.html          ← The full app (hosted on GitHub Pages)
worker/
  index.js          ← Cloudflare Worker (proxies AI requests, keeps API key secret)
  wrangler.toml     ← Worker config
```

---

## Setup Guide

Budget about 20–30 minutes total.

### Step 1: GitHub repo + Pages (5 min)

1. Go to [github.com/new](https://github.com/new) and create a new repo
   - Name it whatever you want (e.g., `brew-buddy`)
   - Make it **Public** (required for free GitHub Pages)
   - Click **Create repository**

2. Upload the files:
   - On the repo page, click **"uploading an existing file"**
   - Upload `index.html` to the root of the repo
   - Upload the `worker/` folder too (for safekeeping)
   - Click **Commit changes**

3. Enable GitHub Pages:
   - Go to **Settings** → **Pages** (left sidebar)
   - Under "Source", select **Deploy from a branch**
   - Branch: **main**, folder: **/ (root)**
   - Click **Save**
   - After a minute, your site will be live at:
     `https://YOUR-USERNAME.github.io/brew-buddy/`

The app works for manual entry at this point. Complete Steps 2–3 to enable photo scanning and AI features.

---

### Step 2: Anthropic API key (5 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
   - Sign up or log in (separate from Claude Pro)
   - Add a minimum of $5 credit under Settings → Billing

2. Create an API key:
   - Go to **API Keys** → **Create Key**
   - Name it something like "brew-buddy"
   - **Copy the key** — you'll need it in Step 3
   - Keep it secret. Never paste it into frontend code.

---

### Step 3: Cloudflare Worker (10–15 min)

The Worker is a small proxy that keeps your API key secure server-side. All three AI features (scan, recipe generation, brew analysis) route through it.

1. **Create a Cloudflare account** (free):
   - [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)

2. **Install Wrangler** (Cloudflare's CLI):
   ```bash
   npm install -g wrangler
   ```
   Requires Node.js. If you don't have it: [nodejs.org](https://nodejs.org)

3. **Log in to Cloudflare**:
   ```bash
   wrangler login
   ```

4. **Deploy the worker**:
   ```bash
   cd worker
   npx wrangler deploy
   ```
   After deploying, it'll print a URL like:
   ```
   https://coffee-scanner.YOUR-SUBDOMAIN.workers.dev
   ```
   **Copy this URL.**

5. **Add your API key as a secret**:
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
   Paste your Anthropic key when prompted. Stored securely in Cloudflare — never in your code.

6. **(Optional but recommended) Lock down CORS**:
   - Open `worker/wrangler.toml`
   - Uncomment and set your GitHub Pages URL:
     ```toml
     [vars]
     ALLOWED_ORIGIN = "https://YOUR-USERNAME.github.io"
     ```
   - Redeploy: `npx wrangler deploy`

---

### Step 4: Connect the app to your Worker (2 min)

1. Open `index.html` in your repo (click the file → pencil icon to edit)

2. Find this line near the top of the `<script>` section:
   ```javascript
   const WORKER_URL = "https://coffee-scanner.YOUR-SUBDOMAIN.workers.dev";
   ```

3. Replace it with your actual Worker URL from Step 3

4. Commit the change

5. Wait ~60 seconds for GitHub Pages to redeploy, then test

---

## Updating the app

**Quick edits:**
- Go to your repo on GitHub
- Click `index.html` → pencil icon → edit → commit
- GitHub Pages updates in about a minute

**Uploading a new version:**
- Go to your repo root
- Click **Add file → Upload files**
- Drag your updated `index.html` onto the drop zone
- Click **Commit changes**

**Updating the Worker** (only needed if `worker/index.js` changes):
```bash
cd worker
npx wrangler deploy
```

---

## Pin to iPhone Home Screen

1. Open your GitHub Pages URL in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Name it **Brew Buddy**, tap **Add**

Opens full-screen without Safari chrome, like a native app.

---

## Resetting app data

Open the **History** tab and scroll to the bottom — there's a **reset all data** link. Tap it, confirm, and the app resets to a clean slate.

---

## How billing works

| Service | Cost |
|---------|------|
| GitHub Pages | Free |
| Cloudflare Workers (free tier) | Free (100K requests/day) |
| Anthropic API — bag scan | ~$0.01–0.03 per scan |
| Anthropic API — recipe generation | ~$0.001 per bean added |
| Anthropic API — brew analysis | ~$0.001 per tasting note |

Realistically under $2/year for a single user.

---

## Troubleshooting

**Photo scan fails:**
- Check the browser console (Safari → Settings → Advanced → Web Inspector)
- Most common causes: Worker URL not updated in `index.html`, API key not set in Cloudflare, or zero API credit balance

**App won't load on GitHub Pages:**
- Make sure the repo is public
- Pages must be set to deploy from main branch, root folder

**Data disappeared:**
- The app stores everything in `localStorage`, tied to the specific domain
- Back up your data by opening the browser console and running:
  ```javascript
  JSON.stringify(localStorage.getItem('coffee-beans'))
  ```
  Save that string somewhere safe — you can restore it later with `localStorage.setItem('coffee-beans', '...')`
