import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AgendaReal from "./Agenda"
import { EJERCICIOS } from "./ejercicios"
import { supabase } from "./supabase"
import { askClaude } from "./ai"
import CreadorRutinasNuevo from "./CreadorRutinasNuevo"
import ClientePanel from "./ClientePanel"
import Chat from "./Chat"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const AI_KEY = import.meta.env.VITE_ANTHROPIC_KEY

const COLORS = {
  bg: "#111111", surface: "#191919", surface2: "#222222", border: "#2a2a2a", border2: "#333333",
  text: "#ececec", textSub: "#888888", textMuted: "#555555",
  accent: "#E8714A", accentSub: "#2a1a12", accentLight: "#F0A07A",
  green: "#3ecf6e", red: "#e5484d", yellow: "#e5a60c",
}

const T = {
  h1: { fontSize: 24, fontWeight: 600, color: COLORS.text, letterSpacing: "-0.025em", lineHeight: 1.2 },
  h2: { fontSize: 18, fontWeight: 600, color: COLORS.text, letterSpacing: "-0.015em", lineHeight: 1.3 },
  h3: { fontSize: 14, fontWeight: 500, color: COLORS.text, letterSpacing: "-0.01em", lineHeight: 1.4 },
  body: { fontSize: 14, fontWeight: 400, color: COLORS.textSub, lineHeight: 1.5 },
  label: { fontSize: 12, fontWeight: 500, color: COLORS.textMuted, letterSpacing: "0.02em" },
  num: { fontSize: 30, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.03em", lineHeight: 1.1 },
}

const Icon = ({ name, size = 20, color = "#888888" }) => {
  const icons = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
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

function autoUsername(email, nombre) {
  const emailPart = (email || "").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
  if (emailPart.length >= 3) return emailPart.slice(0, 20)
  const nombrePart = (nombre || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-zA-Z0-9_]/g, "")
  if (nombrePart.length >= 3) return nombrePart.slice(0, 20)
  return "user" + Math.floor(Math.random() * 9000 + 1000)
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

function useIsPWA() {
  const [pwa, setPwa] = useState(() =>
    window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches
  )
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)")
    const handle = (e) => setPwa(e.matches || window.navigator.standalone === true)
    mq.addEventListener("change", handle)
    return () => mq.removeEventListener("change", handle)
  }, [])
  return pwa
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
  { id: "perfil", icon: "user", label: "Perfil" },
]

