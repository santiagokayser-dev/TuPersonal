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
    price: "9.99",
    currency: "USD",
    period: "mes",
    desc: "Para entrenadores en crecimiento",
    features: ["Hasta 20 clientes", "Todo lo de Gratis", "Generación de rutinas con IA", "Sugerencias de progresión con IA", "Chat con IA ilimitado", "Exportar PDF"],
    cta: "Empezar Pro",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "19.99",
    currency: "USD",
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

export default function Landing({ onEntrar }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMenuOpen(false)
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Styrene A', -apple-system, BlinkMacSystemFont, sans-serif", color: C.text, overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: C.bg + "e8", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src="/logo-white.png" alt="TuPersonal" style={{ height: 28, objectFit: "contain" }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => scrollTo("features")}
              style={{ display: window.innerWidth < 640 ? "none" : "block", background: "none", border: "none", color: C.textSub, fontSize: 13, cursor: "pointer", padding: "6px 12px" }}>
              Funciones
            </button>
            <button onClick={() => scrollTo("planes")}
              style={{ display: window.innerWidth < 640 ? "none" : "block", background: "none", border: "none", color: C.textSub, fontSize: 13, cursor: "pointer", padding: "6px 12px" }}>
              Planes
            </button>
            <button onClick={onEntrar}
              style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: 6, padding: "7px 14px", color: C.text, fontSize: 13, cursor: "pointer" }}>
              Iniciar sesión
            </button>
            <button onClick={onEntrar}
              style={{ background: C.accent, border: "none", borderRadius: 6, padding: "7px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Empezar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 20px 60px", textAlign: "center" }}>
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
            <button onClick={onEntrar}
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
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            }}>
              {/* Fake top bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Buenos días, Santiago</div>
                  <div style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>12 clientes activos</div>
                </div>
                <div style={{ background: C.accent, borderRadius: 6, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 600 }}>+ Nuevo cliente</div>
              </div>
              {/* Stats row */}
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
              {/* Client list */}
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
            {/* Floating badge */}
            <div style={{
              position: "absolute", bottom: -16, right: -16,
              background: "#1a1a1a", border: `1px solid ${C.border2}`, borderRadius: 12,
              padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#a855f722", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="sparkles" size={16} color="#a855f7" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>IA generó tu rutina</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Lista en 3 segundos</div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* LOGOS / SOCIAL PROOF */}
      <FadeIn>
        <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "20px 20px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Confiado por entrenadores personales de toda Argentina</p>
            <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
              {["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Mar del Plata"].map(c => (
                <span key={c} style={{ fontSize: 13, color: C.textSub, fontWeight: 500 }}>{c}</span>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 20px" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Funciones</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 14px" }}>Todo lo que necesitás,<br />en un solo lugar</h2>
            <p style={{ fontSize: 15, color: C.textSub, maxWidth: 480, margin: "0 auto" }}>Diseñado específicamente para entrenadores personales independientes que quieren trabajar de forma profesional.</p>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.05}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px", height: "100%", boxSizing: "border-box" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: f.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon name={f.icon} size={20} color={f.color} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "80px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Cómo funciona</div>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>En marcha en minutos</h2>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {PASOS.map((p, i) => (
              <FadeIn key={p.n} delay={i * 0.08}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.08em", marginBottom: 12 }}>{p.n}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>{p.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* AI FEATURE SPOTLIGHT */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40, alignItems: "center" }}>
          <FadeIn>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#a855f718", border: "1px solid #a855f733", borderRadius: 999, padding: "5px 14px", marginBottom: 20 }}>
                <Icon name="sparkles" size={14} color="#a855f7" />
                <span style={{ fontSize: 12, color: "#c084fc", fontWeight: 500 }}>Inteligencia Artificial</span>
              </div>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 16px" }}>
                Rutinas personalizadas<br />generadas por IA
              </h2>
              <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, marginBottom: 24 }}>
                Describí el objetivo de tu cliente y la IA genera una rutina completa en segundos:
                días, bloques, ejercicios, series, reps y tiempos de descanso. Podés editarla
                como quieras antes de asignarla.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Rutinas estructuradas por días y bloques",
                  "Progresión de cargas sugerida por IA",
                  "Ajuste según datos físicos del cliente",
                  "Lista para usar o personalizar",
                ].map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: C.textSub }}>
                    <div style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16, borderRadius: 999, background: C.green + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="check" size={10} color={C.green} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onEntrar}
                style={{ background: "#a855f7", border: "none", borderRadius: 8, padding: "11px 22px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Probar con IA
              </button>
            </div>
          </FadeIn>
          <FadeIn delay={0.1} y={24}>
            <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 16, padding: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Prompt</div>
              <div style={{ background: C.surface2, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: C.textSub, lineHeight: 1.5, marginBottom: 16 }}>
                "Rutina de 4 días para Martín, objetivo hipertrofia, nivel intermedio, sin acceso a peso libre los jueves"
              </div>
              <div style={{ fontSize: 12, color: "#a855f7", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="sparkles" size={12} color="#a855f7" />
                Rutina generada
              </div>
              {["Lunes · Pecho y tríceps", "Martes · Espalda y bíceps", "Jueves · Máquinas — piernas", "Viernes · Hombros y core"].map((dia, i) => (
                <div key={dia} style={{ background: C.surface2, borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{dia}</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{[6, 6, 5, 5][i]} ejercicios</span>
                </div>
              ))}
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: C.accent + "22", border: `1px solid ${C.accent}44`, borderRadius: 6, padding: "8px 0", textAlign: "center", fontSize: 12, color: C.accent, fontWeight: 500 }}>Asignar a Martín</div>
                <div style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 0", textAlign: "center", fontSize: 12, color: C.textSub }}>Editar rutina</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* EXTRA HIGHLIGHTS */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "64px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {[
              { icon: "phone", color: "#3b82f6", title: "PWA instalable", desc: "Agregá la app a tu pantalla de inicio. Funciona como una app nativa sin pasar por ninguna tienda." },
              { icon: "pdf", color: C.accent, title: "Exportar a PDF", desc: "Generá un PDF profesional de cualquier rutina para compartirla con tus clientes." },
              { icon: "trending", color: C.green, title: "Progreso del cliente", desc: "Registrá el peso y las cargas de tus clientes a lo largo del tiempo y mostrales su evolución." },
              { icon: "lock", color: C.yellow, title: "Datos seguros", desc: "Toda la información se guarda de forma segura en Supabase con autenticación de doble factor." },
            ].map((h, i) => (
              <FadeIn key={h.title} delay={i * 0.06}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: h.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={h.icon} size={18} color={h.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{h.title}</div>
                    <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.55 }}>{h.desc}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planes" style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 20px" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Planes</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 14px" }}>Precio justo para cada etapa</h2>
            <p style={{ fontSize: 14, color: C.textSub }}>Empezá gratis y escalá cuando lo necesites</p>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.07}>
              <div style={{
                background: plan.highlighted ? C.accentSub : C.surface,
                border: `1.5px solid ${plan.highlighted ? C.accent : C.border}`,
                borderRadius: 16, padding: "28px 24px",
                position: "relative", height: "100%", boxSizing: "border-box",
              }}>
                {plan.highlighted && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.accent, borderRadius: 999, padding: "3px 14px", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                    Más popular
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: C.textSub, marginBottom: 20 }}>{plan.desc}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  {plan.currency && <span style={{ fontSize: 14, color: C.textSub }}>USD</span>}
                  <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}>${plan.price}</span>
                  <span style={{ fontSize: 13, color: C.textMuted }}>/ {plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: plan.highlighted ? C.text : C.textSub }}>
                      <Icon name="check" size={14} color={plan.highlighted ? C.accent : C.green} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onEntrar} style={{
                  width: "100%", border: "none", borderRadius: 8, padding: "11px 0",
                  background: plan.highlighted ? C.accent : C.surface2,
                  color: plan.highlighted ? "#fff" : C.text,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  boxSizing: "border-box",
                }}>
                  {plan.cta}
                </button>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "0 20px 80px" }}>
        <FadeIn>
          <div style={{
            maxWidth: 700, margin: "0 auto", background: C.surface, border: `1px solid ${C.border2}`,
            borderRadius: 20, padding: "56px 32px", textAlign: "center",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset",
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accentSub, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name="dumbbell" size={22} color={C.accent} />
            </div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 12px" }}>Empezá hoy, es gratis</h2>
            <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.65, maxWidth: 440, margin: "0 auto 28px" }}>
              Unite a los entrenadores que ya usan TuPersonal para gestionar su negocio de forma profesional.
              Sin tarjeta de crédito, sin compromisos.
            </p>
            <button onClick={onEntrar}
              style={{ background: C.accent, border: "none", borderRadius: 8, padding: "13px 32px", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Crear cuenta gratis
              <Icon name="arrow" size={16} color="#fff" />
            </button>
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 14 }}>¿Ya tenés cuenta? <span onClick={onEntrar} style={{ color: C.accent, cursor: "pointer" }}>Iniciá sesión</span></p>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "28px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <img src="/logo-white.png" alt="TuPersonal" style={{ height: 22, objectFit: "contain" }} />
          <div style={{ fontSize: 12, color: C.textMuted }}>© {new Date().getFullYear()} TuPersonal · Hecho en Argentina</div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Funciones", "Planes", "Iniciar sesión"].map(l => (
              <span key={l} onClick={l === "Iniciar sesión" ? onEntrar : () => scrollTo(l === "Funciones" ? "features" : "planes")}
                style={{ fontSize: 12, color: C.textSub, cursor: "pointer" }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
