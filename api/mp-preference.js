export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const token = process.env.MP_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: "MP_ACCESS_TOKEN no configurado" })

  const { title, unit_price, currency_id, trainer_id } = req.body || {}
  if (!unit_price) return res.status(400).json({ error: "Falta unit_price" })

  const backUrl = "https://tupersonal.fit"

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [{
          title: title || "Plan TuPersonal",
          quantity: 1,
          unit_price: Number(unit_price),
          currency_id: currency_id || "ARS",
        }],
        external_reference: trainer_id || "",
        back_urls: {
          success: backUrl,
          failure: backUrl,
          pending: backUrl,
        },
        auto_return: "approved",
      }),
    })
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    res.status(200).json({ init_point: data.init_point })
  } catch {
    res.status(502).json({ error: "No se pudo conectar con Mercado Pago" })
  }
}
