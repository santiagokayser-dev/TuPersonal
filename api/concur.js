/**
 * Proxy de Concur API — mantiene las credenciales del lado del servidor.
 *
 * Variables de entorno necesarias:
 *   CONCUR_CLIENT_ID
 *   CONCUR_CLIENT_SECRET
 *   CONCUR_USERNAME       (email del usuario en Concur)
 *   CONCUR_PASSWORD
 *   CONCUR_BASE_URL       (ej: https://us.api.concursolutions.com)
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── OAuth ────────────────────────────────────────────────────────────────────

let cachedToken = null
let tokenExpiry  = 0

async function getConcurToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const base = process.env.CONCUR_BASE_URL || 'https://us.api.concursolutions.com'
  const res = await fetch(`${base}/oauth2/v0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: process.env.CONCUR_CLIENT_ID,
      client_secret: process.env.CONCUR_CLIENT_SECRET,
      username: process.env.CONCUR_USERNAME,
      password: process.env.CONCUR_PASSWORD,
      credtype: 'authtoken',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Concur auth failed: ${err}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry  = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

async function concurRequest(method, path, body = null) {
  const base  = process.env.CONCUR_BASE_URL || 'https://us.api.concursolutions.com'
  const token = await getConcurToken()

  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }

  const res = await fetch(`${base}${path}`, opts)
  const text = await res.text()
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) }
  } catch {
    return { ok: res.ok, status: res.status, data: text }
  }
}

// ── Lógica de negocio ────────────────────────────────────────────────────────

// Mapeo de categorías locales → expense type de Concur
const EXPENSE_TYPE_MAP = {
  Almuerzo:   '01104',   // Business Meal (Attendees)
  Cena:       '01104',
  Desayuno:   '01104',
  Transporte: '02001',   // Local Transportation
  Hotel:      '03001',   // Hotel
  Otro:       '00100',   // Miscellaneous
}

async function uploadReceiptImage(token, base64) {
  const base = process.env.CONCUR_BASE_URL || 'https://us.api.concursolutions.com'
  const buf  = Buffer.from(base64, 'base64')

  const res = await fetch(`${base}/api/v3.0/expense/receiptimages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/jpeg',
      Accept: 'application/json',
    },
    body: buf,
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.ID || null
}

async function submitReport(reportId) {
  const base  = process.env.CONCUR_BASE_URL || 'https://us.api.concursolutions.com'
  const token = await getConcurToken()

  const res = await fetch(`${base}/api/v3.0/expense/reports/${reportId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  return res.ok
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verificar que el origen es el propio dominio
  const origin = req.headers.origin || ''
  const allowed = process.env.ALLOWED_ORIGINS?.split(',') || []
  if (allowed.length && !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }

  // Verificar credenciales de Concur configuradas
  const ready = process.env.CONCUR_CLIENT_ID &&
    process.env.CONCUR_CLIENT_SECRET &&
    process.env.CONCUR_USERNAME &&
    process.env.CONCUR_PASSWORD

  if (!ready) {
    return res.status(503).json({
      error: 'Concur no configurado',
      missing: ['CONCUR_CLIENT_ID','CONCUR_CLIENT_SECRET','CONCUR_USERNAME','CONCUR_PASSWORD']
        .filter(k => !process.env[k]),
    })
  }

  const { action, reportId: localReportId } = req.body || {}

  try {
    // ── Subir reporte completo a Concur ──
    if (action === 'upload_report') {
      if (!localReportId) return res.status(400).json({ error: 'reportId requerido' })

      // Obtener el reporte y sus gastos de Supabase
      const { data: report } = await supabase
        .from('bot_reports')
        .select('*')
        .eq('id', localReportId)
        .single()

      if (!report) return res.status(404).json({ error: 'Reporte no encontrado' })
      if (report.estado === 'enviado_concur') {
        return res.status(400).json({ error: 'El reporte ya fue enviado a Concur' })
      }

      const { data: expenses } = await supabase
        .from('bot_expenses')
        .select('*')
        .eq('report_id', localReportId)
        .neq('estado', 'enviado_concur')

      if (!expenses?.length) return res.status(400).json({ error: 'El reporte no tiene gastos' })

      // 1. Crear el reporte en Concur
      const { ok: repOk, data: repData } = await concurRequest('POST', '/api/v3.0/expense/reports', {
        Name: report.nombre,
        Purpose: report.nombre,
        Currency: 'ARS',
        Country: 'AR',
      })
      if (!repOk) return res.status(502).json({ error: 'Error creando reporte en Concur', detail: repData })

      const concurReportId = repData.ID

      // 2. Crear cada entrada + subir receipt
      const token = await getConcurToken()
      const results = []

      for (const exp of expenses) {
        // Subir imagen si existe
        let receiptImageId = null
        if (exp.imagen_base64) {
          receiptImageId = await uploadReceiptImage(token, exp.imagen_base64)
        }

        const { ok: entOk, data: entData } = await concurRequest('POST', '/api/v3.0/expense/entries', {
          ReportID: concurReportId,
          ExpenseTypeCode: EXPENSE_TYPE_MAP[exp.categoria] || EXPENSE_TYPE_MAP.Otro,
          TransactionDate: exp.fecha,
          TransactionAmount: exp.monto,
          CurrencyCode: exp.moneda || 'ARS',
          VendorDescription: exp.comercio,
          Description: exp.descripcion || exp.comercio,
          ...(receiptImageId ? { ReceiptImageID: receiptImageId } : {}),
        })

        if (entOk) {
          await supabase
            .from('bot_expenses')
            .update({ concur_entry_id: entData.ID, estado: 'enviado_concur' })
            .eq('id', exp.id)
          results.push({ id: exp.id, ok: true })
        } else {
          results.push({ id: exp.id, ok: false, error: entData })
        }
      }

      // 3. Marcar reporte como enviado
      await supabase
        .from('bot_reports')
        .update({ estado: 'enviado_concur', concur_report_id: concurReportId })
        .eq('id', localReportId)

      return res.status(200).json({ concurReportId, entries: results })
    }

    // ── Listar reportes de Concur (para verificar) ──
    if (action === 'list_reports') {
      const { ok, data } = await concurRequest('GET', '/api/v3.0/expense/reports?limit=25&approvalStatusCode=A_NOTF')
      if (!ok) return res.status(502).json({ error: 'Error listando reportes', detail: data })
      return res.status(200).json(data)
    }

    return res.status(400).json({ error: 'Acción no reconocida. Usá: upload_report | list_reports' })

  } catch (err) {
    console.error('Concur proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
