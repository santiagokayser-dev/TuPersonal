import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AgendaReal from "./Agenda"
import { EJERCICIOS } from "./ejercicios"
import { supabase } from "./supabase"
import CreadorRutinasNuevo from "./CreadorRutinasNuevo"
import ClientePanel from "./ClientePanel"
import Chat from "./Chat"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const API_KEY = "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"

const COLORS = {
  bg: "#060A10", surface: "#0C1220", surface2: "#111927", border: "#1A2540", border2: "#1E2D4A",
  text: "#FFFFFF", textSub: "#94A3B8", textMuted: "#475569",
  accent: "#2563EB", accentSub: "#1E3A8A", accentLight: "#93C5FD",
  green: "#22c55e", red: "#ef4444", yellow: "#f59e0b",
}

const T = {
  h1: { fontSize: 28, fontWeight: 700, color: "#ffffff", letterSpacing: -0.8, lineHeight: 1.1 },
  h2: { fontSize: 20, fontWeight: 600, color: "#ffffff", letterSpacing: -0.4 },
  h3: { fontSize: 15, fontWeight: 600, color: "#ffffff", letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: 400, color: "#94A3B8", lineHeight: 1.5 },
  label: { fontSize: 11, fontWeight: 500, color: "#64748B", textTransform: "uppercase", letterSpacing: 1.2 },
  num: { fontSize: 32, fontWeight: 700, color: "#ffffff", letterSpacing: -1 },
}

const Icon = ({ name, size = 20, color = "#888888" }) => {
  const icons = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    dumbbell: <><path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h2v5H3zM19 9.5h2v5h-2zM5 7.5h2v9H5zM17 7.5h2v9h-2z"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    wallet: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 100-2 1 1 0 000 2z"/></>,
    chevronRight: <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    sparkles: <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/></>,
    arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>,
    check: <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>,
    trendingUp: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
    chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    sparkle: <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">{icons[name]}</svg>
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handle = () => setMobile(window.innerWidth < 768)
    window.addEventListener("resize", handle)
    return () => window.removeEventListener("resize", handle)
  }, [])
  return mobile
}

function normCliente(c) {
  const deuda = c.meses_deuda || 0
  return {
    ...c,
    ini: (c.nombre || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    estado: deuda > 0 ? `Debe ${deuda} ${deuda === 1 ? "mes" : "meses"}` : "Al día",
    estadoColor: deuda > 1 ? COLORS.red : deuda === 1 ? COLORS.yellow : COLORS.green,
  }
}

const navItems = [
  { id: "inicio", icon: "home", label: "Inicio" },
  { id: "clientes", icon: "users", label: "Clientes" },
  { id: "chat", icon: "chat", label: "Chat" },
  { id: "rutinas", icon: "dumbbell", label: "Rutinas" },
  { id: "agenda", icon: "calendar", label: "Agenda" },
  { id: "pagos", icon: "wallet", label: "Finanzas" },
]

function useAnimatedNumber(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const n = typeof target === "number" ? target : parseFloat(String(target).replace(/[^0-9.]/g, "")) || 0
    if (n === 0) { setVal(0); return }
    const start = Date.now()
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(n * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target])
  return val
}

function LineChart({ data, labels, color = COLORS.accent }) {
  const W = 280, H = 72
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pad = { l: 4, r: 4, t: 8, b: 20 }
  const pts = data.map((v, i) => [
    pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r),
    pad.t + (1 - (v - min) / range) * (H - pad.t - pad.b),
  ])
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ")
  const fillD = `${pathD} L${pts[pts.length - 1][0]},${H - pad.b} L${pts[0][0]},${H - pad.b} Z`
  const gradId = "lg1"
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(t => {
        const y = pad.t + t * (H - pad.t - pad.b)
        return <line key={t} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="3,3" />
      })}
      <motion.path d={fillD} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: "easeOut" }} />
      {pts.map((p, i) => (
        <motion.circle key={i} cx={p[0]} cy={p[1]} r={i === data.length - 1 ? 3.5 : 2.5}
          fill={i === data.length - 1 ? color : COLORS.bg} stroke={color} strokeWidth={1.5}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.04 }} />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={pts[i][0]} y={H - 4} textAnchor="middle" fontSize="9" fill={COLORS.textMuted} fontFamily="-apple-system,sans-serif">{l}</text>
      ))}
    </svg>
  )
}

