import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AgendaReal from "./Agenda"
import { EJERCICIOS } from "./ejercicios"

const COLORS = {
  bg: "#080808",
  surface: "#111111",
  surface2: "#1a1a1a",
  border: "#222222",
  border2: "#2a2a2a",
  text: "#ffffff",
  textSub: "#888888",
  textMuted: "#444444",
  accent: "#6366f1",
  accentSub: "#312e81",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#f59e0b",
}

const T = {
  h1: { fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: -0.8, lineHeight: 1.1 },
  h2: { fontSize: 20, fontWeight: 600, color: COLORS.text, letterSpacing: -0.4 },
  h3: { fontSize: 15, fontWeight: 600, color: COLORS.text, letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: 400, color: COLORS.textSub, lineHeight: 1.5 },
  label: { fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1.2 },
  num: { fontSize: 32, fontWeight: 700, color: COLORS.text, letterSpacing: -1 },
}

const Icon = ({ name, size = 20, color = COLORS.textSub }) => {
  const icons = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    dumbbell: <><path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h2v5H3zM19 9.5h2v5h-2zM5 7.5h2v9H5zM17 7.5h2v9h-2z"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    wallet: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 100-2 1 1 0 000 2z"/></>,
    chevronRight: <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>,
    chevronDown: <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    x: <><path d="M18 6L6 18M6 6l12 12"/></>,
    sparkles: <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/></>,
    arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>,
    check: <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>,
    trash: <><path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2"/></>,
    trendingUp: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      {icons[name]}
    </svg>
  )
}

const clientes = [
  { ini: "LM", nombre: "Lucas Martínez", objetivo: "Hipertrofia", peso: 85, altura: 178, edad: 28, estado: "Al día", estadoColor: COLORS.green, rutina: "Fuerza 3 días/semana", progreso: [55, 60, 65, 68, 70, 72], ejercicio: "Press de banca (kg)", pagos: [{ mes: "Junio", estado: "Pagado", monto: "$32.000", color: COLORS.green }, { mes: "Mayo", estado: "Pagado", monto: "$32.000", color: COLORS.green }] },
  { ini: "SG", nombre: "Sofía García", objetivo: "Pérdida de peso", peso: 62, altura: 165, edad: 25, estado: "Al día", estadoColor: COLORS.green, rutina: "Cardio + fuerza 4 días", progreso: [67, 66, 65, 64, 63, 62], ejercicio: "Peso corporal (kg)", pagos: [{ mes: "Junio", estado: "Pagado", monto: "$28.000", color: COLORS.green }] },
  { ini: "MR", nombre: "Martín Ríos", objetivo: "Fuerza máxima", peso: 92, altura: 182, edad: 32, estado: "Debe 1 mes", estadoColor: COLORS.yellow, rutina: "Powerlifting 4 días", progreso: [80, 90, 100, 110, 120, 125], ejercicio: "Sentadilla (kg)", pagos: [{ mes: "Junio", estado: "Pendiente", monto: "$30.000", color: COLORS.yellow }] },
  { ini: "CP", nombre: "Carla Pérez", objetivo: "Tonificación", peso: 58, altura: 160, edad: 30, estado: "Debe 2 meses", estadoColor: COLORS.red, rutina: "Full body 3 días", progreso: [60, 59, 59, 58, 58, 58], ejercicio: "Peso corporal (kg)", pagos: [{ mes: "Junio", estado: "Pendiente", monto: "$25.000", color: COLORS.red }] },
]

const navItems = [
  { id: "inicio", icon: "home", label: "Inicio" },
  { id: "clientes", icon: "users", label: "Clientes" },
  { id: "rutinas", icon: "dumbbell", label: "Rutinas" },
  { id: "agenda", icon: "calendar", label: "Agenda" },
  { id: "pagos", icon: "wallet", label: "Pagos" },
]

const barData = [40, 55, 62, 70, 80, 95]
const barLabels = ["E", "F", "M", "A", "M", "J"]

