import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n) { return Number(n || 0).toLocaleString('es-AR') }

export default function ExpenseDashboard() {
  const [reports, setReports]   = useState([])
  const [selected, setSelected] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [unmatched, setUnmatched] = useState([])
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState(null)
  const [tab, setTab]           = useState('reportes')  // reportes | tarjeta

  const flash = (text, ok = true) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 4000)
  }

  const loadReports = useCallback(async () => {
    const { data } = await supabase
      .from('bot_reports')
      .select('id, nombre, estado, concur_report_id, created_at, bot_expenses(monto, moneda)')
      .order('created_at', { ascending: false })
    setReports(data || [])
  }, [])

  const loadUnmatched = useCallback(async () => {
    const { data } = await supabase
      .from('bot_card_transactions')
      .select('*')
      .is('matched_expense_id', null)
      .order('fecha', { ascending: false })
      .limit(50)
    setUnmatched(data || [])
  }, [])

  useEffect(() => { loadReports() }, [loadReports])
  useEffect(() => { if (tab === 'tarjeta') loadUnmatched() }, [tab, loadUnmatched])

  async function selectReport(r) {
    setSelected(r)
    const { data } = await supabase
      .from('bot_expenses')
      .select('*')
      .eq('report_id', r.id)
      .order('fecha')
    setExpenses(data || [])
  }

  async function sendToConcur(reportId) {
    setLoading(true)
    try {
      const res = await fetch('/api/concur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload_report', reportId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.missing) {
          flash(`Concur no configurado. Faltan variables: ${data.missing.join(', ')}`, false)
        } else {
          flash(data.error || 'Error subiendo a Concur', false)
        }
      } else {
        flash(`✅ Subido a Concur. ID: ${data.concurReportId}`)
        loadReports()
        if (selected?.id === reportId) selectReport({ ...selected, estado: 'enviado_concur' })
      }
    } catch (e) {
      flash('Error de red: ' + e.message, false)
    }
    setLoading(false)
  }

  async function deleteExpense(id) {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('bot_expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    loadReports()
  }

  const totalARS = r => r.bot_expenses?.filter(e => e.moneda !== 'USD').reduce((s, e) => s + e.monto, 0) || 0
  const totalUSD = r => r.bot_expenses?.filter(e => e.moneda === 'USD').reduce((s, e) => s + e.monto, 0) || 0

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginBottom: '0.25rem' }}>💼 Gastos Concur</h2>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem', fontSize: 14 }}>
        Panel de administración — los tickets los manda tu primo por Telegram.
      </p>

      {msg && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem',
          background: msg.ok ? '#d4edda' : '#f8d7da',
          color: msg.ok ? '#155724' : '#721c24',
        }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
        {['reportes', 'tarjeta'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === t ? '#1a1a2e' : '#f0f0f0',
            color: tab === t ? '#fff' : '#333', fontWeight: tab === t ? 600 : 400,
          }}>
            {t === 'reportes' ? '📊 Reportes' : '💳 Tarjeta'}
          </button>
        ))}
      </div>

      {/* ── Tab Reportes ── */}
      {tab === 'reportes' && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: '1.5rem' }}>
          {/* Lista de reportes */}
          <div>
            <h3 style={{ marginTop: 0 }}>Reportes</h3>
            {reports.length === 0 && (
              <p style={{ color: '#888' }}>No hay reportes todavía. Cuando tu primo mande el primer ticket aparece acá.</p>
            )}
            {reports.map(r => {
              const ars = totalARS(r)
              const usd = totalUSD(r)
              const isSelected = selected?.id === r.id
              return (
                <div
                  key={r.id}
                  onClick={() => selectReport(r)}
                  style={{
                    padding: '0.875rem 1rem', borderRadius: 10, marginBottom: 8,
                    border: isSelected ? '2px solid #1a1a2e' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                    background: isSelected ? '#f0f0ff' : '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {r.estado === 'enviado_concur' ? '✅ ' : '📝 '}{r.nombre}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                      {r.bot_expenses?.length || 0} gastos
                      {ars > 0 && ` · $${fmt(ars)}`}
                      {usd > 0 && ` · USD ${fmt(usd)}`}
                    </div>
                  </div>
                  {r.estado !== 'enviado_concur' && (
                    <span style={{ fontSize: 11, background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: 20 }}>
                      borrador
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detalle del reporte seleccionado */}
          {selected && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ marginTop: 0 }}>{selected.nombre}</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              {selected.estado !== 'enviado_concur' && (
                <button
                  onClick={() => sendToConcur(selected.id)}
                  disabled={loading || !expenses.length}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: '#1a1a2e', color: '#fff', fontWeight: 600, marginBottom: '1rem',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? '⏳ Subiendo...' : '🚀 Subir a Concur'}
                </button>
              )}

              {selected.concur_report_id && (
                <p style={{ fontSize: 13, color: '#555' }}>
                  Concur Report ID: <code>{selected.concur_report_id}</code>
                </p>
              )}

              {expenses.length === 0 && <p style={{ color: '#888' }}>Sin gastos en este reporte.</p>}

              {expenses.map(exp => (
                <div key={exp.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '0.75rem', borderRadius: 8, marginBottom: 8,
                  border: '1px solid #e0e0e0', background: '#fafafa',
                }}>
                  {exp.imagen_base64 && (
                    <img
                      src={`data:image/jpeg;base64,${exp.imagen_base64}`}
                      alt="ticket"
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{exp.comercio || 'Sin comercio'}</strong>
                      <span style={{ fontWeight: 700 }}>
                        {exp.moneda === 'USD' ? `USD ${fmt(exp.monto)}` : `$${fmt(exp.monto)}`}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {exp.fecha} · {exp.categoria}
                      {exp.card_tx_id && <span style={{ color: '#0a6', marginLeft: 8 }}>🔗 matcheado</span>}
                      {exp.estado === 'enviado_concur' && <span style={{ color: '#555', marginLeft: 8 }}>✅ en Concur</span>}
                    </div>
                    {exp.descripcion && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{exp.descripcion}</div>
                    )}
                  </div>
                  {exp.estado !== 'enviado_concur' && (
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c00', fontSize: 16, padding: 0 }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Tarjeta ── */}
      {tab === 'tarjeta' && (
        <div>
          <h3 style={{ marginTop: 0 }}>Movimientos sin comprobante ({unmatched.length})</h3>
          <p style={{ color: '#666', fontSize: 14 }}>
            Pedile a tu primo que mande el ticket correspondiente para que el bot los vincule automáticamente.
          </p>
          {unmatched.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              ✅ Todos los movimientos están vinculados a comprobantes.
            </div>
          )}
          {unmatched.map(tx => (
            <div key={tx.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem 1rem', borderRadius: 8, marginBottom: 6,
              border: '1px solid #e0e0e0', background: '#fafafa',
            }}>
              <div>
                <div style={{ fontWeight: 500 }}>{tx.descripcion}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{tx.fecha}</div>
              </div>
              <div style={{ fontWeight: 700 }}>
                {tx.moneda === 'USD' ? `USD ${fmt(tx.monto)}` : `$${fmt(tx.monto)}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
