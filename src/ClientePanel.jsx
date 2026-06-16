import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const COLORS = {
  bg: "#080808",
  surface: "#111111",
  surface2: "#1a1a1a",
  border: "#222222",
  border2: "#2a2a2a",
  text: "#ffffff",
  textSub: "#888888",
  textMuted: "#444444",
  accent: "#6366f1",
  accentSub: "#312e81",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#f59e0b",
}

const T = {
  h1: { fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: -0.8, lineHeight: 1.1 },
  h2: { fontSize: 20, fontWeight: 600, color: COLORS.text, letterSpacing: -0.4 },
  h3: { fontSize: 15, fontWeight: 600, color: COLORS.text, letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: 400, color: COLORS.textSub, lineHeight: 1.5 },
  label: { fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1.2 },
  num: { fontSize: 32, fontWeight: 700, color: COLORS.text, letterSpacing: -1 },
}

const Icon = ({ name, size = 20, color = COLORS.textSub }) => {
  const icons = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/>,
    dumbbell: <><path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h2v5H3zM19 9.5h2v5h-2zM5 7.5h2v9H5zM17 7.5h2v9h-2z"/></>,
    trendingUp: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
    wallet: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 100-2 1 1 0 000 2z"/></>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    chevronRight: <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
    check: <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    fire: <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 14c-2.2 0-4-1.8-4-4 0-1.5.8-2.8 2-3.5V10c0 1.1.9 2 2 2s2-.9 2-2v-.5c1.2.7 2 2 2 3.5 0 2.2-1.8 4-4 4z" strokeLinecap="round" strokeLinejoin="round"/>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      {icons[name]}
    </svg>
  )
}

const navItems = [
  { id: "inicio", icon: "home", label: "Inicio" },
  { id: "rutina", icon: "dumbbell", label: "Rutina" },
  { id: "progreso", icon: "trendingUp", label: "Progreso" },
  { id: "pagos", icon: "wallet", label: "Pagos" },
]

const rutina = {
  nombre: "Fuerza e hipertrofia",
  dias: [
    {
      dia: "Día A — Empuje",
      ejercicios: [
        { nombre: "Press de banca", series: 4, reps: "8-10", peso: "70kg", musculo: "Pecho" },
        { nombre: "Press militar", series: 3, reps: "10-12", peso: "45kg", musculo: "Hombros" },
        { nombre: "Fondos en paralelas", series: 3, reps: "12", peso: "Peso corporal", musculo: "Tríceps" },
      ]
    },
    {
      dia: "Día B — Jalón",
      ejercicios: [
        { nombre: "Dominadas", series: 4, reps: "6-8", peso: "Peso corporal", musculo: "Espalda" },
        { nombre: "Remo con barra", series: 3, reps: "8-10", peso: "60kg", musculo: "Espalda" },
        { nombre: "Curl con barra", series: 3, reps: "10-12", peso: "30kg", musculo: "Bíceps" },
      ]
    },
    {
      dia: "Día C — Piernas",
      ejercicios: [
        { nombre: "Sentadilla con barra", series: 4, reps: "8-10", peso: "80kg", musculo: "Piernas" },
        { nombre: "Prensa de piernas", series: 3, reps: "10-12", peso: "120kg", musculo: "Piernas" },
        { nombre: "Curl femoral", series: 3, reps: "12-15", peso: "40kg", musculo: "Piernas" },
      ]
    },
  ]
}

const progreso = [55, 60, 65, 68, 70, 72]
const meses = ["E", "F", "M", "A", "M", "J"]

