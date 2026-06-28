import { createClient } from '@supabase/supabase-js'

const TG = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const TG_FILE = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}`

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Helpers de Telegram ──────────────────────────────────────────────────────

async function tgPost(method, body) {
  const res = await fetch(`${TG}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function sendMessage(chatId, text, extra = {}) {
  return tgPost('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', ...extra })
}

async function downloadFileAsBase64(fileId) {
  const { result } = await (await fetch(`${TG}/getFile?file_id=${fileId}`)).json()
  const filePath = result?.file_path
  if (!filePath) throw new Error('No file path from Telegram')

  const res = await fetch(`${TG_FILE}/${filePath}`)
  const buf = await res.arrayBuffer()
  const base64 = Buffer.from(buf).toString('base64')
  const mimeType = filePath.match(/\.(jpe?g)$/i) ? 'image/jpeg' : 'image/png'
  return { base64, mimeType }
}

// ── Claude Vision ────────────────────────────────────────────────────────────

async function extractReceiptData(base64, mimeType) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          {
            type: 'text',
            text: 'Extraé los datos de este ticket/factura. Respondé ÚNICAMENTE con JSON válido, sin markdown ni texto extra:\n{"monto":número,"moneda":"ARS" o "USD","comercio":"nombre del local","fecha":"YYYY-MM-DD","categoria":"Almuerzo" o "Cena" o "Desayuno" o "Transporte" o "Hotel" o "Otro","descripcion":"descripción breve"}',
          },
        ],
      }],
    }),
  })
  const data = await res.json()
  const text = data.content?.[0]?.text?.trim()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : null
  }
}

// ── Supabase helpers ─────────────────────────────────────────────────────────

async function getUserState(chatId) {
  const { data } = await supabase
    .from('bot_users')
    .select('*')
    .eq('chat_id', String(chatId))
    .maybeSingle()
  return data
}

async function setUserState(chatId, state, pendingExpense = null, extra = {}) {
  await supabase.from('bot_users').upsert(
    { chat_id: String(chatId), state, pending_expense: pendingExpense, updated_at: new Date().toISOString(), ...extra },
    { onConflict: 'chat_id' }
  )
}

