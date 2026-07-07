import { StrictMode, useState, useEffect, lazy, Suspense, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { motion } from 'framer-motion'
import { supabase } from './supabase'
import './index.css'

// Cada rama se carga solo cuando se necesita: un visitante baja solo la Landing,
// un atleta solo su panel, un entrenador solo la app de gestión.
const App = lazy(() => import('./App.jsx'))
const Auth = lazy(() => import('./Auth.jsx'))
const ClientePanel = lazy(() => import('./ClientePanel.jsx'))
const Landing = lazy(() => import('./Landing.jsx'))

function Cargando() {
  return (
    <div style={{ background: "#111111", height: "var(--app-height, 100dvh)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}
        style={{ fontSize: 13, color: "#555", fontFamily: "-apple-system, sans-serif" }}>Cargando...</motion.div>
    </div>
  )
}

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ background: "#111111", height: "var(--app-height, 100dvh)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, fontFamily: "-apple-system, sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#efefef" }}>Algo salió mal</div>
        <div style={{ fontSize: 13, color: "#999", maxWidth: 320, lineHeight: 1.5 }}>Ocurrió un error inesperado. Recargá la app para continuar — tus datos están guardados.</div>
        <button onClick={() => window.location.reload()}
          style={{ background: "#E8714A", border: "none", borderRadius: 10, padding: "11px 28px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Recargar
        </button>
      </div>
    )
  }
}

const COLORS = { bg: "#111111", surface: "#191919", border: "#2a2a2a", accent: "#E8714A", accentSub: "#2a1a12", text: "#fff", textMuted: "#999999" }

function ElegirRol({ onElegir }) {
  const [eligiendo, setEligiendo] = useState(false)
  const opciones = [
    {
      id: "trainer",
      label: "Entrenador",
      desc: "Gestioná clientes, rutinas y cobros",
      icon: (
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h2v5H3zM19 9.5h2v5h-2zM5 7.5h2v9H5zM17 7.5h2v9h-2z"/>
        </svg>
      ),
    },
    {
      id: "cliente",
      label: "Atleta",
      desc: "Seguí tu entrenamiento y progreso",
      icon: (
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>
        </svg>
      ),
    },
  ]

  const elegir = async (r) => {
    setEligiendo(true)
    await supabase.auth.updateUser({ data: { rol: r } })
    onElegir(r)
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "var(--app-height, 100dvh)", display: "flex", justifyContent: "center", alignItems: "center", padding: "0 16px", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <img src="/logo-white.png" alt="TuPersonal" style={{ height: "auto", width: "auto", maxHeight: 100, maxWidth: 160, objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, marginBottom: 8, textAlign: "center" }}>¿Cómo vas a usar TuPersonal?</div>
        <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 32, textAlign: "center" }}>Elegí tu rol para continuar</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {opciones.map(o => (
            <motion.button key={o.id} whileTap={{ scale: 0.97 }} onClick={() => elegir(o.id)} disabled={eligiendo}
              style={{ background: COLORS.surface, border: `1.5px solid ${COLORS.border}`, borderRadius: 18, padding: "24px 16px", cursor: eligiendo ? "wait" : "pointer", textAlign: "left", opacity: eligiendo ? 0.6 : 1 }}>
              <div style={{ color: COLORS.accent, marginBottom: 12 }}>{o.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>{o.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Root() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rol, setRol] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState("login")

  useEffect(() => {
    const handleInviteLink = async (user) => {
      const params = new URLSearchParams(window.location.search)
      const inviteTrainerId = params.get("invite")
      if (inviteTrainerId && user) {
        await supabase.from("clientes").update({ user_id: user.id }).eq("email", user.email).eq("trainer_id", inviteTrainerId)
        await supabase.auth.updateUser({ data: { rol: "cliente", trainer_id: inviteTrainerId } })
        window.history.replaceState({}, "", window.location.pathname)
        return "cliente"
      }
      const rolParam = params.get("rol")
      if (rolParam) return rolParam
      return user?.user_metadata?.rol || null
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        const r = await handleInviteLink(session.user)
        setRol(r)
      }
      setLoading(false)
    })
    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        const r = await handleInviteLink(session.user)
        setRol(r)
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setRol(null)
  }

  // Scroll: la app logueada bloquea el scroll del documento (cada panel
  // scrollea adentro); Landing y Auth necesitan scroll normal de página.
  useEffect(() => {
    const locked = !!session && !loading
    document.documentElement.classList.toggle("app-locked", locked)
    document.body.classList.toggle("app-locked", locked)
  }, [session, loading])

  if (loading) return <Cargando />
  if (!session) return showAuth ? <Auth initialModo={authMode} /> : <Landing onEmpezar={() => { setAuthMode("registro"); setShowAuth(true) }} onLogin={() => { setAuthMode("login"); setShowAuth(true) }} />
  if (!rol) return <ElegirRol onElegir={setRol} />
  if (rol === "cliente") return <ClientePanel user={session.user} onLogout={handleLogout} />
  return <App user={session.user} onLogout={handleLogout} />
}

function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}
setAppHeight()
window.addEventListener('resize', setAppHeight)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Cargando />}>
        <Root />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
)
