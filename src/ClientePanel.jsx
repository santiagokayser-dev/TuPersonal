import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"
import { askClaude } from "./ai"
import Chat from "./Chat"

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

const inputStyle = { background: COLORS.surface2, border: `1px solid ${COLORS.border2}`, borderRadius: 6, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "'Styrene A', -apple-system, BlinkMacSystemFont, sans-serif", boxSizing: "border-box", marginBottom: 8 }

function autoUsername(email, nombre) {
  const emailPart = (email || "").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
  if (emailPart.length >= 3) return emailPart.slice(0, 20)
  const nombrePart = (nombre || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-zA-Z0-9_]/g, "")
  if (nombrePart.length >= 3) return nombrePart.slice(0, 20)
  return "user" + Math.floor(Math.random() * 9000 + 1000)
}

const Icon = ({ name, size = 20, color = COLORS.textSub }) => {
  const icons = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    dumbbell: <><path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h2v5H3zM19 9.5h2v5h-2zM5 7.5h2v9H5zM17 7.5h2v9h-2z"/></>,
    trendingUp: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
    wallet: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 100-2 1 1 0 000 2z"/></>,
    chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    chevronRight: <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
    check: <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">{icons[name]}</svg>
}

const navItems = [
  { id: "inicio", icon: "home", label: "Inicio" },
  { id: "rutina", icon: "dumbbell", label: "Rutina" },
  { id: "agenda", icon: "calendar", label: "Agenda" },
  { id: "progreso", icon: "trendingUp", label: "Progreso" },
  { id: "chat", icon: "chat", label: "Chat" },
  { id: "pagos", icon: "wallet", label: "Pagos" },
  { id: "perfil", icon: "user", label: "Perfil" },
]
// El bottom nav de mobile mantiene los 6 items originales — Agenda es
// nueva y queda accesible desde el sidebar de escritorio y desde la
// tarjeta "Próxima sesión" en Inicio, para no apretar la barra mobile.
const bottomNavItems = ["inicio", "rutina", "progreso", "chat", "pagos", "perfil"]

function AvatarImg({ src, ini, size = 52, radius = 8, fontSize = 17, accentColor = "#2563EB" }) {
  const [broken, setBroken] = useState(false)
  if (src && !broken) {
    return <img src={src} alt="avatar" onError={() => setBroken(true)}
      style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", display: "block" }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: accentColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize, fontWeight: 700, color: accentColor, flexShrink: 0 }}>
      {ini}
    </div>
  )
}

function AvatarPicker({ preview, onChange }) {
  const ini = "?"
  return (
    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <div style={{ width: 88, height: 88, borderRadius: 28, background: COLORS.surface2, border: `2px dashed ${COLORS.border2}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
        {preview
          ? <img src={preview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
        }
        <div style={{ position: "absolute", bottom: 4, right: 4, width: 22, height: 22, borderRadius: 7, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </div>
      </div>
      <span style={{ fontSize: 12, color: COLORS.textMuted }}>Foto de perfil (opcional)</span>
      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f) }} />
    </label>
  )
}

function Onboarding({ user, perfilExistente, onComplete, onLogout }) {
  const [datos, setDatos] = useState({
    nombre: "",
    username: user.user_metadata?.username || "",
    peso: "", altura: "", edad: "", objetivo: ""
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const handleAvatarChange = (file) => {
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const guardar = async () => {
    if (!datos.nombre.trim()) return setError("Ingresá tu nombre")
    if (!datos.username.trim()) return setError("Elegí un nombre de usuario")
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(datos.username)) return setError("El usuario solo puede tener letras, números y _ (3–20 caracteres)")
    setGuardando(true)
    setError("")

    let avatar_url = null
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop()
      const path = `${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true })
      if (upErr) {
        setError(upErr.message?.includes("Bucket not found")
          ? "Bucket 'avatars' no existe. Crealo en Supabase Dashboard → Storage (público)."
          : `Error al subir foto: ${upErr.message}`)
        setGuardando(false)
        return
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
      avatar_url = urlData.publicUrl + `?v=${Date.now()}`
    }

    const campos = {
      nombre: datos.nombre,
      username: datos.username.toLowerCase(),
      peso: Number(datos.peso) || null,
      altura: Number(datos.altura) || null,
      edad: Number(datos.edad) || null,
      objetivo: datos.objetivo,
      user_id: user.id,
      ...(avatar_url ? { avatar_url } : {}),
    }

    let result = null

    // Attempt 1: update by user_id (already linked)
    const { data: byUserId } = await supabase.from("clientes")
      .update(campos).eq("user_id", user.id).select().single()
    result = byUserId

    // Attempt 2: update by known id from parent cargar()
    if (!result && perfilExistente?.id) {
      const { data: byId } = await supabase.from("clientes")
        .update(campos).eq("id", perfilExistente.id).select().single()
      result = byId
    }

    // Attempt 3: email lookup then update/insert
    if (!result) {
      const { data: existente } = await supabase.from("clientes")
        .select("id").eq("email", user.email).maybeSingle()
      if (existente) {
        const { data } = await supabase.from("clientes").update(campos).eq("id", existente.id).select().single()
        result = data
      } else {
        const trainerId = user.user_metadata?.trainer_id
        const { data } = await supabase.from("clientes").insert({ ...campos, email: user.email, trainer_id: trainerId }).select().single()
        result = data
      }
    }

    // Fallback: save to auth user metadata (always permitted, no RLS)
    if (!result) {
      const metaPerfil = { ...campos, email: user.email, _from_metadata: true }
      const { error: metaErr } = await supabase.auth.updateUser({ data: { perfil_cliente: metaPerfil } })
      if (!metaErr) {
        result = { ...metaPerfil, id: null }
      }
    }

    if (result) onComplete(result)
    else setError("No se pudo guardar. Intentá de nuevo.")
    setGuardando(false)
  }

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {onLogout && (
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, cursor: "pointer", padding: 0, alignSelf: "flex-start" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver
        </button>
      )}
      <div>
        <div style={{ ...T.label, marginBottom: 6 }}>Bienvenido</div>
        <div style={T.h1}>Tu perfil</div>
        <div style={{ ...T.body, marginTop: 8 }}>Completá tus datos para empezar. Tu entrenador los podrá ver.</div>
      </div>

      <AvatarPicker preview={avatarPreview} onChange={handleAvatarChange} />

      {error && <div style={{ fontSize: 13, color: COLORS.red, background: COLORS.red + "11", borderRadius: 10, padding: "10px 14px" }}>{error}</div>}

      <input placeholder="Tu nombre completo *" value={datos.nombre} onChange={e => setDatos(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
      <input placeholder="Nombre de usuario (ej: dantemie) *" value={datos.username}
        onChange={e => setDatos(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() }))} style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input placeholder="Peso (kg)" value={datos.peso} onChange={e => setDatos(p => ({ ...p, peso: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} type="number" />
        <input placeholder="Altura (cm)" value={datos.altura} onChange={e => setDatos(p => ({ ...p, altura: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} type="number" />
      </div>
      <input placeholder="Edad" value={datos.edad} onChange={e => setDatos(p => ({ ...p, edad: e.target.value }))} style={inputStyle} type="number" />
      <input placeholder="Objetivo (ej: bajar 5kg, ganar masa)" value={datos.objetivo} onChange={e => setDatos(p => ({ ...p, objetivo: e.target.value }))} style={inputStyle} />

      <motion.button whileTap={{ scale: 0.97 }} onClick={guardar} disabled={guardando}
        style={{ background: COLORS.accent, border: "none", borderRadius: 8, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.6 : 1 }}>
        {guardando ? "Guardando..." : "Empezar →"}
      </motion.button>
    </div>
  )
}

function ProgressChart({ data, width = 280, height = 120 }) {
  if (!data || data.length < 2) return null
  const pts = data.slice(-10)
  const vals = pts.map(p => p.peso)
  const max = Math.max(...vals), min = Math.min(...vals)
  const range = max - min || 1
  const padY = 16, padX = 8
  const chartW = width - padX * 2, chartH = height - padY * 2
  const points = pts.map((p, i) => ({
    x: padX + (i / (pts.length - 1)) * chartW,
    y: padY + chartH - ((p.peso - min) / range) * chartH,
  }))
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height + 20}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f, i) => {
        const y = padY + chartH - f * chartH
        const val = (min + f * range).toFixed(1)
        return <g key={i}>
          <line x1={padX} y1={y} x2={width - padX} y2={y} stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={width - padX + 2} y={y + 3} fontSize="8" fill={COLORS.textMuted} textAnchor="start">{val}</text>
        </g>
      })}
      <path d={areaPath} fill="url(#chartGrad)" />
      <path d={linePath} fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5}
          fill={i === points.length - 1 ? COLORS.accent : COLORS.surface} stroke={COLORS.accent} strokeWidth="1.5" />
      ))}
      {pts.map((p, i) => (
        <text key={i} x={points[i].x} y={height + 14} fontSize="8" fill={COLORS.textMuted} textAnchor="middle">
          {p.fecha?.slice(5) || ""}
        </text>
      ))}
    </svg>
  )
}