function MiniBar({ data, labels }) {
  const max = Math.max(...data)
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 70 }}>
      {data.map((h, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
          <motion.div
            initial={{ height: 0 }} animate={{ height: `${(h / max) * 100}%` }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            style={{ width: "100%", borderRadius: 3, background: i === data.length - 1 ? COLORS.accent : COLORS.surface2 }}
          />
          <div style={{ ...T.label, fontSize: 9, letterSpacing: 0 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

function Inicio({ onLogout }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ ...T.label, marginBottom: 6 }}>Tu entrenador: Nico Pérez</div>
          <div style={T.h1}>Hola, Lucas</div>
        </div>
        <button onClick={onLogout} style={{ background: COLORS.surface, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: 8, cursor: "pointer", display: "flex" }}>
          <Icon name="logout" size={16} color={COLORS.textSub} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
          <div style={T.label}>Racha</div>
          <div style={{ ...T.num, fontSize: 28, marginTop: 6 }}>12</div>
          <div style={{ fontSize: 11, color: COLORS.green, marginTop: 2, fontWeight: 500 }}>días seguidos</div>
        </div>
        <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
          <div style={T.label}>Sesiones</div>
          <div style={{ ...T.num, fontSize: 28, marginTop: 6 }}>14</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Meta: 16</div>
        </div>
      </div>

      <div style={{ background: COLORS.accentSub, borderRadius: 18, padding: 18, border: `0.5px solid ${COLORS.accent}33` }}>
        <div style={{ ...T.label, color: "#6366f1", marginBottom: 8 }}>Próxima sesión</div>
        <div style={T.h2}>Mañana — 10:00hs</div>
        <div style={{ ...T.body, color: "#818cf8", marginTop: 4 }}>Día A · Empuje · 60 min</div>
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ ...T.label, marginBottom: 10 }}>Mensaje de tu trainer</div>
        <div style={{ ...T.body, lineHeight: 1.7 }}>
          "Lucas, excelente semana. Esta semana subimos el peso en press de banca a 72.5kg. ¡Vamos por más!"
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 10 }}>Nico · hace 2 horas</div>
      </div>
    </>
  )
}

