import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const C = {
  bg: "#111111", surface: "#191919", surface2: "#222222", surface3: "#2a2a2a",
  border: "#2a2a2a", border2: "#333333",
  text: "#ececec", textSub: "#888888", textMuted: "#555555",
  accent: "#E8714A", accentSub: "#2a1a12", accentLight: "#F0A07A",
  green: "#3ecf6e", red: "#ef4444", yellow: "#e5a60c",
}

const TIPO_COLORS = {
  Fuerza:       { bg: "#1e1a3a", text: "#a5b4fc", dot: "#6366f1" },
  Cardio:       { bg: "#0d2233", text: "#67e8f9", dot: "#06b6d4" },
  Movilidad:    { bg: "#0d2010", text: "#86efac", dot: "#22c55e" },
  "Full body":  { bg: "#22103a", text: "#d8b4fe", dot: "#a855f7" },
  Powerlifting: { bg: "#2a0f0f", text: "#fca5a5", dot: "#ef4444" },
  Funcional:    { bg: "#201500", text: "#fde68a", dot: "#f59e0b" },
  Otro:         { bg: "#161616", text: "#666",    dot: "#444"    },
}

const DIAS_LETRA = ["D","L","M","X","J","V","S"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const TIPOS = ["Fuerza","Cardio","Movilidad","Full body","Powerlifting","Funcional","Otro"]
const DIAS_CORTO = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

const INPUT = { background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "11px 13px", color: C.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }

function toYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
function lunesDe(date) {
  const d = new Date(date); const dia = d.getDay()
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia)); d.setHours(0,0,0,0); return d
}
function horaAMinutos(hora) {
  const [h, m] = (hora || "00:00").split(":").map(Number); return h * 60 + (m || 0)
}