function DashboardCard({ label, value, unit, sub, icon, accent }) {
  return (
    <div style={{ background: COLORS.surface, borderRadius: 8, padding: "18px 16px", border: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 6, position: "relative", overflow: "hidden" }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentLight})` }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={T.label}>{label}</div>
        {icon && <Icon name={icon} size={16} color={COLORS.textMuted} />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: -1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.textMuted }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: COLORS.textMuted }}>{sub}</div>}
    </div>
  )
}

function getMotivationalMessage(objetivo) {
  const obj = (objetivo || "").toLowerCase()
  if (obj.includes("masa") || obj.includes("musculo") || obj.includes("ganar") || obj.includes("volumen"))
    return { text: "Cada repetición te acerca a tu mejor versión. La constancia es tu mejor aliada.", icon: "💪" }
  if (obj.includes("bajar") || obj.includes("perder") || obj.includes("definir") || obj.includes("secar"))
    return { text: "El progreso no siempre es lineal, pero cada día que entrenás suma. Seguí así.", icon: "🔥" }
  if (obj.includes("fuerza") || obj.includes("power") || obj.includes("fuerte"))
    return { text: "La fuerza se construye con paciencia. Hoy levantás más que ayer.", icon: "🏋️" }
  if (obj.includes("salud") || obj.includes("movilidad") || obj.includes("bienestar"))
    return { text: "Invertir en tu salud es la mejor decisión. Tu cuerpo te lo agradece.", icon: "🌱" }
  return { text: "Cada entrenamiento cuenta. Seguí empujando tus límites.", icon: "⚡" }
}

function Inicio({ perfil, onLogout, onActualizar, onNavigate }) {
  const nombre = perfil?.nombre || "Atleta"
  const ini = nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  const pesoHistorial = perfil?.peso_historial || []
  const motivacion = getMotivationalMessage(perfil?.objetivo)

  const [avatarError, setAvatarError] = useState("")
  const [proximaSesion, setProximaSesion] = useState(null)

  useEffect(() => {
    if (!perfil?.id) return
    const hoy = new Date().toISOString().split("T")[0]
    supabase.from("sesiones").select("*").eq("cliente_id", perfil.id).gte("fecha", hoy).order("fecha").order("hora").limit(1).maybeSingle()
      .then(({ data }) => setProximaSesion(data || null))
  }, [perfil?.id])

  const handleAvatarChange = async (file) => {
    setAvatarError("")
    const ext = file.name.split(".").pop()
    const path = `${perfil.user_id || perfil.id}.${ext}`
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
    if (error) {
      setAvatarError(error.message?.includes("Bucket not found")
        ? "Bucket 'avatars' no existe en Supabase Storage. Crealo desde el dashboard."
        : `Error al subir foto: ${error.message}`)
      return
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
    const avatar_url = urlData.publicUrl + `?v=${Date.now()}`
    const { error: dbErr } = await supabase.from("clientes").update({ avatar_url }).eq("id", perfil.id)
    if (dbErr) { setAvatarError(`Foto subida pero no guardada en perfil: ${dbErr.message}`); return }
    onActualizar({ ...perfil, avatar_url })
  }

  const pesoDiff = pesoHistorial.length >= 2
    ? (pesoHistorial[pesoHistorial.length - 1].peso - pesoHistorial[pesoHistorial.length - 2].peso).toFixed(1)
    : null

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <label style={{ cursor: "pointer", position: "relative", flexShrink: 0 }}>
            <AvatarImg src={perfil?.avatar_url} ini={ini} size={52} radius={8} fontSize={17} accentColor={COLORS.accent} />
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarChange(f) }} />
          </label>
          {avatarError && <div style={{ fontSize: 11, color: COLORS.red, background: COLORS.red + "11", borderRadius: 8, padding: "6px 10px", marginTop: 4, maxWidth: 220 }}>{avatarError}</div>}
          <div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>Bienvenido</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>{nombre.split(" ")[0]}</div>
          </div>
        </div>
      </div>

      {/* Próxima sesión */}
      {proximaSesion && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={() => onNavigate?.("agenda")}
          style={{ background: COLORS.surface, borderRadius: 14, padding: "12px 16px", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12, cursor: onNavigate ? "pointer" : "default" }}>
          <Icon name="calendar" size={18} color={COLORS.accent} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Próxima sesión</div>
            <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>
              {new Date(proximaSesion.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" })} · {proximaSesion.hora} — {proximaSesion.tipo}
            </div>
          </div>
          <Icon name="chevronRight" size={16} color={COLORS.textMuted} />
        </motion.div>
      )}

      {/* Motivational banner */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: `linear-gradient(135deg, ${COLORS.accentSub}, ${COLORS.surface})`, borderRadius: 18, padding: "18px 20px", border: `1px solid ${COLORS.accent}33`, display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{motivacion.icon}</div>
        <div>
          {perfil?.objetivo && <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Tu objetivo: {perfil.objetivo}</div>}
          <div style={{ fontSize: 14, color: COLORS.textSub, lineHeight: 1.5, fontStyle: "italic" }}>{motivacion.text}</div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <DashboardCard
          label="Peso actual" value={perfil?.peso || "—"} unit={perfil?.peso ? "kg" : ""}
          sub={pesoDiff ? `${Number(pesoDiff) > 0 ? "+" : ""}${pesoDiff}kg vs anterior` : "Registrá en Progreso"}
          accent
        />
        <DashboardCard label="Altura" value={perfil?.altura || "—"} unit={perfil?.altura ? "cm" : ""} icon="trendingUp" />
        <DashboardCard label="Edad" value={perfil?.edad || "—"} unit={perfil?.edad ? "años" : ""} icon="user" />
        <DashboardCard
          label="Objetivo" value={perfil?.objetivo ? "Activo" : "—"}
          sub={perfil?.objetivo || "Sin definir"} icon="check"
        />
      </div>

      {/* Weight progress chart */}
      {pesoHistorial.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: COLORS.surface, borderRadius: 18, padding: 18, border: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={T.label}>Evolución de peso</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Últimas {Math.min(pesoHistorial.length, 10)} mediciones</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.accent }} />
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>kg</span>
            </div>
          </div>
          <ProgressChart data={pesoHistorial} />
        </motion.div>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Mi rutina", desc: "Ver ejercicios", icon: "dumbbell", page: "rutina" },
          { label: "Mi progreso", desc: "Actualizar datos", icon: "trendingUp", page: "progreso" },
        ].map((a) => (
          <motion.button key={a.page} whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate?.(a.page)}
            style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "14px 16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 6, background: COLORS.accent + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={a.icon} size={18} color={COLORS.accent} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{a.label}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{a.desc}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </>
  )
}

function Rutina({ perfil }) {
  const [rutinas, setRutinas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [diaAbierto, setDiaAbierto] = useState(0)
  const [ejercicioActivo, setEjercicioActivo] = useState(null)
  const diaRefs = useRef([])

  useEffect(() => {
    if (!perfil?.id) { setCargando(false); return }
    const trainerId = perfil.trainer_id
    if (!trainerId) { setCargando(false); return }
    supabase.from("rutinas").select("*")
      .eq("trainer_id", trainerId)
      .then(({ data, error }) => {
        if (error) console.error("Error cargando rutinas cliente:", error)
        const filtradas = (data || []).filter(r => {
          const asignados = Array.isArray(r.clientes_asignados)
            ? r.clientes_asignados
            : (() => { try { return JSON.parse(r.clientes_asignados || "[]") } catch { return [] } })()
          return asignados.includes(perfil.id)
        })
        setRutinas(filtradas)
        setCargando(false)
      })
  }, [perfil?.id])

  if (cargando) return <div style={{ padding: 20, color: COLORS.textMuted, fontSize: 14 }}>Cargando...</div>
  if (rutinas.length === 0) return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={T.h1}>Mi rutina</div>
      <div style={{ background: COLORS.surface, borderRadius: 8, padding: 24, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
        Tu entrenador todavía no te asignó una rutina.
      </div>
    </div>
  )

  const rutina = rutinas[0]
  const dias = (() => { try { return JSON.parse(rutina.dias || "[]") } catch { return [] } })()

  const descargarPDF = () => {
    const ejerciciosHTML = dias.map((dia, i) => {
      const ejercicios = dia.bloques?.flatMap(b => b.ejercicios || []) || dia.ejercicios || []
      return `<div style="margin-bottom:20px;">
        <h2 style="color:#E8714A;font-size:16px;margin:0 0 10px;border-bottom:1px solid #444;padding-bottom:6px;">
          ${String.fromCharCode(65 + i)} — ${dia.nombre || "Día " + (i + 1)}
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#2F2F2F;color:#A0A0A0;text-align:left;">
            <th style="padding:6px 8px;">#</th>
            <th style="padding:6px 8px;">Ejercicio</th>
            <th style="padding:6px 8px;">Series</th>
            <th style="padding:6px 8px;">Reps</th>
            <th style="padding:6px 8px;">RIR</th>
            <th style="padding:6px 8px;">Descanso</th>
            <th style="padding:6px 8px;">Notas</th>
          </tr>
          ${ejercicios.map((ej, j) => `<tr style="border-bottom:1px solid #333;">
            <td style="padding:6px 8px;color:#6B6B6B;">${j + 1}</td>
            <td style="padding:6px 8px;color:#F5F5F5;font-weight:500;">${ej.nombre || ""}</td>
            <td style="padding:6px 8px;color:#A0A0A0;">${ej.series || "-"}</td>
            <td style="padding:6px 8px;color:#A0A0A0;">${ej.reps || "-"}</td>
            <td style="padding:6px 8px;color:#A0A0A0;">${ej.rir !== undefined && ej.rir !== "" ? ej.rir : "-"}</td>
            <td style="padding:6px 8px;color:#A0A0A0;">${ej.descanso ? ej.descanso + "s" : "-"}</td>
            <td style="padding:6px 8px;color:#6B6B6B;font-style:italic;">${ej.notas || ""}</td>
          </tr>`).join("")}
        </table>
      </div>`
    }).join("")

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${rutina.nombre}</title>
      <style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>
    </head><body style="background:#1A1A1A;color:#F5F5F5;font-family:-apple-system,sans-serif;padding:30px;margin:0;">
      <h1 style="font-size:22px;margin:0 0 4px;">${rutina.nombre}</h1>
      <p style="color:#A0A0A0;font-size:13px;margin:0 0 24px;">${dias.length} días de entrenamiento</p>
      ${ejerciciosHTML}
      <p style="color:#6B6B6B;font-size:11px;margin-top:30px;text-align:center;">Generado desde TuPersonal</p>
    </body></html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, "_blank")
    if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(url) }, 600)
    else { URL.revokeObjectURL(url); alert("Permití las ventanas emergentes para descargar el PDF") }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ ...T.label, marginBottom: 6 }}>Programa actual</div>
          <div style={T.h1}>Mi rutina</div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={descargarPDF}
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, color: COLORS.textSub, fontSize: 13, fontWeight: 500 }}>
          <Icon name="download" size={15} color={COLORS.textSub} />
          PDF
        </motion.button>
      </div>

      <div style={{ background: COLORS.accentSub, borderRadius: 18, padding: 16, border: `1px solid ${COLORS.accent}33` }}>
        <div style={{ ...T.label, color: COLORS.accentLight, marginBottom: 6 }}>Rutina asignada</div>
        <div style={T.h3}>{rutina.nombre}</div>
        <div style={{ ...T.body, color: COLORS.accentLight, marginTop: 4, fontSize: 13 }}>{dias.length} días de entrenamiento</div>
      </div>

      {dias.map((dia, i) => {
        const abierto = diaAbierto === i
        const ejercicios = dia.bloques?.flatMap(b => b.ejercicios || []) || dia.ejercicios || []
        return (
          <div key={i} ref={el => diaRefs.current[i] = el} style={{ background: COLORS.surface, borderRadius: 18, border: `1px solid ${abierto ? COLORS.accent + "66" : COLORS.border}` }}>
            <div onClick={() => {
              const abriendo = diaAbierto !== i
              setDiaAbierto(abriendo ? i : -1)
              if (abriendo) setTimeout(() => diaRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" }), 150)
            }}
              style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: abierto ? COLORS.accent : COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: abierto ? "#fff" : COLORS.textSub, flexShrink: 0 }}>
                {String.fromCharCode(65 + i)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={T.h3}>{dia.nombre || `Día ${i + 1}`}</div>
                <div style={{ ...T.body, fontSize: 12, marginTop: 2 }}>{ejercicios.length} ejercicios</div>
              </div>
              <div style={{ transform: `rotate(${abierto ? 90 : 0}deg)`, transition: "transform 0.2s" }}>
                <Icon name="chevronRight" size={16} color={COLORS.textMuted} />
              </div>
            </div>

            <div style={{ maxHeight: abierto ? "2000px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
              <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
                {ejercicios.map((ej, j) => {
                  const activo = ejercicioActivo === `${i}-${j}`
                  const ytUrl = ej.video || `https://www.youtube.com/results?search_query=${encodeURIComponent((ej.nombre || "") + " técnica correcta")}`
                  return (
                    <div key={j}>
                      <div onClick={() => setEjercicioActivo(activo ? null : `${i}-${j}`)}
                        style={{ padding: "13px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: COLORS.accent, flexShrink: 0 }}>{j + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>{ej.nombre || "Ejercicio"}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            {[ej.series && `${ej.series} series`, ej.reps && `${ej.reps} reps`, ej.rir !== undefined && ej.rir !== "" && `RIR ${ej.rir}`, ej.descanso && `${ej.descanso}s`].filter(Boolean).map((tag, k) => (
                              <span key={k} style={{ fontSize: 11, color: COLORS.textMuted, background: COLORS.surface2, borderRadius: 6, padding: "2px 7px" }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                        <Icon name="chevronRight" size={14} color={COLORS.textMuted} />
                      </div>
                      <div style={{ maxHeight: activo ? "400px" : "0", overflow: "hidden", transition: "max-height 0.25s ease", background: COLORS.bg }}>
                        <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8, borderBottom: `1px solid ${COLORS.border}` }}>
                          {ej.notas && <div style={{ fontSize: 13, color: COLORS.textSub, fontStyle: "italic" }}>"{ej.notas}"</div>}
                          <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: 10, background: "#3a1a1a", borderRadius: 6, padding: "11px 14px", textDecoration: "none" }}>
                            <div style={{ width: 30, height: 30, borderRadius: 9, background: "#ef444422", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name="play" size={13} color={COLORS.red} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "#fca5a5" }}>Ver técnica</div>
                              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>YouTube · {ej.nombre}</div>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

const TIPO_COLOR = {
  Fuerza: "#818cf8", Cardio: "#67e8f9", Movilidad: "#86efac",
  "Full body": "#d8b4fe", Powerlifting: "#fca5a5", Funcional: "#fde68a", Otro: "#999",
}

const FAQ_SYSTEM_CLIENTE = `Sos el asistente de soporte de una app llamada TuPersonal. Esta app la usan entrenadores personales para gestionar clientes, y los CLIENTES (atletas) la usan para ver sus rutinas, registrar progreso, chatear con su entrenador, ver su agenda de sesiones y pagar su cuota. No tiene nada que ver con tareas, calendario personal, vida social ni ninguna otra función. Si alguien pregunta algo que no está en la lista de abajo, respondé en una sola oración que no sabés o que eso no es una función de la app. Nunca inventes funciones.

Respuestas cortas: 1 a 3 oraciones. Sin asteriscos, sin #, sin listas con guiones. Solo texto plano. Español argentino informal.

FUNCIONES DE LA APP PARA EL CLIENTE (atleta):

RUTINA
- Ver tu rutina: sección Rutina del menú
- Ver la técnica de un ejercicio: botón "Ver técnica" que abre un video de YouTube
- Tu entrenador es quien arma y asigna las rutinas

AGENDA
- Ver tus próximas sesiones: sección Agenda del menú
- Tu entrenador es quien las programa

PROGRESO
- Registrar tu peso: sección Progreso → cargar peso actual
- Ver evolución de peso: gráfico en la sección Progreso
- Subir fotos de progreso: sección Progreso → subir foto
- Ver cargas registradas: sección Progreso

CHAT
- Escribirle a tu entrenador: sección Chat del menú

PAGOS
- Ver tu cuota mensual: sección Pagos
- Pagar: si tu entrenador configuró un link de MercadoPago, aparece un botón para pagar ahí mismo

PERFIL
- Cambiar tu nombre, foto o datos: sección Perfil
- Unirte a un grupo: Perfil → sección Grupo → poner el código que te dio tu entrenador

PWA (agregar como app)
- En iPhone: Safari → compartir → "Agregar a pantalla de inicio"
- En Android: Chrome → menú → "Agregar a pantalla de inicio"

Si no sabés algo, decilo en una oración. Nunca inventes funciones que no existen. Si preguntan algo sobre entrenamiento (rutinas, series, nutrición) que no sea sobre el uso de la app, sugerí que se lo consulten a su entrenador por el Chat.`

function ChatbotFAQCliente({ onClose, nombre }) {
  const [mensajes, setMensajes] = useState([
    { role: "assistant", text: `¡Hola${nombre ? ", " + nombre.split(" ")[0] : ""}! 👋 Soy tu asistente de TuPersonal. ¿En qué te puedo ayudar?` }
  ])
  const [input, setInput] = useState("")
  const [cargando, setCargando] = useState(false)
  const endRef = useRef(null)

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
      const respuesta = await askClaude({ messages: apiMessages, max_tokens: 200, system: FAQ_SYSTEM_CLIENTE })
      setMensajes(prev => [...prev, { role: "assistant", text: respuesta || "No pude procesar eso." }])
    } catch {
      setMensajes(prev => [...prev, { role: "assistant", text: "Hubo un error. Intentá de nuevo." }])
    }
    setCargando(false)
  }

  return (
    <motion.div key="chatbot-cliente" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: COLORS.bg }}>
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
      <div style={{ padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8, background: COLORS.surface, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
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

function AgendaCliente({ perfil }) {
  const [sesiones, setSesiones] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!perfil?.id) { setCargando(false); return }
    const hoy = new Date().toISOString().split("T")[0]
    supabase.from("sesiones").select("*").eq("cliente_id", perfil.id).gte("fecha", hoy).order("fecha").order("hora")
      .then(({ data }) => { setSesiones(data || []); setCargando(false) })
  }, [perfil?.id])

  if (cargando) return <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, padding: 20 }}>Cargando...</div>

  const porFecha = sesiones.reduce((acc, s) => {
    if (!acc[s.fecha]) acc[s.fecha] = []
    acc[s.fecha].push(s)
    return acc
  }, {})

  return (
    <>
      <div style={T.h1}>Agenda</div>
      <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: -8 }}>Tus próximas sesiones con tu entrenador</div>

      {sesiones.length === 0 && (
        <div style={{ background: COLORS.surface, borderRadius: 14, padding: 24, border: `1px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
          Todavía no tenés sesiones agendadas. Tu entrenador las va a programar acá.
        </div>
      )}

      {Object.entries(porFecha).map(([fecha, ss]) => {
        const d = new Date(fecha + "T00:00:00")
        const label = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
        return (
          <div key={fecha}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "capitalize", marginBottom: 6 }}>{label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ss.map(s => (
                <div key={s.id} style={{ background: COLORS.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: TIPO_COLOR[s.tipo] || TIPO_COLOR.Otro, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{s.hora} — {s.tipo}</div>
                    {s.notas && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{s.notas}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>{s.duracion}min</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

function Progreso({ perfil, onActualizar }) {
  const [editandoPeso, setEditandoPeso] = useState(false)
  const [pesoNuevo, setPesoNuevo] = useState("")
  const [guardandoPeso, setGuardandoPeso] = useState(false)

  const [cargas, setCargas] = useState(perfil?.cargas || {})
  const [editandoCarga, setEditandoCarga] = useState(null)
  const [valorCarga, setValorCarga] = useState("")
  const [ejercicioNuevo, setEjercicioNuevo] = useState("")
  const [agregando, setAgregando] = useState(false)
  const [guardandoCarga, setGuardandoCarga] = useState(false)

  const [fotos, setFotos] = useState(perfil?.fotos_progreso || [])
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !perfil?.id) return
    setSubiendoFoto(true)
    const ext = file.name.split(".").pop()
    const path = `fotos/${perfil.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false })
    if (!upErr) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
      const nuevaFoto = { url: urlData.publicUrl, fecha: new Date().toLocaleDateString("es-AR") }
      const nuevasFotos = [...fotos, nuevaFoto]
      const { data } = await supabase.from("clientes").update({ fotos_progreso: nuevasFotos }).eq("id", perfil.id).select().single()
      if (data) { setFotos(nuevasFotos); onActualizar(data) }
    }
    setSubiendoFoto(false)
  }

  const pesoHistorial = perfil?.peso_historial || []
  const pesoActual = perfil?.peso

  const guardarPeso = async () => {
    const p = Number(pesoNuevo)
    if (!p || !perfil?.id) return
    setGuardandoPeso(true)
    const historial = [...pesoHistorial, { fecha: new Date().toISOString().split("T")[0], peso: p }]
    const { data } = await supabase.from("clientes").update({ peso: p, peso_historial: historial }).eq("id", perfil.id).select().single()
    if (data) onActualizar(data)
    setPesoNuevo("")
    setEditandoPeso(false)
    setGuardandoPeso(false)
  }

  const guardarCarga = async (nombre, valor) => {
    if (!perfil?.id) return
    setGuardandoCarga(true)
    const nuevasCargas = { ...cargas, [nombre]: valor }
    const { data } = await supabase.from("clientes").update({ cargas: nuevasCargas }).eq("id", perfil.id).select().single()
    if (data) {
      setCargas(nuevasCargas)
      onActualizar(data)
    }
    setEditandoCarga(null)
    setValorCarga("")
    setGuardandoCarga(false)
  }

  const eliminarCarga = async (nombre) => {
    if (!perfil?.id) return
    const nuevasCargas = { ...cargas }
    delete nuevasCargas[nombre]
    await supabase.from("clientes").update({ cargas: nuevasCargas }).eq("id", perfil.id)
    setCargas(nuevasCargas)
    onActualizar({ ...perfil, cargas: nuevasCargas })
  }

  const agregarEjercicio = () => {
    if (!ejercicioNuevo.trim()) return
    setEditandoCarga(ejercicioNuevo.trim())
    setValorCarga("")
    setEjercicioNuevo("")
    setAgregando(false)
  }

  const miniChartPts = pesoHistorial.slice(-6)
  const max = miniChartPts.length > 0 ? Math.max(...miniChartPts.map(p => p.peso)) : 1
  const min = miniChartPts.length > 0 ? Math.min(...miniChartPts.map(p => p.peso)) : 0
  const range = max - min || 1

  return (
    <>
      <div style={T.h1}>Mi progreso</div>

      {/* Peso corporal */}
      <div style={{ background: COLORS.surface, borderRadius: 18, padding: 18, border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={T.label}>Peso corporal</div>
            <div style={{ ...T.num, fontSize: 28, marginTop: 6 }}>{pesoActual ? `${pesoActual} kg` : "—"}</div>
            {pesoHistorial.length > 0 && (
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
                Última actualización: {pesoHistorial[pesoHistorial.length - 1].fecha}
              </div>
            )}
          </div>
          {miniChartPts.length > 1 && (
            <svg width={70} height={36} viewBox="0 0 70 36">
              <polyline
                points={miniChartPts.map((p, i) => `${(i / (miniChartPts.length - 1)) * 70},${36 - ((p.peso - min) / range) * 32}`).join(" ")}
                fill="none" stroke={COLORS.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {editandoPeso ? (
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <input placeholder="Nuevo peso (kg)" value={pesoNuevo} onChange={e => setPesoNuevo(e.target.value)} type="number"
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }} autoFocus />
            <button onClick={guardarPeso} disabled={guardandoPeso}
              style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: "0 16px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", flexShrink: 0, opacity: guardandoPeso ? 0.5 : 1 }}>
              {guardandoPeso ? "..." : "OK"}
            </button>
            <button onClick={() => setEditandoPeso(false)}
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "0 12px", color: COLORS.textSub, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
              ✕
            </button>
          </div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditandoPeso(true)}
            style={{ marginTop: 14, background: COLORS.surface2, border: `1px solid ${COLORS.border2}`, borderRadius: 6, padding: "10px 0", color: COLORS.text, fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" }}>
            Actualizar peso
          </motion.button>
        )}
      </div>

      {/* Cargas por ejercicio */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={T.label}>Mis cargas</div>
          <button onClick={() => setAgregando(!agregando)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: COLORS.accent, fontSize: 12, fontWeight: 600, padding: 0 }}>
            <Icon name="plus" size={14} color={COLORS.accent} /> Agregar
          </button>
        </div>

        <AnimatePresence>
          {agregando && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Nombre del ejercicio" value={ejercicioNuevo} onChange={e => setEjercicioNuevo(e.target.value)} onKeyDown={e => e.key === "Enter" && agregarEjercicio()}
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }} autoFocus />
                <button onClick={agregarEjercicio}
                  style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: "0 14px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  +
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {Object.keys(cargas).length === 0 && !agregando && (
          <div style={{ background: COLORS.surface, borderRadius: 8, padding: 20, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
            Agregá tus ejercicios y la carga que usás en cada uno.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(cargas).map(([nombre, carga]) => (
            <motion.div key={nombre} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: COLORS.surface, borderRadius: 8, padding: "13px 16px", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{nombre}</div>
                {editandoCarga === nombre ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <input placeholder="ej: 80kg, 3×10" value={valorCarga} onChange={e => setValorCarga(e.target.value)} onKeyDown={e => e.key === "Enter" && guardarCarga(nombre, valorCarga)}
                      style={{ ...inputStyle, flex: 1, marginBottom: 0, fontSize: 13, padding: "8px 12px" }} autoFocus />
                    <button onClick={() => guardarCarga(nombre, valorCarga)} disabled={guardandoCarga}
                      style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "0 12px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0, opacity: guardandoCarga ? 0.5 : 1 }}>
                      OK
                    </button>
                    <button onClick={() => setEditandoCarga(null)}
                      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "0 10px", color: COLORS.textSub, fontSize: 13, cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent, marginTop: 4 }}>{carga || "—"}</div>
                )}
              </div>
              {editandoCarga !== nombre && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditandoCarga(nombre); setValorCarga(carga) }}
                    style={{ background: COLORS.surface2, border: "none", borderRadius: 9, padding: "6px 8px", cursor: "pointer", display: "flex" }}>
                    <Icon name="edit" size={13} color={COLORS.textSub} />
                  </button>
                  <button onClick={() => eliminarCarga(nombre)}
                    style={{ background: "#3a1a1a", border: "none", borderRadius: 9, padding: "6px 8px", cursor: "pointer", display: "flex" }}>
                    <Icon name="trash" size={13} color={COLORS.red} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {pesoHistorial.length > 0 && (
        <div style={{ background: COLORS.surface, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
          <div style={{ ...T.label, marginBottom: 10 }}>Historial de peso</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...pesoHistorial].reverse().slice(0, 5).map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: COLORS.textSub }}>{h.fecha}</span>
                <span style={{ fontWeight: 600, color: COLORS.text }}>{h.peso} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fotos de progreso */}
      <div style={{ background: COLORS.surface, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={T.label}>Fotos de progreso</div>
          <label style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: subiendoFoto ? 0.5 : 1 }}>
            {subiendoFoto ? "Subiendo..." : "+ Foto"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFotoUpload} disabled={subiendoFoto} />
          </label>
        </div>
        {fotos.length === 0 ? (
          <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, padding: "12px 0" }}>
            Subí tu primera foto para ver tu evolución
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[...fotos].reverse().map((f, i) => (
              <div key={i} style={{ borderRadius: 6, overflow: "hidden", background: COLORS.surface2 }}>
                <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                  <img src={f.url} alt="progreso" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, textAlign: "center", padding: "5px 0" }}>{f.fecha}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function AliasCard({ alias, monto }) {
  // Siempre construir el link de MP: si ya es una URL completa la usamos, si no construimos link.mercadopago.com.ar/USERNAME
  const mpUrl = alias.startsWith("http")
    ? alias
    : `https://link.mercadopago.com.ar/${alias.replace(/^@/, "")}`

  return (
    <div style={{ marginTop: 16 }}>
      <a href={mpUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
        <motion.div whileTap={{ scale: 0.97 }}
          style={{ padding: "14px 20px", borderRadius: 8, background: "#009ee3", color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Pagar con Mercado Pago
        </motion.div>
      </a>
      {monto && (
        <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 8 }}>
          Monto: <strong style={{ color: COLORS.text }}>${Number(monto).toLocaleString("es-AR")}</strong>
        </div>
      )}
    </div>
  )
}

function Pagos({ perfil }) {
  const [mpSettings, setMpSettings] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!perfil?.trainer_id) return
    supabase.from("trainer_settings").select("mp_alias,mp_access_token").eq("trainer_id", perfil.trainer_id).maybeSingle()
      .then(({ data }) => setMpSettings(data || {}))
  }, [perfil?.trainer_id])

  const pagarConMP = async () => {
    if (!mpSettings?.mp_access_token || !perfil?.precio) return
    setGenerando(true)
    setError("")
    try {
      const res = await fetch("/api/mp-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: mpSettings.mp_access_token,
          unit_price: Number(perfil.precio),
          back_url: window.location.href,
        })
      })
      const data = await res.json()
      if (data.init_point) window.open(data.init_point, "_blank")
      else setError("No se pudo generar el link. Verificá el Access Token con tu entrenador.")
    } catch { setError("Error al conectar con Mercado Pago.") }
    setGenerando(false)
  }

  const hasAccessToken = !!mpSettings?.mp_access_token
  const hasAlias = !!mpSettings?.mp_alias
  const aliasUrl = hasAlias ? `https://mpago.la/${mpSettings.mp_alias}` : null

  return (
    <>
      <div>
        <div style={{ ...T.label, marginBottom: 6 }}>Estado de cuenta</div>
        <div style={T.h1}>Mis pagos</div>
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 18, padding: 18, border: `1px solid ${COLORS.border}` }}>
        <div style={T.label}>Plan mensual</div>
        <div style={{ ...T.num, fontSize: 32, marginTop: 8, color: COLORS.text }}>
          {perfil?.precio ? `$${Number(perfil.precio).toLocaleString("es-AR")}` : "—"}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>por mes · entrenamiento personal</div>

        {error && <div style={{ fontSize: 12, color: COLORS.red, marginTop: 12 }}>{error}</div>}

        {mpSettings === null ? (
          <div style={{ marginTop: 16, height: 44, background: COLORS.surface2, borderRadius: 6 }} />
        ) : hasAccessToken && perfil?.precio ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={pagarConMP} disabled={generando}
            style={{ width: "100%", padding: "13px 0", borderRadius: 8, background: "#009ee3", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16, opacity: generando ? 0.7 : 1 }}>
            {generando ? "Generando link..." : "Pagar con Mercado Pago"}
          </motion.button>
        ) : hasAlias ? (
          <AliasCard alias={mpSettings.mp_alias} monto={perfil?.precio} />
        ) : (
          <div style={{ marginTop: 16, fontSize: 13, color: COLORS.textMuted, background: COLORS.surface2, borderRadius: 6, padding: "12px 14px", textAlign: "center" }}>
            Coordiná el pago con tu entrenador
          </div>
        )}
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>
        El seguimiento de pagos y historial lo gestiona tu entrenador.
      </div>
    </>
  )
}

