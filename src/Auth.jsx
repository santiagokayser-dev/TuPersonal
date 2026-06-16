import { useState } from "react"
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
  const [modo, setModo] = useState("login")
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
    if (!email || !password || !nombre) return setError("Completá todos los campos")
    setCargando(true)
    setError("")
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { nombre } }
    })
    if (error) setError(error.message)
    else setMensaje("Revisá tu email para confirmar tu cuenta")
    setCargando(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  return (
    <div style={S.container}>
      <div style={S.phone}>
        <div style={S.logo}>TuPersonal<span style={{ color: "#6366f1" }}>.</span></div>

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
                <div style={S.title}>Crear cuenta</div>
                <div style={S.sub}>Empezá a gestionar tus clientes</div>

                {error && <div style={S.error}>{error}</div>}
                {mensaje && <div style={{ ...S.error, color: "#4ade80" }}>{mensaje}</div>}

                <input style={S.input} type="text" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
                <input style={S.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input style={S.input} type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleRegistro} style={S.btn()} disabled={cargando}>
                  {cargando ? "Creando cuenta..." : "Crear cuenta"}
                </motion.button>

                <button onClick={handleGoogle} style={S.btnGoogle}>
                  <span style={{ fontSize: 16 }}>G</span> Continuar con Google
                </button>

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