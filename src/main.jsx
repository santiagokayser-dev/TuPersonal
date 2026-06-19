import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabase'
import App from './App.jsx'
import Auth from './Auth.jsx'
import ClientePanel from './ClientePanel.jsx'
import './index.css'

function Root() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rol, setRol] = useState(null)

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
      return params.get("rol") || user?.user_metadata?.rol || "trainer"
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

  if (loading) return null
  if (!session) return <Auth />
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
    <Root />
  </StrictMode>
)