function getReportName(categoria, fecha) {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const d = new Date(fecha + 'T12:00:00Z')
  return `${categoria} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

async function getOrCreateReport(nombre) {
  const { data: existing } = await supabase
    .from('bot_reports')
    .select('*')
    .eq('nombre', nombre)
    .maybeSingle()
  if (existing) return existing

  const { data } = await supabase
    .from('bot_reports')
    .insert({ nombre, estado: 'borrador' })
    .select()
    .single()
  return data
}

async function saveExpense(expense, chatId) {
  const reportName = expense.reporte || getReportName(expense.categoria, expense.fecha)
  const report = await getOrCreateReport(reportName)

  const { data: saved } = await supabase
    .from('bot_expenses')
    .insert({
      chat_id: String(chatId),
      report_id: report.id,
      monto: expense.monto,
      moneda: expense.moneda || 'ARS',
      comercio: expense.comercio,
      fecha: expense.fecha,
      categoria: expense.categoria,
      descripcion: expense.descripcion,
      imagen_base64: expense.imagen_base64,
      estado: 'pendiente',
    })
    .select()
    .single()

  // Try to auto-match with unmatched card transactions (±2 days, exact amount)
  if (saved) {
    const fechaD = new Date(expense.fecha + 'T12:00:00Z')
    const desde = new Date(fechaD); desde.setDate(desde.getDate() - 2)
    const hasta = new Date(fechaD); hasta.setDate(hasta.getDate() + 2)

    const { data: cardTx } = await supabase
      .from('bot_card_transactions')
      .select('id')
      .is('matched_expense_id', null)
      .eq('monto', expense.monto)
      .gte('fecha', desde.toISOString().slice(0, 10))
      .lte('fecha', hasta.toISOString().slice(0, 10))
      .limit(1)
      .maybeSingle()

    if (cardTx) {
      await supabase.from('bot_expenses').update({ card_tx_id: cardTx.id }).eq('id', saved.id)
      await supabase.from('bot_card_transactions').update({ matched_expense_id: saved.id }).eq('id', cardTx.id)
    }
  }

  return { expense: saved, report }
}

// ── Importar CSV de tarjeta ──────────────────────────────────────────────────

function parseCardCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  // Detectar separador
  const sep = lines[0].includes(';') ? ';' : ','

  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''))

  // Mapear columnas comunes de bancos argentinos
  const colFecha = headers.findIndex(h => /fecha|date/.test(h))
  const colDesc  = headers.findIndex(h => /desc|comer|concepto|detail/.test(h))
  const colMonto = headers.findIndex(h => /monto|importe|amount|total/.test(h))

  if (colFecha < 0 || colMonto < 0) return []

  return lines.slice(1).map(line => {
    const cols = line.split(sep).map(c => c.trim().replace(/"/g, ''))
    const rawMonto = cols[colMonto]?.replace(/[.$\s]/g, '').replace(',', '.')
    const monto = Math.abs(parseFloat(rawMonto))
    if (isNaN(monto) || monto === 0) return null

    // Normalizar fecha DD/MM/YYYY o YYYY-MM-DD
    let fecha = cols[colFecha]
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      const [d, m, y] = fecha.split('/')
      fecha = `${y}-${m}-${d}`
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
      const [d, m, y] = fecha.split('-')
      fecha = `${y}-${m}-${d}`
    }

    return {
      fecha,
      descripcion: cols[colDesc] || 'Sin descripción',
      monto,
      moneda: 'ARS',
      raw_row: Object.fromEntries(headers.map((h, i) => [h, cols[i]])),
    }
  }).filter(Boolean)
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handlePhoto(chatId, photo) {
  await sendMessage(chatId, '📸 Procesando ticket...')

  const largest = photo[photo.length - 1]
  let base64, mimeType
  try {
    ;({ base64, mimeType } = await downloadFileAsBase64(largest.file_id))
  } catch {
    await sendMessage(chatId, '❌ No pude descargar la imagen. Intentá de nuevo.')
    return
  }

  const extracted = await extractReceiptData(base64, mimeType)
  if (!extracted?.monto || !extracted?.fecha) {
    await sendMessage(chatId, '❌ No pude leer el ticket. Mandá una foto más nítida y bien iluminada.')
    return
  }

  const montoStr = extracted.moneda === 'USD'
    ? `USD ${extracted.monto}`
    : `$${Number(extracted.monto).toLocaleString('es-AR')}`

  const reporteName = getReportName(extracted.categoria, extracted.fecha)

  const msg =
    `✅ *Encontré este gasto:*\n\n` +
    `💰 Monto: ${montoStr}\n` +
    `🏪 Comercio: ${extracted.comercio || 'Desconocido'}\n` +
    `📅 Fecha: ${extracted.fecha}\n` +
    `🏷️ Categoría: ${extracted.categoria}\n` +
    `📊 Reporte: _${reporteName}_\n\n` +
    `¿Confirmás? Respondé *sí* para guardar o *no* para cancelar.\n` +
    `También podés escribir el nombre del reporte si querés cambiarlo.`

  await sendMessage(chatId, msg)
  await setUserState(chatId, 'awaiting_confirmation', { ...extracted, imagen_base64: base64 })
}

async function handleDocument(chatId, doc) {
  if (!doc.mime_type?.includes('csv') && !doc.file_name?.endsWith('.csv')) {
    await sendMessage(chatId, '📄 Solo acepto archivos CSV de tarjeta de crédito.')
    return
  }

  await sendMessage(chatId, '📥 Importando movimientos de tarjeta...')

  let base64, _
  try {
    ;({ base64: base64, mimeType: _ } = await downloadFileAsBase64(doc.file_id))
  } catch {
    await sendMessage(chatId, '❌ No pude descargar el archivo.')
    return
  }

  const csvText = Buffer.from(base64, 'base64').toString('utf-8')
  const rows = parseCardCSV(csvText)

  if (!rows.length) {
    await sendMessage(chatId, '❌ No pude leer el CSV. Asegurate de que tenga columnas de fecha, descripción y monto.')
    return
  }

  const { error } = await supabase.from('bot_card_transactions').insert(rows)
  if (error) {
    await sendMessage(chatId, `❌ Error guardando: ${error.message}`)
    return
  }

  // Match con gastos existentes sin match
  let matched = 0
  for (const row of rows) {
    const fechaD = new Date(row.fecha + 'T12:00:00Z')
    const desde = new Date(fechaD); desde.setDate(desde.getDate() - 2)
    const hasta = new Date(fechaD); hasta.setDate(hasta.getDate() + 2)

    const { data: expense } = await supabase
      .from('bot_expenses')
      .select('id')
      .is('card_tx_id', null)
      .eq('monto', row.monto)
      .gte('fecha', desde.toISOString().slice(0, 10))
      .lte('fecha', hasta.toISOString().slice(0, 10))
      .limit(1)
      .maybeSingle()

    if (expense) {
      const { data: tx } = await supabase
        .from('bot_card_transactions')
        .select('id')
        .eq('fecha', row.fecha)
        .eq('monto', row.monto)
        .is('matched_expense_id', null)
        .limit(1)
        .maybeSingle()

      if (tx) {
        await supabase.from('bot_expenses').update({ card_tx_id: tx.id }).eq('id', expense.id)
        await supabase.from('bot_card_transactions').update({ matched_expense_id: expense.id }).eq('id', tx.id)
        matched++
      }
    }
  }

  await sendMessage(chatId,
    `✅ *CSV importado:*\n\n` +
    `📋 Movimientos: ${rows.length}\n` +
    `🔗 Matches con gastos: ${matched}\n\n` +
    `Los movimientos sin match quedan pendientes para vincular con futuros tickets.`
  )
}

async function handleText(chatId, text, userState) {
  const lower = text.toLowerCase().trim()

  // ── Comandos ──
  if (lower === '/start' || lower === '/hola') {
    await sendMessage(chatId,
      '👋 ¡Hola! Soy el bot de gastos de Concur.\n\n' +
      '📸 Mandame fotos de tickets y los proceso automáticamente.\n\n' +
      '*Comandos disponibles:*\n' +
      '/reportes — Ver reportes del mes\n' +
      '/total — Total de gastos del mes\n' +
      '/sinmatch — Movimientos de tarjeta sin comprobante\n' +
      '/ayuda — Más información'
    )
    await setUserState(chatId, 'idle', null, {
      username: userState?.username,
      full_name: userState?.full_name,
    })
    return
  }

  if (lower === '/reportes') {
    const { data: reports } = await supabase
      .from('bot_reports')
      .select('id, nombre, estado, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!reports?.length) {
      await sendMessage(chatId, '📊 No hay reportes todavía. Mandá un ticket para crear el primero.')
      return
    }

    const lines = await Promise.all(reports.map(async r => {
      const { data: exps } = await supabase
        .from('bot_expenses')
        .select('monto, moneda')
        .eq('report_id', r.id)

      const totalARS = exps?.filter(e => e.moneda !== 'USD').reduce((s, e) => s + e.monto, 0) || 0
      const totalUSD = exps?.filter(e => e.moneda === 'USD').reduce((s, e) => s + e.monto, 0) || 0
      const icon = r.estado === 'enviado_concur' ? '✅' : '📝'
      let line = `${icon} *${r.nombre}*\n   ${exps?.length || 0} gastos`
      if (totalARS > 0) line += ` · $${totalARS.toLocaleString('es-AR')}`
      if (totalUSD > 0) line += ` · USD ${totalUSD}`
      return line
    }))

    await sendMessage(chatId, `📊 *Reportes:*\n\n${lines.join('\n\n')}`)
    return
  }

  if (lower === '/total') {
    const hoy = new Date()
    const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`

    const { data: expenses } = await supabase
      .from('bot_expenses')
      .select('monto, moneda, categoria')
      .gte('fecha', desde)
      .eq('chat_id', String(chatId))

    if (!expenses?.length) {
      await sendMessage(chatId, '💰 No hay gastos registrados este mes.')
      return
    }

    const totalARS = expenses.filter(e => e.moneda !== 'USD').reduce((s, e) => s + e.monto, 0)
    const totalUSD = expenses.filter(e => e.moneda === 'USD').reduce((s, e) => s + e.monto, 0)

    const porCat = expenses.reduce((acc, e) => {
      if (e.moneda !== 'USD') acc[e.categoria] = (acc[e.categoria] || 0) + e.monto
      return acc
    }, {})

    const catLines = Object.entries(porCat)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, t]) => `  • ${cat}: $${t.toLocaleString('es-AR')}`)
      .join('\n')

    let msg = `💰 *Gastos del mes actual:*\n\n`
    if (totalARS > 0) msg += `*Total ARS:* $${totalARS.toLocaleString('es-AR')}\n`
    if (totalUSD > 0) msg += `*Total USD:* ${totalUSD}\n`
    msg += `\n${catLines}`
    await sendMessage(chatId, msg)
    return
  }

  if (lower === '/sinmatch') {
    const { data: txs } = await supabase
      .from('bot_card_transactions')
      .select('fecha, descripcion, monto')
      .is('matched_expense_id', null)
      .order('fecha', { ascending: false })
      .limit(10)

    if (!txs?.length) {
      await sendMessage(chatId, '✅ Todos los movimientos de tarjeta están vinculados a comprobantes.')
      return
    }

    const lines = txs.map(t =>
      `• ${t.fecha} · ${t.descripcion?.slice(0, 30)} · $${t.monto.toLocaleString('es-AR')}`
    ).join('\n')

    await sendMessage(chatId, `🔍 *Movimientos sin comprobante:*\n\n${lines}\n\nMandá el ticket correspondiente para vincularlos.`)
    return
  }

  if (lower === '/ayuda') {
    await sendMessage(chatId,
      '🤖 *Bot de Gastos — Ayuda*\n\n' +
      '*¿Cómo uso el bot?*\n' +
      '1. Sacá foto al ticket/factura\n' +
      '2. El bot extrae monto, fecha y comercio\n' +
      '3. Confirmás y queda guardado\n' +
      '4. Se agrupa automáticamente por categoría y mes\n\n' +
      '*Importar tarjeta:*\n' +
      'Mandá el resumen en CSV y el bot lo importa y vincula con los tickets.\n\n' +
      '*Subir a Concur:*\n' +
      'Configurá las credenciales de Concur con el administrador.'
    )
    return
  }

  // ── Confirmación de gasto pendiente ──
  if (userState?.state === 'awaiting_confirmation') {
    const pending = userState.pending_expense
    if (!pending) {
      await setUserState(chatId, 'idle')
      return
    }

    const confirmWords = ['si', 'sí', 'yes', 'ok', 'dale', 'bueno', 'va', 's', '✅', 'confirmar', 'confirmo']
    const cancelWords  = ['no', 'n', 'cancelar', 'cancel', 'nope', '❌']

    if (confirmWords.includes(lower)) {
      const { expense, report } = await saveExpense(pending, chatId)
      await setUserState(chatId, 'idle', null)

      const { data: exps } = await supabase
        .from('bot_expenses')
        .select('monto')
        .eq('report_id', report.id)

      const totalReporte = exps?.reduce((s, e) => s + e.monto, 0) || 0
      const matchMsg = expense?.card_tx_id ? '\n🔗 _Matcheado con movimiento de tarjeta_' : ''

      await sendMessage(chatId,
        `✅ *¡Guardado!*\n\n` +
        `📊 Reporte: _${report.nombre}_\n` +
        `💰 Total del reporte: $${totalReporte.toLocaleString('es-AR')}` +
        matchMsg +
        `\n\nMandá otro ticket cuando quieras.`
      )
      return
    }

    if (cancelWords.includes(lower)) {
      await setUserState(chatId, 'idle', null)
      await sendMessage(chatId, '❌ Cancelado. Mandá otro ticket cuando quieras.')
      return
    }

    // El usuario escribió algo que no es sí/no → lo interpreta como nombre de reporte
    const nuevoReporte = text.trim()
    await setUserState(chatId, 'awaiting_confirmation', { ...pending, reporte: nuevoReporte })
    await sendMessage(chatId, `📊 Reporte cambiado a: _${nuevoReporte}_\n\n¿Confirmás? Respondé *sí* o *no*.`)
    return
  }

  // Mensaje genérico
  await sendMessage(chatId,
    '📸 Mandame una foto de un ticket para registrar el gasto.\n' +
    'También podés usar /ayuda para ver todos los comandos.'
  )
}

// ── Handler principal (Vercel) ────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verificar secreto del webhook
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(403).end()
  }

  const update = req.body
  try {
    const msg = update.message || update.edited_message
    if (!msg) return res.status(200).end()

    const chatId = msg.chat.id

    // Whitelist opcional: solo acepta mensajes de chat_ids autorizados
    const allowedChats = process.env.TELEGRAM_ALLOWED_CHATS?.split(',').map(s => s.trim())
    if (allowedChats?.length && !allowedChats.includes(String(chatId))) {
      return res.status(200).end()
    }

    const userState = await getUserState(chatId)

    if (msg.photo) {
      await handlePhoto(chatId, msg.photo)
    } else if (msg.document) {
      await handleDocument(chatId, msg.document)
    } else if (msg.text) {
      await handleText(chatId, msg.text, userState)
    }
  } catch (err) {
    console.error('Telegram webhook error:', err)
  }

  res.status(200).end()
}
