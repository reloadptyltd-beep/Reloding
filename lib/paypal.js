// lib/paypal.js - helper for obtaining token and creating payout
import fetch from 'node-fetch';

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || JSON.stringify(data));
  return data.access_token;
}

// Create a single payout (synchronous request)
export async function createPayout({ sender_batch_id, receiver_email, amount, currency='USD', note='' }) {
  const token = await getAccessToken();
  const body = {
    sender_batch_header: {
      sender_batch_id,
      email_subject: "You have a payout",
      email_message: note || "Payout from Reload Shopify Mall Account"
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: { value: (amount / 100).toFixed(2), currency },
        receiver: receiver_email,
        note
      }
    ]
  };

  const res = await fetch(`${PAYPAL_BASE}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}