function Inicio({ clientes = [], nombreTrainer = "", onVerPerfil, onNuevoCliente }) {
  const pendientes = clientes.filter(c => c.estadoColor === COLORS.red || c.estadoColor === COLORS.yellow).length
  const alDia = clientes.length - pendientes
  const totalMensual = clientes.reduce((s, c) => s + (Number(c.precio) || 0), 0)
  const cobrado = clientes.filter(c => !c.meses_deuda).reduce((s, c) => s + (Number(c.precio) || 0), 0)
  const nombre = (nombreTrainer || "Entrenador").split(" ")[0]
  const hora = new Date().getHours()
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches"

  const animTotal = useAnimatedNumber(totalMensual)
  const animCobrado = useAnimatedNumber(cobrado)

  const barData = [40, 55, 62, 70, 80, Math.max(95, Math.round(totalMensual / 1000) || 95)]
  const barLabels = ["E", "F", "M", "A", "M", "J"]

  const [hovCard, setHovCard] = useState(null)

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>
            {saludo}, {nombre} 👋
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 5, lineHeight: 1.4 }}>
            {clientes.length > 0
              ? <>{clientes.length} {clientes.length === 1 ? "cliente" : "clientes"} · <span style={{ color: pendientes > 0 ? COLORS.yellow : COLORS.green }}>{pendientes === 0 ? "todos al día" : `${pendientes} pendiente${pendientes > 1 ? "s" : ""}`}</span>{totalMensual > 0 ? ` · $${(totalMensual / 1000).toFixed(0)}K proyectados` : ""}</>
              : "Empezá agregando tu primer cliente"
            }
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} onClick={onNuevoCliente}
          style={{ background: COLORS.accent, border: "none", borderRadius: 12, padding: "9px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 16px ${COLORS.accent}44` }}>
          <Icon name="plus" size={14} color="#fff" />
          Nuevo
        </motion.button>
      </div>

      {/* Hero card — Facturación */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        style={{ background: `linear-gradient(135deg, ${COLORS.accentSub}cc 0%, ${COLORS.surface} 60%)`, borderRadius: 20, padding: "18px 20px 16px", border: `0.5px solid ${COLORS.accent}44`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: COLORS.accent + "0d" }} />
        <div style={{ ...T.label, color: "#93C5FD66" }}>Facturación mensual</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6, marginBottom: 2 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.text, letterSpacing: -1.5 }}>
            ${animTotal > 0 ? (animTotal >= 1000 ? `${(animTotal / 1000).toFixed(0)}K` : animTotal.toLocaleString("es-AR")) : "—"}
          </div>
          {cobrado > 0 && cobrado < totalMensual && (
            <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600, background: COLORS.green + "18", borderRadius: 8, padding: "2px 8px" }}>
              ${(cobrado / 1000).toFixed(0)}K cobrado
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#93C5FD66" }}>
          {totalMensual > 0 ? `${alDia} de ${clientes.filter(c => Number(c.precio) > 0).length} clientes al día` : "Asigná precios para ver proyección"}
        </div>
      </motion.div>

      {/* 3 métricas secundarias */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Clientes", value: clientes.length, icon: "users", color: COLORS.accent },
          { label: "Al día", value: alDia, icon: "check", color: COLORS.green },
          { label: "Pendientes", value: pendientes, icon: "trendingUp", color: pendientes > 0 ? COLORS.yellow : COLORS.textMuted },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
            onMouseEnter={() => setHovCard(i)} onMouseLeave={() => setHovCard(null)}
            style={{ background: COLORS.surface, borderRadius: 14, padding: "12px 12px 10px", border: `0.5px solid ${hovCard === i ? COLORS.border2 : COLORS.border}`, transition: "border-color 0.2s, transform 0.15s", transform: hovCard === i ? "translateY(-1px)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ ...T.label, fontSize: 10 }}>{m.label}</div>
              <Icon name={m.icon} size={13} color={m.color} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: m.color, letterSpacing: -1 }}>{m.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Gráfico */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        style={{ background: COLORS.surface, borderRadius: 16, padding: "14px 16px 10px", border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={T.label}>Ingresos — últimos 6 meses</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>
            ${barData[barData.length - 1]}K
          </div>
        </div>
        <LineChart data={barData} labels={barLabels} />
      </motion.div>

      {/* Clientes recientes */}
      {clientes.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={T.label}>Clientes recientes</div>
            <div style={{ fontSize: 12, color: COLORS.accent, cursor: "pointer", fontWeight: 500 }} onClick={onNuevoCliente}>ver todos →</div>
          </div>
          {clientes.slice(0, 4).map((c, i) => (
            <motion.div key={c.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 + i * 0.07 }}
              whileHover={{ y: -1 }} onClick={() => onVerPerfil?.(c)}
              style={{ background: COLORS.surface, borderRadius: 14, padding: "11px 14px", border: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: c.estadoColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c.estadoColor, flexShrink: 0 }}>{c.ini}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{c.nombre}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.objetivo || "Sin objetivo"}{c.precio ? ` · $${(Number(c.precio) / 1000).toFixed(0)}K/mes` : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: c.estadoColor, background: c.estadoColor + "18", borderRadius: 6, padding: "2px 7px" }}>{c.estado}</div>
                <Icon name="chevronRight" size={12} color={COLORS.textMuted} />
              </div>
            </motion.div>
          ))}
        </>
      )}

      {clientes.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ background: COLORS.surface, borderRadius: 16, padding: "28px 20px", border: `0.5px dashed ${COLORS.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Bienvenido a TuPersonal</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>Agregá tu primer cliente para empezar a gestionar tu negocio</div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onNuevoCliente}
            style={{ background: COLORS.accent, border: "none", borderRadius: 12, padding: "11px 24px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${COLORS.accent}44` }}>
            + Agregar primer cliente
          </motion.button>
        </motion.div>
      )}
    </>
  )
}

