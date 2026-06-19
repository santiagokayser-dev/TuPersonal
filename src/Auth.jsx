import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const COLORS = {
  bg: "#060A10", surface: "#0C1220", border: "#1E2D4A",
  accent: "#2563EB", accentSub: "#1E3A8A", text: "#fff",
  textMuted: "#94A3B8", green: "#4ade80", red: "#f87171",
}

const S = {
  container: { background: COLORS.bg, minHeight: "100dvh", display: "flex", justifyContent: "center", alignItems: "flex-start", fontFamily: "-apple-system, sans-serif", padding: "0 16px" },
  phone: { width: "100%", maxWidth: 420, background: COLORS.bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 16px 32px" },
  input: { background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 16px", color: COLORS.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", marginBottom: 12, boxSizing: "border-box" },
  btn: (bg) => ({ background: bg || COLORS.accent, border: "none", borderRadius: 12, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", marginBottom: 12 }),
  btnGoogle: { background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: "13px 0", color: COLORS.text, fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  link: { color: COLORS.accent, fontSize: 13, cursor: "pointer", textAlign: "center", marginTop: 8 },
  error: { color: COLORS.red, fontSize: 13, textAlign: "center", marginBottom: 12 },
  logo: { fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 32, letterSpacing: -0.5 },
}

function RolSelector({ rol, onChange }) {
  const opciones = [
    {
      id: "trainer",
      label: "Entrenador",
      desc: "Gestioná clientes, rutinas y cobros",
      icon: (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h2v5H3zM19 9.5h2v5h-2zM5 7.5h2v9H5zM17 7.5h2v9h-2z"/>
        </svg>
      ),
    },
    {
      id: "cliente",
      label: "Atleta",
      desc: "Seguí tu entrenamiento y progreso",
      icon: (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
      {opciones.map(o => {
        const activo = rol === o.id
        return (
          <motion.button key={o.id} whileTap={{ scale: 0.97 }} onClick={() => onChange(o.id)}
            style={{ background: activo ? COLORS.accentSub : COLORS.surface, border: `1.5px solid ${activo ? COLORS.accent : COLORS.border}`, borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
            <div style={{ color: activo ? COLORS.accent : COLORS.textMuted, marginBottom: 8 }}>{o.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: activo ? "#fff" : COLORS.textMuted, marginBottom: 4 }}>{o.label}</div>
            <div style={{ fontSize: 11, color: activo ? "#93C5FD" : "#64748B", lineHeight: 1.4 }}>{o.desc}</div>
          </motion.button>
        )
      })}
    </div>
  )
}

export default function Auth() {
  const params = new URLSearchParams(window.location.search)
  const inviteTrainerId = params.get("invite")

  const [modo, setModo] = useState(inviteTrainerId ? "registro" : "login")
  const [rol, setRol] = useState(inviteTrainerId ? "cliente" : "trainer")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")

  const handleLogin = async () => {
    if (!email || !password) return setError("Completá todos los campos")
    setCargando(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError("Email o contraseña incorrectos")
    setCargando(false)
  }

  const handleRegistro = async () => {
    if (!email || !password) return setError("Completá email y contraseña")
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres")
    setCargando(true)
    setError("")

    const rolFinal = inviteTrainerId ? "cliente" : rol
    const metadata = {
      nombre,
      rol: rolFinal,
      ...(inviteTrainerId ? { trainer_id: inviteTrainerId } : {}),
    }

    const emailRedirect = inviteTrainerId
      ? `${window.location.origin}?invite=${inviteTrainerId}&rol=cliente`
      : window.location.origin
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata, emailRedirectTo: emailRedirect } })

    if (error) {
      setError(error.message)
    } else if (inviteTrainerId && data?.user) {
      await supabase.from("clientes").update({ user_id: data.user.id }).eq("email", email).eq("trainer_id", inviteTrainerId)
      setMensaje("¡Cuenta creada! Revisá tu email para confirmar.")
    } else {
      setMensaje("Revisá tu email para confirmar tu cuenta")
    }
    setCargando(false)
  }

  const handleGoogle = async () => {
    const redirectTo = inviteTrainerId
      ? `${window.location.origin}?invite=${inviteTrainerId}`
      : window.location.origin
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })
  }

  const irARegistro = () => { setModo("registro"); setError(""); setMensaje("") }
  const irALogin = () => { setModo("login"); setError(""); setMensaje("") }

  return (
    <div style={S.container}>
      <div style={S.phone}>
        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: 32 }}>
          <img src="/logo-white.png" alt="TuPersonal" style={{ height: "auto", width: "auto", maxHeight: 120, maxWidth: 180, objectFit: "contain" }} />
        </div>

        {inviteTrainerId && (
          <div style={{ background: "#1E3A8A33", border: `0.5px solid ${COLORS.accent}33`, borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#93C5FD" }}>
            Fuiste invitado por tu entrenador. Creá tu cuenta para continuar.
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={modo} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>

            {modo === "login" ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Bienvenido</div>
                <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24 }}>Iniciá sesión para continuar</div>

                {error && <div style={S.error}>{error}</div>}
                {mensaje && <div style={{ ...S.error, color: COLORS.green }}>{mensaje}</div>}

                <input style={S.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()} />
                <input style={S.input} type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()} />

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogin} style={S.btn()} disabled={cargando}>
                  {cargando ? "Ingresando..." : "Iniciar sesión"}
                </motion.button>

                <button onClick={handleGoogle} style={S.btnGoogle}>
                  <span style={{ fontSize: 16 }}>G</span> Continuar con Google
                </button>

                <div style={S.link} onClick={irARegistro}>¿No tenés cuenta? Registrate</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
                  {inviteTrainerId ? "Crear tu cuenta" : "Crear cuenta"}
                </div>
                <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 20 }}>
                  {inviteTrainerId ? "Tu entrenador te invitó a la plataforma" : "¿Cómo vas a usar TuPersonal?"}
                </div>

                {error && <div style={S.error}>{error}</div>}
                {mensaje && <div style={{ ...S.error, color: COLORS.green }}>{mensaje}</div>}

                {!inviteTrainerId && <RolSelector rol={rol} onChange={setRol} />}

                {(!inviteTrainerId && rol === "trainer") && (
                  <input style={S.input} type="text" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
                )}

                <input style={S.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input style={S.input} type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleRegistro()} />

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleRegistro} style={S.btn()} disabled={cargando}>
                  {cargando ? "Creando cuenta..." : `Crear cuenta${!inviteTrainerId ? ` como ${rol === "trainer" ? "entrenador" : "atleta"}` : ""}`}
                </motion.button>

                <button onClick={handleGoogle} style={S.btnGoogle}>
                  <span style={{ fontSize: 16 }}>G</span> Continuar con Google
                </button>

                <div style={S.link} onClick={irALogin}>¿Ya tenés cuenta? Iniciá sesión</div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