const bottomNavItems = ["inicio", "clientes", "rutinas", "pagos", "perfil"]

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

  const barData = [40, 55, 62, 70, 80, Math.max(95, Math.round(totalMensual / 1000) || 95)]
  const barLabels = ["E", "F", "M", "A", "M", "J"]

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={T.h1}>{saludo}, {nombre}</div>
          <div style={{ ...T.body, fontSize: 13, marginTop: 4 }}>
            {clientes.length > 0
              ? `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""} activo${clientes.length !== 1 ? "s" : ""}`
              : "Sin clientes todavía"
            }
          </div>
        </div>
        <button onClick={onNuevoCliente}
          style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: "8px 14px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="plus" size={14} color="#fff" />
          Nuevo cliente
        </button>
      </div>

      {/* Métricas inline */}
      <div style={{ display: "flex", gap: 32, marginTop: 24, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
        <div>
          <div style={T.label}>Facturación</div>
          <div style={{ ...T.num, marginTop: 4 }}>
            {totalMensual > 0 ? `$${totalMensual >= 1000 ? (totalMensual / 1000).toFixed(0) + "K" : totalMensual.toLocaleString("es-AR")}` : "—"}
          </div>
          {cobrado > 0 && cobrado < totalMensual && (
            <div style={{ fontSize: 12, color: COLORS.green, marginTop: 2 }}>${(cobrado / 1000).toFixed(0)}K cobrado</div>
          )}
        </div>
        <div>
          <div style={T.label}>Al día</div>
          <div style={{ ...T.num, marginTop: 4 }}>{alDia}<span style={{ fontSize: 14, fontWeight: 400, color: COLORS.textMuted, marginLeft: 4 }}>/ {clientes.length}</span></div>
        </div>
        <div>
          <div style={T.label}>Pendientes</div>
          <div style={{ ...T.num, marginTop: 4, color: pendientes > 0 ? COLORS.yellow : COLORS.textMuted }}>{pendientes}</div>
        </div>
      </div>

      {/* Gráfico */}
      <div style={{ paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}`, marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={T.label}>Ingresos — 6 meses</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>${barData[barData.length - 1]}K</div>
        </div>
        <LineChart data={barData} labels={barLabels} />
      </div>

      {/* Clientes */}
      {clientes.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={T.label}>Clientes recientes</div>
            <button onClick={onNuevoCliente} style={{ background: "none", border: "none", color: COLORS.textSub, fontSize: 12, cursor: "pointer", padding: 0 }}>Ver todos</button>
          </div>
          {clientes.slice(0, 5).map((c, i) => (
            <div key={c.id || i} onClick={() => onVerPerfil?.(c)}
              style={{ padding: "10px 0", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: i < Math.min(clientes.length, 5) - 1 ? `1px solid ${COLORS.border}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: COLORS.textSub, flexShrink: 0 }}>{c.ini}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</div>
                {c.objetivo && <div style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{c.objetivo}</div>}
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                {c.precio && <div style={{ fontSize: 13, color: COLORS.textSub, fontWeight: 500 }}>${Number(c.precio).toLocaleString("es-AR")}</div>}
                <div style={{ fontSize: 11, fontWeight: 500, color: c.estadoColor }}>{c.estado}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {clientes.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, marginBottom: 6 }}>Sin clientes todavía</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>Agregá tu primer cliente para comenzar</div>
          <button onClick={onNuevoCliente}
            style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Agregar cliente
          </button>
        </div>
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

  const inputStyle = { background: COLORS.surface2, border: `1px solid ${COLORS.border2}`, borderRadius: 6, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "'Styrene A', -apple-system, sans-serif", boxSizing: "border-box", marginBottom: 8 }

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

  const [todasRutinas, setTodasRutinas] = useState([])

  const cargarRutinas = async () => {
    if (!cliente.id) return
    setCargandoRutinas(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    const { data } = await supabase.from("rutinas").select("*").eq("trainer_id", u.id)
    const todas = data || []
    setTodasRutinas(todas)
    const filtradas = todas.filter(r => {
      let asignados = r.clientes_asignados
      if (typeof asignados === "string") { try { asignados = JSON.parse(asignados) } catch { asignados = [] } }
      if (!Array.isArray(asignados)) asignados = []
      return asignados.some(id => String(id) === String(cliente.id))
    })
    setRutinas(filtradas)
    setCargandoRutinas(false)
  }

  const toggleAsignarRutina = async (rutina) => {
    let asignados = rutina.clientes_asignados
    if (typeof asignados === "string") { try { asignados = JSON.parse(asignados) } catch { asignados = [] } }
    if (!Array.isArray(asignados)) asignados = []
    const yaAsignado = asignados.some(id => String(id) === String(cliente.id))
    const nuevos = yaAsignado ? asignados.filter(id => String(id) !== String(cliente.id)) : [...asignados, cliente.id]
    await supabase.from("rutinas").update({ clientes_asignados: nuevos }).eq("id", rutina.id)
    cargarRutinas()
  }

  const ajustarConIA = async (rutina) => {
    setIaLoading(prev => ({ ...prev, [rutina.id]: true }))
    setIaResultado(prev => ({ ...prev, [rutina.id]: null }))
    try {
      const dias = typeof rutina.dias === "string" ? JSON.parse(rutina.dias) : rutina.dias
      const resumen = dias?.map(d => `${d.nombre}: ${d.bloques?.map(b => b.ejercicios?.map(e => e.nombre).join(", ") || b.nombre || "").join(", ")}`).join(" | ") || ""
      const texto = await askClaude({
        max_tokens: 400,
        messages: [{ role: "user", content: `Sos personal trainer experto. Analizá la rutina "${rutina.nombre}" de ${datos.nombre} (peso: ${datos.peso || "?"}kg, objetivo: ${datos.objetivo || "general"}). Ejercicios: ${resumen}. Cargas actuales: ${JSON.stringify(datos.cargas || {})}. Peso histórico (últimos 3): ${JSON.stringify((datos.peso_historial || []).slice(-3))}. Sugerí ajustes de progresión en máximo 120 palabras, usando bullet points (•). En español, directo.` }]
      })
      setIaResultado(prev => ({ ...prev, [rutina.id]: texto || "Sin respuesta" }))
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
        <button onClick={onBack} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 12px", cursor: "pointer", display: "flex" }}>
          <Icon name="arrowLeft" size={16} color={COLORS.text} />
        </button>
        <div style={T.h3}>Perfil</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setEditando(!editando)}
            style={{ background: editando ? COLORS.accent : COLORS.surface, border: `1px solid ${editando ? COLORS.accent : COLORS.border}`, borderRadius: 6, padding: "8px 14px", color: editando ? "#fff" : COLORS.textSub, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            {editando ? "Cancelar" : "Editar"}
          </button>
          <button onClick={eliminarCliente} disabled={eliminando}
            style={{ background: "#3a1a1a", border: "1px solid #ef444433", borderRadius: 6, padding: "8px 14px", color: COLORS.red, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            {eliminando ? "..." : "Eliminar"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, background: COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, color: COLORS.textSub, flexShrink: 0 }}>{datos.ini}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={T.h2}>{datos.nombre}</div>
          <div style={{ ...T.body, marginTop: 2 }}>{datos.objetivo}{datos.telefono ? ` · ${datos.telefono}` : ""}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: datos.estadoColor || COLORS.green }}>{datos.estado || "Al día"}</span>
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            style={{ width: 36, height: 36, borderRadius: 6, background: COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="#22c55e">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.border}` }}>
        {["info", "progreso", "pagos", "rutinas"].map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === "rutinas") cargarRutinas() }}
            style={{ flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: "transparent", color: tab === t ? COLORS.text : COLORS.textMuted, borderBottom: tab === t ? `2px solid ${COLORS.accent}` : "2px solid transparent", transition: "all 0.15s", marginBottom: -1 }}>
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
                    style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.5 : 1 }}>
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[{ l: "Peso", v: `${datos.peso || "-"} kg` }, { l: "Altura", v: `${datos.altura || "-"} cm` }, { l: "Edad", v: `${datos.edad || "-"} años` }, { l: "Precio", v: `$${datos.precio || "-"}/mes` }, { l: "Objetivo", v: datos.objetivo || "Sin objetivo" }].map((m, i, arr) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                        <span style={T.label}>{m.l}</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>{m.v}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {tab === "progreso" && (
            <>
              <div style={{ display: "flex", gap: 32, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
                <div>
                  <div style={T.label}>Peso actual</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>{datos.peso ? `${datos.peso} kg` : "—"}</div>
                </div>
                <div>
                  <div style={T.label}>Registros</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>{(datos.peso_historial || []).length}</div>
                </div>
              </div>
              {(datos.peso_historial || []).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ ...T.label, marginBottom: 10 }}>Historial de peso</div>
                  {[...(datos.peso_historial || [])].reverse().slice(0, 6).map((h, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: i < 5 ? `1px solid ${COLORS.border}` : "none" }}>
                      <span style={{ color: COLORS.textSub }}>{h.fecha}</span>
                      <span style={{ fontWeight: 600, color: COLORS.text }}>{h.peso} kg</span>
                    </div>
                  ))}
                </div>
              )}
              {Object.keys(datos.cargas || {}).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ ...T.label, marginBottom: 10 }}>Cargas registradas</div>
                  {Object.entries(datos.cargas || {}).map(([nombre, carga], i, arr) => (
                    <div key={nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                      <span style={{ color: COLORS.textSub }}>{nombre}</span>
                      <span style={{ fontWeight: 600, color: COLORS.text }}>{carga}</span>
                    </div>
                  ))}
                </div>
              )}
              {(datos.peso_historial || []).length === 0 && Object.keys(datos.cargas || {}).length === 0 && (
                <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, marginTop: 24 }}>
                  El cliente aún no registró progreso
                </div>
              )}
            </>
          )}
          {tab === "pagos" && (
            <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 14, marginTop: 24 }}>
              Gestioná los pagos desde la sección Finanzas
            </div>
          )}
          {tab === "rutinas" && (
            <>
              {cargandoRutinas ? (
                <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>Cargando...</div>
              ) : (
                <>
                {rutinas.length === 0 && (
                  <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 14, marginTop: 24 }}>
                    Sin rutinas asignadas todavía
                  </div>
                )}
                {rutinas.map((r) => {
                const dias = typeof r.dias === "string" ? (() => { try { return JSON.parse(r.dias) } catch { return [] } })() : (r.dias || [])
                return (
                  <div key={r.id} style={{ paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={T.h3}>{r.nombre}</div>
                        <div style={{ ...T.body, marginTop: 2 }}>{dias.length} {dias.length === 1 ? "día" : "días"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => ajustarConIA(r)} disabled={iaLoading[r.id]}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: COLORS.accentSub, border: `1px solid ${COLORS.accent}44`, borderRadius: 10, padding: "9px 0", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: iaLoading[r.id] ? 0.6 : 1 }}>
                        <Icon name="sparkle" size={13} color={COLORS.accent} />
                        {iaLoading[r.id] ? "Analizando..." : "Ajustar con IA"}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => exportarPDF(r)}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "9px 0", color: COLORS.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <Icon name="download" size={13} color={COLORS.textSub} />
                        Exportar PDF
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {iaResultado[r.id] && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: "hidden" }}>
                          <div style={{ background: COLORS.accentSub + "44", border: `1px solid ${COLORS.accent}44`, borderRadius: 6, padding: "12px 14px" }}>
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
                {/* Rutinas no asignadas */}
                {(() => {
                  const noAsignadas = todasRutinas.filter(r => {
                    let asignados = r.clientes_asignados
                    if (typeof asignados === "string") { try { asignados = JSON.parse(asignados) } catch { asignados = [] } }
                    if (!Array.isArray(asignados)) asignados = []
                    return !asignados.some(id => String(id) === String(cliente.id))
                  })
                  if (noAsignadas.length === 0) return null
                  return (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1, marginTop: 8 }}>Asignar rutina</div>
                      {noAsignadas.map(r => (
                        <div key={r.id} style={{ background: COLORS.surface, borderRadius: 8, padding: "12px 14px", border: `0.5px dashed ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textSub }}>{r.nombre}</div>
                            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                              {(() => { try { const d = typeof r.dias === "string" ? JSON.parse(r.dias) : (r.dias || []); return `${d.length} ${d.length === 1 ? "día" : "días"}` } catch { return "" } })()}
                            </div>
                          </div>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleAsignarRutina(r)}
                            style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Asignar
                          </motion.button>
                        </div>
                      ))}
                    </>
                  )
                })()}
              </>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

const AVATAR_COLORS = [
  "#E8714A","#D4603E","#C75535","#B84A2C","#A93F23","#9A341A","#E07040","#CF6538","#BF5A30","#AF4F28"
]
function avatarColor(name) {
  return AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length]
}