function PerfilCliente({ cliente, onBack, onEliminar, onPreview, onActualizar }) {
  const [tab, setTab] = useState("info")
  const [editando, setEditando] = useState(false)
  const [datos, setDatos] = useState(cliente)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [rutinas, setRutinas] = useState([])
  const [cargandoRutinas, setCargandoRutinas] = useState(false)
  const [iaResultado, setIaResultado] = useState({})
  const [iaLoading, setIaLoading] = useState({})

  const inputStyle = { background: COLORS.surface2, border: `0.5px solid ${COLORS.border2}`, borderRadius: 12, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", boxSizing: "border-box", marginBottom: 8 }

  const waUrl = datos.telefono
    ? `https://wa.me/${datos.telefono.replace(/\D/g, "").replace(/^0/, "54").replace(/^(?!54)/, "549")}`
    : null

  const guardarCambios = async () => {
    if (!cliente.id) return
    setGuardando(true)
    await supabase.from("clientes").update({ nombre: datos.nombre, peso: Number(datos.peso), altura: Number(datos.altura), edad: Number(datos.edad), objetivo: datos.objetivo, precio: Number(datos.precio), telefono: datos.telefono }).eq("id", cliente.id)
    setGuardando(false)
    setEditando(false)
  }

  const eliminarCliente = async () => {
    if (!cliente.id) return
    setEliminando(true)
    await supabase.from("clientes").delete().eq("id", cliente.id)
    setEliminando(false)
    onEliminar(cliente.id)
    onBack()
  }

  const cargarRutinas = async () => {
    if (!cliente.id) return
    setCargandoRutinas(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from("rutinas").select("*").eq("trainer_id", u.id)
    if (error) console.error("Error cargando rutinas:", error)
    console.log("DEBUG rutinas raw:", data, "buscando cliente.id:", cliente.id)
    const filtradas = (data || []).filter(r => {
      let asignados = r.clientes_asignados
      if (typeof asignados === "string") {
        try { asignados = JSON.parse(asignados) } catch { asignados = [] }
      }
      if (!Array.isArray(asignados)) asignados = []
      console.log("  rutina:", r.nombre, "asignados:", asignados)
      return asignados.some(id => String(id) === String(cliente.id))
    })
    setRutinas(filtradas)
    setCargandoRutinas(false)
  }

  const ajustarConIA = async (rutina) => {
    setIaLoading(prev => ({ ...prev, [rutina.id]: true }))
    setIaResultado(prev => ({ ...prev, [rutina.id]: null }))
    try {
      const dias = typeof rutina.dias === "string" ? JSON.parse(rutina.dias) : rutina.dias
      const resumen = dias?.map(d => `${d.nombre}: ${d.bloques?.map(b => b.ejercicios?.map(e => e.nombre).join(", ") || b.nombre || "").join(", ")}`).join(" | ") || ""
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          messages: [{ role: "user", content: `Sos personal trainer experto. Analizá la rutina "${rutina.nombre}" de ${datos.nombre} (peso: ${datos.peso || "?"}kg, objetivo: ${datos.objetivo || "general"}). Ejercicios: ${resumen}. Cargas actuales: ${JSON.stringify(datos.cargas || {})}. Peso histórico (últimos 3): ${JSON.stringify((datos.peso_historial || []).slice(-3))}. Sugerí ajustes de progresión en máximo 120 palabras, usando bullet points (•). En español, directo.` }]
        })
      })
      const d = await res.json()
      setIaResultado(prev => ({ ...prev, [rutina.id]: d.content?.[0]?.text || "Sin respuesta" }))
    } catch {
      setIaResultado(prev => ({ ...prev, [rutina.id]: "Error al conectar con IA. Intentá de nuevo." }))
    }
    setIaLoading(prev => ({ ...prev, [rutina.id]: false }))
  }

  const exportarPDF = (rutina) => {
    const doc = new jsPDF()
    const dias = typeof rutina.dias === "string" ? JSON.parse(rutina.dias) : (rutina.dias || [])
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    doc.text(rutina.nombre, 14, 20)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Cliente: ${datos.nombre}`, 14, 28)
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 14, 34)
    let y = 44
    dias.forEach(dia => {
      const ejercicios = dia.bloques?.flatMap(b => b.ejercicios || [b]) || []
      doc.setFontSize(13)
      doc.setTextColor(40)
      doc.text(dia.nombre || "Día", 14, y)
      y += 4
      autoTable(doc, {
        startY: y,
        head: [["Ejercicio", "Series", "Reps", "RIR", "Descanso"]],
        body: ejercicios.map(e => [e.nombre || "", e.series || "", e.reps || "", e.rir !== undefined ? e.rir : "", e.descanso ? `${e.descanso}s` : ""]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 10
    })
    doc.save(`${rutina.nombre} - ${datos.nombre}.pdf`)
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}
      style={{ display: "flex", flexDirection: "column", gap: 14, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer", display: "flex" }}>
          <Icon name="arrowLeft" size={16} color={COLORS.text} />
        </button>
        <div style={T.h3}>Perfil</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setEditando(!editando)}
            style={{ background: editando ? COLORS.accent : COLORS.surface, border: `0.5px solid ${editando ? COLORS.accent : COLORS.border}`, borderRadius: 12, padding: "8px 14px", color: editando ? "#fff" : COLORS.textSub, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            {editando ? "Cancelar" : "Editar"}
          </button>
          <button onClick={eliminarCliente} disabled={eliminando}
            style={{ background: "#3a1a1a", border: "0.5px solid #ef444433", borderRadius: 12, padding: "8px 14px", color: COLORS.red, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            {eliminando ? "..." : "Eliminar"}
          </button>
        </div>
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 18, padding: 18, border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>{datos.ini}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={T.h2}>{datos.nombre}</div>
            <div style={{ ...T.body, marginTop: 2 }}>{datos.objetivo}</div>
            <div style={{ marginTop: 6, display: "inline-block", background: (datos.estadoColor || COLORS.green) + "22", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: datos.estadoColor || COLORS.green }}>{datos.estado || "Al día"}</div>
          </div>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              style={{ width: 44, height: 44, borderRadius: 14, background: "#1a3a1a", border: "0.5px solid #22c55e33", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="#22c55e">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          )}
        </div>
        {datos.telefono && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11 19.79 19.79 0 01.16 2.38 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
            <span style={{ fontSize: 13, color: COLORS.textSub }}>{datos.telefono}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", background: COLORS.surface, borderRadius: 14, padding: 3, gap: 3 }}>
        {["info", "progreso", "pagos", "rutinas"].map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === "rutinas") cargarRutinas() }}
            style={{ flex: 1, padding: "9px 0", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: tab === t ? COLORS.accent : "transparent", color: tab === t ? "#fff" : COLORS.textSub, transition: "all 0.2s" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tab === "info" && (
            <>
              {editando ? (
                <>
                  <input placeholder="Nombre" value={datos.nombre} onChange={e => setDatos(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input placeholder="Peso (kg)" value={datos.peso} onChange={e => setDatos(p => ({ ...p, peso: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} />
                    <input placeholder="Altura (cm)" value={datos.altura} onChange={e => setDatos(p => ({ ...p, altura: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input placeholder="Edad" value={datos.edad} onChange={e => setDatos(p => ({ ...p, edad: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} />
                    <input placeholder="Precio/mes" value={datos.precio} onChange={e => setDatos(p => ({ ...p, precio: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} />
                  </div>
                  <input placeholder="Objetivo" value={datos.objetivo} onChange={e => setDatos(p => ({ ...p, objetivo: e.target.value }))} style={inputStyle} />
                  <input placeholder="Teléfono (ej: 1134567890)" value={datos.telefono || ""} onChange={e => setDatos(p => ({ ...p, telefono: e.target.value }))} style={inputStyle} type="tel" />
                  <button onClick={guardarCambios} disabled={guardando}
                    style={{ background: COLORS.accent, border: "none", borderRadius: 12, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.5 : 1 }}>
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[{ l: "Peso", v: `${datos.peso || "-"}kg` }, { l: "Altura", v: `${datos.altura || "-"}cm` }, { l: "Edad", v: `${datos.edad || "-"} años` }, { l: "Precio", v: `$${datos.precio || "-"}/mes` }].map((m, i) => (
                      <div key={i} style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                        <div style={T.label}>{m.l}</div>
                        <div style={{ ...T.num, fontSize: 22, marginTop: 4 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                    <div style={{ ...T.label, marginBottom: 8 }}>Objetivo</div>
                    <div style={T.h3}>{datos.objetivo || "Sin objetivo definido"}</div>
                  </div>
                </>
              )}
            </>
          )}
          {tab === "progreso" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                  <div style={T.label}>Peso actual</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>{datos.peso ? `${datos.peso} kg` : "—"}</div>
                </div>
                <div style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                  <div style={T.label}>Registros</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>{(datos.peso_historial || []).length}</div>
                </div>
              </div>
              {(datos.peso_historial || []).length > 0 && (
                <div style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                  <div style={{ ...T.label, marginBottom: 10 }}>Historial de peso</div>
                  {[...(datos.peso_historial || [])].reverse().slice(0, 6).map((h, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: i < 5 ? `0.5px solid ${COLORS.border}` : "none" }}>
                      <span style={{ color: COLORS.textSub }}>{h.fecha}</span>
                      <span style={{ fontWeight: 600, color: COLORS.text }}>{h.peso} kg</span>
                    </div>
                  ))}
                </div>
              )}
              {Object.keys(datos.cargas || {}).length > 0 && (
                <div style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                  <div style={{ ...T.label, marginBottom: 10 }}>Cargas registradas</div>
                  {Object.entries(datos.cargas || {}).map(([nombre, carga], i, arr) => (
                    <div key={nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: i < arr.length - 1 ? `0.5px solid ${COLORS.border}` : "none" }}>
                      <span style={{ color: COLORS.textSub }}>{nombre}</span>
                      <span style={{ fontWeight: 600, color: COLORS.accent }}>{carga}</span>
                    </div>
                  ))}
                </div>
              )}
              {(datos.peso_historial || []).length === 0 && Object.keys(datos.cargas || {}).length === 0 && (
                <div style={{ background: COLORS.surface, borderRadius: 14, padding: 20, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
                  El cliente aún no registró progreso
                </div>
              )}
            </>
          )}
          {tab === "pagos" && (
            <div style={{ background: COLORS.surface, borderRadius: 14, padding: 16, border: `0.5px solid ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
              Gestioná los pagos desde la sección Finanzas
            </div>
          )}
          {tab === "rutinas" && (
            <>
              {cargandoRutinas ? (
                <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>Cargando...</div>
              ) : rutinas.length === 0 ? (
                <div style={{ background: COLORS.surface, borderRadius: 14, padding: 16, border: `0.5px solid ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
                  Sin rutinas asignadas todavía
                </div>
              ) : rutinas.map((r) => {
                const dias = typeof r.dias === "string" ? (() => { try { return JSON.parse(r.dias) } catch { return [] } })() : (r.dias || [])
                return (
                  <div key={r.id} style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={T.h3}>{r.nombre}</div>
                        <div style={{ ...T.body, marginTop: 2 }}>{dias.length} {dias.length === 1 ? "día" : "días"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => ajustarConIA(r)} disabled={iaLoading[r.id]}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: COLORS.accentSub, border: `0.5px solid ${COLORS.accent}44`, borderRadius: 10, padding: "9px 0", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: iaLoading[r.id] ? 0.6 : 1 }}>
                        <Icon name="sparkle" size={13} color={COLORS.accent} />
                        {iaLoading[r.id] ? "Analizando..." : "Ajustar con IA"}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => exportarPDF(r)}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "9px 0", color: COLORS.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <Icon name="download" size={13} color={COLORS.textSub} />
                        Exportar PDF
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {iaResultado[r.id] && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: "hidden" }}>
                          <div style={{ background: COLORS.accentSub + "44", border: `0.5px solid ${COLORS.accent}44`, borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent }}>Sugerencia IA</div>
                              <button onClick={() => setIaResultado(prev => ({ ...prev, [r.id]: null }))}
                                style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                            </div>
                            <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{iaResultado[r.id]}</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

const AVATAR_COLORS = [
  "#1D4ED8","#0369A1","#0E7490","#1E40AF","#2563EB","#0284C7","#155E75","#1D4ED8","#0369A1","#1E3A8A"
]
function avatarColor(name) {
  return AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length]
}

function Clientes({ onVerPerfil, clientes = [], onClienteAgregado, onEliminarCliente }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", precio: "" })
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [menuAbierto, setMenuAbierto] = useState(null)
  const [eliminando, setEliminando] = useState(null)

  const inputStyle = { background: COLORS.surface2, border: `0.5px solid ${COLORS.border2}`, borderRadius: 12, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", boxSizing: "border-box", marginBottom: 8 }

  const agregarCliente = async () => {
    if (!nuevo.nombre.trim()) return
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from("clientes").insert({
      trainer_id: user.id, nombre: nuevo.nombre, email: nuevo.email || null, precio: Number(nuevo.precio) || null,
    }).select().single()
    if (!error && data) { onClienteAgregado?.(normCliente(data)); setNuevo({ nombre: "", email: "", precio: "" }); setMostrarForm(false) }
    setCargando(false)
  }

  const eliminarCliente = async (c) => {
    setEliminando(c.id)
    await supabase.from("clientes").delete().eq("id", c.id)
    onEliminarCliente?.(c.id)
    setMenuAbierto(null)
    setEliminando(null)
  }

  const copiarLink = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const link = `${window.location.origin}?invite=${user.id}`
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(link) }
      else {
        const el = document.createElement("textarea"); el.value = link; el.style.cssText = "position:fixed;opacity:0"
        document.body.appendChild(el); el.focus(); el.select(); document.execCommand("copy"); document.body.removeChild(el)
      }
      setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2500)
    } catch { setLinkCopiado("error"); setTimeout(() => setLinkCopiado(false), 2500) }
  }

  const pendientes = clientes.filter(c => c.meses_deuda > 0).length
  const alDia = clientes.length - pendientes

  // Priority sort: debt first, then al día
  const sorted = [...clientes].sort((a, b) => (b.meses_deuda || 0) - (a.meses_deuda || 0))

  const filtrados = sorted.filter(c => {
    const matchBusqueda = !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchFiltro = filtro === "todos" || (filtro === "aldia" && !c.meses_deuda) || (filtro === "pendientes" && c.meses_deuda > 0)
    return matchBusqueda && matchFiltro
  })

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={T.h1}>Clientes</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
            {clientes.length > 0
              ? <>{alDia} al día{pendientes > 0 ? <> · <span style={{ color: COLORS.yellow }}>{pendientes} pendiente{pendientes > 1 ? "s" : ""}</span></> : ""}</>
              : "Administrá tus clientes, pagos y rutinas"
            }
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={copiarLink}
            style={{ background: linkCopiado === "error" ? COLORS.red+"22" : linkCopiado ? COLORS.green+"22" : COLORS.surface, border: `0.5px solid ${linkCopiado === "error" ? COLORS.red : linkCopiado ? COLORS.green : COLORS.border}`, borderRadius: 12, padding: "8px 12px", color: linkCopiado === "error" ? COLORS.red : linkCopiado ? COLORS.green : COLORS.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
            {linkCopiado === "error" ? "Error" : linkCopiado ? "¡Copiado!" : "Compartir link"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMostrarForm(!mostrarForm)}
            style={{ background: COLORS.accent, border: "none", borderRadius: 12, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: `0 2px 12px ${COLORS.accent}44`, whiteSpace: "nowrap" }}>
            + Agregar cliente
          </motion.button>
        </div>
      </div>

      {/* Form agregar */}
      <AnimatePresence>
        {mostrarForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.accent}44`, overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>Nuevo cliente</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>El cliente completa sus datos al crear su cuenta.</div>
            <input placeholder="Nombre *" value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} autoFocus />
            <input placeholder="Email" value={nuevo.email} onChange={e => setNuevo(p => ({ ...p, email: e.target.value }))} style={inputStyle} type="email" />
            <input placeholder="Precio/mes ($)" value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} style={inputStyle} type="number" />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMostrarForm(false)} style={{ flex: 1, background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 0", color: COLORS.textSub, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={agregarCliente} disabled={cargando || !nuevo.nombre.trim()}
                style={{ flex: 2, background: COLORS.accent, border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: cargando ? 0.5 : 1 }}>
                {cargando ? "Guardando..." : "Agregar cliente"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Búsqueda + filtros */}
      {clientes.length > 0 && (
        <>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Buscar cliente..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 34, marginBottom: 0 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["todos", `Todos (${clientes.length})`], ["aldia", `Al día (${alDia})`], ["pendientes", `Pendientes (${pendientes})`]].map(([id, label]) => (
              <button key={id} onClick={() => setFiltro(id)}
                style={{ padding: "6px 12px", borderRadius: 20, border: `0.5px solid ${filtro === id ? COLORS.accent : COLORS.border}`, background: filtro === id ? COLORS.accentSub : COLORS.surface, color: filtro === id ? "#93C5FD" : COLORS.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {clientes.length === 0 && !mostrarForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: COLORS.surface, borderRadius: 20, padding: "36px 24px", border: `0.5px dashed ${COLORS.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>No tenés clientes todavía</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>Agregá tu primer cliente para empezar a gestionar entrenamientos y cobros</div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMostrarForm(true)}
            style={{ background: COLORS.accent, border: "none", borderRadius: 12, padding: "11px 28px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${COLORS.accent}44` }}>
            + Agregar primer cliente
          </motion.button>
        </motion.div>
      )}

      {/* Lista */}
      {filtrados.length === 0 && clientes.length > 0 && (
        <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, padding: "20px 0" }}>Sin resultados para "{busqueda}"</div>
      )}

      {filtrados.map((c, i) => {
        const ac = avatarColor(c.nombre)
        const isMenuOpen = menuAbierto === c.id
        return (
          <motion.div key={c.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2, boxShadow: `0 4px 20px #00000040` }}
            style={{ background: COLORS.surface, borderRadius: 16, border: `0.5px solid ${COLORS.border}`, position: "relative", overflow: "visible", transition: "border-color 0.2s" }}>
            <div onClick={() => { setMenuAbierto(null); onVerPerfil(c) }} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
              {/* Avatar */}
              <div style={{ width: 46, height: 46, borderRadius: 15, background: `linear-gradient(135deg, ${ac}cc, ${ac}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: `0 2px 10px ${ac}44` }}>
                {c.ini}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{c.nombre}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {c.objetivo && <span>{c.objetivo}</span>}
                  {c.peso && <><span style={{ color: COLORS.textMuted + "66" }}>·</span><span>{c.peso} kg</span></>}
                  {c.precio && <><span style={{ color: COLORS.textMuted + "66" }}>·</span><span>${(Number(c.precio)/1000).toFixed(0)}K/mes</span></>}
                </div>
              </div>
              {/* Estado pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.estadoColor, background: c.estadoColor + "18", borderRadius: 20, padding: "3px 10px", border: `0.5px solid ${c.estadoColor}44` }}>
                  {c.meses_deuda > 0 ? `⚠ ${c.estado}` : `✓ Al día`}
                </div>
                {/* Menú ••• */}
                <motion.button whileTap={{ scale: 0.9 }} onClick={e => { e.stopPropagation(); setMenuAbierto(isMenuOpen ? null : c.id) }}
                  style={{ width: 28, height: 28, borderRadius: 8, background: isMenuOpen ? COLORS.surface2 : "transparent", border: `0.5px solid ${isMenuOpen ? COLORS.border : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <span style={{ color: COLORS.textMuted, fontSize: 14, letterSpacing: 1 }}>•••</span>
                </motion.button>
              </div>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 }}
                  style={{ position: "absolute", right: 12, top: "calc(100% + 4px)", background: COLORS.surface, border: `0.5px solid ${COLORS.border2}`, borderRadius: 14, padding: 6, zIndex: 50, minWidth: 160, boxShadow: "0 8px 32px #00000060" }}>
                  {[
                    { label: "Ver perfil", icon: "users", action: () => { setMenuAbierto(null); onVerPerfil(c) } },
                    { label: "Enviar mensaje", icon: "chat", action: () => setMenuAbierto(null) },
                    { label: eliminando === c.id ? "Eliminando..." : "Eliminar cliente", icon: "logout", danger: true, action: () => eliminarCliente(c) },
                  ].map((item) => (
                    <button key={item.label} onClick={item.action}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", background: "none", border: "none", borderRadius: 10, color: item.danger ? COLORS.red : COLORS.text, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                      <Icon name={item.icon} size={14} color={item.danger ? COLORS.red : COLORS.textMuted} />
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </>
  )
}

function BarraProgreso({ pct, color }) {
  return (
    <div style={{ height: 4, background: COLORS.surface2, borderRadius: 99, overflow: "hidden" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ height: "100%", background: color, borderRadius: 99 }} />
    </div>
  )
}

function SparkLine({ data }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={COLORS.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Finanzas({ clientes = [], user, onVerPerfil }) {
  const [tab, setTab] = useState("resumen")
  const [clientesLocal, setClientesLocal] = useState(clientes)
  const [mpSettings, setMpSettings] = useState({ alias: "", access_token: "" })
  const [guardandoSettings, setGuardandoSettings] = useState(false)
  const [settingsOk, setSettingsOk] = useState(false)
  const [actualizando, setActualizando] = useState(null)

  useEffect(() => { setClientesLocal(clientes) }, [clientes])

  useEffect(() => {
    if (!user?.id) return
    supabase.from("trainer_settings").select("*").eq("trainer_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setMpSettings({ alias: data.mp_alias || "", access_token: data.mp_access_token || "" }) })
  }, [user?.id])

  const guardarSettings = async () => {
    if (!user?.id) return
    setGuardandoSettings(true)
    await supabase.from("trainer_settings").upsert({ trainer_id: user.id, mp_alias: mpSettings.alias.trim(), mp_access_token: mpSettings.access_token.trim() })
    setGuardandoSettings(false)
    setSettingsOk(true)
    setTimeout(() => setSettingsOk(false), 2500)
  }

  const toggleDeuda = async (c) => {
    setActualizando(c.id)
    const nuevaDeuda = (c.meses_deuda || 0) === 0 ? 1 : 0
    await supabase.from("clientes").update({ meses_deuda: nuevaDeuda }).eq("id", c.id)
    setClientesLocal(prev => prev.map(x => x.id === c.id ? normCliente({ ...x, meses_deuda: nuevaDeuda }) : x))
    setActualizando(null)
  }

  // Métricas reales
  const conPrecio = clientesLocal.filter(c => Number(c.precio) > 0)
  const alDia = conPrecio.filter(c => !c.meses_deuda || c.meses_deuda === 0)
  const conDeuda = conPrecio.filter(c => c.meses_deuda > 0)
  const cobrado = alDia.reduce((s, c) => s + Number(c.precio), 0)
  const pendiente = conDeuda.reduce((s, c) => s + Number(c.precio) * (c.meses_deuda || 1), 0)
  const total = cobrado + pendiente
  const tasaCobranza = total > 0 ? Math.round((cobrado / total) * 100) : 100
  const ticketPromedio = conPrecio.length > 0 ? Math.round(conPrecio.reduce((s, c) => s + Number(c.precio), 0) / conPrecio.length) : 0
  const ingresoMensual = conPrecio.reduce((s, c) => s + Number(c.precio), 0)

  const mesActual = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })

  const inputS = { background: COLORS.surface2, border: `0.5px solid ${COLORS.border2}`, borderRadius: 12, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", boxSizing: "border-box", marginBottom: 10 }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ ...T.label, marginBottom: 4 }}>{mesActual.charAt(0).toUpperCase() + mesActual.slice(1)}</div>
          <div style={T.h1}>Finanzas</div>
        </div>
        {conPrecio.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: tasaCobranza >= 80 ? COLORS.green : COLORS.yellow, fontWeight: 600 }}>{tasaCobranza}% cobrado</div>
            <SparkLine data={conPrecio.map(c => Number(c.precio))} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Cobrado este mes", value: cobrado > 0 ? `$${(cobrado / 1000).toFixed(0)}K` : "$0", sub: `${alDia.length} clientes al día`, color: COLORS.green },
          { label: "Pendiente", value: pendiente > 0 ? `$${(pendiente / 1000).toFixed(0)}K` : "$0", sub: `${conDeuda.length} con deuda`, color: pendiente > 0 ? COLORS.red : COLORS.textMuted },
          { label: "Ingreso mensual", value: ingresoMensual > 0 ? `$${(ingresoMensual / 1000).toFixed(0)}K` : "—", sub: "si todos pagan", color: COLORS.text },
          { label: "Ticket promedio", value: ticketPromedio > 0 ? `$${(ticketPromedio / 1000).toFixed(0)}K` : "—", sub: "por cliente/mes", color: COLORS.accent },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ background: COLORS.surface, borderRadius: 16, padding: "14px 14px 12px", border: `0.5px solid ${COLORS.border}` }}>
            <div style={T.label}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, marginTop: 6, letterSpacing: -0.5 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>{m.sub}</div>
          </motion.div>
        ))}
      </div>

      {total > 0 && (
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={T.label}>Tasa de cobranza</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: tasaCobranza >= 80 ? COLORS.green : COLORS.yellow }}>{tasaCobranza}%</div>
          </div>
          <BarraProgreso pct={tasaCobranza} color={tasaCobranza >= 80 ? COLORS.green : COLORS.yellow} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Cobrado: ${cobrado.toLocaleString("es-AR")}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Total: ${(cobrado + pendiente).toLocaleString("es-AR")}</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", background: COLORS.surface, borderRadius: 14, padding: 3, gap: 3 }}>
        {[["resumen", "Clientes"], ["cobros", "Cobros"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: tab === id ? COLORS.accent : "transparent", color: tab === id ? "#fff" : COLORS.textSub, transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Clientes */}
      {tab === "resumen" && (
        <motion.div key="resumen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {clientesLocal.length === 0 && (
            <div style={{ background: COLORS.surface, borderRadius: 14, padding: 20, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
              Agregá clientes con precio/mes para ver el seguimiento de cobros.
            </div>
          )}
          {clientesLocal.filter(c => Number(c.precio) > 0).map((c, i) => (
            <motion.div key={c.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: COLORS.surface, borderRadius: 14, padding: "12px 14px", border: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div onClick={() => onVerPerfil?.(c)} style={{ width: 36, height: 36, borderRadius: 11, background: c.estadoColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.estadoColor, flexShrink: 0, cursor: onVerPerfil ? "pointer" : "default" }}>{c.ini}</div>
              <div onClick={() => onVerPerfil?.(c)} style={{ flex: 1, minWidth: 0, cursor: onVerPerfil ? "pointer" : "default" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</div>
                <div style={{ fontSize: 11, color: c.estadoColor, marginTop: 2 }}>{c.estado}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, flexShrink: 0 }}>${(Number(c.precio) / 1000).toFixed(0)}K</div>
              <button onClick={() => toggleDeuda(c)} disabled={actualizando === c.id}
                style={{ background: (c.meses_deuda || 0) === 0 ? "#3a1a1a" : "#1a3a1a", border: `0.5px solid ${(c.meses_deuda || 0) === 0 ? COLORS.red + "44" : COLORS.green + "44"}`, borderRadius: 10, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: (c.meses_deuda || 0) === 0 ? COLORS.red : COLORS.green, flexShrink: 0 }}>
                {actualizando === c.id ? "..." : (c.meses_deuda || 0) === 0 ? "Debe" : "Cobrado"}
              </button>
            </motion.div>
          ))}
          {clientesLocal.filter(c => !Number(c.precio)).length > 0 && (
            <div style={{ fontSize: 11, color: COLORS.textMuted, textAlign: "center" }}>
              {clientesLocal.filter(c => !Number(c.precio)).length} clientes sin precio asignado
            </div>
          )}
        </motion.div>
      )}

      {/* Tab: Configuración cobros */}
      {tab === "cobros" && (
        <motion.div key="cobros" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
            <div style={{ ...T.label, marginBottom: 4 }}>Usuario de Mercado Pago</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
              Ingresá tu usuario de MP (lo encontrás en tu perfil de la app). Tus clientes podrán hacerte click para pagarte.{" "}
              <span style={{ color: COLORS.accent }}>Ej: si tu link es mercadopago.com.ar/juantrainer → ponés "juantrainer".</span>
            </div>
            <input placeholder="Ej: juantrainer" value={mpSettings.alias} onChange={e => setMpSettings(p => ({ ...p, alias: e.target.value.trim() }))} style={inputS} />
            {mpSettings.alias && (
              <div style={{ fontSize: 12, color: COLORS.green, background: COLORS.green + "11", borderRadius: 8, padding: "8px 12px" }}>
                Link generado: link.mercadopago.com.ar/{mpSettings.alias}
              </div>
            )}
          </div>

          <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
            <div style={{ ...T.label, marginBottom: 4 }}>Access Token (API avanzada)</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
              Opcional. Con esto se genera un link de pago automático con el monto exacto. Encontralo en{" "}
              <a href="https://www.mercadopago.com.ar/developers/panel/app" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.accent }}>mercadopago.com.ar/developers</a>.
            </div>
            <input placeholder="APP_USR-..." value={mpSettings.access_token} onChange={e => setMpSettings(p => ({ ...p, access_token: e.target.value }))} style={{ ...inputS, fontFamily: "monospace", fontSize: 12 }} />
            <div style={{ fontSize: 11, color: COLORS.yellow, background: COLORS.yellow + "11", borderRadius: 8, padding: "8px 12px" }}>
              ⚠ No compartas este token. Si lo perdés podés revocarlo desde el panel de MP.
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={guardarSettings} disabled={guardandoSettings}
            style={{ background: settingsOk ? COLORS.green : COLORS.accent, border: "none", borderRadius: 14, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: guardandoSettings ? 0.6 : 1, transition: "background 0.3s" }}>
            {guardandoSettings ? "Guardando..." : settingsOk ? "✓ Guardado" : "Guardar configuración"}
          </motion.button>

          {(mpSettings.alias || mpSettings.access_token) && (
            <div style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.green}33` }}>
              <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600, marginBottom: 4 }}>✓ Cobros configurados</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                {mpSettings.access_token ? "Tus clientes podrán pagar con un link automático de MP." : `Tus clientes verán un botón para pagar a "${mpSettings.alias}".`}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </>
  )
}

function RutinasPage({ clientes, user, onGuardar }) {
  const [tab, setTab] = useState("lista")
  const [rutinas, setRutinas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandida, setExpandida] = useState(null)
  const [eliminando, setEliminando] = useState(null)

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase.from("rutinas").select("*").eq("trainer_id", user?.id).order("created_at", { ascending: false })
    setRutinas(data || [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [user?.id])

  const eliminar = async (id) => {
    setEliminando(id)
    await supabase.from("rutinas").delete().eq("id", id)
    setRutinas(prev => prev.filter(r => r.id !== id))
    setEliminando(null)
  }

  const getNombreClientes = (asignados) => {
    if (!asignados || !asignados.length) return "Sin asignar"
    const nombres = asignados.map(id => {
      const c = clientes.find(c => c.id === id)
      return c ? c.nombre : null
    }).filter(Boolean)
    if (!nombres.length) return "Sin asignar"
    if (nombres.length <= 2) return nombres.join(", ")
    return `${nombres.slice(0, 2).join(", ")} +${nombres.length - 2}`
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={T.h1}>Rutinas</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{rutinas.length} creadas</div>
      </div>

      <div style={{ display: "flex", background: COLORS.surface, borderRadius: 14, padding: 3, gap: 3 }}>
        {[["lista", "Mis rutinas"], ["crear", "Crear nueva"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: tab === id ? COLORS.accent : "transparent", color: tab === id ? "#fff" : COLORS.textSub, transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "lista" && (
        <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cargando && <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 14, padding: 20 }}>Cargando...</div>}
          {!cargando && rutinas.length === 0 && (
            <div style={{ background: COLORS.surface, borderRadius: 16, padding: 24, border: `0.5px dashed ${COLORS.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>No creaste rutinas todavía</div>
              <button onClick={() => setTab("crear")}
                style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Crear primera rutina
              </button>
            </div>
          )}
          {rutinas.map((r) => {
            const dias = (() => { try { return typeof r.dias === "string" ? JSON.parse(r.dias) : (r.dias || []) } catch { return [] } })()
            const abierta = expandida === r.id
            const asignadosArr = Array.isArray(r.clientes_asignados) ? r.clientes_asignados :
              (() => { try { return JSON.parse(r.clientes_asignados || "[]") } catch { return [] } })()
            return (
              <motion.div key={r.id} layout style={{ background: COLORS.surface, borderRadius: 16, border: `0.5px solid ${COLORS.border}`, overflow: "hidden" }}>
                <div onClick={() => setExpandida(abierta ? null : r.id)}
                  style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="dumbbell" size={18} color={COLORS.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nombre}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                      {dias.length} {dias.length === 1 ? "día" : "días"} · {getNombreClientes(asignadosArr)}
                    </div>
                  </div>
                  <motion.div animate={{ rotate: abierta ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <Icon name="chevronRight" size={14} color={COLORS.textMuted} />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {abierta && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}>
                      <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8, borderTop: `0.5px solid ${COLORS.border}`, paddingTop: 12 }}>
                        {dias.map((d, i) => {
                          const ejercicios = d.bloques?.flatMap(b => b.ejercicios || [b]) || []
                          return (
                            <div key={i} style={{ background: COLORS.surface2, borderRadius: 12, padding: "10px 12px" }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, marginBottom: 6 }}>{d.nombre || `Día ${i + 1}`}</div>
                              {ejercicios.slice(0, 4).map((e, j) => (
                                <div key={j} style={{ fontSize: 12, color: COLORS.textSub, padding: "2px 0" }}>
                                  {e.nombre || e} {e.series && e.reps ? `· ${e.series}×${e.reps}` : ""}
                                </div>
                              ))}
                              {ejercicios.length > 4 && (
                                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>+{ejercicios.length - 4} más</div>
                              )}
                            </div>
                          )
                        })}
                        {asignadosArr.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {asignadosArr.map(id => {
                              const c = clientes.find(c => c.id === id)
                              return c ? (
                                <div key={id} style={{ background: COLORS.accentSub, borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#93C5FD", fontWeight: 500 }}>{c.nombre}</div>
                              ) : null
                            })}
                          </div>
                        )}
                        <button onClick={() => eliminar(r.id)} disabled={eliminando === r.id}
                          style={{ background: "#3a1a1a", border: "0.5px solid #ef444433", borderRadius: 10, padding: "8px 0", color: COLORS.red, fontSize: 12, fontWeight: 500, cursor: "pointer", width: "100%" }}>
                          {eliminando === r.id ? "Eliminando..." : "Eliminar rutina"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {tab === "crear" && (
        <motion.div key="crear" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CreadorRutinasNuevo clientes={clientes} onGuardar={async (datos) => {
            await onGuardar(datos)
            await cargar()
            setTab("lista")
          }} />
        </motion.div>
      )}
    </>
  )
}

export default function App({ user, onLogout }) {
  const [activePage, setActivePage] = useState("inicio")
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [previewCliente, setPreviewCliente] = useState(null)
  const isMobile = useIsMobile()

  const nombreTrainer = user?.user_metadata?.nombre || user?.email?.split("@")[0] || "Entrenador"

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const { data } = await supabase.from("clientes").select("*").order("nombre")
      if (data) setClientes(data.map(normCliente))
      setCargando(false)
    }
    cargar()
  }, [])

  const screenStyle = { flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" }

  const renderPage = () => {
    if (clienteSeleccionado) return (
      <motion.div key="perfil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        <PerfilCliente
          cliente={clienteSeleccionado}
          onBack={() => setClienteSeleccionado(null)}
          onPreview={() => setPreviewCliente(clienteSeleccionado)}
          onEliminar={(id) => {
            setClientes(prev => prev.filter(c => c.id !== id))
            setClienteSeleccionado(null)
          }}
          onActualizar={(actualizado) => {
            setClientes(prev => prev.map(c => c.id === actualizado.id ? normCliente(actualizado) : c))
            setClienteSeleccionado(normCliente(actualizado))
          }}
        />
      </motion.div>
    )

    if (cargando) return (
      <motion.div key="loading" style={{ ...screenStyle, alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ fontSize: 13, color: COLORS.textMuted }}>Cargando...</motion.div>
      </motion.div>
    )

    // Chat gets its own full-height wrapper (no padding/gap)
    if (activePage === "chat") return (
      <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <Chat user={user} clientes={clientes} modo="trainer" />
      </motion.div>
    )

    const pages = {
      inicio: <Inicio clientes={clientes} nombreTrainer={nombreTrainer} onVerPerfil={setClienteSeleccionado} onNuevoCliente={() => setActivePage("clientes")} />,
      clientes: <Clientes
        clientes={clientes}
        onVerPerfil={setClienteSeleccionado}
        onClienteAgregado={(c) => setClientes(prev => [...prev, c])}
        onEliminarCliente={(id) => setClientes(prev => prev.filter(c => c.id !== id))}
      />,
      rutinas: <RutinasPage clientes={clientes} user={user} onGuardar={async ({ nombre, dias, clientesAsignados }) => {
        const { error } = await supabase.from("rutinas").insert({
          trainer_id: user?.id,
          nombre,
          dias: JSON.stringify(dias),
          clientes_asignados: clientesAsignados,
        })
        if (error) console.error("Error guardando rutina:", error)
      }} />,
      agenda: <AgendaReal clientes={clientes} />,
      pagos: <Finanzas clientes={clientes} user={user} onVerPerfil={setClienteSeleccionado} />,
    }
    return (
      <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={screenStyle}>
        {pages[activePage]}
      </motion.div>
    )
  }

  const fontFamily = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"

  return (
    <div style={{ background: COLORS.bg, height: "100dvh", display: "flex", fontFamily }}>
      {/* Sidebar — solo desktop */}
      {!isMobile && (
        <div style={{ width: 220, background: COLORS.surface, borderRight: `0.5px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100dvh", position: "sticky", top: 0, flexShrink: 0 }}>
          <div style={{ padding: "20px 16px 16px" }}>
            <div style={{ marginBottom: 14, padding: "0 4px" }}>
              <img src="/logo-white.png" alt="TuPersonal" style={{ height: 64, width: "auto", display: "block" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>
                {(nombreTrainer || "E").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSub, fontWeight: 500 }}>{nombreTrainer}</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
            {navItems.map(item => {
              const activo = activePage === item.id && !clienteSeleccionado
              return (
                <button key={item.id} onClick={() => { setActivePage(item.id); setClienteSeleccionado(null) }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: activo ? `${COLORS.accent}22` : "none", border: "none", borderRadius: 10, color: activo ? "#fff" : COLORS.textSub, fontSize: 14, fontWeight: activo ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily }}>
                  <Icon name={item.icon} size={18} color={activo ? COLORS.accentLight : COLORS.textMuted} />
                  {item.label}
                </button>
              )
            })}
          </div>
          <div style={{ padding: "16px 20px" }}>
            <button onClick={onLogout}
              style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily, padding: 0 }}>
              <Icon name="logout" size={16} color={COLORS.textMuted} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
        {/* Header mobile */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "calc(16px + env(safe-area-inset-top))", paddingLeft: 20, paddingRight: 20, paddingBottom: 0, flexShrink: 0 }}>
            <img src="/logo-white.png" alt="TuPersonal" style={{ height: 32, width: "auto", }} />
            <button onClick={onLogout}
              style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "5px 10px", color: COLORS.textMuted, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
              Salir
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
        </div>

        {/* Nav inferior — solo mobile */}
        {isMobile && !clienteSeleccionado && (
          <nav style={{ background: COLORS.bg, borderTop: `0.5px solid ${COLORS.border}`, display: "flex", paddingTop: 10, paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: 0, paddingRight: 0, flexShrink: 0 }}>
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

      {/* Overlay vista previa del cliente */}
      <AnimatePresence>
        {previewCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, backdropFilter: "blur(6px)" }}
            onClick={e => { if (e.target === e.currentTarget) setPreviewCliente(null) }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ width: 375, height: 680, borderRadius: 32, overflow: "hidden", border: `1px solid ${COLORS.accent}66` }}>
              <ClientePanel
                user={{ id: previewCliente.user_id || previewCliente.id, email: previewCliente.email || "", user_metadata: {} }}
                initialPerfil={{ ...previewCliente, trainer_id: previewCliente.trainer_id || user?.id }}
                previewMode={true}
                onLogout={() => setPreviewCliente(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}