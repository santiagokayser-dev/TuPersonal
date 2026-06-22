export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const { type, data } = req.body || {}
  if (type !== "payment") return res.status(200).json({ ok: true })

  const token = process.env.MP_ACCESS_TOKEN
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!token || !supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Variables de entorno faltantes" })
  }

  try {
    // Verificar el pago con MP
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payment = await payRes.json()

    if (payment.status !== "approved") return res.status(200).json({ ok: true })

    const trainerId = payment.external_reference
    if (!trainerId) return res.status(200).json({ ok: true })

    // Determinar plan según monto
    const amount = Number(payment.transaction_amount)
    const plan = amount >= 19999 ? "elite" : "pro"

    // Vencimiento: 30 días
    const planExpiresAt = new Date()
    planExpiresAt.setDate(planExpiresAt.getDate() + 30)

    // Upsert en trainer_settings
    await fetch(`${supabaseUrl}/rest/v1/trainer_settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        trainer_id: trainerId,
        plan,
        plan_expires_at: planExpiresAt.toISOString(),
      }),
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error("mp-webhook error:", e)
    res.status(500).json({ error: e.message })
  }
}
