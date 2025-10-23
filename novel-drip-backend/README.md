# Novel Drip — Backend (Vercel-ready, JS)

This backend powers:
- **/api/noveldrip** → Gemini proxy (keeps your API key off the client)
- **/api/paypal/activate** → Verifies a PayPal Subscription on approval
- **/api/paypal/webhook** → Listens to PayPal webhooks (activated/cancelled/etc.)

> **Hosting**: Designed for **Vercel** serverless (Node 18+), but compatible with any Node serverless that supports `fetch`.

---

## 1) Setup

### A) Create `.env` from template
Copy `.env.example` → `.env`, then fill with real values:

```bash
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_API_BASE=https://api-m.paypal.com
PAYPAL_WEBHOOK_ID=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
APP_BASE_URL=https://api.noveldrip.website
APP_SUCCESS_URL=https://noveldrip.website/thank-you
APP_DASHBOARD_URL=https://noveldrip.website/account
DEBUG_MODE=true
```

> For local dev with `vercel dev`, create a local `.env` file.
> On Vercel, add these in **Project → Settings → Environment Variables**.

### B) Push to GitHub
```bash
git init
git add .
git commit -m "Initial backend"
git branch -M main
git remote add origin https://github.com/<YOU>/novel-drip.git
git push -u origin main
```

### C) Import to Vercel
- Vercel → **Add New → Project → Import from GitHub**
- Framework: **Other**
- Root directory: `./`
- Environment Variables: paste the values from your `.env`
- Deploy

### D) Connect custom domain
- Project → Settings → Domains → Add: `api.noveldrip.website`
- In **Namecheap → Advanced DNS** add a **CNAME** for `api → cname.vercel-dns.com`
- Wait for green check on Vercel

---

## 2) Endpoints

### `POST /api/noveldrip`
Body:
```json
{ "model": "gemini-2.5-flash-lite", "payload": { "op": "outline", "...": "..." } }
```
Response:
```json
{ "text": "..." }
```

### `POST /api/paypal/activate`
Body:
```json
{ "subscriptionId": "I-XXXX", "userEmail":"optional@domain.com" }
```
- Verifies the subscription server-to-server
- Returns `{ success:true, plan: "P-...", status: "ACTIVE", email: "..." }`

### `POST /api/paypal/webhook`
- Register URL in PayPal Dashboard as: `https://api.noveldrip.website/api/paypal/webhook`
- Subscribe to events:
  - `BILLING.SUBSCRIPTION.ACTIVATED`
  - `BILLING.SUBSCRIPTION.CANCELLED`
  - `PAYMENT.SALE.COMPLETED`

> This endpoint **verifies the webhook signature** with PayPal before applying any state.

---

## 3) Testing Tips

Curl the AI proxy:
```bash
curl -X POST https://api.noveldrip.website/api/noveldrip   -H "Content-Type: application/json"   -d '{"model":"gemini-2.5-flash-lite","payload":{"op":"outline","genre":"Fantasy","theme":"Redemption","logline":"A farmhand discovers..."}}'
```

Simulate activate (requires a real subscription id from onApprove):
```bash
curl -X POST https://api.noveldrip.website/api/paypal/activate   -H "Content-Type: application/json"   -d '{"subscriptionId":"I-XXXXX"}'
```

---

## 4) Notes

- Persisting plan status requires a DB (e.g., Supabase). This starter just returns JSON; plug your database writes at `// TODO` comments in `activate.js` and `webhook.js`.
- Keep your keys **out of the client**. The Chrome extension should talk only to these endpoints, never to PayPal/Gemini directly.
