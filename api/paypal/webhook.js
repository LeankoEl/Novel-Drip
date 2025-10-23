// /api/paypal/webhook — verifies and handles PayPal events
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

async function verifyWebhookSignature(headers, body) {
  const token = await getPayPalAccessToken();
  const verifyBody = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: config.paypal.webhookId,
    webhook_event: body,
  };

  const resp = await fetch(`${config.paypal.apiBase}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verifyBody)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Webhook verify HTTP ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  return data.verification_status === "SUCCESS";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const headers = {
      "paypal-transmission-id": req.headers["paypal-transmission-id"],
      "paypal-transmission-time": req.headers["paypal-transmission-time"],
      "paypal-transmission-sig": req.headers["paypal-transmission-sig"],
      "paypal-cert-url": req.headers["paypal-cert-url"],
      "paypal-auth-algo": req.headers["paypal-auth-algo"],
    };

    const verified = await verifyWebhookSignature(headers, req.body);
    if (!verified) {
      return res.status(400).json({ ok: false, error: "Webhook not verified" });
    }

    const event = req.body;

    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        // TODO: Persist ACTIVE status for event.resource.id (subscription id)
        break;
      case "BILLING.SUBSCRIPTION.CANCELLED":
        // TODO: Persist CANCELED status for event.resource.id
        break;
      case "PAYMENT.SALE.COMPLETED":
        // Optional: track successful payments
        break;
      default:
        break;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
};
