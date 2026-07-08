// SQL necesario — ejecutar en Supabase SQL editor:
// CREATE TABLE mensajes (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trainer_id uuid REFERENCES auth.users(id) NOT NULL, cliente_id uuid REFERENCES clientes(id) NOT NULL, sender text NOT NULL CHECK (sender IN ('trainer','cliente')), texto text NOT NULL, leido boolean DEFAULT false, created_at timestamptz DEFAULT now());
// ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "trainer_mensajes" ON mensajes FOR ALL USING (auth.uid() = trainer_id);
// CREATE POLICY "cliente_insert_mensajes" ON mensajes FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM clientes WHERE id = mensajes.cliente_id));
// CREATE POLICY "cliente_select_mensajes" ON mensajes FOR SELECT USING (auth.uid() IN (SELECT user_id FROM clientes WHERE id = mensajes.cliente_id));

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const C = {
  bg: "#111111", surface: "#191919", surface2: "#222222", surface3: "#2a2a2a",
  border: "#2a2a2a", border2: "#333333",
  text: "#ececec", textSub: "#888888", textMuted: "#555555",
  accent: "#E8714A", accentSub: "#2a1a12", accentLight: "#F0A07A",
  green: "#3ecf6e", red: "#e5484d", yellow: "#e5a60c",
}

const AVATAR_COLORS = ["#E8714A","#D4603E","#C75535","#B84A2C","#A93F23","#9A341A","#E07040","#CF6538","#BF5A30","#AF4F28"]
const avatarColor = (name) => AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length]

