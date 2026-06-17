import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const S = {
  container: { background: "#0D0D0F", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "-apple-system, sans-serif" },
  phone: { width: 375, height: 720, background: "#0D0D0F", borderRadius: 36, border: "2px solid #2a2a2e", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", padding: 32 },
  title: { fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 4 },
  sub: { fontSize: 14, color: "#666", marginBottom: 32 },
  input: { background: "#1a1a1e", border: "0.5px solid #2a2a2e", borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 14, width: "100%", outline: "none", fontFamily: "-apple-system, sans-serif", marginBottom: 12, boxSizing: "border-box" },
  btn: (bg) => ({ background: bg || "#6366f1", border: "none", borderRadius: 12, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", marginBottom: 12 }),
  btnGoogle: { background: "#1a1a1e", border: "0.5px solid #2a2a2e", borderRadius: 12, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  link: { color: "#6366f1", fontSize: 13, cursor: "pointer", textAlign: "center", marginTop: 8 },
  error: { color: "#f87171", fontSize: 13, textAlign: "center", marginBottom: 12 },
  logo: { fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 32, letterSpacing: -0.5 },
}

export default function Auth() {
  const params = new URLSearchParams(window.location.search)
  const inviteTrainerId = params.get("invite")

  const [modo, setModo] = useState(inviteTrainerId ? "registro" : "login")
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
    setCargando(true)
    setError("")

    const metadata = inviteTrainerId
      ? { nombre, rol: "cliente", trainer_id: inviteTrainerId }
      : { nombre, rol: "trainer" }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })

    if (error) {
      setError(error.message)
    } else if (inviteTrainerId && data?.user) {
      // Link client to trainer's clientes table
      await supabase.from("clientes")
        .update({ user_id: data.user.id })
        .eq("email", email)
        .eq("trainer_id", inviteTrainerId)
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

  return (
    <div style={S.container}>
      <div style={S.phone}>
        <div style={S.logo}>TuPersonal<span style={{ color: "#6366f1" }}>.</span></div>

        {inviteTrainerId && (
          <div style={{ background: "#312e8133", border: "0.5px solid #6366f133", borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#a5b4fc" }}>
            Fuiste invitado por tu entrenador. Creá tu cuenta para continuar.
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={modo} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>

            {modo === "login" ? (
              <>
                <div style={S.title}>Bienvenido</div>
                <div style={S.sub}>Iniciá sesión para continuar</div>

                {error && <div style={S.error}>{error}</div>}
                {mensaje && <div style={{ ...S.error, color: "#4ade80" }}>{mensaje}</div>}

                <input style={S.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input style={S.input} type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogin} style={S.btn()} disabled={cargando}>
                  {cargando ? "Ingresando..." : "Iniciar sesión"}
                </motion.button>

                <button onClick={handleGoogle} style={S.btnGoogle}>
                  <span style={{ fontSize: 16 }}>G</span> Continuar con Google
                </button>

                <div style={S.link} onClick={() => { setModo("registro"); setError("") }}>
                  ¿No tenés cuenta? Registrate
                </div>
              </>
            ) : (
              <>
                <div style={S.title}>{inviteTrainerId ? "Crear tu cuenta" : "Crear cuenta"}</div>
                <div style={S.sub}>{inviteTrainerId ? "Tus datos se cargan después del login" : "Empezá a gestionar tus clientes"}</div>

                {error && <div style={S.error}>{error}</div>}
                {mensaje && <div style={{ ...S.error, color: "#4ade80" }}>{mensaje}</div>}

                {!inviteTrainerId && (
                  <input style={S.input} type="text" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
                )}
                <input style={S.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input style={S.input} type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} />

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleRegistro} style={S.btn()} disabled={cargando}>
                  {cargando ? "Creando cuenta..." : "Crear cuenta"}
                </motion.button>

                {!inviteTrainerId && (
                  <button onClick={handleGoogle} style={S.btnGoogle}>
                    <span style={{ fontSize: 16 }}>G</span> Continuar con Google
                  </button>
                )}

                <div style={S.link} onClick={() => { setModo("login"); setError("") }}>
                  ¿Ya tenés cuenta? Iniciá sesión
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
