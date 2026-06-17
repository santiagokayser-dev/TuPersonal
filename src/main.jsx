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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        const params = new URLSearchParams(window.location.search)
const r = params.get("rol") || session.user.user_metadata?.rol || "trainer"
        setRol(r)
      }
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        const r = session.user.user_metadata?.rol || "trainer"
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)