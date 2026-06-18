import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const C = {
  bg: "#080808", surface: "#111111", surface2: "#161616", surface3: "#1a1a1a",
  border: "#1e1e1e", border2: "#282828",
  text: "#ffffff", textSub: "#888888", textMuted: "#444444",
  accent: "#6366f1", accentSub: "#312e81",
  green: "#22c55e", yellow: "#f59e0b",
}

const TIPO_COLORS = {
  Fuerza:       { bg: "#312e81", text: "#a5b4fc", dot: "#6366f1" },
  Cardio:       { bg: "#1a3040", text: "#67e8f9", dot: "#06b6d4" },
  Movilidad:    { bg: "#1a2e1a", text: "#86efac", dot: "#22c55e" },
  "Full body":  { bg: "#2d1a3a", text: "#d8b4fe", dot: "#a855f7" },
  Powerlifting: { bg: "#3a1a1a", text: "#fca5a5", dot: "#ef4444" },
  Funcional:    { bg: "#2a2010", text: "#fde68a", dot: "#f59e0b" },
  Otro:         { bg: "#1a1a1a", text: "#888888", dot: "#555" },
}

const diasSemana = ["D", "L", "M", "X", "J", "V", "S"]
const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const TIPOS = ["Fuerza","Cardio","Movilidad","Full body","Powerlifting","Funcional","Otro"]

const S = {
  input: { background: C.surface2, border: `0.5px solid ${C.border2}`, borderRadius: 10, padding: "10px 13px", color: C.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system,sans-serif", boxSizing: "border-box" },
}

function toLocalDate(s) { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d) }

