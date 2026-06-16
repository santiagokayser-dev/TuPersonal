import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const CLIENTES = ["Lucas Martínez", "Sofía García", "Martín Ríos", "Carla Pérez"]

const hoy = new Date()
const mesActual = hoy.getMonth()
const añoActual = hoy.getFullYear()

const SESIONES_INICIALES = [
  { id: 1, cliente: "Lucas Martínez", fecha: new Date(añoActual, mesActual, hoy.getDate()), hora: "10:00", duracion: 60, tipo: "Fuerza", color: "#1a3a1a", colorText: "#4ade80" },
  { id: 2, cliente: "Sofía García", fecha: new Date(añoActual, mesActual, hoy.getDate()), hora: "12:00", duracion: 45, tipo: "Cardio", color: "#1a2a3a", colorText: "#60a5fa" },
  { id: 3, cliente: "Martín Ríos", fecha: new Date(añoActual, mesActual, hoy.getDate() + 1), hora: "09:00", duracion: 60, tipo: "Powerlifting", color: "#2a1a3a", colorText: "#c084fc" },
  { id: 4, cliente: "Carla Pérez", fecha: new Date(añoActual, mesActual, hoy.getDate() + 2), hora: "11:00", duracion: 45, tipo: "Full body", color: "#3a2a1a", colorText: "#fb923c" },
]

const S = {
  screen: { flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" },
  title: { fontSize: 22, fontWeight: 600, color: "#fff" },
  card: { background: "#1a1a1e", borderRadius: 14, padding: "12px 14px", border: "0.5px solid #2a2a2e" },
  sectionTitle: { fontSize: 12, fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "#111", border: "0.5px solid #2a2a2e", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", boxSizing: "border-box" },
  btn: (bg) => ({ background: bg || "#6366f1", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }),
  badge: (bg, color) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: bg, color, fontWeight: 500 }),
}

const diasSemana = ["D", "L", "M", "X", "J", "V", "S"]
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

export default function Agenda() {
  const [sesiones, setSesiones] = useState(SESIONES_INICIALES)
  const [mesVista, setMesVista] = useState(mesActual)
  const [añoVista, setAñoVista] = useState(añoActual)
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate())
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nueva, setNueva] = useState({ cliente: CLIENTES[0], hora: "10:00", duracion: 60, tipo: "Fuerza" })
  const [recordatorio, setRecordatorio] = useState(null)

  const diasEnMes = new Date(añoVista, mesVista + 1, 0).getDate()
  const primerDia = new Date(añoVista, mesVista, 1).getDay()

  const sesionesDia = sesiones.filter(s =>
    s.fecha.getDate() === diaSeleccionado &&
    s.fecha.getMonth() === mesVista &&
    s.fecha.getFullYear() === añoVista
  )

  const diasConSesion = sesiones
    .filter(s => s.fecha.getMonth() === mesVista && s.fecha.getFullYear() === añoVista)
    .map(s => s.fecha.getDate())

  const agregarSesion = () => {
    const nuevaSesion = {
      id: Date.now(),
      ...nueva,
      fecha: new Date(añoVista, mesVista, diaSeleccionado),
      color: "#1e1e3a",
      colorText: "#818cf8"
    }
    setSesiones(prev => [...prev, nuevaSesion])
    setMostrarForm(false)
    setRecordatorio(`Recordatorio enviado a ${nueva.cliente} para las ${nueva.hora}hs ✓`)
    setTimeout(() => setRecordatorio(null), 3000)
  }

  const eliminarSesion = (id) => {
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

  return (
    <div style={S.screen}>
      <div style={S.title}>Agenda</div>

      {recordatorio && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ background: "#1a3a1a", borderRadius: 12, padding: "10px 14px", border: "0.5px solid #4ade80", fontSize: 13, color: "#4ade80" }}>
          {recordatorio}
        </motion.div>
      )}

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={mesAnterior} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18 }}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{meses[mesVista]} {añoVista}</div>
          <button onClick={mesSiguiente} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18 }}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {diasSemana.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#444", paddingBottom: 4 }}>{d}</div>
          ))}
          {Array(primerDia).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array(diasEnMes).fill(null).map((_, i) => {
            const dia = i + 1
            const esHoy = dia === hoy.getDate() && mesVista === mesActual && añoVista === añoActual
            const esSeleccionado = dia === diaSeleccionado
            const tieneSesion = diasConSesion.includes(dia)
            return (
              <motion.div key={dia} whileTap={{ scale: 0.9 }} onClick={() => setDiaSeleccionado(dia)}
                style={{
                  aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, cursor: "pointer",
                  background: esSeleccionado ? "#6366f1" : esHoy ? "#1e1e3a" : "transparent",
                  color: esSeleccionado ? "#fff" : esHoy ? "#818cf8" : tieneSesion ? "#fff" : "#555",
                  fontWeight: esHoy || esSeleccionado ? 600 : 400,
                  position: "relative"
                }}>
                {dia}
                {tieneSesion && !esSeleccionado && (
                  <div style={{ position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: "50%", background: "#6366f1" }} />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={S.sectionTitle}>
          {diaSeleccionado === hoy.getDate() && mesVista === mesActual ? "Hoy" : `${diaSeleccionado} de ${meses[mesVista]}`} · {sesionesDia.length} sesiones
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: "#6366f1", border: "none", borderRadius: 20, padding: "5px 14px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          + Nueva
        </motion.button>
      </div>

      <AnimatePresence>
        {mostrarForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ ...S.card, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Nueva sesión — {diaSeleccionado}/{mesVista + 1}</div>
            <select value={nueva.cliente} onChange={e => setNueva(p => ({ ...p, cliente: e.target.value }))} style={{ ...S.input, appearance: "none" }}>
              {CLIENTES.map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input type="time" value={nueva.hora} onChange={e => setNueva(p => ({ ...p, hora: e.target.value }))} style={S.input} />
              <select value={nueva.duracion} onChange={e => setNueva(p => ({ ...p, duracion: Number(e.target.value) }))} style={{ ...S.input, appearance: "none" }}>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
            <input placeholder="Tipo de sesión" value={nueva.tipo} onChange={e => setNueva(p => ({ ...p, tipo: e.target.value }))} style={S.input} />
            <motion.button whileTap={{ scale: 0.97 }} onClick={agregarSesion} style={S.btn()}>
              Agendar y enviar recordatorio
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {sesionesDia.length === 0 ? (
        <div style={{ textAlign: "center", color: "#444", fontSize: 14, paddingTop: 20 }}>Sin sesiones este día</div>
      ) : (
        sesionesDia
          .sort((a, b) => a.hora.localeCompare(b.hora))
          .map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              style={{ ...S.card, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: s.color, borderRadius: 10, padding: "8px 10px", textAlign: "center", minWidth: 44 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.colorText }}>{s.hora}</div>
                <div style={{ fontSize: 10, color: s.colorText, opacity: 0.7 }}>{s.duracion}min</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{s.cliente}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{s.tipo}</div>
              </div>
              <button onClick={() => eliminarSesion(s.id)}
                style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>
                ×
              </button>
            </motion.div>
          ))
      )}
    </div>
  )
}