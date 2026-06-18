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
  bg: "#080808", surface: "#111111", surface2: "#1a1a1a", border: "#222222",
  text: "#ffffff", textSub: "#888888", textMuted: "#444444", accent: "#6366f1",
}

function formatHora(ts) {
  const d = new Date(ts)
  const hoy = new Date()
  if (d.toDateString() === hoy.toDateString()) {
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  }
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

    supabase.from("mensajes")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (mounted && data) setMensajes(data) })

    const channel = supabase.channel(`chat:${trainerId}:${clienteId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "mensajes",
        filter: `trainer_id=eq.${trainerId}`,
      }, (payload) => {
        if (payload.new.cliente_id !== clienteId) return
        setMensajes(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
      })
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [trainerId, clienteId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  const enviar = async () => {
    const t = texto.trim()
    if (!t || enviando) return
    setEnviando(true)
    setTexto("")
    const { data } = await supabase.from("mensajes").insert({
      trainer_id: trainerId,
      cliente_id: clienteId,
      sender: miSender,
      texto: t,
    }).select().single()
    if (data) setMensajes(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
    setEnviando(false)
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header del hilo */}
      <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{nombreOtro}</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Conversación privada</div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, scrollbarWidth: "none" }}>
        {mensajes.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, marginTop: 32 }}>
            Empezá la conversación
          </div>
        )}
        {mensajes.map((m) => {
          const esMio = m.sender === miSender
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", justifyContent: esMio ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "75%", padding: "9px 13px", borderRadius: esMio ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: esMio ? COLORS.accent : COLORS.surface,
                border: esMio ? "none" : `0.5px solid ${COLORS.border}`,
              }}>
                <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.4 }}>{m.texto}</div>
                <div style={{ fontSize: 10, color: esMio ? "#a5b4fc" : COLORS.textMuted, marginTop: 4, textAlign: "right" }}>
                  {formatHora(m.created_at)}
                </div>
              </div>
            </motion.div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: `0.5px solid ${COLORS.border}`, flexShrink: 0, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar() } }}
          placeholder="Escribí un mensaje..."
          rows={1}
          style={{
            flex: 1, background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 12,
            padding: "10px 13px", color: COLORS.text, fontSize: 14, outline: "none", resize: "none",
            fontFamily: "-apple-system, sans-serif", maxHeight: 100, lineHeight: 1.4,
          }}
        />
        <motion.button whileTap={{ scale: 0.93 }} onClick={enviar} disabled={!texto.trim() || enviando}
          style={{
            width: 40, height: 40, borderRadius: 12, background: texto.trim() ? COLORS.accent : COLORS.surface2,
            border: "none", cursor: texto.trim() ? "pointer" : "default", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s",
          }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </motion.button>
      </div>
    </div>
  )
}

// modo="trainer": user=trainer, clientes=[...], muestra lista + hilo
// modo="cliente": user=cliente, clienteId, trainerId
export default function Chat({ user, clientes = [], clienteId = null, trainerId = null, modo = "trainer" }) {
  const [seleccionado, setSeleccionado] = useState(null)
  const [noLeidos, setNoLeidos] = useState({})

  const esCliente = modo === "cliente"
  const currentClienteId = esCliente ? clienteId : seleccionado?.id
  const currentTrainerId = esCliente ? trainerId : user?.id
  const nombreOtro = esCliente ? "Tu entrenador" : (seleccionado?.nombre || "")

  // Cargar no leídos por cliente (trainer)
  useEffect(() => {
    if (esCliente || !user?.id) return
    supabase.from("mensajes")
      .select("cliente_id")
      .eq("trainer_id", user.id)
      .eq("sender", "cliente")
      .eq("leido", false)
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        data.forEach(m => { counts[m.cliente_id] = (counts[m.cliente_id] || 0) + 1 })
        setNoLeidos(counts)
      })
  }, [user?.id, esCliente])

  // Modo cliente: directo al hilo
  if (esCliente) {
    if (!clienteId || !trainerId) {
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ fontSize: 14, color: COLORS.textMuted, textAlign: "center" }}>
            Conectate con tu entrenador para chatear
          </div>
        </div>
      )
    }
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 8px", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.text }}>Chat</div>
        </div>
        <HiloChat trainerId={trainerId} clienteId={clienteId} miSender="cliente" nombreOtro="Tu entrenador" />
      </div>
    )
  }

  // Modo trainer
  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Lista de clientes */}
      <AnimatePresence>
        {(!seleccionado) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.text }}>Mensajes</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 6, scrollbarWidth: "none" }}>
              {clientes.length === 0 && (
                <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 14, paddingTop: 40 }}>
                  Agregá clientes para chatear con ellos
                </div>
              )}
              {clientes.map(c => (
                <motion.button key={c.id} whileTap={{ scale: 0.98 }} onClick={() => setSeleccionado(c)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 14, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 13, background: COLORS.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.accent, flexShrink: 0, position: "relative" }}>
                    {c.ini || (c.nombre || "?").slice(0, 2).toUpperCase()}
                    {noLeidos[c.id] > 0 && (
                      <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: COLORS.accent, fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {noLeidos[c.id]}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Toca para chatear</div>
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hilo seleccionado */}
      <AnimatePresence>
        {seleccionado && (
          <motion.div key="hilo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            style={{ width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${COLORS.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setSeleccionado(null)}
                style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="1.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{seleccionado.nombre}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Chat privado</div>
              </div>
            </div>
            <HiloChat
              trainerId={user?.id}
              clienteId={seleccionado.id}
              miSender="trainer"
              nombreOtro={seleccionado.nombre}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