export default function Agenda({ clientes = [] }) {
  const hoy = new Date()
  const [sesiones, setSesiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mesVista, setMesVista] = useState(hoy.getMonth())
  const [añoVista, setAñoVista] = useState(hoy.getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate())
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nueva, setNueva] = useState({ cliente_id: "", cliente_nombre: "", hora: "10:00", duracion: 60, tipo: "Fuerza", notas: "" })

  useEffect(() => { cargarSesiones() }, [mesVista, añoVista])

  const cargarSesiones = async () => {
    setCargando(true)
    const p = `${añoVista}-${String(mesVista+1).padStart(2,"0")}`
    const ul = new Date(añoVista, mesVista+1, 0).getDate()
    const { data } = await supabase.from("sesiones").select("*").gte("fecha",`${p}-01`).lte("fecha",`${p}-${ul}`).order("hora")
    if (data) setSesiones(data)
    setCargando(false)
  }

  const agregarSesion = async () => {
    if (!nueva.hora) return
    setGuardando(true)
    const fecha = `${añoVista}-${String(mesVista+1).padStart(2,"0")}-${String(diaSeleccionado).padStart(2,"0")}`
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from("sesiones").insert({
      trainer_id: user.id, cliente_id: nueva.cliente_id || null,
      cliente_nombre: nueva.cliente_nombre || clientes.find(c => c.id === nueva.cliente_id)?.nombre || "Sin cliente",
      fecha, hora: nueva.hora, duracion: nueva.duracion, tipo: nueva.tipo, notas: nueva.notas || null,
    }).select().single()
    if (!error && data) { setSesiones(p => [...p, data]); setMostrarForm(false); setNueva({ cliente_id: "", cliente_nombre: "", hora: "10:00", duracion: 60, tipo: "Fuerza", notas: "" }) }
    setGuardando(false)
  }

  const eliminarSesion = async (id) => {
    await supabase.from("sesiones").delete().eq("id", id)
    setSesiones(p => p.filter(s => s.id !== id))
  }

  const mesAnterior = () => { mesVista === 0 ? (setMesVista(11), setAñoVista(a => a-1)) : setMesVista(m => m-1) }
  const mesSiguiente = () => { mesVista === 11 ? (setMesVista(0), setAñoVista(a => a+1)) : setMesVista(m => m+1) }

  const diasEnMes = new Date(añoVista, mesVista+1, 0).getDate()
  const primerDia = new Date(añoVista, mesVista, 1).getDay()
  const fechaStr = (d) => `${añoVista}-${String(mesVista+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
  const sesionesDia = sesiones.filter(s => s.fecha === fechaStr(diaSeleccionado))
  const esHoyDia = (d) => d === hoy.getDate() && mesVista === hoy.getMonth() && añoVista === hoy.getFullYear()

  // Sesiones por día (para indicadores)
  const sesionesPorDia = {}
  sesiones.forEach(s => {
    const d = toLocalDate(s.fecha).getDate()
    if (!sesionesPorDia[d]) sesionesPorDia[d] = []
    sesionesPorDia[d].push(s)
  })

  // Stats del día
  const totalMinutos = sesionesDia.reduce((s, x) => s + (x.duracion || 0), 0)
  const nombreDia = new Date(añoVista, mesVista, diaSeleccionado).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
  const hoyStr = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.6 }}>Agenda</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
            {nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)}
            {sesionesDia.length > 0 && <> · <span style={{ color: C.accent }}>{sesionesDia.length} sesión{sesionesDia.length > 1 ? "es" : ""}</span></>}
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: mostrarForm ? C.surface3 : C.accent, border: `0.5px solid ${mostrarForm ? C.border2 : "transparent"}`, borderRadius: 14, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: mostrarForm ? "none" : `0 4px 16px ${C.accent}44`, flexShrink: 0 }}>
          {mostrarForm ? "Cancelar" : "+ Nueva sesión"}
        </motion.button>
      </div>

      {/* Stats del día seleccionado */}
      {sesionesDia.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Sesiones", value: sesionesDia.length },
            { label: "Minutos", value: totalMinutos },
            { label: "Clientes", value: new Set(sesionesDia.map(s => s.cliente_nombre)).size },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ flex: 1, background: C.surface, borderRadius: 12, padding: "10px 12px", border: `0.5px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>{m.value}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Calendario */}
      <div style={{ background: C.surface, borderRadius: 18, padding: 16, border: `0.5px solid ${C.border2}` }}>
        {/* Nav mes */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={mesAnterior}
            style={{ width: 32, height: 32, borderRadius: 10, background: C.surface3, border: `0.5px solid ${C.border2}`, color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>‹</motion.button>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: -0.2 }}>{meses[mesVista]} {añoVista}</div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={mesSiguiente}
            style={{ width: 32, height: 32, borderRadius: 10, background: C.surface3, border: `0.5px solid ${C.border2}`, color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>›</motion.button>
        </div>

        {/* Días de semana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {diasSemana.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.textMuted, paddingBottom: 8, letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>

        {/* Grid días */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {Array(primerDia).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array(diasEnMes).fill(null).map((_, i) => {
            const dia = i + 1
            const esHoy = esHoyDia(dia)
            const esSel = dia === diaSeleccionado
            const sessDia = sesionesPorDia[dia] || []
            const tieneS = sessDia.length > 0

            return (
              <motion.div key={dia} whileTap={{ scale: 0.82 }} onClick={() => setDiaSeleccionado(dia)}
                style={{
                  aspectRatio: "1", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer", position: "relative", gap: 2,
                  background: esSel ? C.accent : esHoy ? C.accentSub : "transparent",
                  color: esSel ? "#fff" : esHoy ? "#818cf8" : tieneS ? C.text : C.textMuted,
                  fontWeight: esHoy || esSel ? 700 : 400,
                  border: esHoy && !esSel ? `0.5px solid ${C.accent}66` : "0.5px solid transparent",
                }}>
                <span>{dia}</span>
                {tieneS && (
                  <div style={{ display: "flex", gap: 2, position: "absolute", bottom: 3 }}>
                    {sessDia.slice(0, 3).map((s, j) => (
                      <div key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: esSel ? "#fff9" : (TIPO_COLORS[s.tipo]?.dot || C.accent) }} />
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Formulario nueva sesión */}
      <AnimatePresence>
        {mostrarForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ background: C.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${C.accent}44`, overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              Nueva sesión — {String(diaSeleccionado).padStart(2,"0")}/{String(mesVista+1).padStart(2,"0")}/{añoVista}
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
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>
          {esHoyDia(diaSeleccionado) ? "Hoy" : `${diaSeleccionado} de ${meses[mesVista]}`}
        </div>
        <div style={{ flex: 1, height: "0.5px", background: C.border2 }} />
        <div style={{ fontSize: 11, color: C.textMuted }}>
          {cargando ? "" : `${sesionesDia.length} sesión${sesionesDia.length !== 1 ? "es" : ""}`}
        </div>
      </div>

      {/* Sesiones */}
      {cargando ? (
        <motion.div animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: 12 }}>Cargando...</motion.div>
      ) : sesionesDia.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
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
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.06 }}
                style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border2}`, overflow: "hidden", display: "flex" }}>
                {/* Franja de color por tipo */}
                <div style={{ width: 4, background: tc.dot, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {/* Hora */}
                  <div style={{ background: C.surface3, borderRadius: 10, padding: "8px 10px", textAlign: "center", minWidth: 46, flexShrink: 0, border: `0.5px solid ${C.border2}` }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{s.hora?.slice(0,5)}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{s.duracion}m</div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: tc.bg, borderRadius: 8, padding: "3px 10px", marginBottom: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: tc.dot }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: tc.text }}>{s.tipo}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                      {s.cliente_nombre || "Sin cliente"}
                    </div>
                    {clienteObj?.objetivo && (
                      <div style={{ fontSize: 12, color: C.textMuted }}>{clienteObj.objetivo}</div>
                    )}
                    {s.notas && (
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, fontStyle: "italic" }}>"{s.notas}"</div>
                    )}
                  </div>
                  {/* Eliminar */}
                  <button onClick={() => eliminarSesion(s.id)}
                    style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, padding: "2px 4px", lineHeight: 1, flexShrink: 0, opacity: 0.5, transition: "opacity 0.15s" }}
                    onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.5}>
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
