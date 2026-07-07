import { supabase } from "./supabase"

// Todas las llamadas a la IA van por el proxy serverless (/api/anthropic).
// La API key vive solo en el servidor; el endpoint exige sesión de Supabase.
export async function askClaude({ model = "claude-haiku-4-5-20251001", max_tokens = 1024, messages, system }) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ model, max_tokens, messages, ...(system && { system }) }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || data.error || `HTTP ${res.status}`)
  return data.content?.[0]?.text ?? null
}
