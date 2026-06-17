import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AgendaReal from "./Agenda"
import { EJERCICIOS } from "./ejercicios"
import { supabase } from "./supabase"
import CreadorRutinasNuevo from "./CreadorRutinasNuevo"
import ClientePanel from "./ClientePanel"

const COLORS = {
  bg: "#080808", surface: "#111111", surface2: "#1a1a1a", border: "#222222", border2: "#2a2a2a",
  text: "#ffffff", textSub: "#888888", textMuted: "#444444", accent: "#6366f1", accentSub: "#312e81",
  green: "#22c55e", red: "#ef4444", yellow: "#f59e0b",
}

const T = {
  h1: { fontSize: 28, fontWeight: 700, color: "#ffffff", letterSpacing: -0.8, lineHeight: 1.1 },
  h2: { fontSize: 20, fontWeight: 600, color: "#ffffff", letterSpacing: -0.4 },
  h3: { fontSize: 15, fontWeight: 600, color: "#ffffff", letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: 400, color: "#888888", lineHeight: 1.5 },
  label: { fontSize: 11, fontWeight: 500, color: "#444444", textTransform: "uppercase", letterSpacing: 1.2 },
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
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">{icons[name]}</svg>
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
  { id: "rutinas", icon: "dumbbell", label: "Rutinas" },
  { id: "agenda", icon: "calendar", label: "Agenda" },
  { id: "pagos", icon: "wallet", label: "Finanzas" },
]

const barData = [40, 55, 62, 70, 80, 95]
const barLabels = ["E", "F", "M", "A", "M", "J"]