function PerfilClienteEditar({ user, perfil, onActualizar, onLogout }) {
  const [datos, setDatos] = useState({
    nombre: perfil?.nombre || "",
    username: perfil?.username || user?.user_metadata?.username || autoUsername(user?.email, perfil?.nombre),
    peso: perfil?.peso || "",
    altura: perfil?.altura || "",
    edad: perfil?.edad || "",
    objetivo: perfil?.objetivo || "",
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(perfil?.avatar_url || null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  // Grupos
  const [grupoActual, setGrupoActual] = useState(null)
  const [codigoInput, setCodigoInput] = useState("")
  const [uniendose, setUniendose] = useState(false)
  const [grupoMsg, setGrupoMsg] = useState("")

  useEffect(() => {
    if (!perfil?.grupo_id) return
    supabase.from("grupos").select("nombre").eq("id", perfil.grupo_id).maybeSingle()
      .then(({ data }) => { if (data) setGrupoActual(data.nombre) })
  }, [perfil?.grupo_id])

  const unirseGrupo = async () => {
    const codigo = codigoInput.trim().toUpperCase()
    if (!codigo) return
    setUniendose(true)
    setGrupoMsg("")
    const { data: grupo, error: gErr } = await supabase.from("grupos").select("id, nombre").eq("codigo", codigo).maybeSingle()
    if (gErr || !grupo) { setGrupoMsg("Código incorrecto"); setUniendose(false); return }
    const { error: uErr } = await supabase.from("clientes").update({ grupo_id: grupo.id }).eq("id", perfil.id)
    if (uErr) { setGrupoMsg("No se pudo unir: " + uErr.message); setUniendose(false); return }
    setGrupoActual(grupo.nombre)
    onActualizar({ ...perfil, grupo_id: grupo.id })
    setCodigoInput("")
    setGrupoMsg("¡Te uniste a " + grupo.nombre + "!")
    setUniendose(false)
  }

  const salirGrupo = async () => {
    const { error: uErr } = await supabase.from("clientes").update({ grupo_id: null }).eq("id", perfil.id)
    if (!uErr) { setGrupoActual(null); onActualizar({ ...perfil, grupo_id: null }) }
  }

  const guardar = async () => {
    if (!datos.nombre.trim()) return setError("Ingresá tu nombre")
    setGuardando(true)
    setError("")
    setMensaje("")

    let avatar_url = perfil?.avatar_url || null
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop()
      const path = `${user.id}.${ext}`
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

    const campos = {
      nombre: datos.nombre,
      username: datos.username.trim().toLowerCase() || null,
      peso: Number(datos.peso) || null,
      altura: Number(datos.altura) || null,
      edad: Number(datos.edad) || null,
      objetivo: datos.objetivo || null,
      avatar_url,
    }

    let result = null
    let lastErr = null

    const tryUpdate = async (camposToUse, col, val) => {
      const { data, error } = await supabase.from("clientes").update(camposToUse).eq(col, val).select().maybeSingle()
      if (data) return data
      if (error) lastErr = error
      return null
    }

    const { username: _u, ...camposSinUsername } = campos
    const variants = [campos, camposSinUsername]

    for (const c of variants) {
      if (result) break
      if (perfil?.id) result = await tryUpdate(c, "id", perfil.id)
      if (!result) result = await tryUpdate(c, "user_id", user.id)
      if (!result) {
        const { data: found } = await supabase.from("clientes").select("id").eq("email", user.email).limit(1).maybeSingle()
        if (found?.id) result = await tryUpdate(c, "id", found.id)
      }
    }

    if (!result) {
      const insertCampos = { ...campos, user_id: user.id, email: user.email, trainer_id: user.user_metadata?.trainer_id || perfil?.trainer_id || null }
      const { username: _u2, ...insertSinUsername } = insertCampos
      for (const c of [insertCampos, insertSinUsername]) {
        const { data, error } = await supabase.from("clientes").insert(c).select().maybeSingle()
        if (data) { result = data; break }
        if (error) lastErr = error
      }
    }

    if (result) {
      onActualizar(result)
      setMensaje("¡Perfil actualizado!")
    } else {
      await supabase.auth.updateUser({ data: { perfil_cliente: { ...campos, email: user.email } } })
      const detail = lastErr ? `${lastErr.message} [${lastErr.code}]` : "No se pudo guardar"
      setError(`No se guardó en DB: ${detail}`)
    }
    setGuardando(false)
  }

  const ini = (datos.nombre || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ ...T.label, marginBottom: 4 }}>Tu cuenta</div>
          <div style={T.h1}>Perfil</div>
        </div>
        <button onClick={onLogout} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 8, cursor: "pointer", display: "flex" }}>
          <Icon name="logout" size={16} color={COLORS.textSub} />
        </button>
      </div>

      <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: COLORS.accent + "22", border: `2px dashed ${COLORS.border2}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: COLORS.accent, position: "relative", flexShrink: 0 }}>
          {avatarPreview
            ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : ini}
          <div style={{ position: "absolute", bottom: 4, right: 4, width: 22, height: 22, borderRadius: 7, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </div>
        </div>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Cambiar foto</span>
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)) } }} />
      </label>

      {mensaje && <div style={{ fontSize: 13, color: COLORS.green, background: COLORS.green + "11", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>{mensaje}</div>}
      {error && <div style={{ fontSize: 13, color: COLORS.red, background: COLORS.red + "11", borderRadius: 10, padding: "10px 14px" }}>{error}</div>}

      <div>
        <div style={{ ...T.label, marginBottom: 6 }}>Datos personales</div>
        <input placeholder="Nombre completo *" value={datos.nombre} onChange={e => setDatos(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
        <input placeholder="Nombre de usuario (ej: dantemie)" value={datos.username}
          onChange={e => setDatos(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() }))}
          style={inputStyle} />
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: -4, marginBottom: 10 }}>
          El email no se puede cambiar: {user?.email}
        </div>
      </div>

      <div>
        <div style={{ ...T.label, marginBottom: 6 }}>Métricas</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input placeholder="Peso (kg)" value={datos.peso} onChange={e => setDatos(p => ({ ...p, peso: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} type="number" />
          <input placeholder="Altura (cm)" value={datos.altura} onChange={e => setDatos(p => ({ ...p, altura: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} type="number" />
        </div>
        <div style={{ marginTop: 8 }}>
          <input placeholder="Edad" value={datos.edad} onChange={e => setDatos(p => ({ ...p, edad: e.target.value }))} style={inputStyle} type="number" />
        </div>
        <input placeholder="Objetivo (ej: bajar 5kg, ganar masa)" value={datos.objetivo} onChange={e => setDatos(p => ({ ...p, objetivo: e.target.value }))} style={inputStyle} />
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={guardar} disabled={guardando}
        style={{ background: COLORS.accent, border: "none", borderRadius: 8, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.6 : 1 }}>
        {guardando ? "Guardando..." : "Guardar cambios"}
      </motion.button>

      {/* Grupo */}
      {perfil?.id && (
        <div style={{ background: COLORS.surface, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
          <div style={{ ...T.label, marginBottom: 10 }}>Grupo</div>
          {grupoMsg && (
            <div style={{ fontSize: 13, color: grupoMsg.startsWith("¡") ? COLORS.green : COLORS.red, background: (grupoMsg.startsWith("¡") ? COLORS.green : COLORS.red) + "11", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              {grupoMsg}
            </div>
          )}
          {grupoActual ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{grupoActual}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Grupo actual</div>
              </div>
              <button onClick={salirGrupo}
                style={{ background: COLORS.red + "18", border: `1px solid ${COLORS.red}33`, borderRadius: 8, padding: "6px 12px", color: COLORS.red, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                Salir
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Código del grupo"
                value={codigoInput}
                onChange={e => setCodigoInput(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && unirseGrupo()}
                style={{ ...inputStyle, marginBottom: 0, flex: 1, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={unirseGrupo} disabled={uniendose || !codigoInput.trim()}
                style={{ background: COLORS.accent, border: "none", borderRadius: 8, padding: "0 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: uniendose || !codigoInput.trim() ? 0.5 : 1, whiteSpace: "nowrap" }}>
                {uniendose ? "..." : "Unirme"}
              </motion.button>
            </div>
          )}
        </div>
      )}
    </>
  )
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

export default function ClientePanel({ user, onLogout, initialPerfil = null, previewMode = false }) {
  const [perfil, setPerfil] = useState(initialPerfil)
  const [cargando, setCargando] = useState(!initialPerfil)
  const [activePage, setActivePage] = useState("inicio")
  const [chatbotAbierto, setChatbotAbierto] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (initialPerfil) return
    const cargar = async () => {
      setCargando(true)
      let { data } = await supabase.from("clientes").select("*").eq("user_id", user.id).maybeSingle()
      if (!data) {
        const res = await supabase.from("clientes").select("*").eq("email", user.email).maybeSingle()
        data = res.data
        if (data) {
          await supabase.from("clientes").update({ user_id: user.id }).eq("id", data.id)
          data.user_id = user.id
        }
      }
      if (!data || !data.nombre) {
        const metaPerfil = user.user_metadata?.perfil_cliente
        if (metaPerfil?.nombre) {
          data = data ? { ...data, ...metaPerfil } : { ...metaPerfil }
        }
      }
      // Auto-generar username si no tiene uno
      if (data?.id && !data.username) {
        const auto = autoUsername(user.email, data.nombre)
        const { error: usrErr } = await supabase.from("clientes").update({ username: auto }).eq("id", data.id)
        if (!usrErr) data = { ...data, username: auto }
      }
      setPerfil(data)
      setCargando(false)
    }
    cargar()
  }, [user?.id, user?.email, initialPerfil])

  const screenStyle = { flex: 1, overflowY: "scroll", overflowX: "hidden", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }
  const fontFamily = "'Styrene A', -apple-system, BlinkMacSystemFont, sans-serif"

  if (cargando) return (
    <div style={{ background: COLORS.bg, height: "var(--app-height, 100dvh)", display: "flex", justifyContent: "center", alignItems: "center", fontFamily }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}
        style={{ fontSize: 13, color: COLORS.textMuted }}>Cargando...</motion.div>
    </div>
  )

  if (!previewMode && (!perfil || !perfil.nombre)) return (
    <div style={{ background: COLORS.bg, height: "var(--app-height, 100dvh)", overflowY: "auto", scrollbarWidth: "none", fontFamily }}>
      <Onboarding user={user} perfilExistente={perfil} onComplete={(data) => setPerfil(data)} onLogout={onLogout} />
    </div>
  )

  const perfilMock = perfil || { nombre: "Cliente", objetivo: "Sin definir", peso: null, altura: null, edad: null, precio: null }
  const nombre = perfilMock.nombre || "Cliente"
  const username = perfilMock.username || user?.user_metadata?.username || ""

  const renderPage = () => {
    const pages = {
      inicio: <Inicio perfil={perfilMock} onLogout={onLogout} onActualizar={previewMode ? () => {} : setPerfil} onNavigate={setActivePage} />,
      rutina: <Rutina perfil={perfilMock} />,
      agenda: <AgendaCliente perfil={perfilMock} />,
      progreso: <Progreso perfil={perfilMock} onActualizar={previewMode ? () => {} : setPerfil} />,
      chat: <Chat user={user} clienteId={perfilMock?.id} trainerId={perfilMock?.trainer_id} modo="cliente" onProfileClick={() => setActivePage("perfil")} />,
      pagos: <Pagos perfil={perfilMock} />,
      perfil: <PerfilClienteEditar user={user} perfil={perfilMock} onActualizar={previewMode ? () => {} : setPerfil} onLogout={onLogout} />,
    }
    return (
      <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={screenStyle}>
        {pages[activePage]}
      </motion.div>
    )
  }

  const bottomNav = (
    <nav style={{ background: COLORS.bg, borderTop: `1px solid ${COLORS.border}`, display: "flex", paddingTop: 2, paddingBottom: "env(safe-area-inset-bottom)", flexShrink: 0 }}>
      {navItems.filter(item => bottomNavItems.includes(item.id)).map(item => (
        <button key={item.id} onClick={() => setActivePage(item.id)}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "2px 0" }}>
          <Icon name={item.icon} size={22} color={activePage === item.id ? COLORS.accent : COLORS.textMuted} />
          <span style={{ fontSize: 10, fontWeight: 500, color: activePage === item.id ? COLORS.accent : COLORS.textMuted }}>{item.label}</span>
        </button>
      ))}
    </nav>
  )

  // Preview mode: always mobile layout
  if (previewMode) return (
    <div style={{ background: COLORS.bg, height: "100%", display: "flex", flexDirection: "column", fontFamily }}>
      <div style={{ background: COLORS.accent + "22", borderBottom: `1px solid ${COLORS.accent}44`, padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, letterSpacing: 0.5 }}>Vista previa — como lo ve el cliente</div>
        <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: COLORS.accent, padding: 0, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
      </div>
      {bottomNav}
    </div>
  )

  return (
    <div style={{ background: COLORS.bg, height: "var(--app-height, 100dvh)", display: "flex", fontFamily }}>
      {/* Sidebar — solo desktop */}
      {!isMobile && (
        <div style={{ width: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "var(--app-height, 100dvh)", position: "sticky", top: 0, flexShrink: 0 }}>
          <div style={{ padding: "20px 16px 16px" }}>
            <div style={{ marginBottom: 14, padding: "0 4px" }}>
              <img src="/logo-white.png" alt="TuPersonal" style={{ height: 90, width: "auto", display: "block" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: perfilMock.avatar_url ? "none" : COLORS.accent, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {perfilMock.avatar_url
                  ? <img src={perfilMock.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombre}</div>
                {username && <div style={{ fontSize: 11, color: COLORS.textMuted }}>@{username}</div>}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
            {navItems.map(item => {
              const activo = activePage === item.id
              return (
                <button key={item.id} onClick={() => setActivePage(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: activo ? `${COLORS.accent}22` : "none", border: "none", borderRadius: 10, color: activo ? "#fff" : COLORS.textSub, fontSize: 14, fontWeight: activo ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily }}>
                  <Icon name={item.icon} size={18} color={activo ? COLORS.accentLight : COLORS.textMuted} />
                  {item.label}
                </button>
              )
            })}
          </div>
          <div style={{ padding: "8px 12px 16px" }}>
            <div style={{ height: 1, background: COLORS.border, margin: "4px 8px 10px" }} />
            <button onClick={() => setChatbotAbierto(true)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: COLORS.textSub, fontSize: 13, fontFamily, width: "100%", textAlign: "left" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
              FAQ IA
            </button>
            <a href="https://wa.me/541122987419" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, textDecoration: "none", color: COLORS.textSub, fontSize: 13 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Soporte por WhatsApp
            </a>
            <a href="https://instagram.com/tupersonal.fit" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, textDecoration: "none", color: COLORS.textSub, fontSize: 13 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig-cliente" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig-cliente)"/><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.8" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/><rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="1.8" fill="none"/></svg>
              Instagram
            </a>
            <div style={{ height: 1, background: COLORS.border, margin: "10px 8px 8px" }} />
            <button onClick={onLogout}
              style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily, padding: "9px 12px", width: "100%", textAlign: "left" }}>
              <Icon name="logout" size={16} color={COLORS.textMuted} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "var(--app-height, 100dvh)", overflow: "hidden", overscrollBehavior: "none" }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "calc(6px + env(safe-area-inset-top))", paddingLeft: 20, paddingRight: 20, paddingBottom: 0, flexShrink: 0 }}>
            <img src="/logo-white.png" alt="TuPersonal" style={{ height: 32, width: "auto" }} />
            <button onClick={onLogout}
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "5px 10px", color: COLORS.textMuted, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
              Salir
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", overscrollBehavior: "none" }}>
          <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
        </div>
        {isMobile && bottomNav}
      </div>

      <AnimatePresence>
        {chatbotAbierto && <ChatbotFAQCliente onClose={() => setChatbotAbierto(false)} nombre={nombre} />}
      </AnimatePresence>
    </div>
  )
}
