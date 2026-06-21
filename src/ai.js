const VITE_KEY = import.meta.env.VITE_ANTHROPIC_KEY

export async function askClaude({ model = "claude-haiku-4-5-20251001", max_tokens = 1024, messages }) {
  // Try serverless proxy first; fall back to direct browser call with VITE key
  try {
    const res = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens, messages }),
    })
    const data = await res.json()
    if (res.ok) return data.content?.[0]?.text ?? null
    // If server has no key configured and we have a client key, fall through
    if (data.error !== "API key not configured" || !VITE_KEY) {
      throw new Error(data.error || `HTTP ${res.status}`)
    }
  } catch (e) {
    if (!VITE_KEY) throw e
  }

  // Direct browser call using VITE_ANTHROPIC_KEY
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": VITE_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model, max_tokens, messages }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
  return data.content?.[0]?.text ?? null
}