function formatHora(ts) {
  if (!ts) return ""
  const d = new Date(ts), now = new Date(), diff = now - d
  if (diff < 60000) return "ahora"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  const ayer = new Date(now); ayer.setDate(ayer.getDate() - 1)
  if (d.toDateString() === ayer.toDateString()) return "Ayer"
  if (diff < 604800000) return d.toLocaleDateString("es-AR", { weekday: "short" })
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

function Avatar({ nombre, avatarUrl, size = 42, radius = 13 }) {
  const [roto, setRoto] = useState(false)
  const ac = avatarColor(nombre)
  const ini = (nombre || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  if (avatarUrl && !roto) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", flexShrink: 0, boxShadow: `0 2px 8px ${ac}44` }}>
        <img src={avatarUrl} onError={() => setRoto(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(135deg, ${ac}ee 0%, ${ac}77 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: `0 2px 8px ${ac}44` }}>
      {ini}
    </div>
  )
}

function HiloChat({ trainerId, clienteId, miSender, nombreOtro, cliente, onProfileClick }) {
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
        (p) => { if (p.new.cliente_id !== clienteId) return; setMensajes(prev => prev.find(m => m.id === p.new.id) ? prev : [...prev, p.new]) })
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Chat realtime no conectó:", status, err, "— revisá que 'mensajes' esté en la publicación supabase_realtime (supabase-fix-chat-realtime.sql)")
        }
      })
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [trainerId, clienteId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [mensajes])

  const enviar = async () => {
    const t = texto.trim()
    if (!t || enviando) return
    setEnviando(true); setTexto("")
    const { data } = await supabase.from("mensajes").insert({ trainer_id: trainerId, cliente_id: clienteId, sender: miSender, texto: t }).select().single()
    if (data) setMensajes(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
    setEnviando(false)
  }

  const estadoColor = cliente?.meses_deuda > 0 ? C.yellow : C.green
  const estadoLabel = cliente?.meses_deuda > 0 ? "Pago pendiente" : "Al día"

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      {/* Header del hilo */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border2}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, background: C.surface }}>
        <div onClick={onProfileClick} style={{ cursor: onProfileClick ? "pointer" : "default" }}>
          <Avatar nombre={nombreOtro} avatarUrl={cliente?.avatar_url} size={38} radius={12} />
        </div>
        <div style={{ flex: 1 }}>
          <div onClick={onProfileClick} style={{ fontSize: 15, fontWeight: 700, color: C.text, cursor: onProfileClick ? "pointer" : "default" }}>{nombreOtro}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 1 }}>
            {cliente?.objetivo && <span style={{ fontSize: 11, color: C.textMuted }}>{cliente.objetivo}</span>}
            {cliente?.objetivo && <span style={{ fontSize: 10, color: C.textMuted + "44" }}>·</span>}
            <span style={{ fontSize: 11, fontWeight: 600, color: estadoColor }}>{estadoLabel}</span>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6, scrollbarWidth: "none", minHeight: 0, background: C.bg }}>
        {mensajes.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: C.textMuted, fontSize: 13, padding: 20 }}>
            Empezá la conversación con {nombreOtro}
          </div>
        )}
        {mensajes.map((m, i) => {
          const esMio = m.sender === miSender
          const prevMio = i > 0 && mensajes[i - 1].sender === m.sender
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              style={{ width: "100%", display: "flex", justifyContent: esMio ? "flex-end" : "flex-start", marginTop: prevMio ? 2 : 8 }}>
              <div style={{
                maxWidth: "72%", padding: "9px 14px",
                borderRadius: esMio ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                background: esMio ? C.accent : C.surface3,
                border: esMio ? "none" : `1px solid ${C.border2}`,
                boxShadow: esMio ? `0 2px 12px ${C.accent}33` : "none",
              }}>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.45, textAlign: "left" }}>{m.texto}</div>
                <div style={{ fontSize: 10, color: esMio ? "#ffffff88" : C.textMuted, marginTop: 3, textAlign: "right" }}>
                  {formatHora(m.created_at)}
                </div>
              </div>
            </motion.div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border2}`, flexShrink: 0, display: "flex", gap: 10, alignItems: "flex-end", background: C.surface }}>
        <textarea value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar() } }}
          placeholder="Escribí un mensaje..." rows={1}
          style={{ flex: 1, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "11px 15px", color: C.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "-apple-system,sans-serif", maxHeight: 120, lineHeight: 1.45 }}
        />
        <motion.button whileTap={{ scale: 0.9 }} onClick={enviar} disabled={!texto.trim() || enviando}
          style={{ width: 42, height: 42, borderRadius: 13, background: texto.trim() ? C.accent : C.surface3, border: `1px solid ${texto.trim() ? "transparent" : C.border2}`, cursor: texto.trim() ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s, box-shadow 0.2s", boxShadow: texto.trim() ? `0 2px 12px ${C.accent}55` : "none" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </motion.button>
      </div>
    </div>
  )
}

function ConversacionItem({ c, noLeidos, lastMsg, seleccionado, onClick, cargando }) {
  const unread = noLeidos[c.id] || 0
  const isSelected = seleccionado?.id === c.id

  return (
    <motion.div onClick={onClick} whileHover={{ backgroundColor: isSelected ? undefined : C.surface3 }}
      style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", cursor: "pointer", borderRadius: 0, background: isSelected ? `${C.accent}14` : "transparent", transition: "background 0.12s", position: "relative", borderLeft: `2px solid ${isSelected ? C.accent : "transparent"}` }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar nombre={c.nombre} avatarUrl={c.avatar_url} size={40} radius={13} />
        {unread > 0 && (
          <div style={{ position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, background: C.accent, border: `2px solid ${C.bg}`, fontSize: 8, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <div style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 500, color: unread > 0 ? C.text : C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>
            {c.nombre}
          </div>
          <div style={{ fontSize: 10, color: unread > 0 ? C.accent : C.textMuted, fontWeight: unread > 0 ? 700 : 400, flexShrink: 0 }}>
            {lastMsg ? formatHora(lastMsg.created_at) : ""}
          </div>
        </div>
        <div style={{ fontSize: 12, color: unread > 0 ? "#aaa" : C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cargando
            ? <span style={{ color: C.surface3 }}>—</span>
            : lastMsg
              ? <>{lastMsg.sender === "trainer" && <span style={{ color: C.textMuted }}>Tú: </span>}{lastMsg.texto}</>
              : <span style={{ fontStyle: "italic" }}>Iniciar conversación</span>
          }
        </div>
      </div>
      {unread > 0 && (
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
      )}
    </motion.div>
  )
}

export default function Chat({ user, clientes = [], clienteId = null, trainerId = null, modo = "trainer", onProfileClick }) {
  const [seleccionado, setSeleccionado] = useState(null)
  const [noLeidos, setNoLeidos] = useState({})
  const [lastMessages, setLastMessages] = useState({})
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)
  const [isMobile] = useState(() => window.innerWidth < 768)

  const esCliente = modo === "cliente"

  useEffect(() => {
    if (esCliente || !user?.id) { setCargando(false); return }
    supabase.from("mensajes").select("cliente_id,texto,created_at,sender,leido")
      .eq("trainer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const last = {}, counts = {}
          data.forEach(m => {
            if (!last[m.cliente_id]) last[m.cliente_id] = m
            if (!m.leido && m.sender === "cliente") counts[m.cliente_id] = (counts[m.cliente_id] || 0) + 1
          })
          setLastMessages(last); setNoLeidos(counts)
        }
        setCargando(false)
      })
  }, [user?.id, esCliente])

  // Realtime: actualizar la lista de conversaciones (último mensaje +
  // no leídos) sin recargar, apenas llega cualquier mensaje nuevo.
  useEffect(() => {
    if (esCliente || !user?.id) return
    const channel = supabase.channel(`chat-list:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes", filter: `trainer_id=eq.${user.id}` },
        (p) => {
          const m = p.new
          setLastMessages(prev => ({ ...prev, [m.cliente_id]: m }))
          if (m.sender === "cliente" && !m.leido) {
            setNoLeidos(prev => ({ ...prev, [m.cliente_id]: (prev[m.cliente_id] || 0) + 1 }))
          }
        })
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Chat list realtime no conectó:", status, err)
        }
      })
    return () => supabase.removeChannel(channel)
  }, [user?.id, esCliente])

  const sorted = [...clientes].sort((a, b) => {
    const du = (noLeidos[b.id] || 0) - (noLeidos[a.id] || 0)
    if (du !== 0) return du
    return new Date(lastMessages[b.id]?.created_at || 0) - new Date(lastMessages[a.id]?.created_at || 0)
  })
  const filtrados = sorted.filter(c => !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  const totalNoLeidos = Object.values(noLeidos).reduce((s, n) => s + n, 0)

  // Modo cliente
  if (esCliente) {
    if (!clienteId || !trainerId) return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: C.textMuted }}>Conectate con tu entrenador para chatear</div>
      </div>
    )
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <HiloChat trainerId={trainerId} clienteId={clienteId} miSender="cliente" nombreOtro="Tu entrenador" onProfileClick={onProfileClick} />
      </div>
    )
  }

  // Panel lista
  const Lista = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 16px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: -0.4 }}>Mensajes</div>
          {totalNoLeidos > 0 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{ background: C.accent, borderRadius: 8, padding: "2px 9px", fontSize: 11, fontWeight: 700, color: "#fff" }}>
              {totalNoLeidos}
            </motion.div>
          )}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
          {clientes.length} conversaci{clientes.length === 1 ? "ón" : "ones"}
        </div>
      </div>

      {clientes.length > 0 && (
        <div style={{ padding: "0 12px 8px", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ width: "100%", background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "8px 12px 8px 28px", color: C.text, fontSize: 12, outline: "none", fontFamily: "-apple-system,sans-serif", boxSizing: "border-box" }} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", minHeight: 0 }}>
        {clientes.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
            Agregá clientes para chatear
          </div>
        )}
        {cargando && clientes.length > 0
          ? clientes.map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: C.surface3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ width: "45%", height: 12, borderRadius: 6, background: C.surface3, marginBottom: 7 }} />
                  <div style={{ width: "65%", height: 10, borderRadius: 6, background: C.surface2 }} />
                </div>
              </div>
            ))
          : filtrados.map(c => (
              <ConversacionItem key={c.id} c={c} noLeidos={noLeidos} lastMsg={lastMessages[c.id]} seleccionado={seleccionado} onClick={() => setSeleccionado(c)} cargando={cargando} />
            ))
        }
      </div>
    </div>
  )

  // Mobile
  if (isMobile) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {!seleccionado ? (
            <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {Lista}
            </motion.div>
          ) : (
            <motion.div key="hilo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border2}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 10, background: C.surface }}>
                <button onClick={() => setSeleccionado(null)} style={{ background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div onClick={() => onProfileClick?.(seleccionado)} style={{ cursor: onProfileClick ? "pointer" : "default" }}>
                  <Avatar nombre={seleccionado.nombre} avatarUrl={seleccionado.avatar_url} size={28} radius={9} />
                </div>
                <div onClick={() => onProfileClick?.(seleccionado)} style={{ fontSize: 14, fontWeight: 600, color: C.text, cursor: onProfileClick ? "pointer" : "default" }}>{seleccionado.nombre}</div>
              </div>
              <HiloChat trainerId={user?.id} clienteId={seleccionado.id} miSender="trainer" nombreOtro={seleccionado.nombre} cliente={seleccionado} onProfileClick={() => onProfileClick?.(seleccionado)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Desktop — 2 paneles
  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
      {/* Lista */}
      <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${C.border2}`, display: "flex", flexDirection: "column", background: C.surface, minHeight: 0 }}>
        {Lista}
      </div>
      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: C.bg }}>
        {seleccionado ? (
          <HiloChat trainerId={user?.id} clienteId={seleccionado.id} miSender="trainer" nombreOtro={seleccionado.nombre} cliente={seleccionado} onProfileClick={() => onProfileClick?.(seleccionado)} />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: 8, background: C.surface, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.textSub }}>Seleccioná una conversación</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Elegí un cliente de la lista</div>
          </div>
        )}
      </div>
    </div>
  )
}
