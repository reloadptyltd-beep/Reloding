// pages/api/paypal/create-payout.js
import { createPayout } from '../../lib/paypal';
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { userId, amountCents } = req.body;
    if (!userId || !amountCents) return res.status(400).json({ error: 'Missing params' });

    const userRes = await query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];
    if (!user.paypal_payout_email) return res.status(400).json({ error: 'User has no PayPal payout email' });

    // Create withdrawal DB entry
    const ins = await query(
      `INSERT INTO withdrawals (user_id, amount_cents, currency, method, destination, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, amountCents, 'USD', 'paypal', user.paypal_payout_email, 'processing']
    );
    const withdrawal = ins.rows[0];

    // Call PayPal payout
    const payout = await createPayout({
      sender_batch_id: `batch_${Date.now()}_${withdrawal.id}`,
      receiver_email: user.paypal_payout_email,
      amount: amountCents,
      currency: 'USD',
      note: `Payout for withdrawal #${withdrawal.id}`
    });

    // update DB with provider_response
    await query('UPDATE withdrawals SET provider_response=$1, status=$2, processed_at=now() WHERE id=$3', [payout, 'paid', withdrawal.id]);

    res.json({ success: true, payout, withdrawalId: withdrawal.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