// ── Session Form Modal ──────────────────────────────────────────────────────
function SessionForm({ sesion, dia, clientes, onSave, onClose, guardando }) {
  const esEdicion = !!sesion?.id
  const [form, setForm] = useState({
    cliente_id: sesion?.cliente_id || "",
    cliente_nombre: sesion?.cliente_nombre || "",
    hora: sesion?.hora?.slice(0,5) || "10:00",
    duracion: sesion?.duracion || 60,
    tipo: sesion?.tipo || "Fuerza",
    notas: sesion?.notas || "",
    recurrente: false,
  })

  const labelDia = (() => {
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const d = new Date(dia + "T00:00:00")
    if (toYMD(d) === toYMD(hoy)) return "Hoy"
    if (toYMD(d) === toYMD(addDays(hoy, 1))) return "Mañana"
    return `${DIAS_CORTO[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
  })()

  return (
    <motion.div key="form-modal" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(14px + env(safe-area-inset-top)) 20px 16px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{esEdicion ? "Editar sesión" : "Nueva sesión"}</div>
          {!esEdicion && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{labelDia}</div>}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12, scrollbarWidth: "none", paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>

        {/* Cliente */}
        {clientes.length > 0 ? (
          <select value={form.cliente_id} onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value }))} style={{ ...INPUT, appearance: "none" }}>
            <option value="">— Sin cliente —</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        ) : (
          <input placeholder="Nombre del cliente" value={form.cliente_nombre} onChange={e => setForm(p => ({ ...p, cliente_nombre: e.target.value }))} style={INPUT} />
        )}

        {/* Hora + Duración */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Hora</div>
            <input type="time" value={form.hora} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))} style={{ ...INPUT, width: "100%", minWidth: 0 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Duración</div>
            <select value={form.duracion} onChange={e => setForm(p => ({ ...p, duracion: Number(e.target.value) }))} style={{ ...INPUT, appearance: "none", width: "100%", minWidth: 0 }}>
              {[30,45,60,75,90,120].map(d => <option key={d} value={d}>{d < 60 ? `${d} min` : d === 60 ? "1 hora" : d === 90 ? "1h 30min" : "2 horas"}</option>)}
            </select>
          </div>
        </div>

        {/* Tipo */}
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>Tipo de sesión</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TIPOS.map(t => {
              const tc = TIPO_COLORS[t]
              const sel = form.tipo === t
              return (
                <button key={t} onClick={() => setForm(p => ({ ...p, tipo: t }))}
                  style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${sel ? tc.dot : C.border2}`, background: sel ? tc.bg : "transparent", color: sel ? tc.text : C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notas */}
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Notas (opcional)</div>
          <input placeholder="Ej: Aumentar peso en sentadilla" value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} style={INPUT} />
        </div>

        {/* Recurrente — solo al crear */}
        {!esEdicion && (
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "12px 14px" }}>
            <div onClick={() => setForm(p => ({ ...p, recurrente: !p.recurrente }))}
              style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.recurrente ? C.accent : C.border2}`, background: form.recurrente ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
              {form.recurrente && <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Repetir semanalmente</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>Se agendará las próximas 8 semanas</div>
            </div>
          </label>
        )}

        {/* Botones */}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 0", color: C.textSub, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSave(form)} disabled={guardando}
            style={{ flex: 2, background: guardando ? C.surface3 : C.accent, border: "none", borderRadius: 12, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.6 : 1 }}>
            {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Agendar sesión"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Session Card ────────────────────────────────────────────────────────────
function SessionCard({ s, clientes, onEditar, onEliminar, onToggleAsistencia, compact = false }) {
  const tc = TIPO_COLORS[s.tipo] || TIPO_COLORS["Otro"]
  const clienteObj = clientes.find(c => c.id === s.cliente_id)
  return (
    <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${s.asistio === true ? C.green+"44" : s.asistio === false ? C.red+"44" : C.border2}`, overflow: "hidden", display: "flex" }}>
      <div style={{ width: 3, background: tc.dot, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: compact ? "10px 12px" : "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {/* Hora */}
          <div style={{ background: C.surface3, borderRadius: 8, padding: compact ? "6px 8px" : "8px 10px", textAlign: "center", minWidth: 44, flexShrink: 0 }}>
            <div style={{ fontSize: compact ? 13 : 15, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{s.hora?.slice(0,5)}</div>
            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>{s.duracion}m</div>
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: tc.bg, borderRadius: 6, padding: "2px 8px", marginBottom: 4 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: tc.dot }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: tc.text }}>{s.tipo}</span>
              {s.recurrente && <span style={{ fontSize: 9, color: tc.text, opacity: 0.7 }}>· ↺</span>}
            </div>
            <div style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.cliente_nombre || "Sin cliente"}
            </div>
            {!compact && clienteObj?.objetivo && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{clienteObj.objetivo}</div>}
            {!compact && s.notas && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, fontStyle: "italic" }}>"{s.notas}"</div>}
          </div>
          {/* Acciones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
            <button onClick={() => onEditar(s)} title="Editar"
              style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => onEliminar(s.id)} title="Eliminar"
              style={{ background: "none", border: "none", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textMuted }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>
        {/* Asistencia */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={() => onToggleAsistencia(s, true)}
            style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: `1px solid ${s.asistio === true ? C.green : C.border2}`, background: s.asistio === true ? C.green+"22" : "transparent", color: s.asistio === true ? C.green : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            ✓ Asistió
          </button>
          <button onClick={() => onToggleAsistencia(s, false)}
            style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: `1px solid ${s.asistio === false ? C.red : C.border2}`, background: s.asistio === false ? C.red+"22" : "transparent", color: s.asistio === false ? C.red : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            ✗ Faltó
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Timeline View ───────────────────────────────────────────────────────────
const HORA_INI = 7
const HORA_FIN = 22
const PX_POR_MIN = 1.2

function TimelineView({ sesiones, clientes, onEditar, onEliminar, onToggleAsistencia }) {
  const totalH = (HORA_FIN - HORA_INI) * 60 * PX_POR_MIN
  const horas = Array.from({ length: HORA_FIN - HORA_INI }, (_, i) => HORA_INI + i)

  return (
    <div style={{ position: "relative", height: totalH, borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      {/* Líneas de hora */}
      {horas.map(h => (
        <div key={h} style={{ position: "absolute", top: (h - HORA_INI) * 60 * PX_POR_MIN, left: 0, right: 0, display: "flex", alignItems: "flex-start" }}>
          <div style={{ width: 44, paddingLeft: 8, paddingTop: 2, fontSize: 10, color: C.textMuted, flexShrink: 0 }}>{String(h).padStart(2,"0")}:00</div>
          <div style={{ flex: 1, height: "0.5px", background: C.border, marginTop: 7 }} />
        </div>
      ))}
      {/* Sesiones */}
      {sesiones.map(s => {
        const tc = TIPO_COLORS[s.tipo] || TIPO_COLORS["Otro"]
        const minDesdeIni = horaAMinutos(s.hora) - HORA_INI * 60
        const top = minDesdeIni * PX_POR_MIN
        const height = Math.max((s.duracion || 60) * PX_POR_MIN, 36)
        return (
          <div key={s.id} onClick={() => onEditar(s)}
            style={{ position: "absolute", top, left: 48, right: 8, height, background: tc.bg, border: `1px solid ${tc.dot}44`, borderLeft: `3px solid ${tc.dot}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", overflow: "hidden" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tc.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.hora?.slice(0,5)} · {s.cliente_nombre || "Sin cliente"}
            </div>
            {height > 40 && <div style={{ fontSize: 10, color: tc.text, opacity: 0.7 }}>{s.tipo} · {s.duracion}min</div>}
            {s.asistio === true && <div style={{ position: "absolute", top: 4, right: 6, fontSize: 10, color: C.green }}>✓</div>}
            {s.asistio === false && <div style={{ position: "absolute", top: 4, right: 6, fontSize: 10, color: C.red }}>✗</div>}
          </div>
        )
      })}
      {/* Línea de hora actual */}
      {(() => {
        const ahora = new Date()
        const minActual = ahora.getHours() * 60 + ahora.getMinutes()
        const minDesde = minActual - HORA_INI * 60
        if (minDesde < 0 || minDesde > (HORA_FIN - HORA_INI) * 60) return null
        return (
          <div style={{ position: "absolute", top: minDesde * PX_POR_MIN, left: 44, right: 0, height: 1.5, background: C.accent, zIndex: 5 }}>
            <div style={{ position: "absolute", left: -3, top: -3, width: 7, height: 7, borderRadius: "50%", background: C.accent }} />
          </div>
        )
      })()}
    </div>
  )
}

// ── Stats View ──────────────────────────────────────────────────────────────
function StatsView({ sesiones, clientes }) {
  const totalSesiones = sesiones.length
  const totalMinutos = sesiones.reduce((s, x) => s + (x.duracion || 0), 0)
  const clientesUnicos = new Set(sesiones.filter(s => s.cliente_id).map(s => s.cliente_id)).size
  const asistidas = sesiones.filter(s => s.asistio === true).length
  const marcadas = sesiones.filter(s => s.asistio !== null && s.asistio !== undefined).length
  const tasaAsistencia = marcadas > 0 ? Math.round((asistidas / marcadas) * 100) : null

  const porTipo = TIPOS.reduce((acc, t) => {
    const n = sesiones.filter(s => s.tipo === t).length
    if (n > 0) acc[t] = n
    return acc
  }, {})

  const clientesConAsist = clientes.map(c => {
    const scss = sesiones.filter(s => s.cliente_id === c.id)
    const marcadass = scss.filter(s => s.asistio !== null && s.asistio !== undefined)
    const asist = scss.filter(s => s.asistio === true).length
    return { ...c, sesiones: scss.length, asistencias: asist, marcadas: marcadass.length }
  }).filter(c => c.sesiones > 0)

  if (totalSesiones === 0) return (
    <div style={{ textAlign: "center", padding: "28px 0", color: C.textMuted, fontSize: 13 }}>Sin sesiones esta semana</div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Sesiones", value: totalSesiones, color: C.accent },
          { label: "Horas", value: `${Math.floor(totalMinutos/60)}h${totalMinutos%60>0?` ${totalMinutos%60}m`:""}`, color: C.text },
          { label: "Clientes", value: clientesUnicos, color: C.textSub },
        ].map((m, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 10, padding: "12px 10px", border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: m.color, letterSpacing: -0.5 }}>{m.value}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Por tipo */}
      <div style={{ background: C.surface, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Por tipo</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {Object.entries(porTipo).sort((a,b) => b[1]-a[1]).map(([tipo, n]) => {
            const tc = TIPO_COLORS[tipo] || TIPO_COLORS["Otro"]
            const pct = Math.round((n / totalSesiones) * 100)
            return (
              <div key={tipo}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: tc.text, fontWeight: 500 }}>{tipo}</span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{n} · {pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: C.surface3, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
                    style={{ height: "100%", borderRadius: 3, background: tc.dot }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Asistencia */}
      {marcadas > 0 && (
        <div style={{ background: C.surface, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Asistencia</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: tasaAsistencia >= 80 ? C.green : C.yellow }}>{tasaAsistencia}%</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{asistidas} de {marcadas} sesiones marcadas</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {clientesConAsist.filter(c => c.marcadas > 0).map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accent+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{c.ini || c.nombre?.slice(0,2).toUpperCase()}</div>
                <div style={{ flex: 1, fontSize: 12, color: C.text }}>{c.nombre}</div>
                <div style={{ fontSize: 12, color: c.asistencias === c.marcadas ? C.green : C.yellow, fontWeight: 600 }}>
                  {c.asistencias}/{c.marcadas}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AgendaReal({ clientes = [] }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0)

  const [sesiones, setSesiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [diaSeleccionado, setDiaSeleccionado] = useState(toYMD(hoy))
  const [vistaTab, setVistaTab] = useState("lista") // lista | timeline | stats
  const [mostrarForm, setMostrarForm] = useState(false)
  const [sesionEditando, setSesionEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const lunesBase = lunesDe(hoy)
  const lunesSemana = addDays(lunesBase, semanaOffset * 7)
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(lunesSemana, i))
  const domingoSemana = diasSemana[6]

  const mismoMes = lunesSemana.getMonth() === domingoSemana.getMonth()
  const semanaLabel = mismoMes
    ? `${lunesSemana.getDate()}–${domingoSemana.getDate()} de ${MESES[lunesSemana.getMonth()]}`
    : `${lunesSemana.getDate()} ${MESES_CORTO[lunesSemana.getMonth()]} – ${domingoSemana.getDate()} ${MESES_CORTO[domingoSemana.getMonth()]}`

  useEffect(() => { cargarSemana() }, [semanaOffset])

  const cargarSemana = async () => {
    setCargando(true)
    const desde = toYMD(addDays(lunesSemana, -7))
    const hasta = toYMD(addDays(domingoSemana, 14))
    const { data } = await supabase.from("sesiones").select("*").gte("fecha", desde).lte("fecha", hasta).order("hora")
    if (data) setSesiones(data)
    setCargando(false)
  }

  const guardarSesion = async (form) => {
    if (!form.hora) return
    setGuardando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const base = {
      trainer_id: user.id,
      cliente_id: form.cliente_id || null,
      cliente_nombre: form.cliente_nombre || clientes.find(c => c.id === form.cliente_id)?.nombre || "Sin cliente",
      hora: form.hora, duracion: form.duracion, tipo: form.tipo, notas: form.notas || null,
    }

    if (sesionEditando?.id) {
      // Editar
      const { data, error } = await supabase.from("sesiones").update(base).eq("id", sesionEditando.id).select().single()
      if (!error && data) setSesiones(p => p.map(s => s.id === data.id ? data : s))
    } else {
      // Crear (con posible recurrencia)
      const fechas = [diaSeleccionado]
      if (form.recurrente) {
        for (let i = 1; i <= 8; i++) fechas.push(toYMD(addDays(new Date(diaSeleccionado + "T00:00:00"), i * 7)))
      }
      const inserts = fechas.map(fecha => ({ ...base, fecha, recurrente: form.recurrente }))
      const { data, error } = await supabase.from("sesiones").insert(inserts).select()
      if (!error && data) setSesiones(p => [...p, ...data].sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)))
    }

    setGuardando(false)
    setMostrarForm(false)
    setSesionEditando(null)
  }

  const eliminarSesion = async (id) => {
    await supabase.from("sesiones").delete().eq("id", id)
    setSesiones(p => p.filter(s => s.id !== id))
  }

  const toggleAsistencia = async (s, valor) => {
    const nuevo = s.asistio === valor ? null : valor
    await supabase.from("sesiones").update({ asistio: nuevo }).eq("id", s.id)
    setSesiones(p => p.map(x => x.id === s.id ? { ...x, asistio: nuevo } : x))
  }

  const abrirEditar = (s) => { setSesionEditando(s); setMostrarForm(true) }

  const sesionesDia = sesiones.filter(s => s.fecha === diaSeleccionado).sort((a,b) => a.hora.localeCompare(b.hora))
  const sesionesSemana = sesiones.filter(s => s.fecha >= toYMD(lunesSemana) && s.fecha <= toYMD(domingoSemana))
  const sesionesPorFecha = sesiones.reduce((acc, s) => { if (!acc[s.fecha]) acc[s.fecha] = []; acc[s.fecha].push(s); return acc }, {})

  const selDate = new Date(diaSeleccionado + "T00:00:00")
  const esHoy = diaSeleccionado === toYMD(hoy)
  const esMañana = diaSeleccionado === toYMD(addDays(hoy, 1))
  const labelDia = esHoy ? "Hoy" : esMañana ? "Mañana" : `${DIAS_CORTO[selDate.getDay()]} ${selDate.getDate()} de ${MESES[selDate.getMonth()]}`
  const totalMinDia = sesionesDia.reduce((s, x) => s + (x.duracion || 0), 0)

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.6 }}>Agenda</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
            {labelDia}
            {sesionesDia.length > 0 && <> · <span style={{ color: C.accent }}>{sesionesDia.length} sesión{sesionesDia.length !== 1 ? "es" : ""}</span>{totalMinDia > 0 && ` · ${totalMinDia}min`}</>}
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSesionEditando(null); setMostrarForm(true) }}
          style={{ background: C.accent, border: "none", borderRadius: 10, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${C.accent}44`, flexShrink: 0 }}>
          + Nueva
        </motion.button>
      </div>

      {/* Tira semanal */}
      <div style={{ background: C.surface, borderRadius: 16, padding: "12px 10px", border: `1px solid ${C.border2}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSemanaOffset(o => o - 1)}
            style={{ width: 28, height: 28, borderRadius: 8, background: C.surface3, border: `1px solid ${C.border2}`, color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>‹</motion.button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{semanaLabel}</div>
            {semanaOffset !== 0 && (
              <div onClick={() => { setSemanaOffset(0); setDiaSeleccionado(toYMD(hoy)) }}
                style={{ fontSize: 10, color: C.accent, cursor: "pointer", marginTop: 1 }}>← Hoy</div>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSemanaOffset(o => o + 1)}
            style={{ width: 28, height: 28, borderRadius: 8, background: C.surface3, border: `1px solid ${C.border2}`, color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>›</motion.button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {diasSemana.map(dia => {
            const ymd = toYMD(dia); const esHoyD = ymd === toYMD(hoy); const esSel = ymd === diaSeleccionado
            const sessDia = sesionesPorFecha[ymd] || []
            return (
              <motion.div key={ymd} whileTap={{ scale: 0.88 }} onClick={() => setDiaSeleccionado(ymd)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "7px 2px 5px", borderRadius: 8, cursor: "pointer", background: esSel ? C.accent : esHoyD ? C.accentSub : "transparent", border: `1px solid ${esSel ? C.accent : esHoyD ? C.accent+"55" : "transparent"}` }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: esSel ? "#fff9" : C.textMuted }}>{DIAS_LETRA[dia.getDay()]}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: esSel ? "#fff" : esHoyD ? C.accent : sessDia.length > 0 ? C.text : C.textMuted, letterSpacing: -0.3 }}>{dia.getDate()}</div>
                <div style={{ height: 5, display: "flex", gap: 2, alignItems: "center" }}>
                  {sessDia.slice(0,3).map((s,j) => <div key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: esSel ? "#ffffff88" : (TIPO_COLORS[s.tipo]?.dot || C.accent) }} />)}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Tabs vista */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
        {[["lista","Lista"], ["timeline","Timeline"], ["stats","Esta semana"]].map(([id, label]) => (
          <button key={id} onClick={() => setVistaTab(id)}
            style={{ flex: 1, padding: "8px 4px", border: "none", background: "transparent", fontSize: 12, fontWeight: 500, cursor: "pointer", color: vistaTab === id ? C.accent : C.textSub, borderBottom: `2px solid ${vistaTab === id ? C.accent : "transparent"}` }}>
            {label}
          </button>
        ))}
      </div>

      {/* Separador día (para lista y timeline) */}
      {vistaTab !== "stats" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: esHoy ? C.accent : C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{labelDia}</div>
          <div style={{ flex: 1, height: "0.5px", background: C.border2 }} />
          {sesionesDia.length > 0 && <div style={{ fontSize: 11, color: C.textMuted }}>{sesionesDia.length} sesión{sesionesDia.length !== 1 ? "es" : ""}</div>}
        </div>
      )}

      {/* Contenido */}
      {cargando ? (
        <motion.div animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: 16 }}>Cargando...</motion.div>
      ) : vistaTab === "stats" ? (
        <StatsView sesiones={sesionesSemana} clientes={clientes} />
      ) : vistaTab === "timeline" ? (
        sesionesDia.length === 0
          ? <div style={{ textAlign: "center", padding: "28px 0", color: C.textMuted, fontSize: 13 }}>Sin sesiones este día</div>
          : <TimelineView sesiones={sesionesDia} clientes={clientes} onEditar={abrirEditar} onEliminar={eliminarSesion} onToggleAsistencia={toggleAsistencia} />
      ) : (
        <AnimatePresence>
          {sesionesDia.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 28 }}>📅</div>
              <div style={{ fontSize: 14, color: C.textSub }}>Sin sesiones este día</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Tocá "+ Nueva" para agendar</div>
            </div>
          ) : sesionesDia.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }}>
              <SessionCard s={s} clientes={clientes} onEditar={abrirEditar} onEliminar={eliminarSesion} onToggleAsistencia={toggleAsistencia} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Modal form */}
      <AnimatePresence>
        {mostrarForm && (
          <SessionForm
            key="form"
            sesion={sesionEditando}
            dia={diaSeleccionado}
            clientes={clientes}
            onSave={guardarSesion}
            onClose={() => { setMostrarForm(false); setSesionEditando(null) }}
            guardando={guardando}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