function Clientes({ onVerPerfil, clientes = [], onClienteAgregado, onEliminarCliente, user }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", precio: "" })
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [menuAbierto, setMenuAbierto] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [modoAgregar, setModoAgregar] = useState("buscar")
  const [usernameBusq, setUsernameBusq] = useState("")
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [busqError, setBusqError] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [tab, setTab] = useState("clientes")

  // Grupos state
  const [grupos, setGrupos] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(false)
  const [mostrarCrearGrupo, setMostrarCrearGrupo] = useState(false)
  const [nombreGrupo, setNombreGrupo] = useState("")
  const [creandoGrupo, setCreandoGrupo] = useState(false)
  const [grupoCopiado, setGrupoCopiado] = useState(null)

  useEffect(() => {
    if (tab === "grupos") cargarGrupos()
  }, [tab])

  const cargarGrupos = async () => {
    setCargandoGrupos(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from("grupos").select("*").eq("trainer_id", user.id).order("created_at", { ascending: false })
    setGrupos(data || [])
    setCargandoGrupos(false)
  }

  const genCodigo = () => Math.random().toString(36).slice(2, 8).toUpperCase()

  const crearGrupo = async () => {
    if (!nombreGrupo.trim()) return
    setCreandoGrupo(true)
    const { data: { user } } = await supabase.auth.getUser()
    const codigo = genCodigo()
    const { data, error } = await supabase.from("grupos").insert({ trainer_id: user.id, nombre: nombreGrupo.trim(), codigo }).select().single()
    if (data) { setGrupos(prev => [data, ...prev]); setNombreGrupo(""); setMostrarCrearGrupo(false) }
    else if (error?.message?.includes("grupos")) alert("Primero creá la tabla grupos en Supabase. Pedí el SQL al admin.")
    setCreandoGrupo(false)
  }

  const eliminarGrupo = async (id) => {
    await supabase.from("grupos").delete().eq("id", id)
    setGrupos(prev => prev.filter(g => g.id !== id))
  }

  const copiarCodigo = (codigo, id) => {
    const mostrarOk = () => { setGrupoCopiado(id); setTimeout(() => setGrupoCopiado(null), 2000) }
    if (navigator.share) {
      navigator.share({ title: "TuPersonal — código de grupo", text: `Usá el código ${codigo} para unirte a mi grupo en TuPersonal.` }).then(mostrarOk).catch(() => {})
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(codigo).then(mostrarOk).catch(() => {})
    } else {
      const el = document.createElement("textarea"); el.value = codigo; el.style.cssText = "position:fixed;opacity:0"
      document.body.appendChild(el); el.focus(); el.select(); document.execCommand("copy"); document.body.removeChild(el)
      mostrarOk()
    }
  }

  const inputStyle = { background: COLORS.surface2, border: `1px solid ${COLORS.border2}`, borderRadius: 6, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "'Styrene A', -apple-system, sans-serif", boxSizing: "border-box", marginBottom: 8 }

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

  const buscarPorUsername = async () => {
    if (!usernameBusq.trim()) return
    setBuscando(true)
    setClienteEncontrado(null)
    setBusqError("")
    const { data, error } = await supabase.from("clientes")
      .select("*")
      .eq("username", usernameBusq.toLowerCase().trim())
      .maybeSingle()
    if (error) {
      if (error.code === "42703") {
        setBusqError("La columna username no existe en la tabla clientes. Ejecutá el SQL de migraciones en Supabase.")
      } else if (error.code === "42501" || error.message?.toLowerCase().includes("permission") || error.message?.toLowerCase().includes("rls")) {
        setBusqError("Sin permiso para buscar. Aplicá las políticas RLS en Supabase (SQL Editor).")
      } else {
        setBusqError(`Error ${error.code}: ${error.message}`)
      }
      setClienteEncontrado(false)
    } else if (!data) {
      setClienteEncontrado(false)
    } else {
      setClienteEncontrado(data)
    }
    setBuscando(false)
  }

  const vincularCliente = async () => {
    if (!clienteEncontrado?.id) return
    setCargando(true)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from("clientes")
      .update({ trainer_id: currentUser.id })
      .eq("id", clienteEncontrado.id)
      .select().maybeSingle()
    if (data) {
      onClienteAgregado?.(normCliente(data))
      setUsernameBusq(""); setClienteEncontrado(null); setBusqError(""); setMostrarForm(false); setModoAgregar("buscar")
    } else if (error) {
      setBusqError(`No se pudo vincular: ${error.message} [${error.code}]`)
    } else {
      setBusqError("No se pudo vincular: sin permiso para actualizar este registro. Aplicá las políticas RLS en Supabase.")
    }
    setCargando(false)
  }

  const eliminarCliente = async (c) => {
    setEliminando(c.id)
    await supabase.from("clientes").delete().eq("id", c.id)
    onEliminarCliente?.(c.id)
    setMenuAbierto(null)
    setEliminando(null)
  }

  const copiarLink = () => {
    const link = `${window.location.origin}?invite=${user?.id}`
    if (navigator.share) {
      navigator.share({ title: "TuPersonal", text: "Descargá la app y conectate conmigo:", url: link })
        .then(() => { setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2500) })
        .catch(e => { if (e?.name !== "AbortError") { setLinkCopiado("error"); setTimeout(() => setLinkCopiado(false), 2500) } })
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => { setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2500) })
        .catch(() => { setLinkCopiado("error"); setTimeout(() => setLinkCopiado(false), 2500) })
    } else {
      try {
        const el = document.createElement("textarea"); el.value = link; el.style.cssText = "position:fixed;opacity:0"
        document.body.appendChild(el); el.focus(); el.select(); document.execCommand("copy"); document.body.removeChild(el)
        setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2500)
      } catch { setLinkCopiado("error"); setTimeout(() => setLinkCopiado(false), 2500) }
    }
  }

  const pendientes = clientes.filter(c => c.meses_deuda > 0).length
  const alDia = clientes.length - pendientes
  const sorted = [...clientes].sort((a, b) => (b.meses_deuda || 0) - (a.meses_deuda || 0))
  const filtrados = sorted.filter(c => {
    const matchBusqueda = !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchFiltro = filtro === "todos" || (filtro === "aldia" && !c.meses_deuda) || (filtro === "pendientes" && c.meses_deuda > 0)
    return matchBusqueda && matchFiltro
  })

  return (
    <>
      {/* Header */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={T.h1}>{tab === "grupos" ? "Grupos" : "Clientes"}</div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {tab === "clientes" ? (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={copiarLink}
                  style={{ background: linkCopiado === "error" ? COLORS.red+"22" : linkCopiado ? COLORS.green+"22" : COLORS.surface, border: `1px solid ${linkCopiado === "error" ? COLORS.red : linkCopiado ? COLORS.green : COLORS.border}`, borderRadius: 10, padding: "5px 9px", color: linkCopiado === "error" ? COLORS.red : linkCopiado ? COLORS.green : COLORS.textSub, fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {linkCopiado === "error" ? "Error" : linkCopiado ? "✓ Listo" : "Compartir link"}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMostrarForm(!mostrarForm)}
                  style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "5px 11px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "none", whiteSpace: "nowrap" }}>
                  + Agregar cliente
                </motion.button>
              </>
            ) : (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMostrarCrearGrupo(true)}
                style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "5px 11px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "none", whiteSpace: "nowrap" }}>
                + Crear grupo
              </motion.button>
            )}
          </div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
          {tab === "clientes"
            ? (clientes.length > 0 ? <>{alDia} al día{pendientes > 0 ? <> · <span style={{ color: COLORS.yellow }}>{pendientes} pendiente{pendientes > 1 ? "s" : ""}</span></> : ""}</> : "Administrá tus clientes, pagos y rutinas")
            : "Creá grupos con código para que tus clientes se unan fácilmente"
          }
        </div>
        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 0, marginTop: 12, borderBottom: `1px solid ${COLORS.border}` }}>
          {[["clientes", "Clientes"], ["grupos", "Grupos"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "10px 16px", border: "none", background: "transparent", color: tab === t ? COLORS.text : COLORS.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer", borderBottom: tab === t ? `2px solid ${COLORS.accent}` : "2px solid transparent", marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAB: GRUPOS ===== */}
      {tab === "grupos" && (
        <>
          {/* Crear grupo form */}
          <AnimatePresence>
            {mostrarCrearGrupo && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Nuevo grupo</div>
                <input placeholder="Nombre del grupo (ej: Lunes/Miércoles, Avanzados...)" value={nombreGrupo}
                  onChange={e => setNombreGrupo(e.target.value)} onKeyDown={e => e.key === "Enter" && crearGrupo()}
                  style={inputStyle} autoFocus />
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: -4, marginBottom: 12 }}>
                  Se generará un código de 6 caracteres que tus clientes usan para unirse.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setMostrarCrearGrupo(false); setNombreGrupo("") }}
                    style={{ flex: 1, background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "11px 0", color: COLORS.textSub, fontSize: 14, cursor: "pointer" }}>
                    Cancelar
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={crearGrupo} disabled={creandoGrupo || !nombreGrupo.trim()}
                    style={{ flex: 2, background: COLORS.accent, border: "none", borderRadius: 6, padding: "11px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: creandoGrupo || !nombreGrupo.trim() ? 0.5 : 1 }}>
                    {creandoGrupo ? "Creando..." : "Crear grupo"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {cargandoGrupos && (
            <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, padding: "20px 0" }}>Cargando grupos...</div>
          )}

          {!cargandoGrupos && grupos.length === 0 && !mostrarCrearGrupo && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, marginBottom: 6 }}>No tenés grupos todavía</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>Creá un grupo y compartí el código</div>
              <button onClick={() => setMostrarCrearGrupo(true)}
                style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Crear grupo
              </button>
            </div>
          )}

          {grupos.map((g, i) => {
            const miembros = clientes.filter(c => c.grupo_id === g.id)
            return (
              <div key={g.id}
                style={{ paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{g.nombre}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{miembros.length} miembro{miembros.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => copiarCodigo(g.codigo, g.id)}
                      style={{ background: grupoCopiado === g.id ? COLORS.green + "22" : COLORS.accentSub, border: `1px solid ${grupoCopiado === g.id ? COLORS.green : COLORS.accent}33`, borderRadius: 10, padding: "6px 12px", color: grupoCopiado === g.id ? COLORS.green : COLORS.accentLight, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, fontFamily: "monospace" }}>
                      {grupoCopiado === g.id ? "¡Copiado!" : g.codigo}
                    </motion.button>
                    <button onClick={() => eliminarGrupo(g.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: COLORS.textMuted, fontSize: 16, lineHeight: 1 }}>✕</button>
                  </div>
                </div>
                {miembros.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {miembros.map(m => (
                      <div key={m.id} style={{ fontSize: 11, background: COLORS.surface2, borderRadius: 8, padding: "3px 10px", color: COLORS.textSub }}>
                        {m.nombre}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* ===== TAB: CLIENTES ===== */}
      {tab === "clientes" && (
        <>
          {/* Form agregar */}
          <AnimatePresence>
            {mostrarForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ background: COLORS.surface, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.accent}44`, overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {[["buscar", "@ Buscar usuario"], ["manual", "+ Agregar manual"]].map(([m, label]) => (
                    <button key={m} onClick={() => { setModoAgregar(m); setClienteEncontrado(null); setUsernameBusq(""); setBusqError("") }}
                      style={{ flex: 1, background: modoAgregar === m ? COLORS.accent : COLORS.surface2, border: `1px solid ${modoAgregar === m ? COLORS.accent : COLORS.border2}`, borderRadius: 10, padding: "8px 0", color: modoAgregar === m ? "#fff" : COLORS.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>

                {modoAgregar === "buscar" ? (
                  <>
                    <input placeholder="Nombre de usuario (sin @)" value={usernameBusq}
                      onChange={e => { setUsernameBusq(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()); setClienteEncontrado(null); setBusqError("") }}
                      onKeyDown={e => e.key === "Enter" && buscarPorUsername()}
                      style={inputStyle} autoFocus />
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <button onClick={() => { setMostrarForm(false); setClienteEncontrado(null); setUsernameBusq(""); setBusqError("") }}
                        style={{ flex: 1, background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "12px 0", color: COLORS.textSub, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={buscarPorUsername} disabled={buscando || !usernameBusq.trim()}
                        style={{ flex: 2, background: COLORS.accent, border: "none", borderRadius: 6, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: buscando || !usernameBusq.trim() ? 0.5 : 1 }}>
                        {buscando ? "Buscando..." : "Buscar"}
                      </motion.button>
                    </div>
                    {busqError && (
                      <div style={{ fontSize: 12, color: COLORS.red, background: COLORS.red + "11", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>{busqError}</div>
                    )}
                    {clienteEncontrado === false && !busqError && (
                      <div style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center", padding: "4px 0", lineHeight: 1.5 }}>
                        No se encontró @{usernameBusq}.<br/>
                        <span style={{ fontSize: 12 }}>Si el usuario existe, puede ser un problema de permisos — aplicá el SQL de políticas RLS en Supabase.</span>
                      </div>
                    )}
                    {clienteEncontrado && clienteEncontrado.trainer_id !== null && (
                      <div style={{ fontSize: 13, color: COLORS.yellow, textAlign: "center", padding: "4px 0" }}>
                        Este usuario ya tiene un entrenador asignado.
                      </div>
                    )}
                    {clienteEncontrado && clienteEncontrado.trainer_id === null && (
                      <>
                        <div style={{ background: COLORS.surface2, borderRadius: 6, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                          {clienteEncontrado.avatar_url
                            ? <img src={clienteEncontrado.avatar_url} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
                            : <div style={{ width: 44, height: 44, borderRadius: 6, background: COLORS.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: COLORS.accent }}>
                                {(clienteEncontrado.nombre || "?")[0].toUpperCase()}
                              </div>
                          }
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{clienteEncontrado.nombre || "Sin nombre"}</div>
                            <div style={{ fontSize: 12, color: COLORS.textMuted }}>@{clienteEncontrado.username}</div>
                          </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={vincularCliente} disabled={cargando}
                          style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", opacity: cargando ? 0.5 : 1 }}>
                          {cargando ? "Agregando..." : "Agregar como mi cliente"}
                        </motion.button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>El cliente completa sus datos al crear su cuenta.</div>
                    <input placeholder="Nombre *" value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} autoFocus />
                    <input placeholder="Email" value={nuevo.email} onChange={e => setNuevo(p => ({ ...p, email: e.target.value }))} style={inputStyle} type="email" />
                    <input placeholder="Precio/mes ($)" value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} style={inputStyle} type="number" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setMostrarForm(false)} style={{ flex: 1, background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "12px 0", color: COLORS.textSub, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={agregarCliente} disabled={cargando || !nuevo.nombre.trim()}
                        style={{ flex: 2, background: COLORS.accent, border: "none", borderRadius: 6, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: cargando ? 0.5 : 1 }}>
                        {cargando ? "Guardando..." : "Agregar cliente"}
                      </motion.button>
                    </div>
                  </>
                )}
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
                    style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${filtro === id ? COLORS.accent : COLORS.border}`, background: filtro === id ? COLORS.accentSub : COLORS.surface, color: filtro === id ? COLORS.accentLight : COLORS.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {clientes.length === 0 && !mostrarForm && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, marginBottom: 6 }}>No tenés clientes todavía</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>Agregá tu primer cliente para empezar</div>
              <button onClick={() => setMostrarForm(true)}
                style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Agregar cliente
              </button>
            </div>
          )}

          {/* Lista */}
          {filtrados.length === 0 && clientes.length > 0 && (
            <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, padding: "20px 0" }}>Sin resultados para "{busqueda}"</div>
          )}

          {filtrados.map((c, i) => {
            const isMenuOpen = menuAbierto === c.id
            return (
              <div key={c.id || i} style={{ position: "relative" }}>
                <div onClick={() => { setMenuAbierto(null); onVerPerfil(c) }}
                  style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: COLORS.textSub, flexShrink: 0 }}>
                    {c.ini}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>{c.nombre}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1 }}>
                      {[c.objetivo, c.peso && `${c.peso}kg`, c.precio && `$${(Number(c.precio)/1000).toFixed(0)}K/mes`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: c.estadoColor, flexShrink: 0 }}>
                    {c.meses_deuda > 0 ? c.estado : "Al día"}
                  </span>
                  <button onClick={e => { e.stopPropagation(); setMenuAbierto(isMenuOpen ? null : c.id) }}
                    style={{ width: 24, height: 24, background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }}>
                    <span style={{ color: COLORS.textMuted, fontSize: 14 }}>···</span>
                  </button>
                </div>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.1 }}
                      style={{ position: "absolute", right: 0, top: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border2}`, borderRadius: 6, padding: 4, zIndex: 50, minWidth: 150, boxShadow: "0 4px 16px #00000040" }}>
                      {[
                        { label: "Ver perfil", action: () => { setMenuAbierto(null); onVerPerfil(c) } },
                        { label: eliminando === c.id ? "Eliminando..." : "Eliminar", danger: true, action: () => eliminarCliente(c) },
                      ].map((item) => (
                        <button key={item.label} onClick={item.action}
                          style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", borderRadius: 4, color: item.danger ? COLORS.red : COLORS.text, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </>
      )}
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

  const inputS = { background: COLORS.surface2, border: `1px solid ${COLORS.border2}`, borderRadius: 6, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "'Styrene A', -apple-system, sans-serif", boxSizing: "border-box", marginBottom: 10 }

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
            style={{ background: COLORS.surface, borderRadius: 8, padding: "14px 14px 12px", border: `1px solid ${COLORS.border}` }}>
            <div style={T.label}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, marginTop: 6, letterSpacing: -0.5 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>{m.sub}</div>
          </motion.div>
        ))}
      </div>

      {total > 0 && (
        <div style={{ background: COLORS.surface, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
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

      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.border}` }}>
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
            <div style={{ background: COLORS.surface, borderRadius: 8, padding: 20, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
              Agregá clientes con precio/mes para ver el seguimiento de cobros.
            </div>
          )}
          {clientesLocal.filter(c => Number(c.precio) > 0).map((c, i) => (
            <motion.div key={c.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: COLORS.surface, borderRadius: 8, padding: "12px 14px", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div onClick={() => onVerPerfil?.(c)} style={{ width: 36, height: 36, borderRadius: 11, background: c.estadoColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.estadoColor, flexShrink: 0, cursor: onVerPerfil ? "pointer" : "default" }}>{c.ini}</div>
              <div onClick={() => onVerPerfil?.(c)} style={{ flex: 1, minWidth: 0, cursor: onVerPerfil ? "pointer" : "default" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</div>
                <div style={{ fontSize: 11, color: c.estadoColor, marginTop: 2 }}>{c.estado}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, flexShrink: 0 }}>${(Number(c.precio) / 1000).toFixed(0)}K</div>
              <button onClick={() => toggleDeuda(c)} disabled={actualizando === c.id}
                style={{ background: (c.meses_deuda || 0) === 0 ? "#3a1a1a" : "#1a3a1a", border: `1px solid ${(c.meses_deuda || 0) === 0 ? COLORS.red + "44" : COLORS.green + "44"}`, borderRadius: 10, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: (c.meses_deuda || 0) === 0 ? COLORS.red : COLORS.green, flexShrink: 0 }}>
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
          <div style={{ background: COLORS.surface, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
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

          <div style={{ background: COLORS.surface, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
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
            style={{ background: settingsOk ? COLORS.green : COLORS.accent, border: "none", borderRadius: 8, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: guardandoSettings ? 0.6 : 1, transition: "background 0.3s" }}>
            {guardandoSettings ? "Guardando..." : settingsOk ? "✓ Guardado" : "Guardar configuración"}
          </motion.button>

          {(mpSettings.alias || mpSettings.access_token) && (
            <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.green}33` }}>
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
  const [asignando, setAsignando] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const [busquedaAsignar, setBusquedaAsignar] = useState("")

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

  const toggleAsignar = async (rutinaId, clienteId, asignadosArr) => {
    const yaAsignado = asignadosArr.includes(clienteId)
    const nuevos = yaAsignado ? asignadosArr.filter(id => id !== clienteId) : [...asignadosArr, clienteId]
    await supabase.from("rutinas").update({ clientes_asignados: nuevos }).eq("id", rutinaId)
    setRutinas(prev => prev.map(r => r.id === rutinaId ? { ...r, clientes_asignados: nuevos } : r))
  }

  const exportarPDF = (r) => {
    const doc = new jsPDF()
    const dias = (() => { try { return typeof r.dias === "string" ? JSON.parse(r.dias) : (r.dias || []) } catch { return [] } })()
    const asignadosArr = Array.isArray(r.clientes_asignados) ? r.clientes_asignados :
      (() => { try { return JSON.parse(r.clientes_asignados || "[]") } catch { return [] } })()
    const nombresClientes = asignadosArr.map(id => clientes.find(c => c.id === id)?.nombre).filter(Boolean).join(", ") || "Sin asignar"
    doc.setFontSize(18); doc.setTextColor(40, 40, 40)
    doc.text(r.nombre, 14, 20)
    doc.setFontSize(11); doc.setTextColor(100)
    doc.text(`Clientes: ${nombresClientes}`, 14, 28)
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 14, 34)
    let y = 44
    dias.forEach(dia => {
      const ejercicios = dia.bloques?.flatMap(b => b.ejercicios || [b]) || dia.ejercicios || []
      doc.setFontSize(13); doc.setTextColor(40)
      doc.text(dia.nombre || "Día", 14, y); y += 4
      autoTable(doc, {
        startY: y,
        head: [["Ejercicio", "Series", "Reps", "RIR", "Descanso"]],
        body: ejercicios.map(e => [e.nombre || "", e.series || "", e.reps || "", e.rir !== undefined ? e.rir : "", e.descanso ? `${e.descanso}s` : ""]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [232, 113, 74] },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 10
    })
    doc.save(`${r.nombre}.pdf`)
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

      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.border}` }}>
        {[["lista", "Mis rutinas"], ["crear", "Crear nueva"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: tab === id ? COLORS.accent : "transparent", color: tab === id ? "#fff" : COLORS.textSub, transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "lista" && (
        <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar rutina..."
            style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }}
          />
          {cargando && <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 14, padding: 20 }}>Cargando...</div>}
          {!cargando && rutinas.length === 0 && (
            <div style={{ background: COLORS.surface, borderRadius: 8, padding: 24, border: `0.5px dashed ${COLORS.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>No creaste rutinas todavía</div>
              <button onClick={() => setTab("crear")}
                style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Crear primera rutina
              </button>
            </div>
          )}
          {rutinas.filter(r => !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase())).map((r) => {
            const dias = (() => { try { return typeof r.dias === "string" ? JSON.parse(r.dias) : (r.dias || []) } catch { return [] } })()
            const abierta = expandida === r.id
            const asignadosArr = Array.isArray(r.clientes_asignados) ? r.clientes_asignados :
              (() => { try { return JSON.parse(r.clientes_asignados || "[]") } catch { return [] } })()
            return (
              <motion.div key={r.id} layout style={{ background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                <div onClick={() => setExpandida(abierta ? null : r.id)}
                  style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                      <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
                        {dias.map((d, i) => {
                          const ejercicios = d.bloques?.flatMap(b => b.ejercicios || [b]) || []
                          return (
                            <div key={i} style={{ background: COLORS.surface2, borderRadius: 6, padding: "10px 12px" }}>
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
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setAsignando(asignando === r.id ? null : r.id); setBusquedaAsignar("") }}
                            style={{ flex: 1, background: COLORS.accentSub, border: `1px solid ${COLORS.accent}44`, borderRadius: 10, padding: "8px 0", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            <Icon name="users" size={13} color={COLORS.accent} /> Asignar
                          </button>
                          <button onClick={() => exportarPDF(r)}
                            style={{ flex: 1, background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 0", color: COLORS.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                            <Icon name="download" size={13} color={COLORS.textSub} /> PDF
                          </button>
                          <button onClick={() => eliminar(r.id)} disabled={eliminando === r.id}
                            style={{ flex: 1, background: "#3a1a1a", border: "1px solid #ef444433", borderRadius: 10, padding: "8px 0", color: COLORS.red, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                            {eliminando === r.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                        {asignando === r.id && (
                          <div style={{ background: COLORS.surface2, borderRadius: 6, padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Seleccionar clientes</div>
                            {clientes.length >= 10 && (
                              <input
                                value={busquedaAsignar}
                                onChange={e => setBusquedaAsignar(e.target.value)}
                                placeholder="Buscar cliente..."
                                style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", color: COLORS.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 4 }}
                              />
                            )}
                            {clientes.length === 0 && <div style={{ fontSize: 12, color: COLORS.textMuted }}>No tenés clientes</div>}
                            {clientes.filter(c => !busquedaAsignar || c.nombre.toLowerCase().includes(busquedaAsignar.toLowerCase())).map(c => {
                              const sel = asignadosArr.includes(c.id)
                              return (
                                <button key={c.id} onClick={() => toggleAsignar(r.id, c.id, asignadosArr)}
                                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: sel ? COLORS.accent + "22" : "transparent", border: `1px solid ${sel ? COLORS.accent + "44" : COLORS.border}`, borderRadius: 10, cursor: "pointer", width: "100%" }}>
                                  <div style={{ width: 20, height: 20, borderRadius: 6, background: sel ? COLORS.accent : COLORS.surface, border: `1.5px solid ${sel ? COLORS.accent : COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {sel && <Icon name="check" size={12} color="#fff" />}
                                  </div>
                                  <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{c.nombre}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                        {asignando !== r.id && asignadosArr.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {asignadosArr.map(id => {
                              const c = clientes.find(c => c.id === id)
                              return c ? (
                                <div key={id} style={{ background: COLORS.accentSub, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: COLORS.accentLight, fontWeight: 500 }}>{c.nombre}</div>
                              ) : null
                            })}
                          </div>
                        )}
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

function PerfilTrainer({ user, onLogout, onUserUpdated }) {
  const generatedUsername = user?.user_metadata?.username || autoUsername(user?.email, user?.user_metadata?.nombre)
  const [datos, setDatos] = useState({
    nombre: user?.user_metadata?.nombre || "",
    username: generatedUsername,
  })

  useEffect(() => {
    if (!user?.user_metadata?.username && generatedUsername) {
      supabase.auth.updateUser({ data: { username: generatedUsername } })
    }
  }, [])
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.user_metadata?.avatar_url || null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  const inputStyle = { background: COLORS.surface2, border: `1px solid ${COLORS.border2}`, borderRadius: 6, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "'Styrene A', -apple-system, sans-serif", boxSizing: "border-box", marginBottom: 8 }

  const guardar = async () => {
    if (!datos.nombre.trim()) return setError("Ingresá tu nombre")
    setGuardando(true); setError(""); setMensaje("")

    let avatar_url = user?.user_metadata?.avatar_url || null
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop()
      const path = `trainer-${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true })
      if (upErr) {
        setError(upErr.message?.includes("Bucket not found")
          ? "Bucket 'avatars' no existe. Crealo en Supabase Dashboard → Storage → New bucket (público)."
          : `Error al subir foto: ${upErr.message}`)
        setGuardando(false)
        return
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
      avatar_url = urlData.publicUrl + `?v=${Date.now()}`
    }

    const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
      data: { nombre: datos.nombre, username: datos.username.toLowerCase(), avatar_url }
    })

    if (!updateErr) {
      setMensaje("¡Perfil actualizado!")
      if (updateData?.user) onUserUpdated?.(updateData.user)
    } else setError("No se pudo guardar")
    setGuardando(false)
  }

  const ini = (datos.nombre || user?.email || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <>
      <div style={T.h1}>Mi perfil</div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0" }}>
        <label style={{ cursor: "pointer" }}>
          <div style={{ width: 96, height: 96, borderRadius: 30, background: COLORS.surface2, border: `2px dashed ${COLORS.border2}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" onError={() => setAvatarPreview(null)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 32, fontWeight: 700, color: COLORS.accent }}>{ini}</span>
            }
            <div style={{ position: "absolute", bottom: 5, right: 5, width: 24, height: 24, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="plus" size={12} color="#fff" />
            </div>
          </div>
          <input type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)) } }} />
        </label>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Foto de perfil</span>
      </div>

      {error && <div style={{ fontSize: 13, color: COLORS.red, background: COLORS.red + "11", borderRadius: 10, padding: "10px 14px" }}>{error}</div>}
      {mensaje && <div style={{ fontSize: 13, color: COLORS.green, background: COLORS.green + "11", borderRadius: 10, padding: "10px 14px" }}>{mensaje}</div>}

      <div style={{ background: COLORS.surface, borderRadius: 8, padding: "12px 14px", border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Email</div>
        <div style={{ fontSize: 14, color: COLORS.textSub }}>{user.email}</div>
      </div>

      <input placeholder="Tu nombre completo" value={datos.nombre}
        onChange={e => setDatos(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
      <input placeholder="Nombre de usuario" value={datos.username}
        onChange={e => setDatos(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() }))} style={inputStyle} />

      <motion.button whileTap={{ scale: 0.97 }} onClick={guardar} disabled={guardando}
        style={{ background: COLORS.accent, border: "none", borderRadius: 8, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.6 : 1, width: "100%" }}>
        {guardando ? "Guardando..." : "Guardar cambios"}
      </motion.button>

      <button onClick={onLogout}
        style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "12px 0", color: COLORS.textMuted, fontSize: 14, cursor: "pointer", width: "100%" }}>
        Cerrar sesión
      </button>
    </>
  )
}

const PLANES = [
  {
    id: "gratis",
    nombre: "Gratis",
    precio: "$0",
    periodo: "",
    descripcion: "Para empezar",
    color: COLORS.textMuted,
    bg: COLORS.surface,
    border: COLORS.border,
    features: [
      "Hasta 3 clientes",
      "Rutinas básicas",
      "Chat con clientes",
      "PDF de rutinas",
    ],
    cta: "Plan actual",
    ctaDisabled: true,
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "$4.999",
    periodo: "/mes",
    descripcion: "Para crecer",
    color: COLORS.accent,
    bg: COLORS.accent + "12",
    border: COLORS.accent + "55",
    badge: "Popular",
    features: [
      "Hasta 20 clientes",
      "Rutinas ilimitadas",
      "Generación con IA",
      "Grupos de clientes",
      "Agenda y finanzas",
      "Soporte por WhatsApp",
    ],
    cta: "Elegir Pro",
    ctaDisabled: false,
  },
  {
    id: "elite",
    nombre: "Elite",
    precio: "$9.999",
    periodo: "/mes",
    descripcion: "Sin límites",
    color: "#f59e0b",
    bg: "#f59e0b12",
    border: "#f59e0b44",
    features: [
      "Clientes ilimitados",
      "Todo lo de Pro",
      "IA avanzada prioritaria",
      "Marca personalizada",
      "Soporte 24/7 dedicado",
      "Acceso anticipado a novedades",
    ],
    cta: "Elegir Elite",
    ctaDisabled: false,
  },
]

function PlanesModal({ onClose }) {
  return (
    <motion.div key="planes" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: COLORS.bg }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(14px + env(safe-area-inset-top)) 20px 16px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Planes</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Elegí el plan que mejor se adapta a vos</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      {/* Planes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
        {PLANES.map(plan => (
          <div key={plan.id} style={{ background: plan.bg, border: `1.5px solid ${plan.border}`, borderRadius: 18, padding: 20, position: "relative" }}>
            {plan.badge && (
              <div style={{ position: "absolute", top: 16, right: 16, background: plan.color, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                {plan.badge}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: plan.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{plan.nombre}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.text, letterSpacing: -1 }}>{plan.precio}</span>
                <span style={{ fontSize: 14, color: COLORS.textMuted }}>{plan.periodo}</span>
              </div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{plan.descripcion}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: 13, color: COLORS.textSub }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              disabled={plan.ctaDisabled}
              onClick={() => !plan.ctaDisabled && window.open(`https://wa.me/541122987419?text=Hola, quiero contratar el plan ${plan.nombre} de TuPersonal`, "_blank")}
              style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: plan.ctaDisabled ? COLORS.surface2 : plan.color, color: plan.ctaDisabled ? COLORS.textMuted : plan.id === "gratis" ? "#fff" : "#fff", fontSize: 14, fontWeight: 600, cursor: plan.ctaDisabled ? "default" : "pointer", opacity: plan.ctaDisabled ? 0.7 : 1 }}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const FAQ_SYSTEM = `INSTRUCCIONES CRÍTICAS:
- Respondé SOLO usando la información de abajo. Nunca uses conocimiento previo sobre ninguna app llamada "TuPersonal".
- TuPersonal NO es una app de tareas, calendario ni vida personal. Es una app EXCLUSIVAMENTE para entrenadores personales y sus clientes.
- Respuestas de 1 a 3 oraciones. Sin asteriscos, sin #, sin markdown. Solo texto plano.
- Español argentino informal.

TuPersonal ES: una app para que entrenadores personales gestionen sus clientes, rutinas, pagos y chat. Nada más.

FUNCIONES DE LA APP:

CLIENTES
- Agregar cliente: ir a Clientes → "+ Agregar cliente" → buscar por usuario o agregar manual
- Vincular cliente existente: el cliente descarga la app, crea cuenta, y vos lo buscás por su @usuario
- Compartir link de invitación: botón "Compartir link" en la pantalla de Clientes
- Ver perfil del cliente: tocás el nombre en la lista
- Eliminar cliente: desde el perfil del cliente hay un botón eliminar

RUTINAS
- Crear rutina: Rutinas → "Crear nueva" → ponés nombre, días y ejercicios
- Agregar ejercicio: dentro de un día, botón "+" o elegir desde Biblioteca
- Tipos de bloques: normal, biserie (2 ejercicios), superserie (3+), circuito
- Asignar rutina a cliente: desde Mis Rutinas, abrís la rutina → botón "Asignar"
- Descargar PDF: desde Mis Rutinas o desde el perfil del cliente, botón PDF
- Generar rutina con IA: en Crear nueva hay un botón de IA que genera la rutina automáticamente

CHAT
- El chat está en la sección Chat del menú
- Podés mandar mensajes a cada cliente individualmente
- Los clientes también pueden escribirte desde su app

FINANZAS
- Se ve en la sección Finanzas
- Muestra facturación total, clientes al día y con deuda
- Podés marcar cuántos meses debe cada cliente desde su perfil

PERFIL DEL ENTRENADOR
- Ir a Perfil → podés cambiar nombre, foto y usuario
- La foto de perfil aparece en la barra de navegación

GRUPOS
- Crear grupo: Clientes → tab Grupos → crear grupo → se genera un código de 6 letras
- El cliente ingresa el código en su Perfil → sección Grupo → campo "Código del grupo"

CLIENTE (cómo se conecta)
- El cliente entra a la misma URL de la app desde su celular
- Crea una cuenta con email y contraseña
- Vos lo agregás buscando su @usuario, o él usa el link de invitación que compartiste
- En su app ve sus rutinas, puede chatear con vos, ver su progreso y pagar

PWA (agregar como app)
- En iPhone: Safari → compartir → "Agregar a pantalla de inicio"
- En Android: Chrome → menú → "Agregar a pantalla de inicio"
- Una vez instalada funciona como app nativa sin barra del navegador

Si no sabés algo, decilo en una oración. Nunca inventes funciones que no existen.`

function ChatbotFAQ({ onClose, nombreTrainer }) {
  const [mensajes, setMensajes] = useState([
    { role: "assistant", text: `¡Hola${nombreTrainer ? ", " + nombreTrainer.split(" ")[0] : ""}! 👋 Soy tu asistente de TuPersonal. ¿En qué te puedo ayudar?` }
  ])
  const [input, setInput] = useState("")
  const [cargando, setCargando] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [mensajes])

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || cargando) return
    const nuevos = [...mensajes, { role: "user", text: texto }]
    setMensajes(nuevos)
    setInput("")
    setCargando(true)
    try {
      const apiMessages = nuevos.map(m => ({ role: m.role, content: m.text }))
      const respuesta = await askClaude({ messages: apiMessages, max_tokens: 200, system: FAQ_SYSTEM })
      setMensajes(prev => [...prev, { role: "assistant", text: respuesta || "No pude procesar eso." }])
    } catch {
      setMensajes(prev => [...prev, { role: "assistant", text: "Hubo un error. Intentá de nuevo." }])
    }
    setCargando(false)
  }

  return (
    <motion.div key="chatbot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: COLORS.bg }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(14px + env(safe-area-inset-top)) 16px 14px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>Asistente FAQ</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>Preguntame sobre TuPersonal</div>
        </div>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10, scrollbarWidth: "none" }}>
        {mensajes.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px", background: m.role === "user" ? COLORS.accent : COLORS.surface, fontSize: 14, color: m.role === "user" ? "#fff" : COLORS.text, lineHeight: 1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
        {cargando && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: COLORS.surface }}>
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ fontSize: 18, color: COLORS.textMuted, letterSpacing: 4 }}>···</motion.div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {/* Input */}
      <div style={{ padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8, background: COLORS.surface, flexShrink: 0 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
          placeholder="Escribí tu pregunta..."
          style={{ flex: 1, background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "10px 14px", color: COLORS.text, fontSize: 14, outline: "none" }} />
        <button onClick={enviar} disabled={!input.trim() || cargando}
          style={{ width: 42, height: 42, borderRadius: 12, background: input.trim() && !cargando ? COLORS.accent : COLORS.surface2, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || cargando ? 0.4 : 1 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </motion.div>
  )
}

export default function App({ user: initialUser, onLogout }) {
  const [activePage, setActivePage] = useState("inicio")
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [previewCliente, setPreviewCliente] = useState(null)
  const [user, setUser] = useState(initialUser)
  const [chatNoLeidos, setChatNoLeidos] = useState(0)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [chatbotAbierto, setChatbotAbierto] = useState(false)
  const [planesAbierto, setPlanesAbierto] = useState(false)
  const isMobile = useIsMobile()
  const isPWA = useIsPWA()

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

  useEffect(() => {
    if (!user?.id) return
    const fetchUnread = () => {
      supabase.from("mensajes").select("id", { count: "exact", head: true })
        .eq("trainer_id", user.id).eq("sender", "cliente").eq("leido", false)
        .then(({ count }) => setChatNoLeidos(count || 0))
    }
    fetchUnread()
    const channel = supabase.channel("unread-badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes", filter: `trainer_id=eq.${user.id}` }, fetchUnread)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mensajes", filter: `trainer_id=eq.${user.id}` }, fetchUnread)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const screenStyle = { flex: 1, overflowY: "scroll", overflowX: "hidden", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }

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
        <Chat user={user} clientes={clientes} modo="trainer" onProfileClick={(c) => setClienteSeleccionado(c)} />
      </motion.div>
    )

    const pages = {
      inicio: <Inicio clientes={clientes} nombreTrainer={nombreTrainer} onVerPerfil={setClienteSeleccionado} onNuevoCliente={() => setActivePage("clientes")} />,
      clientes: <Clientes
        clientes={clientes}
        user={user}
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
      perfil: <PerfilTrainer user={user} onLogout={onLogout} onUserUpdated={setUser} />,
    }
    return (
      <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={screenStyle}>
        {pages[activePage]}
      </motion.div>
    )
  }

  const fontFamily = "'Styrene A', -apple-system, BlinkMacSystemFont, sans-serif"

  return (
    <div style={{ background: COLORS.bg, height: "var(--app-height, 100dvh)", display: "flex", fontFamily }}>
      {/* Sidebar — solo desktop */}
      {!isMobile && (
        <div style={{ width: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "var(--app-height, 100dvh)", position: "sticky", top: 0, flexShrink: 0 }}>
          <div style={{ padding: "20px 16px 16px" }}>
            <div style={{ marginBottom: 14, padding: "0 4px" }}>
              <img src="/logo-white.png" alt="TuPersonal" onClick={() => { setActivePage("inicio"); setClienteSeleccionado(null) }} style={{ height: 90, width: "auto", display: "block", cursor: "pointer" }} />
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
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: activo ? `${COLORS.accent}22` : "none", border: "none", borderRadius: 10, color: activo ? "#fff" : COLORS.textSub, fontSize: 14, fontWeight: activo ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily, position: "relative" }}>
                  <Icon name={item.icon} size={18} color={activo ? COLORS.accentLight : COLORS.textMuted} />
                  {item.label}
                  {item.id === "chat" && chatNoLeidos > 0 && (
                    <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9, background: COLORS.accent, fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                      {chatNoLeidos > 99 ? "99+" : chatNoLeidos}
                    </span>
                  )}
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "var(--app-height, 100dvh)", overflow: "hidden", overscrollBehavior: "none" }}>
        {/* Header mobile */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "calc(10px + env(safe-area-inset-top))", paddingLeft: 16, paddingRight: 16, paddingBottom: 8, flexShrink: 0 }}>
            <button onClick={() => setDrawerAbierto(true)}
              style={{ width: 36, height: 36, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: 4, flexShrink: 0 }}>
              <span style={{ display: "block", width: 22, height: 2, borderRadius: 2, background: COLORS.text }} />
              <span style={{ display: "block", width: 22, height: 2, borderRadius: 2, background: COLORS.text }} />
              <span style={{ display: "block", width: 22, height: 2, borderRadius: 2, background: COLORS.text }} />
            </button>
            <img src="/logo-white.png" alt="TuPersonal" onClick={() => { setActivePage("inicio"); setClienteSeleccionado(null) }} style={{ height: 28, width: "auto", cursor: "pointer", position: "absolute", left: "50%", transform: "translateX(-50%)" }} />
            <div style={{ width: 36 }} />
          </div>
        )}

        {/* Drawer mobile */}
        <AnimatePresence>
          {drawerAbierto && (
            <>
              <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => setDrawerAbierto(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, backdropFilter: "blur(2px)" }} />
              <motion.div key="drawer" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
                style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, background: COLORS.surface, zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.4)" }}>
                {/* Perfil */}
                <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 18, background: user?.user_metadata?.avatar_url ? "none" : COLORS.accent, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {user?.user_metadata?.avatar_url
                        ? <img src={user.user_metadata.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : (nombreTrainer || "E").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, lineHeight: 1.2 }}>{nombreTrainer || "Entrenador"}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>Entrenador personal</div>
                    </div>
                  </div>
                </div>
                {/* Nav items */}
                <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px", scrollbarWidth: "none" }}>
                  {navItems.map(item => {
                    const activo = activePage === item.id && !clienteSeleccionado
                    return (
                      <button key={item.id} onClick={() => { setActivePage(item.id); setClienteSeleccionado(null); setDrawerAbierto(false) }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: activo ? COLORS.accent + "22" : "transparent", border: "none", borderRadius: 12, cursor: "pointer", marginBottom: 2 }}>
                        <Icon name={item.icon} size={20} color={activo ? COLORS.accentLight : COLORS.textMuted} />
                        <span style={{ fontSize: 14, fontWeight: activo ? 600 : 400, color: activo ? COLORS.text : COLORS.textSub }}>{item.label}</span>
                        {item.id === "chat" && chatNoLeidos > 0 && (
                          <span style={{ marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 10, background: COLORS.accent, fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                            {chatNoLeidos > 9 ? "9+" : chatNoLeidos}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  {/* Separador */}
                  <div style={{ height: 1, background: COLORS.border, margin: "8px 4px" }} />
                  {/* WhatsApp */}
                  <a href="https://wa.me/541122987419" target="_blank" rel="noopener noreferrer"
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, cursor: "pointer", textDecoration: "none", marginBottom: 2 }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span style={{ fontSize: 14, color: COLORS.textSub }}>WhatsApp</span>
                  </a>
                  {/* Instagram */}
                  <a href="https://instagram.com/tupersonal.ar" target="_blank" rel="noopener noreferrer"
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, cursor: "pointer", textDecoration: "none" }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig)"/><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.8" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/><rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="1.8" fill="none"/></svg>
                    <span style={{ fontSize: 14, color: COLORS.textSub }}>@tupersonal.ar</span>
                  </a>
                  {/* Mejorar plan */}
                  <button onClick={() => { setDrawerAbierto(false); setPlanesAbierto(true) }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, cursor: "pointer", background: "linear-gradient(135deg, #f59e0b22, #f59e0b11)", border: `1px solid #f59e0b44`, marginBottom: 2 }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>Mejorar plan</span>
                  </button>
                  {/* Chatbot FAQ */}
                  <div style={{ height: 1, background: COLORS.border, margin: "8px 4px" }} />
                  <button onClick={() => { setDrawerAbierto(false); setChatbotAbierto(true) }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, cursor: "pointer", background: COLORS.accent + "18", border: "none" }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
                    <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.accent }}>Asistente FAQ</span>
                  </button>
                </div>
                {/* Logout */}
                <div style={{ padding: "14px 20px", borderTop: `1px solid ${COLORS.border}`, paddingBottom: "calc(14px + env(safe-area-inset-bottom))" }}>
                  <button onClick={onLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: "10px 14px", borderRadius: 10, color: COLORS.textMuted }}>
                    <Icon name="logout" size={18} color={COLORS.textMuted} />
                    <span style={{ fontSize: 14, fontWeight: 400 }}>Cerrar sesión</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", overscrollBehavior: "none" }}>
          <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
        </div>

        {/* Nav inferior — solo mobile */}
        {isMobile && !clienteSeleccionado && (
          <nav id="bottom-nav" style={{ background: COLORS.bg, borderTop: `1px solid ${COLORS.border}`, display: "flex", paddingTop: 6, paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: 0, paddingRight: 0, flexShrink: 0 }}>
            {navItems.filter(item => bottomNavItems.includes(item.id)).map(item => {
              const activo = activePage === item.id
              const esPerfil = item.id === "perfil"
              const avatarUrl = user?.user_metadata?.avatar_url
              return (
                <button key={item.id} onClick={() => setActivePage(item.id)}
                  style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "0", position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    {esPerfil && avatarUrl
                      ? <div style={{ width: 24, height: 24, borderRadius: 8, overflow: "hidden", border: `2px solid ${activo ? COLORS.accent : "transparent"}` }}>
                          <img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      : <Icon name={item.icon} size={22} color={activo ? COLORS.accent : COLORS.textMuted} />
                    }
                  </div>
                  <span className="nav-label" style={{ fontSize: 10, fontWeight: 500, color: activo ? COLORS.accent : COLORS.textMuted }}>{item.label}</span>
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {/* Chatbot FAQ */}
      <AnimatePresence>
        {chatbotAbierto && <ChatbotFAQ onClose={() => setChatbotAbierto(false)} nombreTrainer={nombreTrainer} />}
      </AnimatePresence>

      {/* Planes */}
      <AnimatePresence>
        {planesAbierto && <PlanesModal onClose={() => setPlanesAbierto(false)} />}
      </AnimatePresence>

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