function MiniBar({ data, labels }) {
  const max = Math.max(...data)
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
      {data.map((h, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
          <motion.div initial={{ height: 0 }} animate={{ height: `${(h / max) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            style={{ width: "100%", borderRadius: 3, background: i === data.length - 1 ? COLORS.accent : COLORS.surface2 }} />
          <div style={{ ...T.label, fontSize: 9, letterSpacing: 0 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

function Inicio({ clientes = [], nombreTrainer = "" }) {
  const pendientes = clientes.filter(c => c.estadoColor === COLORS.red || c.estadoColor === COLORS.yellow).length
  const totalMensual = clientes.reduce((s, c) => s + (Number(c.precio) || 0), 0)
  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
  const nombre = nombreTrainer || "Entrenador"

  return (
    <>
      <div style={{ paddingBottom: 8 }}>
        <div style={{ ...T.label, marginBottom: 8 }}>{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</div>
        <div style={T.h1}>Hola, {nombre.split(" ")[0]}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Clientes activos", value: String(clientes.length), change: "Total registrados", icon: "users", changeColor: COLORS.textMuted },
          { label: "Facturación mens.", value: totalMensual > 0 ? `$${(totalMensual / 1000).toFixed(0)}K` : "-", change: "Si cobran todos", icon: "wallet", changeColor: COLORS.textMuted },
          { label: "Al día", value: String(clientes.length - pendientes), change: "pagos confirmados", icon: "check", changeColor: COLORS.green },
          { label: "Pendientes", value: String(pendientes), change: pendientes > 0 ? "revisar cobros" : "todo en orden", icon: "trendingUp", changeColor: pendientes > 0 ? COLORS.yellow : COLORS.green },
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
      {clientes.length > 0 && (
        <>
          <div style={T.label}>Clientes recientes</div>
          {clientes.slice(0, 3).map((c, i) => (
            <motion.div key={c.id || i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              style={{ background: COLORS.surface, borderRadius: 16, padding: "12px 14px", border: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>{c.ini}</div>
              <div style={{ flex: 1 }}>
                <div style={T.h3}>{c.nombre}</div>
                <div style={{ ...T.body, fontSize: 12, marginTop: 1 }}>{c.objetivo || "Sin objetivo definido"}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.estadoColor }}>{c.estado}</div>
            </motion.div>
          ))}
        </>
      )}
      {clientes.length === 0 && (
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 20, border: `0.5px dashed ${COLORS.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>Aún no tenés clientes cargados</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted + "88" }}>Agregá tu primer cliente desde la sección Clientes</div>
        </div>
      )}
    </>
  )
}

function PerfilCliente({ cliente, onBack, onEliminar, onPreview }) {
  const [tab, setTab] = useState("info")
  const [editando, setEditando] = useState(false)
  const [datos, setDatos] = useState(cliente)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [rutinas, setRutinas] = useState([])
  const [cargandoRutinas, setCargandoRutinas] = useState(false)

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
    const { data } = await supabase.from("rutinas").select("*").eq("cliente_id", cliente.id)
    if (data) setRutinas(data)
    setCargandoRutinas(false)
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

      <motion.button whileTap={{ scale: 0.97 }} onClick={onPreview}
        style={{ background: COLORS.accentSub, border: `0.5px solid ${COLORS.accent}55`, borderRadius: 14, padding: "11px 0", color: COLORS.accent, cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Ver como cliente
      </motion.button>

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
            <div style={{ background: COLORS.surface, borderRadius: 14, padding: 16, border: `0.5px solid ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
              Próximamente — registro de progreso
            </div>
          )}
          {tab === "pagos" && (
            <div style={{ background: COLORS.surface, borderRadius: 14, padding: 16, border: `0.5px solid ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
              Próximamente — historial de pagos
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
              ) : rutinas.map((r, i) => (
                <div key={i} style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px solid ${COLORS.border}` }}>
                  <div style={T.h3}>{r.nombre}</div>
                  <div style={{ ...T.body, marginTop: 4 }}>{r.dias?.length || 0} días</div>
                </div>
              ))}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

function Clientes({ onVerPerfil, clientes = [], onClienteAgregado }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", precio: "" })

  const inputStyle = { background: COLORS.surface2, border: `0.5px solid ${COLORS.border2}`, borderRadius: 12, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", boxSizing: "border-box", marginBottom: 8 }

  const agregarCliente = async () => {
    if (!nuevo.nombre.trim()) return
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from("clientes").insert({
      trainer_id: user.id,
      nombre: nuevo.nombre,
      email: nuevo.email || null,
      precio: Number(nuevo.precio) || null,
    }).select().single()
    if (!error && data) {
      onClienteAgregado?.(normCliente(data))
      setNuevo({ nombre: "", email: "", precio: "" })
      setMostrarForm(false)
    }
    setCargando(false)
  }

  const copiarLink = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const link = `${window.location.origin}?invite=${user.id}`
    await navigator.clipboard.writeText(link)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2500)
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={T.h1}>Clientes</div>
        <div style={{ display: "flex", gap: 8 }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={copiarLink}
            style={{ background: linkCopiado ? COLORS.green + "22" : COLORS.surface, border: `0.5px solid ${linkCopiado ? COLORS.green : COLORS.border}`, borderRadius: 12, padding: "8px 12px", color: linkCopiado ? COLORS.green : COLORS.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            {linkCopiado ? "¡Copiado!" : "Link"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMostrarForm(!mostrarForm)}
            style={{ background: COLORS.accent, border: "none", borderRadius: 12, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Agregar
          </motion.button>
        </div>
      </div>
      <AnimatePresence>
        {mostrarForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}`, overflow: "hidden" }}>
            <div style={{ ...T.label, marginBottom: 4 }}>Nuevo cliente</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>El cliente carga sus datos cuando crea su cuenta.</div>
            <input placeholder="Nombre *" value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
            <input placeholder="Email (para enviar el link de invitación)" value={nuevo.email} onChange={e => setNuevo(p => ({ ...p, email: e.target.value }))} style={inputStyle} type="email" />
            <input placeholder="Precio/mes ($)" value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} style={inputStyle} type="number" />
            <div style={{ background: COLORS.surface2, borderRadius: 12, padding: "10px 14px", marginBottom: 8, fontSize: 12, color: COLORS.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              Después usá el botón "Link" para enviarle el link de invitación.
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={agregarCliente} disabled={cargando || !nuevo.nombre.trim()}
              style={{ background: cargando ? COLORS.surface2 : COLORS.accent, border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", opacity: cargando ? 0.5 : 1 }}>
              {cargando ? "Guardando..." : "Agregar cliente"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {clientes.length === 0 && !mostrarForm && (
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 24, border: `0.5px dashed ${COLORS.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Aún no tenés clientes — agregá el primero</div>
        </div>
      )}
      {clientes.map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
          onClick={() => onVerPerfil(c)} style={{ background: COLORS.surface, borderRadius: 16, padding: "14px 16px", border: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>{c.ini}</div>
          <div style={{ flex: 1 }}>
            <div style={T.h3}>{c.nombre}</div>
            <div style={{ ...T.body, fontSize: 12, marginTop: 2 }}>{c.objetivo || "Sin objetivo definido"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.estadoColor || COLORS.green }}>{c.estado || "Al día"}</div>
            <Icon name="chevronRight" size={14} color={COLORS.textMuted} />
          </div>
        </motion.div>
      ))}
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

function Finanzas({ clientes = [], user }) {
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
              <div style={{ width: 36, height: 36, borderRadius: 11, background: c.estadoColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.estadoColor, flexShrink: 0 }}>{c.ini}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
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

export default function App({ user, onLogout }) {
  const [activePage, setActivePage] = useState("inicio")
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [previewCliente, setPreviewCliente] = useState(null)

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

    const pages = {
      inicio: <Inicio clientes={clientes} nombreTrainer={nombreTrainer} />,
      clientes: <Clientes
        clientes={clientes}
        onVerPerfil={setClienteSeleccionado}
        onClienteAgregado={(c) => setClientes(prev => [...prev, c])}
      />,
      rutinas: <CreadorRutinasNuevo clientes={clientes} onGuardar={async ({ nombre, dias, clientesAsignados }) => {
        try {
          await supabase.from("rutinas").insert({
            trainer_id: user?.id,
            nombre,
            dias: JSON.stringify(dias),
            clientes_asignados: clientesAsignados,
          })
        } catch (e) { console.error("Error guardando rutina", e) }
      }} />,
      agenda: <AgendaReal clientes={clientes} />,
      pagos: <Finanzas clientes={clientes} user={user} />,
    }
    return (
      <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={screenStyle}>
        {pages[activePage]}
      </motion.div>
    )
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      <div style={{ width: 375, height: 720, background: COLORS.bg, borderRadius: 40, border: `1px solid ${COLORS.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, letterSpacing: -0.3 }}>
            TuPersonal<span style={{ color: COLORS.accent }}>.</span>
          </div>
          <button onClick={onLogout}
            style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "5px 10px", color: COLORS.textMuted, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
            Salir
          </button>
        </div>

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

      {/* Overlay vista previa del cliente */}
      <AnimatePresence>
        {previewCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, backdropFilter: "blur(6px)" }}
            onClick={e => { if (e.target === e.currentTarget) setPreviewCliente(null) }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} transition={{ duration: 0.22, ease: "easeOut" }}>
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