export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const origin = req.headers.origin || ""
  const allowed = process.env.ALLOWED_ORIGINS?.split(",") || []
  if (allowed.length && !allowed.includes(origin)) {
    return res.status(403).json({ error: "Origin not allowed" })
  }

  const apiKey = process.env.ANTHROPIC_KEY
  if (!apiKey) return res.status(500).json({ error: "API key not configured" })

  const { model, max_tokens, messages } = req.body || {}
  if (!messages?.length) return res.status(400).json({ error: "Messages required" })

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-haiku-4-5-20251001",
        max_tokens: Math.min(max_tokens || 400, 4096),
        messages,
      }),
    })
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    res.status(200).json(data)
  } catch {
    res.status(502).json({ error: "Failed to reach Anthropic API" })
  }
}
