export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { access_token, title, unit_price, currency_id, back_url } = req.body || {}
  if (!access_token || !unit_price) return res.status(400).json({ error: "Missing required fields" })

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        items: [{
          title: title || "Plan mensual entrenamiento personal",
          quantity: 1,
          unit_price: Number(unit_price),
          currency_id: currency_id || "ARS",
        }],
        back_urls: {
          success: back_url || "https://tu-personal-dcef.vercel.app",
          failure: back_url || "https://tu-personal-dcef.vercel.app",
          pending: back_url || "https://tu-personal-dcef.vercel.app",
        },
        auto_return: "approved",
      }),
    })
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    res.status(200).json({ init_point: data.init_point })
  } catch {
    res.status(502).json({ error: "Failed to reach Mercado Pago API" })
  }
}
