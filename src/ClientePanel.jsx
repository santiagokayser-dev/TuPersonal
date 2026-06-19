import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"
import Chat from "./Chat"

const COLORS = {
  bg: "#060A10", surface: "#0C1220", surface2: "#111927", border: "#1A2540", border2: "#1E2D4A",
  text: "#FFFFFF", textSub: "#94A3B8", textMuted: "#475569", accent: "#2563EB", accentSub: "#1E3A8A", accentLight: "#93C5FD",
  green: "#22c55e", red: "#ef4444", yellow: "#f59e0b",
}

const T = {
  h1: { fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: -0.8, lineHeight: 1.1 },
  h2: { fontSize: 20, fontWeight: 600, color: COLORS.text, letterSpacing: -0.4 },
  h3: { fontSize: 15, fontWeight: 600, color: COLORS.text, letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: 400, color: COLORS.textSub, lineHeight: 1.5 },
  label: { fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1.2 },
  num: { fontSize: 32, fontWeight: 700, color: COLORS.text, letterSpacing: -1 },
}

const inputStyle = { background: COLORS.surface2, border: `0.5px solid ${COLORS.border2}`, borderRadius: 12, padding: "11px 14px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", boxSizing: "border-box", marginBottom: 8 }

const Icon = ({ name, size = 20, color = COLORS.textSub }) => {
  const icons = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/>,
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
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">{icons[name]}</svg>
}

const navItems = [
  { id: "inicio", icon: "home", label: "Inicio" },
  { id: "rutina", icon: "dumbbell", label: "Rutina" },
  { id: "progreso", icon: "trendingUp", label: "Progreso" },
  { id: "chat", icon: "chat", label: "Chat" },
  { id: "pagos", icon: "wallet", label: "Pagos" },
]

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

function Onboarding({ user, perfilExistente, onComplete }) {
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
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
        avatar_url = urlData.publicUrl
      }
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
        style={{ background: COLORS.accent, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.6 : 1 }}>
        {guardando ? "Guardando..." : "Empezar →"}
      </motion.button>
    </div>
  )
}

