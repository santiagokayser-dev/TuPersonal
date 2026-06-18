import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const C = {
  bg: "#060A10", surface: "#0C1220", surface2: "#111927", surface3: "#151F30",
  border: "#1A2540", border2: "#1E2D4A",
  text: "#FFFFFF", textSub: "#94A3B8", textMuted: "#475569",
  accent: "#2563EB", accentSub: "#1E3A8A", accentLight: "#93C5FD",
  green: "#22c55e", yellow: "#f59e0b",
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

const DIAS_CORTO = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]
const DIAS_LETRA = ["D","L","M","X","J","V","S"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const TIPOS = ["Fuerza","Cardio","Movilidad","Full body","Powerlifting","Funcional","Otro"]

const S = {
  input: { background: C.surface2, border: `0.5px solid ${C.border2}`, borderRadius: 10, padding: "10px 13px", color: C.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system,sans-serif", boxSizing: "border-box" },
}

function toYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Lunes de la semana que contiene 'date'
function lunesDe(date) {
  const d = new Date(date)
  const dia = d.getDay() // 0=dom
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0,0,0,0)
  return d
}

export default function Agenda({ clientes = [] }) {
  const hoy = new Date()
  hoy.setHours(0,0,0,0)

  const [sesiones, setSesiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [semanaOffset, setSemanaOffset] = useState(0) // 0 = semana actual
  const [diaSeleccionado, setDiaSeleccionado] = useState(toYMD(hoy))
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nueva, setNueva] = useState({ cliente_id: "", cliente_nombre: "", hora: "10:00", duracion: 60, tipo: "Fuerza", notas: "" })

  // 7 días de la semana visible
  const lunesBase = lunesDe(hoy)
  const lunesSemana = addDays(lunesBase, semanaOffset * 7)
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(lunesSemana, i))
  const domingoSemana = diasSemana[6]

  // Label semana
  const mismoMes = lunesSemana.getMonth() === domingoSemana.getMonth()
  const semanaLabel = mismoMes
    ? `${lunesSemana.getDate()}–${domingoSemana.getDate()} de ${MESES[lunesSemana.getMonth()]}`
    : `${lunesSemana.getDate()} ${MESES_CORTO[lunesSemana.getMonth()]} – ${domingoSemana.getDate()} ${MESES_CORTO[domingoSemana.getMonth()]}`

  useEffect(() => {
    cargarSemana()
  }, [semanaOffset])

  const cargarSemana = async () => {
    setCargando(true)
    // Cargar 3 semanas alrededor (para tener contexto)
    const desde = toYMD(addDays(lunesSemana, -7))
    const hasta = toYMD(addDays(domingoSemana, 7))
    const { data } = await supabase.from("sesiones").select("*").gte("fecha", desde).lte("fecha", hasta).order("hora")
    if (data) setSesiones(data)
    setCargando(false)
  }

  const agregarSesion = async () => {
    if (!nueva.hora) return
    setGuardando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from("sesiones").insert({
      trainer_id: user.id, cliente_id: nueva.cliente_id || null,
      cliente_nombre: nueva.cliente_nombre || clientes.find(c => c.id === nueva.cliente_id)?.nombre || "Sin cliente",
      fecha: diaSeleccionado, hora: nueva.hora, duracion: nueva.duracion, tipo: nueva.tipo, notas: nueva.notas || null,
    }).select().single()
    if (!error && data) {
      setSesiones(p => [...p, data].sort((a,b) => a.hora.localeCompare(b.hora)))
      setMostrarForm(false)
      setNueva({ cliente_id: "", cliente_nombre: "", hora: "10:00", duracion: 60, tipo: "Fuerza", notas: "" })
    }
    setGuardando(false)
  }

  const eliminarSesion = async (id) => {
    await supabase.from("sesiones").delete().eq("id", id)
    setSesiones(p => p.filter(s => s.id !== id))
  }

  const sesionesDia = sesiones.filter(s => s.fecha === diaSeleccionado)
  const sesionesPorFecha = {}
  sesiones.forEach(s => { if (!sesionesPorFecha[s.fecha]) sesionesPorFecha[s.fecha] = []; sesionesPorFecha[s.fecha].push(s) })

  const selDate = new Date(diaSeleccionado + "T00:00:00")
  const esHoy = diaSeleccionado === toYMD(hoy)
  const esMañana = diaSeleccionado === toYMD(addDays(hoy, 1))
  const labelDia = esHoy ? "Hoy" : esMañana ? "Mañana" : `${DIAS_CORTO[selDate.getDay()]} ${selDate.getDate()} de ${MESES[selDate.getMonth()]}`

  const totalMinutos = sesionesDia.reduce((s, x) => s + (x.duracion || 0), 0)

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.6 }}>Agenda</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
            {labelDia}
            {sesionesDia.length > 0 && <> · <span style={{ color: C.accent }}>{sesionesDia.length} sesión{sesionesDia.length !== 1 ? "es" : ""}</span>{totalMinutos > 0 && ` · ${totalMinutos}min`}</>}
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: mostrarForm ? C.surface3 : C.accent, border: `0.5px solid ${mostrarForm ? C.border2 : "transparent"}`, borderRadius: 14, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: mostrarForm ? "none" : `0 4px 16px ${C.accent}44`, flexShrink: 0 }}>
          {mostrarForm ? "Cancelar" : "+ Nueva sesión"}
        </motion.button>
      </div>

      {/* Tira semanal */}
      <div style={{ background: C.surface, borderRadius: 18, padding: "14px 12px 12px", border: `0.5px solid ${C.border2}` }}>
        {/* Nav semana */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSemanaOffset(o => o - 1)}
            style={{ width: 30, height: 30, borderRadius: 9, background: C.surface3, border: `0.5px solid ${C.border2}`, color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>‹</motion.button>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: -0.2 }}>{semanaLabel}</div>
            {semanaOffset !== 0 && (
              <div onClick={() => { setSemanaOffset(0); setDiaSeleccionado(toYMD(hoy)) }}
                style={{ fontSize: 11, color: C.accent, cursor: "pointer", marginTop: 2 }}>← Volver a hoy</div>
            )}
          </div>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSemanaOffset(o => o + 1)}
            style={{ width: 30, height: 30, borderRadius: 9, background: C.surface3, border: `0.5px solid ${C.border2}`, color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>›</motion.button>
        </div>

        {/* 7 días */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {diasSemana.map((dia, i) => {
            const ymd = toYMD(dia)
            const esHoyDia = ymd === toYMD(hoy)
            const esSel = ymd === diaSeleccionado
            const sessDia = sesionesPorFecha[ymd] || []
            const tieneS = sessDia.length > 0

            return (
              <motion.div key={ymd} whileTap={{ scale: 0.88 }} onClick={() => setDiaSeleccionado(ymd)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px 6px", borderRadius: 12, cursor: "pointer",
                  background: esSel ? C.accent : esHoyDia ? C.accentSub : "transparent",
                  border: `0.5px solid ${esSel ? C.accent : esHoyDia ? C.accent+"55" : "transparent"}`,
                  transition: "background 0.15s" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: esSel ? "#fff9" : C.textMuted, letterSpacing: 0.5 }}>
                  {DIAS_LETRA[(dia.getDay())]}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: esSel ? "#fff" : esHoyDia ? "#818cf8" : tieneS ? C.text : C.textSub, letterSpacing: -0.3 }}>
                  {dia.getDate()}
                </div>
                {/* Dots */}
                <div style={{ height: 6, display: "flex", gap: 2, alignItems: "center", justifyContent: "center" }}>
                  {tieneS && sessDia.slice(0, 3).map((s, j) => (
                    <div key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: esSel ? "#ffffffaa" : (TIPO_COLORS[s.tipo]?.dot || C.accent) }} />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Form nueva sesión */}
      <AnimatePresence>
        {mostrarForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ background: C.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${C.accent}44`, overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              Nueva sesión — {labelDia}
            </div>
            {clientes.length > 0 ? (
              <select value={nueva.cliente_id} onChange={e => setNueva(p => ({ ...p, cliente_id: e.target.value }))} style={{ ...S.input, appearance: "none" }}>
                <option value="">— Sin cliente —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            ) : (
              <input placeholder="Nombre del cliente" value={nueva.cliente_nombre} onChange={e => setNueva(p => ({ ...p, cliente_nombre: e.target.value }))} style={S.input} />
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input type="time" value={nueva.hora} onChange={e => setNueva(p => ({ ...p, hora: e.target.value }))} style={S.input} />
              <select value={nueva.duracion} onChange={e => setNueva(p => ({ ...p, duracion: Number(e.target.value) }))} style={{ ...S.input, appearance: "none" }}>
                {[30,45,60,90,120].map(d => <option key={d} value={d}>{d < 120 ? `${d} min` : "2 hs"}</option>)}
              </select>
            </div>
            <select value={nueva.tipo} onChange={e => setNueva(p => ({ ...p, tipo: e.target.value }))} style={{ ...S.input, appearance: "none" }}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
            <input placeholder="Notas (opcional)" value={nueva.notas} onChange={e => setNueva(p => ({ ...p, notas: e.target.value }))} style={S.input} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMostrarForm(false)} style={{ flex: 1, background: C.surface3, border: `0.5px solid ${C.border2}`, borderRadius: 12, padding: "12px 0", color: C.textSub, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={agregarSesion} disabled={guardando}
                style={{ flex: 2, background: guardando ? C.surface3 : C.accent, border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.6 : 1 }}>
                {guardando ? "Guardando..." : "Agendar sesión"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Separador del día */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: esHoy ? C.accent : C.textMuted, textTransform: "uppercase", letterSpacing: 1.2, whiteSpace: "nowrap" }}>
          {labelDia}
        </div>
        <div style={{ flex: 1, height: "0.5px", background: C.border2 }} />
        {sesionesDia.length > 0 && (
          <div style={{ fontSize: 11, color: C.textMuted, whiteSpace: "nowrap" }}>
            {sesionesDia.length} sesión{sesionesDia.length !== 1 ? "es" : ""}
          </div>
        )}
      </div>

      {/* Sesiones del día */}
      {cargando ? (
        <motion.div animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: 16 }}>Cargando...</motion.div>
      ) : sesionesDia.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 28 }}>📅</div>
          <div style={{ fontSize: 14, color: C.textSub }}>Sin sesiones este día</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Tocá "+ Nueva sesión" para agendar</div>
        </div>
      ) : (
        <AnimatePresence>
          {sesionesDia.map((s, i) => {
            const tc = TIPO_COLORS[s.tipo] || TIPO_COLORS["Otro"]
            const clienteObj = clientes.find(c => c.id === s.cliente_id)
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.05 }}
                style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border2}`, overflow: "hidden", display: "flex" }}>
                <div style={{ width: 3, background: tc.dot, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {/* Hora */}
                  <div style={{ background: C.surface3, borderRadius: 10, padding: "8px 10px", textAlign: "center", minWidth: 48, flexShrink: 0, border: `0.5px solid ${C.border2}` }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{s.hora?.slice(0,5)}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{s.duracion}m</div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: tc.bg, borderRadius: 8, padding: "3px 9px", marginBottom: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: tc.dot }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: tc.text }}>{s.tipo}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                      {s.cliente_nombre || "Sin cliente"}
                    </div>
                    {clienteObj?.objetivo && <div style={{ fontSize: 12, color: C.textMuted }}>{clienteObj.objetivo}</div>}
                    {s.notas && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, fontStyle: "italic" }}>"{s.notas}"</div>}
                  </div>
                  <button onClick={() => eliminarSesion(s.id)}
                    style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, padding: "2px 4px", lineHeight: 1, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                    ×
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )
}
