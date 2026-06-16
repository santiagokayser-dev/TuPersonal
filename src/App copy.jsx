import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AgendaReal from "./Agenda"
import { EJERCICIOS } from "./ejercicios"
const S = {
  app: { background: "#0D0D0F", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "-apple-system, sans-serif" },
  phone: { width: 375, height: 720, background: "#0D0D0F", borderRadius: 36, border: "2px solid #2a2a2e", overflow: "hidden", display: "flex", flexDirection: "column" },
  screen: { flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" },
  title: { fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 2 },
  sub: { fontSize: 13, color: "#666" },
  metricRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  metricCard: { background: "#1a1a1e", borderRadius: 14, padding: 14, border: "0.5px solid #2a2a2e" },
  metricLabel: { fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: 600, color: "#fff" },
  metricChange: { fontSize: 11, color: "#4ade80", marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 },
  card: { background: "#1a1a1e", borderRadius: 14, padding: "12px 14px", border: "0.5px solid #2a2a2e", display: "flex", alignItems: "center", gap: 12 },
  avatar: (bg, color) => ({ width: 40, height: 40, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color, flexShrink: 0 }),
  avatarLg: (bg, color) => ({ width: 64, height: 64, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color, flexShrink: 0 }),
  badge: (bg, color) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: bg, color, fontWeight: 500 }),
  nav: { background: "#111113", borderTop: "0.5px solid #2a2a2e", display: "flex", padding: "8px 0 20px", flexShrink: 0 },
  navBtn: (active) => ({ flex: 1, background: "none", border: "none", color: active ? "#6366f1" : "#555", fontSize: 10, fontWeight: 500, cursor: "pointer", padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
  input: { background: "#1a1a1e", border: "0.5px solid #2a2a2e", borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif" },
  btn: (bg) => ({ background: bg || "#6366f1", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }),
}

const clientes = [
  { ini: "LM", bg: "#1a3a1a", color: "#4ade80", nombre: "Lucas Martínez", detalle: "85kg · 1.78m · Hipertrofia", badge: ["#1a3a1a", "#4ade80", "Al día"], edad: 28, peso: 85, altura: 178, objetivo: "Ganar masa muscular", rutina: "Fuerza 3 días/semana", pagos: [{ mes: "Junio", estado: "Pagado", monto: "$32K", color: "#4ade80" }, { mes: "Mayo", estado: "Pagado", monto: "$32K", color: "#4ade80" }], progreso: [55, 60, 65, 68, 70, 72], ejercicio: "Press de banca (kg)" },
  { ini: "SG", bg: "#1a2a3a", color: "#60a5fa", nombre: "Sofía García", detalle: "62kg · 1.65m · Pérdida de peso", badge: ["#1a3a1a", "#4ade80", "Al día"], edad: 25, peso: 62, altura: 165, objetivo: "Bajar 5kg", rutina: "Cardio + fuerza 4 días/semana", pagos: [{ mes: "Junio", estado: "Pagado", monto: "$28K", color: "#4ade80" }], progreso: [67, 66, 65, 64, 63, 62], ejercicio: "Peso corporal (kg)" },
  { ini: "MR", bg: "#2a1a3a", color: "#c084fc", nombre: "Martín Ríos", detalle: "92kg · 1.82m · Fuerza", badge: ["#3a2a00", "#fbbf24", "Debe 1 mes"], edad: 32, peso: 92, altura: 182, objetivo: "Aumentar fuerza máxima", rutina: "Powerlifting 4 días/semana", pagos: [{ mes: "Junio", estado: "Pendiente", monto: "$30K", color: "#fbbf24" }], progreso: [80, 90, 100, 110, 120, 125], ejercicio: "Sentadilla (kg)" },
  { ini: "CP", bg: "#3a2a1a", color: "#fb923c", nombre: "Carla Pérez", detalle: "58kg · 1.60m · Tonificación", badge: ["#3a1a1a", "#f87171", "Debe 2 meses"], edad: 30, peso: 58, altura: 160, objetivo: "Tonificar y definir", rutina: "Full body 3 días/semana", pagos: [{ mes: "Junio", estado: "Pendiente", monto: "$25K", color: "#f87171" }], progreso: [60, 59, 59, 58, 58, 58], ejercicio: "Peso corporal (kg)" },
]

const ejerciciosPorMusculo = {
  "Pecho": ["Press de banca", "Press inclinado", "Fondos", "Aperturas con mancuernas", "Pullover"],
  "Espalda": ["Dominadas", "Remo con barra", "Remo con mancuerna", "Jalón al pecho", "Peso muerto"],
  "Hombros": ["Press militar", "Elevaciones laterales", "Pájaros", "Press Arnold", "Face pulls"],
  "Piernas": ["Sentadilla", "Prensa", "Extensiones", "Curl femoral", "Zancadas", "Pantorrillas"],
  "Bíceps": ["Curl con barra", "Curl martillo", "Curl concentrado", "Curl en polea"],
  "Tríceps": ["Fondos en paralelas", "Press francés", "Extensión en polea", "Patada de tríceps"],
  "Core": ["Plancha", "Crunch", "Russian twist", "Rueda abdominal", "Elevación de piernas"],
}

const navItems = [
  { id: "inicio", icon: "⌂", label: "Inicio" },
  { id: "clientes", icon: "👥", label: "Clientes" },
  { id: "rutinas", icon: "💪", label: "Rutinas" },
  { id: "agenda", icon: "📅", label: "Agenda" },
  { id: "pagos", icon: "💳", label: "Pagos" },
]

const barData = [40, 55, 62, 70, 80, 95]
const barLabels = ["E", "F", "M", "A", "M", "J"]

function BarChart({ data, label }) {
  const max = Math.max(...data)
  return (
    <div style={{ background: "#1a1a1e", borderRadius: 14, padding: 14, border: "0.5px solid #2a2a2e" }}>
      <div style={S.sectionTitle}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70, marginTop: 10 }}>
        {data.map((h, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${(h / max) * 100}%` }} transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }} style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === data.length - 1 ? "#6366f1" : "#333" }} />
            <div style={{ fontSize: 10, color: "#555" }}>{barLabels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CreadorRutinas() {
  const [modo, setModo] = useState("menu")
  const [clienteSelec, setClienteSelec] = useState("")
  const [prompt, setPrompt] = useState("")
  const [cargando, setCargando] = useState(false)
  const [rutinaAI, setRutinaAI] = useState(null)
  const [musculoSelec, setMusculoSelec] = useState(null)
  const [ejerciciosSelec, setEjerciciosSelec] = useState([])
  const [rutinaManual, setRutinaManual] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [nuevoEj, setNuevoEj] = useState({ nombre: "", youtube: "", descripcion: "" })
  const [ejerciciosCustom, setEjerciciosCustom] = useState({})

  const todosEjercicios = musculoSelec ? [
    ...(EJERCICIOS[musculoSelec] || []),
    ...(ejerciciosCustom[musculoSelec] || [])
  ].filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase())) : []

  const generarConAI = async () => {
    if (!prompt.trim()) return
    setCargando(true)
    setRutinaAI(null)
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "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",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: `Sos un personal trainer experto. Generá una rutina de entrenamiento basada en esto: "${prompt}". 
            Respondé SOLO con JSON válido, sin texto extra, con este formato exacto:
            {
              "nombre": "nombre de la rutina",
              "dias": [
                {
                  "dia": "Día A - nombre",
                  "ejercicios": [
                    { "nombre": "nombre ejercicio", "series": 3, "reps": "8-10", "peso": "70kg", "musculo": "Pecho" }
                  ]
                }
              ]
            }`
          }]
        })
      })
      const data = await res.json()
      const texto = data.content[0].text
      const clean = texto.replace(/```json|```/g, "").trim()
      const rutina = JSON.parse(clean)
      setRutinaAI(rutina)
    } catch (e) {
      setRutinaAI({ error: true })
    }
    setCargando(false)
  }

  const toggleEjercicio = (ej) => {
    setEjerciciosSelec(prev =>
      prev.find(e => e.nombre === ej.nombre)
        ? prev.filter(e => e.nombre !== ej.nombre)
        : [...prev, { ...ej, series: 3, reps: "10-12", musculo: musculoSelec }]
    )
  }

  const agregarEjercicioCustom = () => {
    if (!nuevoEj.nombre.trim() || !musculoSelec) return
    setEjerciciosCustom(prev => ({
      ...prev,
      [musculoSelec]: [...(prev[musculoSelec] || []), { ...nuevoEj }]
    }))
    setNuevoEj({ nombre: "", youtube: "", descripcion: "" })
    setMostrarNuevo(false)
  }

  const RutinaCard = ({ rutina }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{rutina.nombre}</div>
      {rutina.dias.map((dia, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          style={{ background: "#1a1a1e", borderRadius: 16, border: "0.5px solid #2a2a2e", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #2a2a2e", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{dia.dia}</div>
            <div style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#1e1e3a", color: "#818cf8", fontWeight: 500 }}>{dia.ejercicios.length} ejercicios</div>
          </div>
          {dia.ejercicios.map((ej, j) => {
            const ejInfo = Object.values(EJERCICIOS).flat().find(e => e.nombre.toLowerCase() === ej.nombre.toLowerCase())
            return (
              <div key={j} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: j < dia.ejercicios.length - 1 ? "0.5px solid #1a1a1e" : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e1e3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#818cf8", fontWeight: 600, flexShrink: 0 }}>{j + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{ej.nombre}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{ej.series} × {ej.reps}{ej.peso ? ` · ${ej.peso}` : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#1e1e3a", color: "#818cf8" }}>{ej.musculo}</div>
                  {ejInfo?.youtube && (
                    <a href={ejInfo.youtube} target="_blank" rel="noopener noreferrer"
                      style={{ width: 26, height: 26, borderRadius: 8, background: "#3a1a1a", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: 12 }}>
                      ▶
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      ))}
      <button onClick={() => { setModo("menu"); setRutinaAI(null); setRutinaManual(null); setEjerciciosSelec([]) }}
        style={{ background: "#1a1a1e", border: "0.5px solid #2a2a2e", borderRadius: 12, padding: "12px 0", color: "#818cf8", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
        ← Nueva rutina
      </button>
    </div>
  )

  if (modo === "menu") return (
    <>
      <div style={S.title}>Rutinas</div>
      <motion.div whileTap={{ scale: 0.97 }} onClick={() => setModo("ai")}
        style={{ background: "#1e1b3a", borderRadius: 16, padding: 18, border: "0.5px solid #312e81", cursor: "pointer" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#c4b5fd" }}>✨ Generar con AI</div>
        <div style={{ fontSize: 13, color: "#818cf8", marginTop: 4 }}>Describís qué necesita el cliente y la AI arma la rutina completa</div>
      </motion.div>
      <motion.div whileTap={{ scale: 0.97 }} onClick={() => setModo("manual")}
        style={{ background: "#1a1a1e", borderRadius: 16, padding: 18, border: "0.5px solid #2a2a2e", cursor: "pointer" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>📋 Armar manualmente</div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Elegís de una biblioteca de +80 ejercicios con videos de técnica</div>
      </motion.div>
    </>
  )

  if (modo === "ai") return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setModo("menu")} style={{ background: "#1a1a1e", border: "0.5px solid #2a2a2e", borderRadius: 10, padding: "6px 10px", color: "#fff", cursor: "pointer", fontSize: 16 }}>←</button>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Generar con AI</div>
      </div>
      <div style={{ background: "#1a1a1e", borderRadius: 14, padding: 14, border: "0.5px solid #2a2a2e" }}>
        <div style={{ ...S.sectionTitle, marginBottom: 8 }}>Para qué cliente</div>
        <select value={clienteSelec} onChange={e => setClienteSelec(e.target.value)} style={{ ...S.input, appearance: "none" }}>
          <option value="">Seleccionar cliente...</option>
          {clientes.map((c, i) => <option key={i} value={c.nombre}>{c.nombre}</option>)}
        </select>
      </div>
      <div style={{ background: "#1a1a1e", borderRadius: 14, padding: 14, border: "0.5px solid #2a2a2e" }}>
        <div style={{ ...S.sectionTitle, marginBottom: 8 }}>Describí la rutina</div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Ej: Rutina de hipertrofia para Lucas, 3 días por semana, enfocada en pecho y espalda, nivel intermedio..."
          style={{ ...S.input, minHeight: 90, resize: "none", lineHeight: 1.5 }} />
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={generarConAI} disabled={cargando || !prompt.trim()}
        style={{ ...S.btn(), opacity: cargando || !prompt.trim() ? 0.5 : 1 }}>
        {cargando ? "Generando rutina..." : "✨ Generar rutina"}
      </motion.button>
      {cargando && (
        <div style={{ textAlign: "center", color: "#818cf8", fontSize: 13 }}>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            La AI está armando tu rutina...
          </motion.div>
        </div>
      )}
      {rutinaAI && !rutinaAI.error && <RutinaCard rutina={rutinaAI} />}
      {rutinaAI?.error && <div style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>Hubo un error. Intentá de nuevo.</div>}
    </>
  )

  if (modo === "manual") return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => { setModo("menu"); setMusculoSelec(null); setEjerciciosSelec([]) }}
          style={{ background: "#1a1a1e", border: "0.5px solid #2a2a2e", borderRadius: 10, padding: "6px 10px", color: "#fff", cursor: "pointer", fontSize: 16 }}>←</button>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Biblioteca de ejercicios</div>
        {ejerciciosSelec.length > 0 && <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "#1e1e3a", color: "#818cf8", fontWeight: 500 }}>{ejerciciosSelec.length} sel.</div>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Object.keys(EJERCICIOS).map(m => (
          <button key={m} onClick={() => { setMusculoSelec(musculoSelec === m ? null : m); setBusqueda("") }}
            style={{ padding: "6px 14px", borderRadius: 20, border: "0.5px solid", borderColor: musculoSelec === m ? "#6366f1" : "#2a2a2e", background: musculoSelec === m ? "#1e1e3a" : "#1a1a1e", color: musculoSelec === m ? "#818cf8" : "#888", fontSize: 12, cursor: "pointer" }}>
            {m}
          </button>
        ))}
      </div>

      {musculoSelec && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "#1a1a1e", borderRadius: 14, border: "0.5px solid #2a2a2e", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "0.5px solid #222", display: "flex", gap: 8 }}>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio..."
              style={{ ...S.input, marginBottom: 0, flex: 1 }} />
            <button onClick={() => setMostrarNuevo(!mostrarNuevo)}
              style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "0 12px", color: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>+</button>
          </div>

          <AnimatePresence>
            {mostrarNuevo && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                style={{ overflow: "hidden", borderBottom: "0.5px solid #222" }}>
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>Nuevo ejercicio en {musculoSelec}</div>
                  <input placeholder="Nombre del ejercicio" value={nuevoEj.nombre} onChange={e => setNuevoEj(p => ({ ...p, nombre: e.target.value }))} style={{ ...S.input, marginBottom: 0 }} />
                  <input placeholder="Link de YouTube (opcional)" value={nuevoEj.youtube} onChange={e => setNuevoEj(p => ({ ...p, youtube: e.target.value }))} style={{ ...S.input, marginBottom: 0 }} />
                  <input placeholder="Descripción breve" value={nuevoEj.descripcion} onChange={e => setNuevoEj(p => ({ ...p, descripcion: e.target.value }))} style={{ ...S.input, marginBottom: 0 }} />
                  <button onClick={agregarEjercicioCustom} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "10px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Agregar ejercicio
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {todosEjercicios.map((ej, i) => {
            const seleccionado = ejerciciosSelec.find(e => e.nombre === ej.nombre)
            return (
              <div key={i} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < todosEjercicios.length - 1 ? "0.5px solid #1a1a1a" : "none" }}>
                <div onClick={() => toggleEjercicio(ej)} style={{ flex: 1, cursor: "pointer" }}>
                  <div style={{ fontSize: 13, color: seleccionado ? "#fff" : "#aaa", fontWeight: seleccionado ? 500 : 400 }}>{ej.nombre}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{ej.descripcion}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {ej.youtube && (
                    <a href={ej.youtube} target="_blank" rel="noopener noreferrer"
                      style={{ width: 28, height: 28, borderRadius: 8, background: "#3a1a1a", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: 12 }}>
                      ▶
                    </a>
                  )}
                  <div onClick={() => toggleEjercicio(ej)}
                    style={{ width: 24, height: 24, borderRadius: "50%", background: seleccionado ? "#6366f1" : "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", cursor: "pointer" }}>
                    {seleccionado ? "✓" : "+"}
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {ejerciciosSelec.length > 0 && (
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => { setRutinaManual({ nombre: "Rutina personalizada", dias: [{ dia: "Día A", ejercicios: ejerciciosSelec }] }); setModo("resultado-manual") }}
          style={S.btn()}>
          Crear rutina con {ejerciciosSelec.length} ejercicios
        </motion.button>
      )}
    </>
  )

  if (modo === "resultado-manual" && rutinaManual) return <RutinaCard rutina={rutinaManual} />
  return null
}

function PerfilCliente({ cliente, onBack }) {
  const [tab, setTab] = useState("info")
  const tabs = ["info", "progreso", "pagos"]
  const tabLabels = { info: "Info", progreso: "Progreso", pagos: "Pagos" }
  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.25 }} style={{ ...S.screen, paddingTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "#1a1a1e", border: "0.5px solid #2a2a2e", borderRadius: 10, padding: "6px 10px", color: "#fff", cursor: "pointer", fontSize: 16 }}>←</button>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Perfil del cliente</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#1a1a1e", borderRadius: 16, padding: 16, border: "0.5px solid #2a2a2e" }}>
        <div style={S.avatarLg(cliente.bg, cliente.color)}>{cliente.ini}</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#fff" }}>{cliente.nombre}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{cliente.objetivo}</div>
          <div style={{ marginTop: 8 }}><span style={S.badge(cliente.badge[0], cliente.badge[1])}>{cliente.badge[2]}</span></div>
        </div>
      </div>
      <div style={{ display: "flex", background: "#1a1a1e", borderRadius: 12, padding: 3, gap: 3 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: tab === t ? "#6366f1" : "transparent", color: tab === t ? "#fff" : "#555", transition: "all 0.2s" }}>{tabLabels[t]}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tab === "info" && (<>
            <div style={S.metricRow}>
              <div style={S.metricCard}><div style={S.metricLabel}>Peso</div><div style={S.metricValue}>{cliente.peso}kg</div></div>
              <div style={S.metricCard}><div style={S.metricLabel}>Altura</div><div style={S.metricValue}>{cliente.altura}cm</div></div>
            </div>
            <div style={S.metricRow}>
              <div style={S.metricCard}><div style={S.metricLabel}>Edad</div><div style={S.metricValue}>{cliente.edad} años</div></div>
              <div style={S.metricCard}><div style={S.metricLabel}>IMC</div><div style={S.metricValue}>{(cliente.peso / ((cliente.altura / 100) ** 2)).toFixed(1)}</div></div>
            </div>
            <div style={{ background: "#1a1a1e", borderRadius: 14, padding: 14, border: "0.5px solid #2a2a2e" }}><div style={S.sectionTitle}>Objetivo</div><div style={{ fontSize: 14, color: "#ddd", marginTop: 6 }}>{cliente.objetivo}</div></div>
            <div style={{ background: "#1a1a1e", borderRadius: 14, padding: 14, border: "0.5px solid #2a2a2e" }}><div style={S.sectionTitle}>Rutina actual</div><div style={{ fontSize: 14, color: "#ddd", marginTop: 6 }}>{cliente.rutina}</div></div>
          </>)}
          {tab === "progreso" && <BarChart data={cliente.progreso} label={cliente.ejercicio} />}
          {tab === "pagos" && cliente.pagos.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              style={{ background: "#1a1a1e", borderRadius: 12, padding: "12px 14px", border: "0.5px solid #2a2a2e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 14, color: "#ddd", fontWeight: 500 }}>{p.mes} 2025</div><div style={{ fontSize: 12, color: p.color, marginTop: 2 }}>{p.estado}</div></div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{p.monto}</div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

function Clientes({ onVerPerfil }) {
  return (
    <>
      <div style={S.title}>Clientes</div>
      {clientes.map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} onClick={() => onVerPerfil(c)} style={{ ...S.card, cursor: "pointer" }}>
          <div style={S.avatar(c.bg, c.color)}>{c.ini}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{c.nombre}</div><div style={{ fontSize: 12, color: "#666" }}>{c.detalle}</div></div>
          <div style={S.badge(c.badge[0], c.badge[1])}>{c.badge[2]}</div>
        </motion.div>
      ))}
    </>
  )
}

function Inicio() {
  return (
    <>
      <div><div style={S.title}>Hola, Nico 👋</div><div style={S.sub}>Lunes 16 de junio</div></div>
      <div style={S.metricRow}>
        <div style={S.metricCard}><div style={S.metricLabel}>Ingresos mes</div><div style={S.metricValue}>$480K</div><div style={S.metricChange}>+12% vs anterior</div></div>
        <div style={S.metricCard}><div style={S.metricLabel}>Clientes</div><div style={S.metricValue}>18</div><div style={S.metricChange}>+2 este mes</div></div>
      </div>
      <BarChart data={barData} label="Ingresos últimos 6 meses" />
      <div style={S.sectionTitle}>Próximos turnos</div>
      <div style={S.card}><div style={S.avatar("#1a3a1a", "#4ade80")}>LM</div><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Lucas Martínez</div><div style={{ fontSize: 12, color: "#666" }}>10:00hs · Fuerza e hipertrofia</div></div><div style={S.badge("#1a3a1a", "#4ade80")}>Hoy</div></div>
      <div style={S.card}><div style={S.avatar("#1a2a3a", "#60a5fa")}>SG</div><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Sofía García</div><div style={{ fontSize: 12, color: "#666" }}>12:00hs · Pérdida de peso</div></div><div style={S.badge("#1a3a1a", "#4ade80")}>Hoy</div></div>
      <motion.button whileTap={{ scale: 0.97 }}
  onClick={() => window.location.href = "?rol=cliente"}
  style={{ background: "#1a1a1e", border: "0.5px solid #2a2a2e", borderRadius: 12, padding: "10px 0", color: "#818cf8", fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" }}>
  👁 Previsualizar vista del cliente
</motion.button>

    </>
  )
}

function Agenda() {
  return (
    <>
      <div style={S.title}>Agenda</div>
      <div style={{ ...S.card, flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 8 }}>Sesiones de hoy</div>
        <div style={{ fontSize: 13, color: "#888" }}>10:00hs — Lucas Martínez</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>12:00hs — Sofía García</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>14:00hs — Martín Ríos</div>
      </div>
    </>
  )
}

function Pagos() {
  return (
    <>
      <div style={S.title}>Pagos</div>
      <div style={S.metricRow}>
        <div style={S.metricCard}><div style={S.metricLabel}>Cobrado</div><div style={{ ...S.metricValue, fontSize: 18 }}>$384K</div><div style={S.metricChange}>16 clientes</div></div>
        <div style={S.metricCard}><div style={S.metricLabel}>Pendiente</div><div style={{ ...S.metricValue, fontSize: 18, color: "#f87171" }}>$96K</div><div style={{ ...S.metricChange, color: "#f87171" }}>2 clientes</div></div>
      </div>
    </>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState("inicio")
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  const renderPage = () => {
    if (clienteSeleccionado) return <PerfilCliente cliente={clienteSeleccionado} onBack={() => setClienteSeleccionado(null)} />
    switch (activePage) {
      case "inicio": return <motion.div key="inicio" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} style={S.screen}><Inicio /></motion.div>
      case "clientes": return <motion.div key="clientes" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} style={S.screen}><Clientes onVerPerfil={setClienteSeleccionado} /></motion.div>
      case "rutinas": return <motion.div key="rutinas" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} style={S.screen}><CreadorRutinas /></motion.div>
      case "agenda": return <motion.div key="agenda" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}><AgendaReal /></motion.div>
      case "pagos": return <motion.div key="pagos" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} style={S.screen}><Pagos /></motion.div>
      default: return null
    }
  }

  return (
    <div style={S.app}>
      <div style={S.phone}>
        <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
        </div>
        {!clienteSeleccionado && (
          <nav style={S.nav}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActivePage(item.id)} style={S.navBtn(activePage === item.id)}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}