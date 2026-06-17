import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const S = {
  card: { background: "#111111", borderRadius: 14, padding: "12px 14px", border: "0.5px solid #222222" },
  input: { background: "#111", border: "0.5px solid #2a2a2e", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", boxSizing: "border-box" },
  btn: (bg) => ({ background: bg || "#6366f1", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }),
}

const diasSemana = ["D", "L", "M", "X", "J", "V", "S"]
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

const TIPOS = ["Fuerza", "Cardio", "Movilidad", "Full body", "Powerlifting", "Funcional", "Otro"]

function toLocalDate(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

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

  useEffect(() => {
    cargarSesiones()
  }, [mesVista, añoVista])

  const cargarSesiones = async () => {
    setCargando(true)
    const primerDia = `${añoVista}-${String(mesVista + 1).padStart(2, "0")}-01`
    const ultimoDia = `${añoVista}-${String(mesVista + 1).padStart(2, "0")}-${new Date(añoVista, mesVista + 1, 0).getDate()}`
    const { data } = await supabase.from("sesiones").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia).order("hora")
    if (data) setSesiones(data)
    setCargando(false)
  }

  const agregarSesion = async () => {
    if (!nueva.hora) return
    setGuardando(true)
    const fecha = `${añoVista}-${String(mesVista + 1).padStart(2, "0")}-${String(diaSeleccionado).padStart(2, "0")}`
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from("sesiones").insert({
      trainer_id: user.id,
      cliente_id: nueva.cliente_id || null,
      cliente_nombre: nueva.cliente_nombre || clientes.find(c => c.id === nueva.cliente_id)?.nombre || "Sin cliente",
      fecha,
      hora: nueva.hora,
      duracion: nueva.duracion,
      tipo: nueva.tipo,
      notas: nueva.notas || null,
    }).select().single()
    if (!error && data) {
      setSesiones(prev => [...prev, data])
      setMostrarForm(false)
      setNueva({ cliente_id: "", cliente_nombre: "", hora: "10:00", duracion: 60, tipo: "Fuerza", notas: "" })
    }
    setGuardando(false)
  }

  const eliminarSesion = async (id) => {
    await supabase.from("sesiones").delete().eq("id", id)
    setSesiones(prev => prev.filter(s => s.id !== id))
  }

  const mesAnterior = () => {
    if (mesVista === 0) { setMesVista(11); setAñoVista(a => a - 1) }
    else setMesVista(m => m - 1)
  }
  const mesSiguiente = () => {
    if (mesVista === 11) { setMesVista(0); setAñoVista(a => a + 1) }
    else setMesVista(m => m + 1)
  }

  const diasEnMes = new Date(añoVista, mesVista + 1, 0).getDate()
  const primerDia = new Date(añoVista, mesVista, 1).getDay()

  const fechaStr = (d) => `${añoVista}-${String(mesVista + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`

  const sesionesDia = sesiones.filter(s => s.fecha === fechaStr(diaSeleccionado))
  const diasConSesion = new Set(sesiones.map(s => toLocalDate(s.fecha).getDate()))

  const esHoyDia = (d) => d === hoy.getDate() && mesVista === hoy.getMonth() && añoVista === hoy.getFullYear()

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#fff" }}>Agenda</div>

      {/* Calendario */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={mesAnterior} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "0 4px" }}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{meses[mesVista]} {añoVista}</div>
          <button onClick={mesSiguiente} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "0 4px" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {diasSemana.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#444", paddingBottom: 6 }}>{d}</div>
          ))}
          {Array(primerDia).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array(diasEnMes).fill(null).map((_, i) => {
            const dia = i + 1
            const esHoy = esHoyDia(dia)
            const esSeleccionado = dia === diaSeleccionado
            const tieneSesion = diasConSesion.has(dia)
            return (
              <motion.div key={dia} whileTap={{ scale: 0.85 }} onClick={() => setDiaSeleccionado(dia)}
                style={{ aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer", position: "relative",
                  background: esSeleccionado ? "#6366f1" : esHoy ? "#1e1e3a" : "transparent",
                  color: esSeleccionado ? "#fff" : esHoy ? "#818cf8" : tieneSesion ? "#fff" : "#555",
                  fontWeight: esHoy || esSeleccionado ? 700 : 400 }}>
                {dia}
                {tieneSesion && !esSeleccionado && (
                  <div style={{ position: "absolute", bottom: 2, width: 3, height: 3, borderRadius: "50%", background: "#6366f1" }} />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Header del día */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {esHoyDia(diaSeleccionado) ? "Hoy" : `${diaSeleccionado} de ${meses[mesVista]}`}
          {!cargando && ` · ${sesionesDia.length} ${sesionesDia.length === 1 ? "sesión" : "sesiones"}`}
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: mostrarForm ? "#2a2a3a" : "#6366f1", border: "none", borderRadius: 20, padding: "5px 14px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {mostrarForm ? "Cancelar" : "+ Nueva"}
        </motion.button>
      </div>

      {/* Formulario nueva sesión */}
      <AnimatePresence>
        {mostrarForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ ...S.card, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
              Nueva sesión — {diaSeleccionado}/{mesVista + 1}/{añoVista}
            </div>

            {clientes.length > 0 ? (
              <select value={nueva.cliente_id} onChange={e => setNueva(p => ({ ...p, cliente_id: e.target.value, cliente_nombre: "" }))}
                style={{ ...S.input, appearance: "none" }}>
                <option value="">— Sin cliente asignado —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            ) : (
              <input placeholder="Nombre del cliente" value={nueva.cliente_nombre} onChange={e => setNueva(p => ({ ...p, cliente_nombre: e.target.value }))} style={S.input} />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input type="time" value={nueva.hora} onChange={e => setNueva(p => ({ ...p, hora: e.target.value }))} style={S.input} />
              <select value={nueva.duracion} onChange={e => setNueva(p => ({ ...p, duracion: Number(e.target.value) }))} style={{ ...S.input, appearance: "none" }}>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>2 horas</option>
              </select>
            </div>

            <select value={nueva.tipo} onChange={e => setNueva(p => ({ ...p, tipo: e.target.value }))} style={{ ...S.input, appearance: "none" }}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>

            <input placeholder="Notas (opcional)" value={nueva.notas} onChange={e => setNueva(p => ({ ...p, notas: e.target.value }))} style={S.input} />

            <motion.button whileTap={{ scale: 0.97 }} onClick={agregarSesion} disabled={guardando} style={S.btn(guardando ? "#2a2a3a" : "#6366f1")}>
              {guardando ? "Guardando..." : "Agendar sesión"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de sesiones del día */}
      {cargando ? (
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ textAlign: "center", color: "#444", fontSize: 13, paddingTop: 10 }}>Cargando...</motion.div>
      ) : sesionesDia.length === 0 ? (
        <div style={{ textAlign: "center", color: "#333", fontSize: 14, paddingTop: 20 }}>Sin sesiones este día</div>
      ) : (
        sesionesDia.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            style={{ ...S.card, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#1a1a2e", borderRadius: 10, padding: "8px 10px", textAlign: "center", minWidth: 44, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{s.hora?.slice(0, 5)}</div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{s.duracion}min</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.cliente_nombre || "Sin cliente"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#6366f1", background: "#1a1a3a", borderRadius: 6, padding: "2px 8px" }}>{s.tipo}</span>
                {s.notas && <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>{s.notas}</span>}
              </div>
            </div>
            <button onClick={() => eliminarSesion(s.id)}
              style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 20, padding: "4px 8px", flexShrink: 0, lineHeight: 1 }}>
              ×
            </button>
          </motion.div>
        ))
      )}
    </div>
  )
}
