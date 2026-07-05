import { useState, useRef } from "react"
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion"
import ConfirmModal from "./ConfirmModal"
import { EJERCICIOS, MUSCULO_ALIASES } from "./ejercicios"
import { askClaude } from "./ai"

const C = {
  bg: "#111111", surface: "#191919", surface2: "#222222", surface3: "#2a2a2a",
  border: "#2a2a2a", border2: "#333333",
  text: "#ececec", textSub: "#888888", textMuted: "#555555",
  accent: "#E8714A", accentSub: "#2a1a12", accentLight: "#F0A07A",
  green: "#3ecf6e", red: "#e5484d", yellow: "#e5a60c", blue: "#3b82f6",
}

const inp = {
  background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10,
  padding: "10px 12px", color: C.text, fontSize: 14, outline: "none",
  fontFamily: "-apple-system, sans-serif", width: "100%", boxSizing: "border-box",
}

function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function buscarEjercicios(query, extras = {}, max = 50) {
  const q = norm(query.trim())
  if (!q) return []
  const todosBase = Object.values(EJERCICIOS).flat()
  const todosExtras = Object.values(extras).flat()
  const todos = [...todosBase, ...todosExtras]
  const musculoKey = MUSCULO_ALIASES[q]
  let muscularMatches = []
  if (musculoKey) muscularMatches = [...(EJERCICIOS[musculoKey] || []), ...(extras[musculoKey] || [])]
  const textMatches = todos.filter(e => {
    if (norm(e.nombre).includes(q)) return true
    if ((e.aliases || []).some(a => norm(a).includes(q))) return true
    if (e.musculo && norm(e.musculo).includes(q)) return true
    return false
  })
  const seen = new Set()
  const result = []
  for (const e of [...muscularMatches, ...textMatches]) {
    if (!seen.has(e.nombre)) { seen.add(e.nombre); result.push(e) }
  }
  return result.slice(0, max)
}

const TIPOS = [
  { id: "normal",     label: "Normal",     color: C.textMuted,  bg: C.surface3 },
  { id: "biserie",    label: "Biserie",    color: C.yellow,     bg: "#2a2000" },
  { id: "superserie", label: "Superserie", color: C.green,      bg: "#0a2a14" },
  { id: "circuito",   label: "Circuito",   color: C.red,        bg: "#2a0a0a" },
]
const TIPO_MAX = { normal: 1, biserie: 2, superserie: 6, circuito: 10 }

const ejVacio = () => ({ nombre: "", series: "3", reps: "10", peso: "", rir: "2", descanso: "90", aclaracion: "", video: "" })

function normalizarDias(dias) {
  if (!Array.isArray(dias)) return []
  return dias.map(d => {
    const nombre = d.nombre || "Día"
    if (Array.isArray(d.bloques)) {
      return {
        nombre,
        bloques: d.bloques.map(b => ({
          id: b.id || Math.random().toString(36).slice(2),
          tipo: b.tipo || "normal",
          ejercicios: Array.isArray(b.ejercicios) && b.ejercicios.length > 0
            ? b.ejercicios.map(e => ({ ...ejVacio(), ...e }))
            : [ejVacio()],
        }))
      }
    }
    // Formato viejo: ejercicios directamente en el día
    if (Array.isArray(d.ejercicios) && d.ejercicios.length > 0) {
      return {
        nombre,
        bloques: d.ejercicios.map(e => ({
          id: Math.random().toString(36).slice(2),
          tipo: "normal",
          ejercicios: [{ ...ejVacio(), ...e }],
        }))
      }
    }
    return { nombre, bloques: [] }
  })
}
const bloqueVacio = (tipo = "normal") => ({
  id: Math.random().toString(36).slice(2),
  tipo,
  ejercicios: [ejVacio()],
})

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, color = C.textSub, fill = "none", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
)

function DragHandle({ onPointerDown }) {
  return (
    <div onPointerDown={onPointerDown} style={{ cursor: "grab", touchAction: "none", padding: "0 6px", display: "flex", alignItems: "center", opacity: 0.4 }}>
      <svg width={14} height={20} viewBox="0 0 14 20" fill={C.textMuted}>
        {[3,8,13].flatMap(y => [3, 9].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r={1.4} />))}
      </svg>
    </div>
  )
}

