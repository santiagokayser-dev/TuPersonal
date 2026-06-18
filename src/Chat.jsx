// SQL necesario — ejecutar en Supabase SQL editor:
// CREATE TABLE mensajes (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trainer_id uuid REFERENCES auth.users(id) NOT NULL, cliente_id uuid REFERENCES clientes(id) NOT NULL, sender text NOT NULL CHECK (sender IN ('trainer','cliente')), texto text NOT NULL, leido boolean DEFAULT false, created_at timestamptz DEFAULT now());
// ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "trainer_mensajes" ON mensajes FOR ALL USING (auth.uid() = trainer_id);
// CREATE POLICY "cliente_insert_mensajes" ON mensajes FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM clientes WHERE id = mensajes.cliente_id));
// CREATE POLICY "cliente_select_mensajes" ON mensajes FOR SELECT USING (auth.uid() IN (SELECT user_id FROM clientes WHERE id = mensajes.cliente_id));

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const COLORS = {
  bg: "#080808", surface: "#111111", surface2: "#1a1a1a", border: "#222222", border2: "#2a2a2a",
  text: "#ffffff", textSub: "#888888", textMuted: "#444444", accent: "#6366f1", accentSub: "#312e81",
  green: "#22c55e", red: "#ef4444", yellow: "#f59e0b",
}

const AVATAR_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#06b6d4","#f97316","#84cc16"
]
function avatarColor(name) {
  return AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length]
}

function formatHora(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return "ahora"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  const ayer = new Date(now); ayer.setDate(ayer.getDate() - 1)
  if (d.toDateString() === ayer.toDateString()) return "Ayer"
  if (diff < 604800000) return d.toLocaleDateString("es-AR", { weekday: "short" })
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

function HiloChat({ trainerId, clienteId, miSender, nombreOtro }) {
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (!trainerId || !clienteId) return
    let mounted = true
    supabase.from("mensajes").select("*")
      .eq("trainer_id", trainerId).eq("cliente_id", clienteId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (mounted && data) setMensajes(data) })

    const channel = supabase.channel(`chat:${trainerId}:${clienteId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes", filter: `trainer_id=eq.${trainerId}` },
        (payload) => {
          if (payload.new.cliente_id !== clienteId) return
          setMensajes(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
        })
      .subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [trainerId, clienteId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [mensajes])

  const enviar = async () => {
    const t = texto.trim()
    if (!t || enviando) return
    setEnviando(true); setTexto("")
    const { data } = await supabase.from("mensajes").insert({
      trainer_id: trainerId, cliente_id: clienteId, sender: miSender, texto: t,
    }).select().single()
    if (data) setMensajes(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
    setEnviando(false)
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${COLORS.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, background: `linear-gradient(135deg, ${avatarColor(nombreOtro)}cc, ${avatarColor(nombreOtro)}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
          {(nombreOtro || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{nombreOtro}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>Conversación privada</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, scrollbarWidth: "none", minHeight: 0 }}>
        {mensajes.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, marginTop: 40 }}>
            Empezá la conversación con {nombreOtro}
          </div>
        )}
        {mensajes.map((m) => {
          const esMio = m.sender === miSender
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", justifyContent: esMio ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "72%", padding: "9px 13px", borderRadius: esMio ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: esMio ? COLORS.accent : COLORS.surface2,
                border: esMio ? "none" : `0.5px solid ${COLORS.border2}`,
              }}>
                <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.45 }}>{m.texto}</div>
                <div style={{ fontSize: 10, color: esMio ? "#a5b4fc88" : COLORS.textMuted, marginTop: 4, textAlign: "right" }}>
                  {formatHora(m.created_at)}
                </div>
              </div>
            </motion.div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "10px 12px", borderTop: `0.5px solid ${COLORS.border}`, flexShrink: 0, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar() } }}
          placeholder="Escribí un mensaje..."
          rows={1}
          style={{ flex: 1, background: COLORS.surface2, border: `0.5px solid ${COLORS.border2}`, borderRadius: 12, padding: "10px 13px", color: COLORS.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "-apple-system, sans-serif", maxHeight: 100, lineHeight: 1.4 }}
        />
        <motion.button whileTap={{ scale: 0.93 }} onClick={enviar} disabled={!texto.trim() || enviando}
          style={{ width: 40, height: 40, borderRadius: 12, background: texto.trim() ? COLORS.accent : COLORS.surface2, border: "none", cursor: texto.trim() ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </motion.button>
      </div>
    </div>
  )
}

