# Coffee Brewing Assistant

Hoffmann Method / Clever Dripper / Oxo Grinder

A single-page coffee brewing app with AI-powered bag scanning. Snap a photo of your coffee bag and it reads the label to auto-fill bean details and generate a brew recipe.

---

## What's in here

```
index.html          ← The app (hosted on GitHub Pages)
worker/
  index.js          ← Cloudflare Worker (proxies AI requests)
  wrangler.toml     ← Worker config
```

---

## Setup Guide

There are three things to set up. Budget about 20-30 minutes total.

### Step 1: GitHub repo + Pages (5 min)

1. Go to [github.com/new](https://github.com/new) and create a new repo
   - Name it whatever you want (e.g., `coffee-brewer`)
   - Make it **Public** (required for free GitHub Pages)
   - Click **Create repository**

2. Upload the files:
   - On the repo page, click **"uploading an existing file"** (or drag and drop)
   - Upload `index.html` to the root of the repo
   - Upload the `worker/` folder too (for safekeeping, it won't affect Pages)
   - Click **Commit changes**

3. Enable GitHub Pages:
   - Go to **Settings** → **Pages** (left sidebar)
   - Under "Source", select **Deploy from a branch**
   - Branch: **main**, folder: **/ (root)**
   - Click **Save**
   - After a minute, your site will be live at:
     `https://YOUR-USERNAME.github.io/coffee-brewer/`

At this point the app works for everything except photo scanning. Let's fix that.

---

### Step 2: Anthropic API key (5 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
   - Sign up or log in (this is separate from your Claude Pro account)
   - You'll need to add a minimum of $5 credit (Settings → Billing)

2. Create an API key:
   - Go to **API Keys** in the console
   - Click **Create Key**
   - Name it something like "coffee-scanner"
   - **Copy the key** -- you'll need it in the next step
   - Keep it secret. Don't paste it into any frontend code.

---

### Step 3: Cloudflare Worker (10-15 min)

This is the small proxy that keeps your API key safe.

1. **Create a Cloudflare account** (free):
   - Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)

2. **Install Wrangler** (Cloudflare's CLI tool):
   ```bash
   npm install -g wrangler
   ```
   (Requires Node.js. If you don't have it: [nodejs.org](https://nodejs.org))

3. **Log in to Cloudflare**:
   ```bash
   wrangler login
   ```
   This opens a browser window to authenticate.

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
   Paste your Anthropic API key when prompted. This stores it securely in Cloudflare -- it never appears in your code.

6. **(Optional but recommended) Lock down CORS**:
   - Open `worker/wrangler.toml`
   - Uncomment the `ALLOWED_ORIGIN` line and set it to your GitHub Pages URL:
     ```toml
     [vars]
     ALLOWED_ORIGIN = "https://YOUR-USERNAME.github.io"
     ```
   - Redeploy: `npx wrangler deploy`

---

### Step 4: Connect the app to your worker (2 min)

1. Open `index.html` in your repo (on GitHub, click the file, then the pencil icon to edit)

2. Find this line near the top of the `<script>` section:
   ```javascript
   const SCANNER_WORKER_URL = "https://coffee-scanner.YOUR-SUBDOMAIN.workers.dev";
   ```

3. Replace it with your actual worker URL from Step 3

4. Commit the change

5. Wait ~60 seconds for GitHub Pages to update, then test it

---

## Pin to iPhone Home Screen

1. Open your GitHub Pages URL in Safari
2. Tap the **Share** button (square with arrow)
3. Tap **Add to Home Screen**
4. Name it, tap **Add**

It opens full-screen without Safari chrome, like a native app.

---

## Making changes later

**Quick edits:** Click any file on GitHub.com, hit the pencil icon, edit, commit. GitHub Pages updates in about a minute.

**Bigger changes with Claude:** Paste the HTML into a Claude conversation, describe what you want changed, download the result, then upload it to the repo (or paste it into the GitHub editor).

---

## How billing works

| Service | Cost |
|---------|------|
| GitHub Pages | Free |
| Cloudflare Workers (free tier) | Free (100K requests/day) |
| Anthropic API | ~$0.01-0.03 per photo scan |

You'll use maybe a few scans per week. Realistically under $2/year in API costs.

---

## Troubleshooting

**Photo scan fails:** Check the browser console (Safari → Settings → Advanced → Web Inspector). Common issues:
- Worker URL not updated in `index.html`
- API key not set as secret in Cloudflare
- API credit balance is zero

**App won't load on GitHub Pages:** Make sure the repo is public and Pages is set to deploy from main branch, root folder.

**Data disappeared:** The app stores beans in `localStorage`, which is tied to the specific domain. If the URL changes, the data won't carry over. You can export by opening the browser console and running `JSON.stringify(beans)`.
