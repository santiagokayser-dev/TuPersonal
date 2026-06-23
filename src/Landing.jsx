import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"

const C = {
  bg: "#0e0e0e",
  surface: "#161616",
  surface2: "#1e1e1e",
  border: "#272727",
  border2: "#333",
  text: "#efefef",
  textSub: "#999",
  textMuted: "#555",
  accent: "#E8714A",
  accentLight: "#F0A07A",
  accentSub: "#2a1a12",
  green: "#3ecf6e",
  yellow: "#e5a60c",
  red: "#e5484d",
}

const Icon = ({ name, size = 22, color = C.textSub }) => {
  const icons = {
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    dumbbell: <><path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h2v5H3zM19 9.5h2v5h-2zM5 7.5h2v9H5zM17 7.5h2v9h-2z"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    wallet: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 100-2 1 1 0 000 2z"/></>,
    sparkles: <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/></>,
    chat: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
    check: <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>,
    whatsapp: null,
    arrow: <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>,
    phone: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></>,
    pdf: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    trending: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  )
}

function FadeIn({ children, delay = 0, y = 20, style }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }} style={style}>
      {children}
    </motion.div>
  )
}

const FEATURES = [
  {
    icon: "users",
    title: "Gestión de clientes",
    desc: "Todos tus clientes en un lugar. Seguí su peso, altura, objetivo y estado de pago. Contactalos por WhatsApp con un toque.",
    color: "#3b82f6",
  },
  {
    icon: "dumbbell",
    title: "Creador de rutinas",
    desc: "Armá rutinas por días con bloques de Normal, Biserie, Superserie o Circuito. Drag & drop para reorganizar. Exportá a PDF.",
    color: C.accent,
  },
  {
    icon: "sparkles",
    title: "Rutinas con IA",
    desc: "Describí el objetivo y la IA genera una rutina completa lista para usar. También sugiere progresiones personalizadas para cada cliente.",
    color: "#a855f7",
  },
  {
    icon: "calendar",
    title: "Agenda",
    desc: "Programá tus sesiones de entrenamiento, cardio, evaluaciones y más. Visualizá la semana de cada cliente de un vistazo.",
    color: "#06b6d4",
  },
  {
    icon: "wallet",
    title: "Finanzas",
    desc: "Controlá quién te debe y cuánto. Registrá cobros, visualizá tu facturación mensual y llevá el historial de pagos.",
    color: C.green,
  },
  {
    icon: "chat",
    title: "Chat con IA",
    desc: "Consultá dudas de entrenamiento, nutrición o programación directamente con IA integrada en la app.",
    color: C.yellow,
  },
]

const PLANS = [
  {
    name: "Gratis",
    price: "0",
    period: "siempre",
    desc: "Para empezar sin compromiso",
    features: ["Hasta 3 clientes", "Creador de rutinas", "Agenda", "Finanzas básica"],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "14.000",
    currency: "ARS",
    period: "mes",
    desc: "Para entrenadores en crecimiento",
    features: ["Hasta 20 clientes", "Todo lo de Gratis", "Generación de rutinas con IA", "Sugerencias de progresión con IA", "Chat con IA ilimitado", "Exportar PDF"],
    cta: "Empezar Pro",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "24.000",
    currency: "ARS",
    period: "mes",
    desc: "Para entrenadores establecidos",
    features: ["Clientes ilimitados", "Todo lo de Pro", "Portal del atleta", "Soporte prioritario"],
    cta: "Empezar Elite",
    highlighted: false,
  },
]

const PASOS = [
  { n: "01", title: "Creá tu cuenta", desc: "Registrate en segundos con tu email o Google. Sin tarjeta de crédito." },
  { n: "02", title: "Agregá tus clientes", desc: "Cargá sus datos físicos, objetivo y precio. El sistema calcula el estado de pago automáticamente." },
  { n: "03", title: "Armá las rutinas", desc: "Usá el creador visual o pedíselas a la IA. Asignáselas a cada cliente en un toque." },
  { n: "04", title: "Gestioná todo desde el celular", desc: "Instalá la app en tu teléfono y trabajá desde donde estés." },
]