function ConversacionItem({ c, noLeidos, lastMsg, seleccionado, onClick }) {
  const [hover, setHover] = useState(false)
  const ac = avatarColor(c.nombre)
  const unread = noLeidos[c.id] || 0
  const isSelected = seleccionado?.id === c.id

  const estadoColor = c.meses_deuda > 0 ? COLORS.yellow : COLORS.green
  const estadoLabel = c.meses_deuda > 0 ? "Pendiente" : "Al día"

  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer", borderRadius: 12, background: isSelected ? COLORS.accent + "18" : hover ? COLORS.surface2 : "transparent", transition: "background 0.15s", position: "relative", borderLeft: isSelected ? `2px solid ${COLORS.accent}` : "2px solid transparent" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg, ${ac}cc, ${ac}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
          {c.ini || (c.nombre || "?").slice(0, 2).toUpperCase()}
        </div>
        {unread > 0 && (
          <div style={{ position: "absolute", top: -3, right: -3, width: 18, height: 18, borderRadius: "50%", background: COLORS.accent, border: `2px solid ${COLORS.bg}`, fontSize: 9, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <div style={{ fontSize: 14, fontWeight: unread > 0 ? 700 : 500, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "65%" }}>
            {c.nombre}
          </div>
          <div style={{ fontSize: 11, color: unread > 0 ? COLORS.accent : COLORS.textMuted, fontWeight: unread > 0 ? 600 : 400, flexShrink: 0 }}>
            {lastMsg ? formatHora(lastMsg.created_at) : ""}
          </div>
        </div>
        <div style={{ fontSize: 12, color: unread > 0 ? COLORS.textSub : COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>
          {lastMsg
            ? <>{lastMsg.sender === "trainer" ? "Tú: " : ""}{lastMsg.texto}</>
            : "Sin mensajes aún"
          }
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {c.objetivo && <span style={{ fontSize: 10, color: COLORS.textMuted }}>{c.objetivo}</span>}
          {c.objetivo && <span style={{ fontSize: 10, color: COLORS.textMuted + "44" }}>·</span>}
          <span style={{ fontSize: 10, fontWeight: 600, color: estadoColor }}>{estadoLabel}</span>
        </div>
      </div>
    </div>
  )
}

export default function Chat({ user, clientes = [], clienteId = null, trainerId = null, modo = "trainer" }) {
  const [seleccionado, setSeleccionado] = useState(null)
  const [noLeidos, setNoLeidos] = useState({})
  const [lastMessages, setLastMessages] = useState({})
  const [busqueda, setBusqueda] = useState("")
  const [isMobile] = useState(() => window.innerWidth < 768)

  const esCliente = modo === "cliente"
  const currentClienteId = esCliente ? clienteId : seleccionado?.id
  const currentTrainerId = esCliente ? trainerId : user?.id
  const nombreOtro = esCliente ? "Tu entrenador" : (seleccionado?.nombre || "")

  // Cargar último mensaje por cliente y no leídos
  useEffect(() => {
    if (esCliente || !user?.id) return
    supabase.from("mensajes").select("cliente_id, texto, created_at, sender, leido")
      .eq("trainer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return
        const last = {}; const counts = {}
        data.forEach(m => {
          if (!last[m.cliente_id]) last[m.cliente_id] = m
          if (!m.leido && m.sender === "cliente") counts[m.cliente_id] = (counts[m.cliente_id] || 0) + 1
        })
        setLastMessages(last); setNoLeidos(counts)
      })
  }, [user?.id, esCliente])

  const sortedClientes = [...clientes].sort((a, b) => {
    const aU = noLeidos[a.id] || 0; const bU = noLeidos[b.id] || 0
    if (aU !== bU) return bU - aU
    const aT = lastMessages[a.id]?.created_at || 0; const bT = lastMessages[b.id]?.created_at || 0
    return new Date(bT) - new Date(aT)
  })

  const filtrados = sortedClientes.filter(c =>
    !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const totalNoLeidos = Object.values(noLeidos).reduce((s, n) => s + n, 0)

  // Modo cliente
  if (esCliente) {
    if (!clienteId || !trainerId) return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ fontSize: 14, color: COLORS.textMuted, textAlign: "center" }}>Conectate con tu entrenador para chatear</div>
      </div>
    )
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 8px", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Chat</div>
        </div>
        <HiloChat trainerId={trainerId} clienteId={clienteId} miSender="cliente" nombreOtro="Tu entrenador" />
      </div>
    )
  }

  // Panel de lista (izquierda en desktop / pantalla completa en mobile)
  const Lista = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 16px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>Mensajes</div>
          {totalNoLeidos > 0 && (
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, background: COLORS.accent + "18", borderRadius: 20, padding: "2px 10px" }}>
              {totalNoLeidos} nuevo{totalNoLeidos > 1 ? "s" : ""}
            </div>
          )}
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>
          {clientes.length === 0 ? "Agregá clientes para chatear" : `${clientes.length} conversaci${clientes.length === 1 ? "ón" : "ones"}`}
        </div>
      </div>

      {/* Búsqueda */}
      {clientes.length > 0 && (
        <div style={{ padding: "0 12px 10px", flexShrink: 0, position: "relative" }}>
          <svg style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)" }} width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ width: "100%", background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 12px 8px 30px", color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "-apple-system,sans-serif", boxSizing: "border-box" }} />
        </div>
      )}

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 4px 8px", scrollbarWidth: "none" }}>
        {clientes.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, padding: "40px 20px" }}>
            Agregá clientes para empezar a chatear con ellos
          </div>
        )}
        {filtrados.map(c => (
          <ConversacionItem key={c.id} c={c} noLeidos={noLeidos} lastMsg={lastMessages[c.id]}
            seleccionado={seleccionado} onClick={() => setSeleccionado(c)} />
        ))}
        {busqueda && filtrados.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, padding: 20 }}>Sin resultados</div>
        )}
      </div>
    </div>
  )

  // Mobile: alterna entre lista y hilo
  if (isMobile) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
        <AnimatePresence mode="wait">
          {!seleccionado ? (
            <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {Lista}
            </motion.div>
          ) : (
            <motion.div key="hilo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: `0.5px solid ${COLORS.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setSeleccionado(null)} style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{seleccionado.nombre}</div>
              </div>
              <HiloChat trainerId={user?.id} clienteId={seleccionado.id} miSender="trainer" nombreOtro={seleccionado.nombre} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Desktop: 2 paneles
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Panel izquierdo */}
      <div style={{ width: 280, flexShrink: 0, borderRight: `0.5px solid ${COLORS.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {Lista}
      </div>
      {/* Panel derecho */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {seleccionado ? (
          <HiloChat trainerId={user?.id} clienteId={seleccionado.id} miSender="trainer" nombreOtro={seleccionado.nombre} />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textSub }}>Seleccioná una conversación</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>Elegí un cliente de la lista para chatear</div>
          </div>
        )}
      </div>
    </div>
  )
}