function MiniBar({ data, labels }) {
  const max = Math.max(...data)
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
      {data.map((h, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
          <motion.div
            initial={{ height: 0 }} animate={{ height: `${(h / max) * 100}%` }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            style={{ width: "100%", borderRadius: 3, background: i === data.length - 1 ? COLORS.accent : COLORS.surface2 }}
          />
          <div style={{ ...T.label, fontSize: 9, letterSpacing: 0 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

function Inicio() {
  return (
    <>
      <div style={{ paddingBottom: 8 }}>
        <div style={{ ...T.label, marginBottom: 8 }}>Lunes, 16 de junio</div>
        <div style={T.h1}>Hola, Nico</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Ingresos", value: "$480K", change: "+12%", icon: "trendingUp", changeColor: COLORS.green },
          { label: "Clientes", value: "18", change: "+2 este mes", icon: "users", changeColor: COLORS.green },
          { label: "Promedio", value: "$26K", change: "Sin cambios", icon: "wallet", changeColor: COLORS.textMuted },
          { label: "Hoy", value: "5", change: "Próx: 10:00", icon: "calendar", changeColor: COLORS.textMuted },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: COLORS.surface, borderRadius: 16, padding: "14px 14px 12px", border: `0.5px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={T.label}>{m.label}</div>
              <Icon name={m.icon} size={14} color={COLORS.textMuted} />
            </div>
            <div style={{ ...T.num, fontSize: 24, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: m.changeColor, fontWeight: 500 }}>{m.change}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ ...T.label, marginBottom: 14 }}>Ingresos — últimos 6 meses</div>
        <MiniBar data={barData} labels={barLabels} />
      </div>

      <div style={T.label}>Próximas sesiones</div>

      {clientes.slice(0, 2).map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
          style={{ background: COLORS.surface, borderRadius: 16, padding: "12px 14px", border: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>{c.ini}</div>
          <div style={{ flex: 1 }}>
            <div style={T.h3}>{c.nombre}</div>
            <div style={{ ...T.body, fontSize: 12, marginTop: 1 }}>{i === 0 ? "10:00hs" : "12:00hs"} · {c.objetivo}</div>
          </div>
          <Icon name="chevronRight" size={16} color={COLORS.textMuted} />
        </motion.div>
      ))}
      <motion.button whileTap={{ scale: 0.97 }}
  onClick={() => window.location.href = "?rol=cliente"}
  style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 14, padding: "13px 0", color: COLORS.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
  <Icon name="users" size={14} color={COLORS.textSub} />
  Vista del cliente
</motion.button>
    </>
  )
}

function PerfilCliente({ cliente, onBack }) {
  const [tab, setTab] = useState("info")
  const max = Math.max(...cliente.progreso)
  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}
      style={{ display: "flex", flexDirection: "column", gap: 14, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: "8px 12px", color: COLORS.text, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <Icon name="arrowLeft" size={16} color={COLORS.text} />
        </button>
        <div style={T.h3}>Perfil</div>
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 18, padding: 18, border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: COLORS.accent }}>{cliente.ini}</div>
          <div>
            <div style={T.h2}>{cliente.nombre}</div>
            <div style={{ ...T.body, marginTop: 2 }}>{cliente.objetivo}</div>
            <div style={{ marginTop: 6, display: "inline-block", background: cliente.estadoColor + "22", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: cliente.estadoColor }}>{cliente.estado}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", background: COLORS.surface, borderRadius: 14, padding: 3, gap: 3 }}>
        {["info", "progreso", "pagos"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px 0", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: tab === t ? COLORS.accent : "transparent", color: tab === t ? "#fff" : COLORS.textSub, transition: "all 0.2s" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tab === "info" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ l: "Peso", v: `${cliente.peso}kg` }, { l: "Altura", v: `${cliente.altura}cm` }, { l: "Edad", v: `${cliente.edad} años` }, { l: "IMC", v: (cliente.peso / ((cliente.altura / 100) ** 2)).toFixed(1) }].map((m, i) => (
                  <div key={i} style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                    <div style={T.label}>{m.l}</div>
                    <div style={{ ...T.num, fontSize: 22, marginTop: 4 }}>{m.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                <div style={{ ...T.label, marginBottom: 8 }}>Rutina actual</div>
                <div style={T.h3}>{cliente.rutina}</div>
              </div>
            </>
          )}
          {tab === "progreso" && (
            <div style={{ background: COLORS.surface, borderRadius: 14, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
              <div style={{ ...T.label, marginBottom: 14 }}>{cliente.ejercicio}</div>
              <MiniBar data={cliente.progreso} labels={["E", "F", "M", "A", "M", "J"]} />
            </div>
          )}
          {tab === "pagos" && cliente.pagos.map((p, i) => (
            <div key={i} style={{ background: COLORS.surface, borderRadius: 14, padding: "14px 16px", border: `0.5px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={T.h3}>{p.mes} 2025</div>
                <div style={{ fontSize: 12, color: p.color, marginTop: 3, fontWeight: 500 }}>{p.estado}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>{p.monto}</div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

function Clientes({ onVerPerfil }) {
  return (
    <>
      <div style={T.h1}>Clientes</div>
      {clientes.map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
          onClick={() => onVerPerfil(c)} style={{ background: COLORS.surface, borderRadius: 16, padding: "14px 16px", border: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>{c.ini}</div>
          <div style={{ flex: 1 }}>
            <div style={T.h3}>{c.nombre}</div>
            <div style={{ ...T.body, fontSize: 12, marginTop: 2 }}>{c.objetivo}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.estadoColor }}>{c.estado}</div>
            <Icon name="chevronRight" size={14} color={COLORS.textMuted} />
          </div>
        </motion.div>
      ))}
    </>
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
          "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          messages: [{ role: "user", content: `Sos un personal trainer experto. Generá una rutina basada en: "${prompt}". Respondé SOLO con JSON válido sin texto extra: {"nombre": "nombre rutina","dias": [{"dia": "Día A - nombre","ejercicios": [{"nombre": "ejercicio","series": 3,"reps": "8-10","peso": "70kg","musculo": "Pecho"}]}]}` }]
        })
      })
      const data = await res.json()
      const texto = data.content[0].text
      const clean = texto.replace(/```json|```/g, "").trim()
      setRutinaAI(JSON.parse(clean))
    } catch (e) { setRutinaAI({ error: true }) }
    setCargando(false)
  }

  const toggleEjercicio = (ej) => {
    setEjerciciosSelec(prev => prev.find(e => e.nombre === ej.nombre) ? prev.filter(e => e.nombre !== ej.nombre) : [...prev, { ...ej, series: 3, reps: "10-12", musculo: musculoSelec }])
  }

  const agregarCustom = () => {
    if (!nuevoEj.nombre.trim() || !musculoSelec) return
    setEjerciciosCustom(prev => ({ ...prev, [musculoSelec]: [...(prev[musculoSelec] || []), { ...nuevoEj }] }))
    setNuevoEj({ nombre: "", youtube: "", descripcion: "" })
    setMostrarNuevo(false)
  }

  const RutinaCard = ({ rutina }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={T.h2}>{rutina.nombre}</div>
      {rutina.dias.map((dia, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          style={{ background: COLORS.surface, borderRadius: 18, border: `0.5px solid ${COLORS.border}`, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={T.h3}>{dia.dia}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, background: COLORS.accentSub + "44", borderRadius: 8, padding: "3px 10px" }}>{dia.ejercicios.length} ejercicios</div>
          </div>
          {dia.ejercicios.map((ej, j) => {
            const ejInfo = Object.values(EJERCICIOS).flat().find(e => e.nombre.toLowerCase() === ej.nombre.toLowerCase())
            const youtubeUrl = ejInfo?.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(ej.nombre + " técnica correcta")}`
            return (
              <div key={j} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: j < dia.ejercicios.length - 1 ? `0.5px solid ${COLORS.border}` : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: COLORS.textSub, flexShrink: 0 }}>{j + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{ej.nombre}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{ej.series} × {ej.reps}{ej.peso ? ` · ${ej.peso}` : ""}</div>
                </div>
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
                  style={{ width: 30, height: 30, borderRadius: 10, background: "#3a1a1a", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                  <Icon name="play" size={12} color="#f87171" />
                </a>
              </div>
            )
          })}
        </motion.div>
      ))}
      <button onClick={() => { setModo("menu"); setRutinaAI(null); setRutinaManual(null); setEjerciciosSelec([]) }}
        style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 14, padding: "13px 0", color: COLORS.textSub, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
        Nueva rutina
      </button>
    </div>
  )

  const inputStyle = { background: COLORS.surface, border: `0.5px solid ${COLORS.border2}`, borderRadius: 12, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", boxSizing: "border-box" }

  if (modo === "menu") return (
    <>
      <div style={T.h1}>Rutinas</div>
      <motion.div whileTap={{ scale: 0.98 }} onClick={() => setModo("ai")}
        style={{ background: COLORS.accentSub, borderRadius: 18, padding: 20, border: `0.5px solid ${COLORS.accent}44`, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Icon name="sparkles" size={18} color={COLORS.accent} />
          <div style={{ ...T.h3, color: "#a5b4fc" }}>Generar con AI</div>
        </div>
        <div style={{ ...T.body, color: "#6366f180" }}>Describís el objetivo del cliente y la AI diseña la rutina completa</div>
      </motion.div>
      <motion.div whileTap={{ scale: 0.98 }} onClick={() => setModo("manual")}
        style={{ background: COLORS.surface, borderRadius: 18, padding: 20, border: `0.5px solid ${COLORS.border}`, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Icon name="dumbbell" size={18} color={COLORS.textSub} />
          <div style={T.h3}>Armar manualmente</div>
        </div>
        <div style={T.body}>Biblioteca de +80 ejercicios con videos de técnica</div>
      </motion.div>
    </>
  )

  if (modo === "ai") return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setModo("menu")} style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: 8, cursor: "pointer", display: "flex" }}>
          <Icon name="arrowLeft" size={18} color={COLORS.text} />
        </button>
        <div style={T.h2}>Generar con AI</div>
      </div>
      <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ ...T.label, marginBottom: 10 }}>Cliente</div>
        <select value={clienteSelec} onChange={e => setClienteSelec(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
          <option value="">Seleccionar...</option>
          {clientes.map((c, i) => <option key={i} value={c.nombre}>{c.nombre}</option>)}
        </select>
      </div>
      <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ ...T.label, marginBottom: 10 }}>Describí la rutina</div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Ej: Rutina de hipertrofia 3 días/semana, enfocada en pecho y espalda, nivel intermedio..."
          style={{ ...inputStyle, minHeight: 90, resize: "none", lineHeight: 1.6 }} />
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={generarConAI} disabled={cargando || !prompt.trim()}
        style={{ background: cargando || !prompt.trim() ? COLORS.surface2 : COLORS.accent, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", opacity: cargando || !prompt.trim() ? 0.5 : 1 }}>
        {cargando ? "Generando..." : "Generar rutina"}
      </motion.button>
      {cargando && (
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ textAlign: "center", color: COLORS.accent, fontSize: 13 }}>La AI está diseñando tu rutina...</motion.div>
      )}
      {rutinaAI && !rutinaAI.error && <RutinaCard rutina={rutinaAI} />}
      {rutinaAI?.error && <div style={{ color: COLORS.red, fontSize: 13, textAlign: "center" }}>Hubo un error. Intentá de nuevo.</div>}
    </>
  )

  if (modo === "manual") return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => { setModo("menu"); setMusculoSelec(null); setEjerciciosSelec([]) }}
          style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: 8, cursor: "pointer", display: "flex" }}>
          <Icon name="arrowLeft" size={18} color={COLORS.text} />
        </button>
        <div style={T.h2}>Biblioteca</div>
        {ejerciciosSelec.length > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, background: COLORS.accentSub + "44", borderRadius: 8, padding: "3px 10px" }}>{ejerciciosSelec.length} sel.</div>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Object.keys(EJERCICIOS).map(m => (
          <button key={m} onClick={() => { setMusculoSelec(musculoSelec === m ? null : m); setBusqueda("") }}
            style={{ padding: "7px 14px", borderRadius: 20, border: `0.5px solid ${musculoSelec === m ? COLORS.accent : COLORS.border}`, background: musculoSelec === m ? COLORS.accentSub : COLORS.surface, color: musculoSelec === m ? "#a5b4fc" : COLORS.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            {m}
          </button>
        ))}
      </div>

      {musculoSelec && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: COLORS.surface, borderRadius: 16, border: `0.5px solid ${COLORS.border}`, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: `0.5px solid ${COLORS.border}`, display: "flex", gap: 8 }}>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..."
              style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 12px", color: COLORS.text, fontSize: 13, flex: 1, outline: "none" }} />
            <button onClick={() => setMostrarNuevo(!mostrarNuevo)}
              style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "0 12px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="plus" size={16} color="#fff" />
            </button>
          </div>

          <AnimatePresence>
            {mostrarNuevo && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden", borderBottom: `0.5px solid ${COLORS.border}` }}>
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ ...T.label, marginBottom: 2 }}>Nuevo en {musculoSelec}</div>
                  {["nombre", "youtube", "descripcion"].map(k => (
                    <input key={k} placeholder={k === "nombre" ? "Nombre del ejercicio" : k === "youtube" ? "Link de YouTube" : "Descripción"}
                      value={nuevoEj[k]} onChange={e => setNuevoEj(p => ({ ...p, [k]: e.target.value }))}
                      style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none" }} />
                  ))}
                  <button onClick={agregarCustom} style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "10px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Agregar</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {todosEjercicios.map((ej, i) => {
            const sel = ejerciciosSelec.find(e => e.nombre === ej.nombre)
            return (
              <div key={i} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < todosEjercicios.length - 1 ? `0.5px solid ${COLORS.border}` : "none" }}>
                <div onClick={() => toggleEjercicio(ej)} style={{ flex: 1, cursor: "pointer" }}>
                  <div style={{ fontSize: 13, color: sel ? COLORS.text : COLORS.textSub, fontWeight: sel ? 500 : 400 }}>{ej.nombre}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{ej.descripcion}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {ej.youtube && (
                    <a href={ej.youtube} target="_blank" rel="noopener noreferrer"
                      style={{ width: 28, height: 28, borderRadius: 9, background: "#3a1a1a", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                      <Icon name="play" size={11} color="#f87171" />
                    </a>
                  )}
                  <div onClick={() => toggleEjercicio(ej)}
                    style={{ width: 28, height: 28, borderRadius: 9, background: sel ? COLORS.accent : COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Icon name={sel ? "check" : "plus"} size={13} color={sel ? "#fff" : COLORS.textSub} />
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
          style={{ background: COLORS.accent, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
          Crear rutina con {ejerciciosSelec.length} ejercicios
        </motion.button>
      )}
    </>
  )

  if (modo === "resultado-manual" && rutinaManual) return <RutinaCard rutina={rutinaManual} />
  return null
}

function Pagos() {
  return (
    <>
      <div style={T.h1}>Pagos</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
          <div style={{ ...T.label, marginBottom: 8 }}>Cobrado</div>
          <div style={{ ...T.num, fontSize: 22, color: COLORS.green }}>$384K</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>16 clientes</div>
        </div>
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
          <div style={{ ...T.label, marginBottom: 8 }}>Pendiente</div>
          <div style={{ ...T.num, fontSize: 22, color: COLORS.red }}>$96K</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>2 clientes</div>
        </div>
      </div>
      <div style={T.label}>Últimos movimientos</div>
      {[
        { nombre: "Lucas Martínez", fecha: "Hoy · Mercado Pago", monto: "$32.000", color: COLORS.green },
        { nombre: "Sofía García", fecha: "Ayer · Transferencia", monto: "$28.000", color: COLORS.green },
        { nombre: "Martín Ríos", fecha: "Vence hoy", monto: "$30.000", color: COLORS.yellow },
      ].map((p, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          style={{ background: COLORS.surface, borderRadius: 16, padding: "14px 16px", border: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={T.h3}>{p.nombre}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{p.fecha}</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: p.color }}>{p.monto}</div>
        </motion.div>
      ))}
    </>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState("inicio")
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  const screenStyle = { flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" }

  const renderPage = () => {
    if (clienteSeleccionado) return (
      <motion.div key="perfil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        <PerfilCliente cliente={clienteSeleccionado} onBack={() => setClienteSeleccionado(null)} />
      </motion.div>
    )
    const pages = {
      inicio: <Inicio />,
      clientes: <Clientes onVerPerfil={setClienteSeleccionado} />,
      rutinas: <CreadorRutinas />,
      agenda: <AgendaReal />,
      pagos: <Pagos />,
    }
    return (
      <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        style={screenStyle}>
        {pages[activePage]}
      </motion.div>
    )
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      <div style={{ width: 375, height: 720, background: COLORS.bg, borderRadius: 40, border: `1px solid ${COLORS.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
        </div>
        {!clienteSeleccionado && (
          <nav style={{ background: COLORS.bg, borderTop: `0.5px solid ${COLORS.border}`, display: "flex", padding: "10px 0 22px" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActivePage(item.id)}
                style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0" }}>
                <Icon name={item.icon} size={22} color={activePage === item.id ? COLORS.accent : COLORS.textMuted} />
                <span style={{ fontSize: 10, fontWeight: 500, color: activePage === item.id ? COLORS.accent : COLORS.textMuted }}>{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}