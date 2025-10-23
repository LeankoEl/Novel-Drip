// /api/paypal/activate — verifies a subscription by ID
const { config } = require("../config");

async function getPayPalAccessToken() {
  const creds = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString("base64");
  const resp = await fetch(`${config.paypal.apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials"
  });
  if (!resp.ok) throw new Error(`OAuth failed: ${resp.status}`);
  const data = await resp.json();
  return data.access_token;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { subscriptionId, userEmail } = req.body || {};
    if (!subscriptionId) return res.status(400).json({ error: "Missing subscriptionId" });

    const token = await getPayPalAccessToken();
    const sResp = await fetch(`${config.paypal.apiBase}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const sub = await sResp.json();

    if (sub.status === "ACTIVE") {
      // TODO: Persist in DB (e.g., Supabase): sub.id, sub.plan_id, sub.subscriber.email_address, status
      return res.status(200).json({
        success: true,
        subscriptionId: sub.id,
        status: sub.status,
        plan: sub.plan_id,
        email: sub?.subscriber?.email_address || userEmail || null,
      });
    }

    return res.status(400).json({ success: false, status: sub.status, details: sub });
  } catch (err) {
    if (config.app.debug) console.error("activate error:", err);
    res.status(500).json({ error: String(err) });
  }
};