export default function Landing({ onEmpezar, onLogin }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMenuOpen(false)
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Styrene A', -apple-system, BlinkMacSystemFont, sans-serif", color: C.text, overflow: "hidden", position: "relative" }}>

      {/* Background ambient glows */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: 1000, height: 1000, background: "radial-gradient(circle, rgba(232,113,74,0.09) 0%, transparent 60%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "10%", left: "-15%", width: 800, height: 800, background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "5%", right: "-15%", width: 700, height: 700, background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(232,113,74,0.05) 0%, transparent 65%)", borderRadius: "50%" }} />
      </div>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: C.bg + "cc", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, isolation: "isolate" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src="/logo-white.png" alt="TuPersonal" style={{ height: 44, objectFit: "contain" }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => scrollTo("features")}
              style={{ display: window.innerWidth < 640 ? "none" : "block", background: "none", border: "none", color: C.textSub, fontSize: 13, cursor: "pointer", padding: "6px 12px" }}>
              Funciones
            </button>
            <button onClick={() => scrollTo("planes")}
              style={{ display: window.innerWidth < 640 ? "none" : "block", background: "none", border: "none", color: C.textSub, fontSize: 13, cursor: "pointer", padding: "6px 12px" }}>
              Planes
            </button>
            <button onClick={onLogin}
              style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: 6, padding: "7px 14px", color: C.text, fontSize: 13, cursor: "pointer" }}>
              Iniciar sesión
            </button>
            <button onClick={onEmpezar}
              style={{ background: C.accent, border: "none", borderRadius: 6, padding: "7px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Empezar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 20px 60px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <FadeIn delay={0}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accentSub, border: `1px solid ${C.accent}44`, borderRadius: 999, padding: "5px 14px", marginBottom: 28 }}>
            <Icon name="sparkles" size={14} color={C.accent} />
            <span style={{ fontSize: 12, color: C.accentLight, fontWeight: 500 }}>Rutinas con inteligencia artificial</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, margin: "0 0 20px" }}>
            La herramienta que<br />
            <span style={{ color: C.accent }}>necesitás</span> para entrenar<br />
            como un pro
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: C.textSub, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.65 }}>
            Gestioná clientes, rutinas, cobros y agenda desde el celular.
            Con IA integrada para crear y personalizar entrenamientos en segundos.
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onEmpezar}
              style={{ background: C.accent, border: "none", borderRadius: 8, padding: "13px 28px", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              Empezar gratis
              <Icon name="arrow" size={16} color="#fff" />
            </button>
            <button onClick={() => scrollTo("features")}
              style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "13px 28px", color: C.text, fontSize: 15, cursor: "pointer" }}>
              Ver funciones
            </button>
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 16 }}>Sin tarjeta de crédito · Hasta 3 clientes gratis</p>
        </FadeIn>

        {/* App preview mockup */}
        <FadeIn delay={0.2} y={40}>
          <div style={{ marginTop: 56, position: "relative", display: "inline-block" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 20,
              padding: 24, maxWidth: 680, margin: "0 auto", textAlign: "left",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), 0 0 120px rgba(232,113,74,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Buenos días, Santiago</div>
                  <div style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>12 clientes activos</div>
                </div>
                <div style={{ background: C.accent, borderRadius: 6, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 600 }}>+ Nuevo cliente</div>
              </div>
              <div style={{ display: "flex", gap: 32, paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
                {[
                  { label: "Facturación", value: "$180K" },
                  { label: "Al día", value: "10/12" },
                  { label: "Pendientes", value: "2" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 4 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {[
                { ini: "MG", nombre: "Martín González", objetivo: "Hipertrofia", precio: "$15.000", estado: "Al día", color: C.green },
                { ini: "LF", nombre: "Laura Fernández", objetivo: "Pérdida de peso", precio: "$12.000", estado: "Debe 1 mes", color: C.yellow },
                { ini: "CA", nombre: "Carlos Acosta", objetivo: "Fuerza general", precio: "$15.000", estado: "Al día", color: C.green },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.textSub }}>{c.ini}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nombre}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{c.objetivo}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: C.textSub }}>{c.precio}</div>
                    <div style={{ fontSize: 11, color: c.color, fontWeight: 500 }}>{c.estado}</div>
                  </div>
                </div>
              ))}
            </div>