// ── EjercicioCard ─────────────────────────────────────────────────────────────
function EjercicioCard({ ej, onChange, onChangeBulk, onDelete, showDelete, tipoColor, expanded, onExpand, onConfirm, ejerciciosCustom = {} }) {
  const [dropOpen, setDropOpen] = useState(false)
  const ytUrl = ej.video || `https://www.youtube.com/results?search_query=${encodeURIComponent(ej.nombre + " ejercicio técnica")}`
  const sugerencias = ej.nombre.trim().length >= 2 ? buscarEjercicios(ej.nombre, ejerciciosCustom, 6) : []

  if (!expanded) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.surface2, borderRadius: 10, borderLeft: `3px solid ${tipoColor || C.border2}` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: ej.nombre ? C.text : C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ej.nombre || "Sin nombre"}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            {[ej.series && ej.reps ? `${ej.series}×${ej.reps}` : null, ej.peso || null, ej.rir ? `RIR ${ej.rir}` : null, ej.descanso ? `${ej.descanso}s` : null].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {(ej.video || ej.nombre) && (
            <a href={ytUrl} target="_blank" rel="noopener noreferrer" style={{ width: 30, height: 30, borderRadius: 8, background: "#2a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill={ej.video ? C.red : C.red + "44"}><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 3 12 3 12 3s-4.2 0-6.8.2c-.6 0-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v1.9C.7 15.2 1 17 1 17s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.2 12 21 12 21s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3C22.7 18.7 23 17 23 17s.3-2.1.3-4.2v-1.9C23.3 9.1 23 7 23 7zM9.7 15V8.5l6.6 3.3L9.7 15z"/></svg>
            </a>
          )}
          <button onClick={onExpand} style={{ width: 30, height: 30, borderRadius: 8, background: C.surface3, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ico d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={13} color={C.textSub} />
          </button>
          {showDelete && (
            <button onClick={onDelete} style={{ width: 30, height: 30, borderRadius: 8, background: "#2a0a0a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" size={13} color={C.red} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.surface2, borderRadius: 12, border: `1px solid ${tipoColor ? tipoColor + "55" : C.accent + "44"}`, overflow: "hidden" }}>
      {/* Nombre con autocompletado */}
      <div style={{ position: "relative", borderBottom: `1px solid ${C.border}` }}>
        <input value={ej.nombre} onChange={e => { onChange("nombre", e.target.value); setDropOpen(true) }}
          onFocus={() => setDropOpen(true)} onBlur={() => setTimeout(() => setDropOpen(false), 150)}
          placeholder="Nombre del ejercicio..." autoFocus
          style={{ ...inp, borderRadius: 0, border: "none", background: "transparent", fontSize: 14, fontWeight: 600, paddingRight: showDelete ? 44 : 12 }} />
        {showDelete && (
          <button onClick={onDelete} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Ico d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" size={14} color={C.red} />
          </button>
        )}
        {dropOpen && sugerencias.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "0 0 12px 12px", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.7)" }}>
            {sugerencias.map((s, i) => (
              <div key={i} onMouseDown={e => { e.preventDefault(); onChangeBulk({ nombre: s.nombre, video: s.youtube || "" }); setDropOpen(false) }}
                style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < sugerencias.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <div style={{ fontSize: 13, color: C.text }}>{s.nombre}</div>
                  {s.descripcion && <div style={{ fontSize: 11, color: C.textMuted }}>{s.descripcion}</div>}
                </div>
                {s.youtube && <svg width={14} height={14} viewBox="0 0 24 24" fill={C.red}><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 3 12 3 12 3s-4.2 0-6.8.2c-.6 0-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v1.9C.7 15.2 1 17 1 17s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.2 12 21 12 21s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3C22.7 18.7 23 17 23 17s.3-2.1.3-4.2v-1.9C23.3 9.1 23 7 23 7zM9.7 15V8.5l6.6 3.3L9.7 15z"/></svg>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campos */}
      <div style={{ padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[["SERIES", "series", "3"], ["REPS", "reps", "10"], ["PESO/CARGA", "peso", "kg/%"]].map(([label, key, ph]) => (
            <div key={key}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
              <input value={ej[key]} onChange={e => onChange(key, e.target.value)} placeholder={ph}
                style={{ ...inp, padding: "8px 0", textAlign: "center", fontSize: 15, fontWeight: 700, borderRadius: 8 }} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["RIR", "rir", "2"], ["DESCANSO (s)", "descanso", "90"]].map(([label, key, ph]) => (
            <div key={key}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
              <input value={ej[key]} onChange={e => onChange(key, e.target.value)} placeholder={ph}
                style={{ ...inp, padding: "8px 0", textAlign: "center", fontSize: 15, fontWeight: 700, borderRadius: 8 }} />
            </div>
          ))}
        </div>
        <input value={ej.aclaracion} onChange={e => onChange("aclaracion", e.target.value)}
          placeholder="Nota técnica o aclaración para el cliente..."
          style={{ ...inp, fontSize: 12, color: C.textSub, borderRadius: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <input value={ej.video} onChange={e => onChange("video", e.target.value)}
            placeholder="URL del video (opcional)..."
            style={{ ...inp, flex: 1, fontSize: 12, color: C.textSub, borderRadius: 8 }} />
          <a href={ytUrl} target="_blank" rel="noopener noreferrer"
            style={{ width: 38, height: 38, borderRadius: 8, background: "#2a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill={ej.video ? C.red : C.red + "55"}><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 3 12 3 12 3s-4.2 0-6.8.2c-.6 0-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v1.9C.7 15.2 1 17 1 17s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.2 12 21 12 21s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3C22.7 18.7 23 17 23 17s.3-2.1.3-4.2v-1.9C23.3 9.1 23 7 23 7zM9.7 15V8.5l6.6 3.3L9.7 15z"/></svg>
          </a>
        </div>
        <button onClick={onConfirm}
          style={{ background: C.accent, border: "none", borderRadius: 10, padding: "11px 0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Ico d="M20 6L9 17l-5-5" size={14} color="#fff" sw={2.5} />
          Listo
        </button>
      </div>
    </div>
  )
}

// ── BloqueCard ────────────────────────────────────────────────────────────────
function BloqueCard({ bloque, bloqueIdx, onChange, onDelete, onDragHandlePointerDown, ejerciciosCustom, startCollapsed = false }) {
  const [expandedIdx, setExpandedIdx] = useState(startCollapsed ? null : (bloque._expandIdx ?? 0))
  const tipo = TIPOS.find(t => t.id === bloque.tipo) || TIPOS[0]
  const maxEjs = TIPO_MAX[bloque.tipo]
  const puedeAgregarEj = bloque.ejercicios.length < maxEjs

  const actualizarEj = (ejIdx, campo, valor) => {
    onChange({ ...bloque, ejercicios: bloque.ejercicios.map((e, i) => i === ejIdx ? { ...e, [campo]: valor } : e) })
  }
  const actualizarEjBulk = (ejIdx, campos) => {
    onChange({ ...bloque, ejercicios: bloque.ejercicios.map((e, i) => i === ejIdx ? { ...e, ...campos } : e) })
  }
  const agregarEj = () => {
    if (!puedeAgregarEj) return
    const nuevoIdx = bloque.ejercicios.length
    onChange({ ...bloque, ejercicios: [...bloque.ejercicios, ejVacio()] })
    setExpandedIdx(nuevoIdx)
  }
  const eliminarEj = (ejIdx) => {
    if (bloque.ejercicios.length === 1) { onDelete(); return }
    onChange({ ...bloque, ejercicios: bloque.ejercicios.filter((_, i) => i !== ejIdx) })
  }
  const cambiarTipo = (nuevoTipo) => {
    const max = TIPO_MAX[nuevoTipo]
    const ejercicios = bloque.ejercicios.slice(0, max)
    while (ejercicios.length < (nuevoTipo === "biserie" ? 2 : 1)) ejercicios.push(ejVacio())
    onChange({ ...bloque, tipo: nuevoTipo, ejercicios })
  }

  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 10px 8px 4px", background: tipo.bg, borderBottom: `1px solid ${tipo.color}22` }}>
        <DragHandle onPointerDown={onDragHandlePointerDown} />
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, width: 16, flexShrink: 0, textAlign: "center" }}>{bloqueIdx + 1}</div>
        {/* Tipo pills */}
        <div style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
          {TIPOS.map(t => (
            <button key={t.id} onClick={() => cambiarTipo(t.id)}
              style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${bloque.tipo === t.id ? t.color : C.border}`, background: bloque.tipo === t.id ? t.color + "22" : "transparent", color: bloque.tipo === t.id ? t.color : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={onDelete} style={{ width: 28, height: 28, background: "#2a0a0a", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ico d="M3 6h18M19 6l-1 14H6L5 6" size={13} color={C.red} />
        </button>
      </div>

      {/* Ejercicios */}
      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {bloque.ejercicios.map((ej, ejIdx) => (
          <div key={ejIdx}>
            {ejIdx > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0" }}>
                <div style={{ flex: 1, height: 1, background: tipo.color + "33" }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: tipo.color, textTransform: "uppercase", letterSpacing: 1.2 }}>{tipo.label}</span>
                <div style={{ flex: 1, height: 1, background: tipo.color + "33" }} />
              </div>
            )}
            <EjercicioCard
              ej={ej} onChange={(c, v) => actualizarEj(ejIdx, c, v)} onChangeBulk={c => actualizarEjBulk(ejIdx, c)}
              onDelete={() => eliminarEj(ejIdx)} showDelete={bloque.tipo !== "normal"}
              tipoColor={tipo.color} expanded={expandedIdx === ejIdx}
              onExpand={() => setExpandedIdx(ejIdx)} onConfirm={() => setExpandedIdx(null)}
              ejerciciosCustom={ejerciciosCustom}
            />
          </div>
        ))}
        {puedeAgregarEj && bloque.tipo !== "normal" && (
          <button onClick={agregarEj}
            style={{ background: "transparent", border: `1px dashed ${tipo.color}55`, borderRadius: 10, padding: "9px 0", color: tipo.color, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Ico d="M12 5v14M5 12h14" size={13} color={tipo.color} />
            Agregar al {tipo.label.toLowerCase()}
          </button>
        )}
      </div>
    </div>
  )
}

// ── DraggableBloque ───────────────────────────────────────────────────────────
function DraggableBloque(props) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={props.bloque} dragControls={controls} dragListener={false} style={{ listStyle: "none" }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
      <BloqueCard {...props} onDragHandlePointerDown={e => controls.start(e)} />
    </Reorder.Item>
  )
}

// ── Biblioteca ────────────────────────────────────────────────────────────────
function Biblioteca({ onAgregar, onCerrar, ejerciciosCustom, onAgregarCustom }) {
  const [busqueda, setBusqueda] = useState("")
  const [musculo, setMusculo] = useState(null)
  const [tipoBloque, setTipoBloque] = useState("normal")
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [nuevoEj, setNuevoEj] = useState({ nombre: "", youtube: "", descripcion: "" })
  const inputRef = useRef(null)

  const todosCustom = Object.values(ejerciciosCustom).flat()
  const lista = musculo
    ? [...(EJERCICIOS[musculo] || []), ...(ejerciciosCustom[musculo] || [])].filter(e => !busqueda.trim() || norm(e.nombre).includes(norm(busqueda)))
    : busqueda.trim() ? buscarEjercicios(busqueda, ejerciciosCustom, 60)
    : [...Object.values(EJERCICIOS).flat(), ...todosCustom].slice(0, 60)

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onCerrar} style={{ width: 36, height: 36, borderRadius: 10, background: C.surface2, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ico d="M18 6L6 18M6 6l12 12" size={16} color={C.text} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, flex: 1 }}>Biblioteca de ejercicios</div>
        <button onClick={() => { setMostrarNuevo(v => !v); setTimeout(() => inputRef.current?.focus(), 100) }}
          style={{ background: mostrarNuevo ? C.accent : C.surface2, border: "none", borderRadius: 10, padding: "8px 14px", color: mostrarNuevo ? "#fff" : C.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Nuevo
        </button>
      </div>

      {/* Form nuevo */}
      <AnimatePresence>
        {mostrarNuevo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", flexShrink: 0 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8, background: C.surface }}>
              <input ref={inputRef} placeholder="Nombre del ejercicio *" value={nuevoEj.nombre} onChange={e => setNuevoEj(p => ({ ...p, nombre: e.target.value }))} style={inp} />
              <input placeholder="Link de YouTube (opcional)" value={nuevoEj.youtube} onChange={e => setNuevoEj(p => ({ ...p, youtube: e.target.value }))} style={{ ...inp, fontSize: 12 }} />
              <button onClick={() => { if (!nuevoEj.nombre.trim()) return; onAgregarCustom(musculo || "Custom", nuevoEj); setNuevoEj({ nombre: "", youtube: "", descripcion: "" }); setMostrarNuevo(false) }}
                disabled={!nuevoEj.nombre.trim()}
                style={{ background: nuevoEj.nombre.trim() ? C.accent : C.surface2, border: "none", borderRadius: 10, padding: "11px 0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: nuevoEj.nombre.trim() ? 1 : 0.4 }}>
                Guardar en biblioteca
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tipo de bloque */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 }}>AGREGAR COMO</div>
        <div style={{ display: "flex", gap: 6 }}>
          {TIPOS.map(t => (
            <button key={t.id} onClick={() => setTipoBloque(t.id)}
              style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: `1px solid ${tipoBloque === t.id ? t.color : C.border}`, background: tipoBloque === t.id ? t.color + "22" : "transparent", color: tipoBloque === t.id ? t.color : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{ padding: "10px 16px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar ejercicio..." autoFocus
            style={{ ...inp, paddingLeft: 36 }} />
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          <button onClick={() => setMusculo(null)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${!musculo ? C.accent : C.border}`, background: !musculo ? C.accentSub : "transparent", color: !musculo ? C.accentLight : C.textMuted, fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            Todos
          </button>
          {Object.keys(EJERCICIOS).map(m => (
            <button key={m} onClick={() => setMusculo(musculo === m ? null : m)}
              style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${musculo === m ? C.accent : C.border}`, background: musculo === m ? C.accentSub : "transparent", color: musculo === m ? C.accentLight : C.textMuted, fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {lista.length === 0 && <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Sin resultados</div>}
        {lista.map((ej, i) => (
          <div key={i} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onAgregar(ej, tipoBloque)}>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{ej.nombre}</div>
              {ej.descripcion && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{ej.descripcion}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <a href={ej.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(ej.nombre + " técnica")}`} target="_blank" rel="noopener noreferrer"
                style={{ width: 34, height: 34, borderRadius: 9, background: "#2a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill={ej.youtube ? C.red : C.red + "55"}><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 3 12 3 12 3s-4.2 0-6.8.2c-.6 0-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v1.9C.7 15.2 1 17 1 17s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.2 12 21 12 21s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3C22.7 18.7 23 17 23 17s.3-2.1.3-4.2v-1.9C23.3 9.1 23 7 23 7zM9.7 15V8.5l6.6 3.3L9.7 15z"/></svg>
              </a>
              <button onClick={() => onAgregar(ej, tipoBloque)}
                style={{ width: 34, height: 34, borderRadius: 9, background: C.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico d="M12 5v14M5 12h14" size={16} color="#fff" sw={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── AI Generator ──────────────────────────────────────────────────────────────
function GeneradorAI({ onRutinaGenerada, clientes, onCerrar }) {
  const [prompt, setPrompt] = useState("")
  const [clienteSelId, setClienteSelId] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  const clienteSel = clientes.find(c => c.id === clienteSelId)

  const generar = async () => {
    if (!prompt.trim()) return
    setCargando(true); setError("")
    try {
      const texto = await askClaude({
        max_tokens: 4000,
        messages: [{ role: "user", content: `Sos un personal trainer experto. Generá una rutina de entrenamiento basada en esto: "${prompt}"${clienteSel ? ` para el cliente ${clienteSel.nombre}` : ""}.\nRespondé SOLO con JSON válido, sin texto extra, con este formato exacto:\n{"nombre":"nombre de la rutina","dias":[{"nombre":"Día A - Pecho y Tríceps","ejercicios":[{"nombre":"Press de banca","series":"4","reps":"8-10","peso":"80kg","rir":"2","descanso":"120","aclaracion":""}]}]}` }]
      })
      if (!texto) { setError("La IA no devolvió respuesta."); setCargando(false); return }
      const rutina = JSON.parse(texto.replace(/```json|```/g, "").trim())
      const dias = rutina.dias.map(d => ({
        nombre: d.nombre,
        bloques: d.ejercicios.map(ej => ({
          id: Math.random().toString(36).slice(2), tipo: "normal",
          ejercicios: [{ nombre: ej.nombre || "", series: String(ej.series || "3"), reps: String(ej.reps || "10"), peso: String(ej.peso || ""), rir: String(ej.rir || "2"), descanso: String(ej.descanso || "90"), aclaracion: ej.aclaracion || "", video: "" }]
        }))
      }))
      onRutinaGenerada(rutina.nombre, dias, clienteSelId || null)
    } catch (e) {
      setError(e.message?.includes("401") ? "API key inválida." : `Error: ${e.message}`)
    }
    setCargando(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      style={{ background: "#1a1025", borderRadius: 16, border: `1px solid #7c3aed44`, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #7c3aed22", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#c4b5fd" }}>✨ Generar con IA</div>
          <div style={{ fontSize: 12, color: "#818cf8", marginTop: 2 }}>Describí el objetivo y la IA arma la rutina completa</div>
        </div>
        <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Ico d="M18 6L6 18M6 6l12 12" size={16} color="#818cf8" />
        </button>
      </div>
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {clientes.length > 0 && (
          <select value={clienteSelId} onChange={e => setClienteSelId(e.target.value)}
            style={{ ...inp, color: clienteSelId ? C.text : C.textMuted }}>
            <option value="">Seleccionar cliente (opcional)</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        )}
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Ej: Rutina de fuerza 4 días, nivel intermedio, enfocada en piernas y espalda. Incluir biseries en accesorios..."
          style={{ ...inp, minHeight: 90, resize: "none", lineHeight: 1.6 }} />
        <button onClick={generar} disabled={cargando || !prompt.trim()}
          style={{ background: cargando || !prompt.trim() ? "#312e81" : "#7c3aed", border: "none", borderRadius: 12, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !prompt.trim() ? 0.5 : 1 }}>
          {cargando ? "Generando rutina..." : "✨ Generar rutina"}
        </button>
        {cargando && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }}
            style={{ textAlign: "center", color: "#818cf8", fontSize: 12 }}>La IA está armando tu rutina...</motion.div>
        )}
        {error && <div style={{ color: C.red, fontSize: 12, background: C.red + "11", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
      </div>
    </motion.div>
  )
}

// ── PDF ───────────────────────────────────────────────────────────────────────
async function generarPDF(nombre, dias) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(232, 113, 74)
  doc.rect(0, 0, pageW, 30, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18); doc.setFont(undefined, "bold")
  doc.text(nombre || "Rutina", 14, 20)
  let y = 40
  dias.forEach((dia, di) => {
    doc.setFontSize(13); doc.setTextColor(40, 40, 40); doc.setFont(undefined, "bold")
    doc.text(dia.nombre, 14, y)
    doc.setDrawColor(232, 113, 74); doc.setLineWidth(0.5); doc.line(14, y + 2, pageW - 14, y + 2)
    y += 10
    ;(dia.bloques || []).forEach((bloque, bi) => {
      const tipo = TIPOS.find(t => t.id === bloque.tipo) || TIPOS[0]
      const esTipado = bloque.tipo !== "normal"
      const colorMap = { biserie: [229, 166, 12], superserie: [62, 207, 110], circuito: [229, 72, 77] }
      const col = colorMap[bloque.tipo] || [232, 113, 74]
      const rows = bloque.ejercicios.map((e, ei) => [
        esTipado ? `${bi+1}${String.fromCharCode(65+ei)}` : `${bi+1}`,
        e.nombre || "-", e.series || "-", e.reps || "-", e.peso || "-",
        e.rir !== "" ? e.rir : "-", e.descanso ? `${e.descanso}s` : "-", e.aclaracion || "",
      ])
      if (esTipado) {
        doc.setFillColor(...col); doc.roundedRect(14, y - 4, 34, 7, 2, 2, "F")
        doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont(undefined, "bold")
        doc.text(tipo.label.toUpperCase(), 16, y + 0.5); y += 8
      }
      autoTable(doc, {
        startY: y,
        head: [["#", "Ejercicio", "Series", "Reps", "Peso", "RIR", "Desc.", "Notas"]],
        body: rows,
        styles: { fontSize: 9, cellPadding: 2.5, textColor: [40, 40, 40] },
        headStyles: { fillColor: col, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        columnStyles: { 0: { cellWidth: 8 }, 2: { cellWidth: 14, halign: "center" }, 3: { cellWidth: 12, halign: "center" }, 4: { cellWidth: 14, halign: "center" }, 5: { cellWidth: 10, halign: "center" }, 6: { cellWidth: 14, halign: "center" } },
        alternateRowStyles: { fillColor: [252, 248, 245] },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + (esTipado ? 8 : 6)
      if (y > 260) { doc.addPage(); y = 20 }
    })
    y += 4
    if (y > 260 && di < dias.length - 1) { doc.addPage(); y = 20 }
  })
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(180); doc.setFont(undefined, "normal")
    doc.text("Generado con TuPersonal", 14, doc.internal.pageSize.getHeight() - 8)
    doc.text(`${i} / ${pages}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" })
  }
  doc.save(`${(nombre || "rutina").replace(/\s+/g, "_")}.pdf`)
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreadorRutinasNuevo({ clientes = [], onGuardar, planActual = "gratis", onMejorarPlan, rutinaInicial = null, onEliminar }) {
  const esEdicion = !!rutinaInicial?.id
  const diasIniciales = (() => {
    if (!rutinaInicial) return [{ nombre: "Día A", bloques: [] }, { nombre: "Día B", bloques: [] }, { nombre: "Día C", bloques: [] }]
    try {
      const raw = typeof rutinaInicial.dias === "string" ? JSON.parse(rutinaInicial.dias) : (rutinaInicial.dias || [])
      const norm = normalizarDias(raw)
      return norm.length > 0 ? norm : [{ nombre: "Día A", bloques: [] }]
    } catch { return [{ nombre: "Día A", bloques: [] }] }
  })()
  const [nombre, setNombre] = useState(rutinaInicial?.nombre || "")
  const [dias, setDias] = useState(diasIniciales)
  const [diaActivo, setDiaActivo] = useState(0)
  const [clientesAsignados, setClientesAsignados] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [biblioteca, setBiblioteca] = useState(false)
  const [aiPanel, setAiPanel] = useState(false)
  const [aiGenerado, setAiGenerado] = useState(false)
  const [confirmFn, setConfirmFn] = useState(null)
  const [ejerciciosCustom, setEjerciciosCustom] = useState({})
  const [tipoPicker, setTipoPicker] = useState(false)
  const tabsRef = useRef(null)

  const diaActual = dias[diaActivo]
  const bloques = diaActual?.bloques || []

  const updateBloque = (bIdx, nuevo) =>
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : { ...d, bloques: d.bloques.map((b, j) => j === bIdx ? nuevo : b) }))

  const deleteBloque = (bIdx) =>
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : { ...d, bloques: d.bloques.filter((_, j) => j !== bIdx) }))

  const reorderBloques = (nuevos) =>
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : { ...d, bloques: nuevos }))

  const agregarBloque = (tipo = "normal") => {
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : { ...d, bloques: [...d.bloques, bloqueVacio(tipo)] }))
    setTipoPicker(false)
  }

  const agregarDia = () => {
    const letra = String.fromCharCode(65 + dias.length)
    setDias(prev => [...prev, { nombre: `Día ${letra}`, bloques: [] }])
    setTimeout(() => { if (tabsRef.current) tabsRef.current.scrollLeft = tabsRef.current.scrollWidth }, 50)
  }

  const duplicarDia = () => {
    const copia = JSON.parse(JSON.stringify(dias[diaActivo]))
    copia.nombre = `${copia.nombre} (copia)`
    copia.bloques = copia.bloques.map(b => ({ ...b, id: Math.random().toString(36).slice(2) }))
    const nuevos = [...dias.slice(0, diaActivo + 1), copia, ...dias.slice(diaActivo + 1)]
    setDias(nuevos); setDiaActivo(diaActivo + 1)
  }

  const eliminarDia = () => {
    if (dias.length <= 1) return
    setDias(prev => prev.filter((_, i) => i !== diaActivo))
    setDiaActivo(Math.max(0, diaActivo - 1))
  }

  const agregarDesde = (ej, tipo) => {
    const bloque = { id: Math.random().toString(36).slice(2), tipo, ejercicios: [{ ...ejVacio(), nombre: ej.nombre, video: ej.youtube || "" }] }
    if (tipo === "biserie") bloque.ejercicios.push(ejVacio())
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : { ...d, bloques: [...d.bloques, bloque] }))
    setBiblioteca(false)
  }

  const handleRutinaAI = (nombreRutina, diasGenerados, clienteId) => {
    setNombre(nombreRutina)
    setDias(diasGenerados)
    setDiaActivo(0)
    setAiPanel(false)
    setAiGenerado(true)
    if (clienteId) setClientesAsignados(prev => prev.includes(clienteId) ? prev : [...prev, clienteId])
  }

  const handleGuardar = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    await onGuardar?.({ nombre, dias, clientesAsignados })
    setGuardando(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Título + acciones superiores */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>{esEdicion ? "Editar rutina" : "Crear rutina"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {esEdicion && (
            <button onClick={() => setConfirmFn(() => onEliminar)}
              style={{ height: 38, padding: "0 14px", background: "#3a1a1a", border: "1px solid #ef444433", borderRadius: 10, color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Eliminar
            </button>
          )}
          <button onClick={() => generarPDF(nombre, dias)}
            style={{ height: 38, padding: "0 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Ico d="M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" size={14} color={C.textSub} />
            PDF
          </button>
          <button onClick={handleGuardar} disabled={guardando || !nombre.trim()}
            style={{ height: 38, padding: "0 18px", background: nombre.trim() ? C.accent : C.surface2, border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: nombre.trim() ? "pointer" : "default", opacity: !nombre.trim() ? 0.4 : 1 }}>
            {guardando ? "..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* ── Nombre */}
      <input placeholder="Nombre de la rutina..." value={nombre} onChange={e => setNombre(e.target.value)}
        style={{ ...inp, fontSize: 16, padding: "13px 16px", borderRadius: 14, fontWeight: 700, marginBottom: 12 }} />

      {/* ── Botón IA */}
      {planActual === "gratis" ? (
        <button onClick={() => onMejorarPlan?.()}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", opacity: 0.75 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#33333344", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🔒</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.textSub, display: "flex", alignItems: "center", gap: 8 }}>
              Generar con IA
              <span style={{ fontSize: 10, background: "#f59e0b22", color: "#f59e0b", borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>Pro</span>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>Disponible en plan Pro y Elite</div>
          </div>
        </button>
      ) : (
        <button onClick={() => setAiPanel(v => !v)}
          style={{ background: aiPanel ? "#1a1025" : C.surface, border: `1px solid ${aiPanel ? "#7c3aed55" : C.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#7c3aed22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✨</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: aiPanel ? "#c4b5fd" : C.text }}>Generar con IA</div>
            <div style={{ fontSize: 12, color: aiPanel ? "#818cf8" : C.textMuted, marginTop: 1 }}>Describís el objetivo y la IA arma todo</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Ico d={aiPanel ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} size={16} color={aiPanel ? "#818cf8" : C.textMuted} />
          </div>
        </button>
      )}

      <AnimatePresence>
        {aiPanel && <GeneradorAI onRutinaGenerada={handleRutinaAI} clientes={clientes} onCerrar={() => setAiPanel(false)} />}
      </AnimatePresence>

      {/* ── Tabs de días */}
      <div ref={tabsRef} style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", marginBottom: 10 }}>
        {dias.map((d, i) => {
          const count = (d.bloques || []).length
          return (
            <button key={i} onClick={() => setDiaActivo(i)}
              style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${diaActivo === i ? C.accent : C.border}`, background: diaActivo === i ? C.accentSub : C.surface, color: diaActivo === i ? C.accentLight : C.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
              {d.nombre}
              {count > 0 && <span style={{ background: diaActivo === i ? C.accent : C.surface3, color: diaActivo === i ? "#fff" : C.textMuted, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{count}</span>}
            </button>
          )
        })}
        <button onClick={agregarDia} style={{ padding: "8px 12px", borderRadius: 20, border: `1px dashed ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
          + Día
        </button>
      </div>

      {/* ── Header del día activo */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input value={diaActual.nombre} onChange={e => setDias(prev => prev.map((d, i) => i !== diaActivo ? d : { ...d, nombre: e.target.value }))}
          style={{ ...inp, flex: 1, fontWeight: 600, borderRadius: 10 }} placeholder="Nombre del día..." />
        <button onClick={duplicarDia} title="Duplicar día"
          style={{ width: 38, height: 38, borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.textSub} strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button onClick={() => dias.length > 1 && setConfirmFn(() => eliminarDia)} disabled={dias.length <= 1} title="Eliminar día"
          style={{ width: 38, height: 38, borderRadius: 10, background: dias.length > 1 ? "#2a0a0a" : "transparent", border: `1px solid ${dias.length > 1 ? C.red + "44" : C.border}`, cursor: dias.length > 1 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: dias.length <= 1 ? 0.3 : 1 }}>
          <Ico d="M3 6h18M19 6l-1 14H6L5 6" size={14} color={C.red} />
        </button>
      </div>

      {/* ── Estado vacío */}
      <AnimatePresence>
        {bloques.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: C.surface, borderRadius: 16, padding: "36px 20px", textAlign: "center", border: `1px dashed ${C.border2}`, marginBottom: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏋️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>Sin ejercicios</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Usá los botones de abajo para agregar</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bloques */}
      <Reorder.Group axis="y" values={bloques} onReorder={reorderBloques}
        style={{ listStyle: "none", padding: 0, margin: "0 0 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        <AnimatePresence>
          {bloques.map((bloque, bIdx) => (
            <DraggableBloque key={bloque.id} bloque={bloque} bloqueIdx={bIdx}
              onChange={nuevo => updateBloque(bIdx, nuevo)} onDelete={() => setConfirmFn(() => () => deleteBloque(bIdx))}
              ejerciciosCustom={ejerciciosCustom} startCollapsed={esEdicion || aiGenerado} />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* ── Botones agregar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <button onClick={() => setTipoPicker(v => !v)}
            style={{ width: "100%", height: 46, background: tipoPicker ? C.accentSub : C.surface, border: `1px solid ${tipoPicker ? C.accent : C.border}`, borderRadius: 14, color: tipoPicker ? C.accentLight : C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Ico d="M12 5v14M5 12h14" size={16} color={tipoPicker ? C.accentLight : C.text} sw={2.5} />
            Agregar bloque
            <Ico d={tipoPicker ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} size={14} color={tipoPicker ? C.accentLight : C.textMuted} />
          </button>
          <AnimatePresence>
            {tipoPicker && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 14, overflow: "hidden", zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                {TIPOS.map(t => (
                  <button key={t.id} onClick={() => agregarBloque(t.id)}
                    style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", borderBottom: t.id !== "circuito" ? `1px solid ${C.border}` : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
                    onMouseEnter={e => e.currentTarget.style.background = t.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.color }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{{ normal: "1 ejercicio", biserie: "2 ejercicios alternados", superserie: "Hasta 6 ejercicios", circuito: "Hasta 10 ejercicios" }[t.id]}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => { setBiblioteca(true); setTipoPicker(false) }}
          style={{ height: 46, padding: "0 16px", background: C.accent, border: "none", borderRadius: 14, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          Biblioteca
        </button>
      </div>

      {/* ── Asignar clientes */}
      {clientes.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 12 }}>ASIGNAR A CLIENTES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {clientes.map((c, i) => {
              const key = c.id || c.nombre
              const sel = clientesAsignados.includes(key)
              return (
                <button key={i} onClick={() => setClientesAsignados(prev => sel ? prev.filter(x => x !== key) : [...prev, key])}
                  style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${sel ? C.accent : C.border}`, background: sel ? C.accentSub : C.surface2, color: sel ? C.accentLight : C.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  {sel ? "✓ " : ""}{c.nombre}
                </button>
              )
            })}
          </div>
          {clientesAsignados.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.textMuted }}>
              Se asignará a {clientesAsignados.length} cliente{clientesAsignados.length > 1 ? "s" : ""} al guardar
            </div>
          )}
        </div>
      )}

      {/* ── Biblioteca (full screen) */}
      <AnimatePresence>
        {biblioteca && (
          <Biblioteca onAgregar={agregarDesde} onCerrar={() => setBiblioteca(false)}
            ejerciciosCustom={ejerciciosCustom}
            onAgregarCustom={(m, ej) => setEjerciciosCustom(prev => ({ ...prev, [m]: [...(prev[m] || []), ej] }))} />
        )}
      </AnimatePresence>
      <ConfirmModal open={!!confirmFn} onConfirm={() => { confirmFn?.(); setConfirmFn(null) }} onCancel={() => setConfirmFn(null)} />
    </div>
  )
}