function Inicio({ perfil, onLogout, onActualizar }) {
  const nombre = perfil?.nombre || "Atleta"
  const ini = nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  const handleAvatarChange = async (file) => {
    const ext = file.name.split(".").pop()
    const path = `${perfil.user_id || perfil.id}.${ext}`
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
      const avatar_url = urlData.publicUrl
      await supabase.from("clientes").update({ avatar_url }).eq("id", perfil.id)
      onActualizar({ ...perfil, avatar_url })
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <label style={{ cursor: "pointer", position: "relative", flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: COLORS.accent + "22", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: COLORS.accent }}>
              {perfil?.avatar_url
                ? <img src={perfil.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : ini}
            </div>
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 6, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarChange(f) }} />
          </label>
          <div>
            <div style={{ ...T.label, marginBottom: 4 }}>Tu entrenador</div>
            <div style={T.h1}>Hola, {nombre.split(" ")[0]}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: 8, cursor: "pointer", display: "flex" }}>
          <Icon name="logout" size={16} color={COLORS.textSub} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
          <div style={T.label}>Peso actual</div>
          <div style={{ ...T.num, fontSize: 26, marginTop: 6 }}>{perfil?.peso ? `${perfil.peso}kg` : "—"}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Actualizalo en Progreso</div>
        </div>
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
          <div style={T.label}>Objetivo</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, marginTop: 8, lineHeight: 1.4 }}>{perfil?.objetivo || "Sin definir"}</div>
        </div>
      </div>

      {perfil?.objetivo && (
        <div style={{ background: COLORS.accentSub, borderRadius: 18, padding: 18, border: `0.5px solid ${COLORS.accent}33` }}>
          <div style={{ ...T.label, color: COLORS.accentLight, marginBottom: 6 }}>Tu meta</div>
          <div style={T.h3}>{perfil.objetivo}</div>
          <div style={{ ...T.body, color: "#818cf8", marginTop: 6, fontSize: 13 }}>Seguí avanzando — vas por buen camino.</div>
        </div>
      )}

      <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ ...T.label, marginBottom: 8 }}>Tus datos</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { l: "Peso", v: perfil?.peso ? `${perfil.peso}kg` : "—" },
            { l: "Altura", v: perfil?.altura ? `${perfil.altura}cm` : "—" },
            { l: "Edad", v: perfil?.edad ? `${perfil.edad}a` : "—" },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{m.v}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Rutina({ perfil }) {
  const [rutinas, setRutinas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [diaAbierto, setDiaAbierto] = useState(0)
  const [ejercicioActivo, setEjercicioActivo] = useState(null)

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
      <div style={{ background: COLORS.surface, borderRadius: 16, padding: 24, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
        Tu entrenador todavía no te asignó una rutina.
      </div>
    </div>
  )

  const rutina = rutinas[0]
  const dias = (() => { try { return JSON.parse(rutina.dias || "[]") } catch { return [] } })()

  return (
    <>
      <div>
        <div style={{ ...T.label, marginBottom: 6 }}>Programa actual</div>
        <div style={T.h1}>Mi rutina</div>
      </div>

      <div style={{ background: COLORS.accentSub, borderRadius: 18, padding: 16, border: `0.5px solid ${COLORS.accent}33` }}>
        <div style={{ ...T.label, color: COLORS.accentLight, marginBottom: 6 }}>Rutina asignada</div>
        <div style={T.h3}>{rutina.nombre}</div>
        <div style={{ ...T.body, color: "#818cf8", marginTop: 4, fontSize: 13 }}>{dias.length} días de entrenamiento</div>
      </div>

      {dias.map((dia, i) => {
        const abierto = diaAbierto === i
        const ejercicios = dia.bloques?.flatMap(b => b.ejercicios || []) || dia.ejercicios || []
        return (
          <motion.div key={i} style={{ background: COLORS.surface, borderRadius: 18, border: `0.5px solid ${abierto ? COLORS.accent + "66" : COLORS.border}`, overflow: "hidden" }}>
            <div onClick={() => setDiaAbierto(abierto ? -1 : i)}
              style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 14, background: abierto ? COLORS.accent : COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: abierto ? "#fff" : COLORS.textSub, flexShrink: 0 }}>
                {String.fromCharCode(65 + i)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={T.h3}>{dia.nombre || `Día ${i + 1}`}</div>
                <div style={{ ...T.body, fontSize: 12, marginTop: 2 }}>{ejercicios.length} ejercicios</div>
              </div>
              <motion.div animate={{ rotate: abierto ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <Icon name="chevronRight" size={16} color={COLORS.textMuted} />
              </motion.div>
            </div>

            <AnimatePresence>
              {abierto && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  style={{ overflow: "hidden", borderTop: `0.5px solid ${COLORS.border}` }}>
                  {ejercicios.map((ej, j) => {
                    const activo = ejercicioActivo === `${i}-${j}`
                    const ytUrl = ej.video || `https://www.youtube.com/results?search_query=${encodeURIComponent((ej.nombre || "") + " técnica correcta")}`
                    return (
                      <div key={j}>
                        <div onClick={() => setEjercicioActivo(activo ? null : `${i}-${j}`)}
                          style={{ padding: "13px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: `0.5px solid ${COLORS.border}`, cursor: "pointer" }}>
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
                        <AnimatePresence>
                          {activo && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              style={{ overflow: "hidden", background: COLORS.bg, borderBottom: `0.5px solid ${COLORS.border}` }}>
                              <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                                {ej.notas && <div style={{ fontSize: 13, color: COLORS.textSub, fontStyle: "italic" }}>"{ej.notas}"</div>}
                                <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ display: "flex", alignItems: "center", gap: 10, background: "#3a1a1a", borderRadius: 12, padding: "11px 14px", textDecoration: "none" }}>
                                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "#ef444422", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Icon name="play" size={13} color={COLORS.red} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fca5a5" }}>Ver técnica</div>
                                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>YouTube · {ej.nombre}</div>
                                  </div>
                                </a>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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
      <div style={{ background: COLORS.surface, borderRadius: 18, padding: 18, border: `0.5px solid ${COLORS.border}` }}>
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
              style={{ background: COLORS.accent, border: "none", borderRadius: 12, padding: "0 16px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", flexShrink: 0, opacity: guardandoPeso ? 0.5 : 1 }}>
              {guardandoPeso ? "..." : "OK"}
            </button>
            <button onClick={() => setEditandoPeso(false)}
              style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: "0 12px", color: COLORS.textSub, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
              ✕
            </button>
          </div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditandoPeso(true)}
            style={{ marginTop: 14, background: COLORS.surface2, border: `0.5px solid ${COLORS.border2}`, borderRadius: 12, padding: "10px 0", color: COLORS.text, fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" }}>
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
                  style={{ background: COLORS.accent, border: "none", borderRadius: 12, padding: "0 14px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  +
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {Object.keys(cargas).length === 0 && !agregando && (
          <div style={{ background: COLORS.surface, borderRadius: 14, padding: 20, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
            Agregá tus ejercicios y la carga que usás en cada uno.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(cargas).map(([nombre, carga]) => (
            <motion.div key={nombre} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: COLORS.surface, borderRadius: 14, padding: "13px 16px", border: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
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
                      style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 10, padding: "0 10px", color: COLORS.textSub, fontSize: 13, cursor: "pointer" }}>
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
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
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
      <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
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
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", background: COLORS.surface2 }}>
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
          style={{ padding: "14px 20px", borderRadius: 14, background: "#009ee3", color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
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
      const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mpSettings.mp_access_token}` },
        body: JSON.stringify({
          items: [{ title: "Plan mensual entrenamiento personal", quantity: 1, unit_price: Number(perfil.precio), currency_id: "ARS" }],
          back_urls: { success: window.location.href, failure: window.location.href, pending: window.location.href },
          auto_return: "approved",
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

      <div style={{ background: COLORS.surface, borderRadius: 18, padding: 18, border: `0.5px solid ${COLORS.border}` }}>
        <div style={T.label}>Plan mensual</div>
        <div style={{ ...T.num, fontSize: 32, marginTop: 8, color: COLORS.text }}>
          {perfil?.precio ? `$${Number(perfil.precio).toLocaleString("es-AR")}` : "—"}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>por mes · entrenamiento personal</div>

        {error && <div style={{ fontSize: 12, color: COLORS.red, marginTop: 12 }}>{error}</div>}

        {mpSettings === null ? (
          <div style={{ marginTop: 16, height: 44, background: COLORS.surface2, borderRadius: 12 }} />
        ) : hasAccessToken && perfil?.precio ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={pagarConMP} disabled={generando}
            style={{ width: "100%", padding: "13px 0", borderRadius: 14, background: "#009ee3", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16, opacity: generando ? 0.7 : 1 }}>
            {generando ? "Generando link..." : "Pagar con Mercado Pago"}
          </motion.button>
        ) : hasAlias ? (
          <AliasCard alias={mpSettings.mp_alias} monto={perfil?.precio} />
        ) : (
          <div style={{ marginTop: 16, fontSize: 13, color: COLORS.textMuted, background: COLORS.surface2, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            Coordiná el pago con tu entrenador
          </div>
        )}
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 14, padding: 14, border: `0.5px dashed ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>
        El seguimiento de pagos y historial lo gestiona tu entrenador.
      </div>
    </>
  )
}

export default function ClientePanel({ user, onLogout, initialPerfil = null, previewMode = false }) {
  const [perfil, setPerfil] = useState(initialPerfil)
  const [cargando, setCargando] = useState(!initialPerfil)
  const [activePage, setActivePage] = useState("inicio")

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
      // Fallback: load profile from auth user metadata if DB is inaccessible due to RLS
      if (!data || !data.nombre) {
        const metaPerfil = user.user_metadata?.perfil_cliente
        if (metaPerfil?.nombre) {
          data = data ? { ...data, ...metaPerfil } : { ...metaPerfil }
        }
      }
      setPerfil(data)
      setCargando(false)
    }
    cargar()
  }, [user?.id, user?.email, initialPerfil])

  const screenStyle = { flex: 1, overflowY: "scroll", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }

  if (cargando) return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "-apple-system, sans-serif" }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}
        style={{ fontSize: 13, color: COLORS.textMuted }}>Cargando...</motion.div>
    </div>
  )

  if (!previewMode && (!perfil || !perfil.nombre)) return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", overflowY: "auto", scrollbarWidth: "none", fontFamily: "-apple-system, sans-serif" }}>
      <Onboarding user={user} perfilExistente={perfil} onComplete={(data) => setPerfil(data)} />
    </div>
  )

  const perfilMock = perfil || { nombre: "Cliente", objetivo: "Sin definir", peso: null, altura: null, edad: null, precio: null }

  const renderPage = () => {
    const pages = {
      inicio: <Inicio perfil={perfilMock} onLogout={onLogout} onActualizar={previewMode ? () => {} : setPerfil} />,
      rutina: <Rutina perfil={perfilMock} />,
      progreso: <Progreso perfil={perfilMock} onActualizar={previewMode ? () => {} : setPerfil} />,
      chat: <Chat user={user} clienteId={perfilMock?.id} trainerId={perfilMock?.trainer_id} modo="cliente" />,
      pagos: <Pagos perfil={perfilMock} />,
    }
    return (
      <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={screenStyle}>
        {pages[activePage]}
      </motion.div>
    )
  }

  const inner = (
    <div style={{ background: COLORS.bg, height: "100%", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      {previewMode && (
        <div style={{ background: COLORS.accent + "22", borderBottom: `0.5px solid ${COLORS.accent}44`, padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, letterSpacing: 0.5 }}>Vista previa — como lo ve el cliente</div>
          <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: COLORS.accent, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
      </div>
      <nav style={{ background: COLORS.bg, borderTop: `0.5px solid ${COLORS.border}`, display: "flex", paddingTop: 2, paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: 0, paddingRight: 0, flexShrink: 0 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActivePage(item.id)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0" }}>
            <Icon name={item.icon} size={22} color={activePage === item.id ? COLORS.accent : COLORS.textMuted} />
            <span style={{ fontSize: 10, fontWeight: 500, color: activePage === item.id ? COLORS.accent : COLORS.textMuted }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )

  if (previewMode) return inner

  return (
    <div style={{ background: COLORS.bg, height: "var(--app-height, 100dvh)", display: "flex", flexDirection: "column" }}>
      {inner}
    </div>
  )
}