function Rutina() {
  const [diaAbierto, setDiaAbierto] = useState(0)
  const [ejercicioActivo, setEjercicioActivo] = useState(null)

  return (
    <>
      <div>
        <div style={{ ...T.label, marginBottom: 6 }}>Programa actual</div>
        <div style={T.h1}>Mi rutina</div>
      </div>

      <div style={{ background: COLORS.accentSub, borderRadius: 18, padding: 16, border: `0.5px solid ${COLORS.accent}33` }}>
        <div style={{ ...T.label, color: "#6366f1", marginBottom: 6 }}>Diseñado por Nico Pérez</div>
        <div style={T.h3}>{rutina.nombre}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {["Lun", "Mié", "Vie"].map((d, i) => (
            <div key={i} style={{ flex: 1, background: COLORS.accent + "22", borderRadius: 10, padding: "7px 0", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#a5b4fc" }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {rutina.dias.map((dia, i) => {
        const abierto = diaAbierto === i
        return (
          <motion.div key={i} style={{ background: COLORS.surface, borderRadius: 18, border: `0.5px solid ${abierto ? COLORS.accent + "66" : COLORS.border}`, overflow: "hidden", transition: "border-color 0.2s" }}>
            <div onClick={() => setDiaAbierto(abierto ? -1 : i)}
              style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 14, background: abierto ? COLORS.accent : COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", flexShrink: 0 }}>
                <span style={{ fontSize: 16 }}>{i === 0 ? "A" : i === 1 ? "B" : "C"}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={T.h3}>{dia.dia}</div>
                <div style={{ ...T.body, fontSize: 12, marginTop: 2 }}>{dia.ejercicios.length} ejercicios</div>
              </div>
              <motion.div animate={{ rotate: abierto ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <Icon name="chevronRight" size={16} color={COLORS.textMuted} />
              </motion.div>
            </div>

            <AnimatePresence>
              {abierto && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  style={{ overflow: "hidden", borderTop: `0.5px solid ${COLORS.border}` }}>
                  {dia.ejercicios.map((ej, j) => {
                    const activo = ejercicioActivo === `${i}-${j}`
                    return (
                      <div key={j}>
                        <div onClick={() => setEjercicioActivo(activo ? null : `${i}-${j}`)}
                          style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: `0.5px solid ${COLORS.border}`, cursor: "pointer" }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: COLORS.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: COLORS.accent, flexShrink: 0 }}>{j + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>{ej.nombre}</div>
                            <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                              {[`${ej.series} series`, `${ej.reps} reps`, ej.peso].map((tag, k) => (
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
                              <div style={{ padding: "12px 18px" }}>
                                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ej.nombre + " técnica correcta")}`}
                                  target="_blank" rel="noopener noreferrer"
                                  style={{ display: "flex", alignItems: "center", gap: 10, background: "#3a1a1a", borderRadius: 12, padding: "11px 14px", textDecoration: "none" }}>
                                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "#ef444422", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Icon name="play" size={13} color={COLORS.red} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fca5a5" }}>Ver técnica correcta</div>
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

function Progreso() {
  return (
    <>
      <div>
        <div style={{ ...T.label, marginBottom: 6 }}>Evolución</div>
        <div style={T.h1}>Mi progreso</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Peso actual", value: "85kg", sub: "Objetivo: 82kg", subColor: COLORS.textMuted },
          { label: "Bench max", value: "72kg", sub: "+17kg desde enero", subColor: COLORS.green },
        ].map((m, i) => (
          <div key={i} style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
            <div style={T.label}>{m.label}</div>
            <div style={{ ...T.num, fontSize: 24, marginTop: 6 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: m.subColor, marginTop: 4, fontWeight: 500 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${COLORS.border}` }}>
        <div style={{ ...T.label, marginBottom: 14 }}>Press de banca (kg)</div>
        <MiniBar data={progreso} labels={meses} />
      </div>

      <div style={{ ...T.label, marginTop: 4 }}>Objetivos</div>
      {[
        { label: "Bajar a 82kg", pct: 75, color: COLORS.green },
        { label: "Press de banca 80kg", pct: 90, color: COLORS.accent },
        { label: "Asistencia mensual", pct: 87, color: COLORS.yellow },
      ].map((o, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
          style={{ background: COLORS.surface, borderRadius: 14, padding: "14px 16px", border: `0.5px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{o.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: o.color }}>{o.pct}%</div>
          </div>
          <div style={{ background: COLORS.surface2, borderRadius: 20, height: 5, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${o.pct}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.7, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 20, background: o.color }} />
          </div>
        </motion.div>
      ))}
    </>
  )
}

function Pagos() {
  const crearPago = async () => {
    try {
      const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer APP_USR-7417603565938023-061519-6416808ae70250449d00b0f8954b61c5-3474234843`
        },
        body: JSON.stringify({
          items: [{
            title: "Plan mensual FitDesk",
            quantity: 1,
            unit_price: 32000,
            currency_id: "ARS"
          }],
          back_urls: {
            success: "https://fitdesk.app/pago-exitoso",
  failure: "https://fitdesk.app/pago-fallido",
  pending: "https://fitdesk.app/pago-pendiente"
          },
          auto_return: "approved"
        })
      })
      const data = await res.json()
      if (data.init_point) window.open(data.init_point, "_blank")
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div>
        <div style={{ ...T.label, marginBottom: 6 }}>Estado de cuenta</div>
        <div style={T.h1}>Mis pagos</div>
      </div>

      <div style={{ background: COLORS.surface, borderRadius: 18, padding: 18, border: `0.5px solid ${COLORS.border}` }}>
        <div style={T.label}>Próximo vencimiento</div>
        <div style={{ ...T.num, fontSize: 26, marginTop: 8 }}>1 de julio</div>
        <div style={{ ...T.body, marginTop: 4 }}>Plan mensual · $32.000</div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={crearPago}
          style={{ width: "100%", padding: "13px 0", borderRadius: 14, background: "#009ee3", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16 }}>
          Pagar con Mercado Pago
        </motion.button>
      </div>

      <div style={T.label}>Historial</div>
      {[
        { mes: "Junio 2025", fecha: "1 jun · Mercado Pago", monto: "$32.000", color: COLORS.green },
        { mes: "Mayo 2025", fecha: "1 may · Transferencia", monto: "$28.000", color: COLORS.green },
        { mes: "Abril 2025", fecha: "1 abr · Transferencia", monto: "$25.000", color: COLORS.green },
      ].map((p, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          style={{ background: COLORS.surface, borderRadius: 14, padding: "14px 16px", border: `0.5px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={T.h3}>{p.mes}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{p.fecha}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{p.monto}</div>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: COLORS.green + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" size={11} color={COLORS.green} />
            </div>
          </div>
        </motion.div>
      ))}
    </>
  )
}

export default function ClientePanel({ onLogout }) {
  const [activePage, setActivePage] = useState("inicio")

  const screenStyle = { flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" }

  const renderPage = () => {
    const pages = {
      inicio: <Inicio onLogout={onLogout} />,
      rutina: <Rutina />,
      progreso: <Progreso />,
      pagos: <Pagos />,
    }
    return (
      <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        style={screenStyle}>
        {pages[activePage]}
      </motion.div>
    )
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      <div style={{ width: 375, height: 720, background: COLORS.bg, borderRadius: 40, border: `1px solid ${COLORS.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
        </div>
        <nav style={{ background: COLORS.bg, borderTop: `0.5px solid ${COLORS.border}`, display: "flex", padding: "10px 0 22px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0" }}>
              <Icon name={item.icon} size={22} color={activePage === item.id ? COLORS.accent : COLORS.textMuted} />
              <span style={{ fontSize: 10, fontWeight: 500, color: activePage === item.id ? COLORS.accent : COLORS.textMuted }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}