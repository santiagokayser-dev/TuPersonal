import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { EJERCICIOS, MUSCULO_ALIASES } from "./ejercicios"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { askClaude } from "./ai"

const C = {
  bg: "#080808", surface: "#111111", surface2: "#1a1a1a", border: "#222222", border2: "#2a2a2a",
  text: "#ffffff", textSub: "#888888", textMuted: "#444444", accent: "#6366f1", accentSub: "#312e81",
  green: "#22c55e", red: "#ef4444", yellow: "#f59e0b",
}

const T = {
  h1: { fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.6 },
  h3: { fontSize: 14, fontWeight: 600, color: C.text },
  label: { fontSize: 10, fontWeight: 500, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.1 },
}

const inp = {
  background: C.surface2, border: `0.5px solid ${C.border2}`, borderRadius: 9,
  padding: "7px 9px", color: C.text, fontSize: 13, outline: "none",
  fontFamily: "-apple-system, sans-serif", width: "100%", boxSizing: "border-box",
}

// Normaliza texto quitando tildes y pasando a minúsculas
function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

// Busca ejercicios por nombre, aliases y grupo muscular
function buscarEjercicios(query, extras = {}, max = 50) {
  const q = norm(query.trim())
  if (!q) return []
  const todosBase = Object.values(EJERCICIOS).flat()
  const todosExtras = Object.values(extras).flat()
  const todos = [...todosBase, ...todosExtras]

  const musculoKey = MUSCULO_ALIASES[q]
  let muscularMatches = []
  if (musculoKey) {
    muscularMatches = [...(EJERCICIOS[musculoKey] || []), ...(extras[musculoKey] || [])]
  }

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
  { id: "normal",     label: "Normal",     color: null },
  { id: "biserie",    label: "Biserie",    color: "#f59e0b" },
  { id: "superserie", label: "Superserie", color: "#22c55e" },
  { id: "circuito",   label: "Circuito",   color: "#ef4444" },
]

const TIPO_MAX = { normal: 1, biserie: 2, superserie: 6, circuito: 10 }

const ejVacio = () => ({ nombre: "", series: "3", reps: "10", rir: "2", descanso: "90", aclaracion: "", video: "" })
const bloqueVacio = (tipo = "normal") => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  tipo,
  ejercicios: [ejVacio()],
  _expandIdx: 0,  // primer ejercicio empieza expandido
})

const DIAS_INIT = [
  { nombre: "Día A", bloques: [] },
  { nombre: "Día B", bloques: [] },
  { nombre: "Día C", bloques: [] },
]

// ── Tiny icon components ─────────────────────────────────────────────────────

function IconTrash({ color = C.red }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

function IconYT({ color = C.red }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill={color}>
      <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 3 12 3 12 3s-4.2 0-6.8.2c-.6 0-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v1.9C.7 15.2 1 17 1 17s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.2 12 21 12 21s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3C22.7 18.7 23 17 23 17s.3-2.1.3-4.2v-1.9C23.3 9.1 23 7 23 7zM9.7 15V8.5l6.6 3.3L9.7 15z"/>
    </svg>
  )
}

function IconChevronUp() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
}
function IconChevronDown() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
}
function IconPlus({ color = C.accent }) {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
}

// ── ExerciseField ────────────────────────────────────────────────────────────

function CampoEj({ label, value, onChange, placeholder, width = "auto", center = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width }}>
      <div style={T.label}>{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inp, textAlign: center ? "center" : "left", padding: "6px 7px" }}
      />
    </div>
  )
}

// ── Icono lápiz ──────────────────────────────────────────────────────────────
function IconEdit({ color = C.textMuted }) {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

// ── EjercicioCard ────────────────────────────────────────────────────────────

function EjercicioCard({ ej, onChange, onChangeBulk, onDelete, showDelete, tipoColor, todosEjercicios, expanded, onExpand, onConfirm }) {
  const [dropOpen, setDropOpen] = useState(false)
  const ytUrl = ej.video || `https://www.youtube.com/results?search_query=${encodeURIComponent(ej.nombre + " ejercicio técnica")}`

  const sugerencias = ej.nombre.trim().length >= 2
    ? buscarEjercicios(ej.nombre, {}, 6)
    : []

  const seleccionarSugerencia = (s) => {
    onChangeBulk({ nombre: s.nombre, video: s.youtube || "" })
    setDropOpen(false)
  }

  // Vista colapsada
  if (!expanded) {
    return (
      <div style={{
        background: C.surface2, borderRadius: 10,
        padding: "9px 12px",
        border: `0.5px solid ${tipoColor ? tipoColor + "33" : C.border2}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: ej.nombre ? C.text : C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ej.nombre || "Sin nombre"}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            {[
              ej.series && ej.reps ? `${ej.series}×${ej.reps}` : null,
              ej.rir ? `RIR ${ej.rir}` : null,
              ej.descanso ? `${ej.descanso}s` : null,
            ].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {(ej.video || ej.nombre) && (
            <a href={ytUrl} target="_blank" rel="noopener noreferrer"
              style={{ width: 28, height: 28, borderRadius: 7, background: ej.video ? "#3a1a1a" : "#2a1a1a", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <IconYT color={ej.video ? C.red : "#f5533844"} />
            </a>
          )}
          <button onClick={onExpand}
            style={{ width: 28, height: 28, borderRadius: 7, background: C.surface, border: `0.5px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconEdit />
          </button>
          {showDelete && (
            <button onClick={onDelete}
              style={{ width: 28, height: 28, borderRadius: 7, background: "#3a1a1a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconTrash />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Vista expandida (editando)
  return (
    <div style={{
      background: C.surface2, borderRadius: 12, padding: "12px 12px 10px",
      border: `0.5px solid ${tipoColor ? tipoColor + "66" : C.accent + "55"}`,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Nombre */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            value={ej.nombre}
            onChange={e => { onChange("nombre", e.target.value); setDropOpen(true) }}
            onFocus={() => setDropOpen(true)}
            onBlur={() => setTimeout(() => setDropOpen(false), 150)}
            placeholder="Nombre del ejercicio..."
            autoFocus
            style={{ ...inp, fontSize: 13, fontWeight: 500, width: "100%" }}
          />
          {dropOpen && sugerencias.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
              background: C.surface, border: `0.5px solid ${C.border2}`, borderRadius: 10,
              overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}>
              {sugerencias.map((s, i) => (
                <div key={i} onMouseDown={e => { e.preventDefault(); seleccionarSugerencia(s) }}
                  style={{ padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < sugerencias.length - 1 ? `0.5px solid ${C.border}` : "none", cursor: "pointer", background: "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div>
                    <div style={{ fontSize: 13, color: C.text }}>{s.nombre}</div>
                    {s.descripcion && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{s.descripcion}</div>}
                  </div>
                  {s.youtube && <IconYT color={C.red} />}
                </div>
              ))}
            </div>
          )}
        </div>
        {showDelete && (
          <button onClick={onDelete}
            style={{ background: "#3a1a1a", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconTrash />
          </button>
        )}
      </div>

      {/* Series / Reps / RIR / Descanso */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
        <CampoEj label="Series" value={ej.series} onChange={v => onChange("series", v)} placeholder="3" center />
        <CampoEj label="Reps" value={ej.reps} onChange={v => onChange("reps", v)} placeholder="10" center />
        <CampoEj label="RIR" value={ej.rir} onChange={v => onChange("rir", v)} placeholder="2" center />
        <CampoEj label="Desc. (s)" value={ej.descanso} onChange={v => onChange("descanso", v)} placeholder="90" center />
      </div>

      {/* Aclaración */}
      <input
        value={ej.aclaracion}
        onChange={e => onChange("aclaracion", e.target.value)}
        placeholder="Aclaración o nota técnica..."
        style={{ ...inp, fontSize: 12, color: C.textSub }}
      />

      {/* Video */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          value={ej.video}
          onChange={e => onChange("video", e.target.value)}
          placeholder="URL del video (opcional)..."
          style={{ ...inp, flex: 1, fontSize: 11, color: C.textSub }}
        />
        <a href={ytUrl} target="_blank" rel="noopener noreferrer"
          title={ej.video ? "Ver video" : "Buscar en YouTube"}
          style={{ background: ej.video ? "#3a1a1a" : "#2a1a1a", border: `0.5px solid ${C.border2}`, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
          <IconYT color={ej.video ? C.red : "#f5533844"} />
        </a>
      </div>

      {/* Confirmar */}
      <button onClick={onConfirm}
        style={{ background: C.accent, border: "none", borderRadius: 10, padding: "9px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        Agregar ejercicio
      </button>
    </div>
  )
}

// ── BloqueCard ───────────────────────────────────────────────────────────────

function BloqueCard({ bloque, bloqueIdx, totalBloques, onChange, onDelete, onMover, todosEjercicios }) {
  const [expandedIdx, setExpandedIdx] = useState(bloque._expandIdx ?? null)
  const tipo = TIPOS.find(t => t.id === bloque.tipo) || TIPOS[0]
  const maxEjs = TIPO_MAX[bloque.tipo]
  const puedeAgregarEj = bloque.ejercicios.length < maxEjs

  const actualizarEj = (ejIdx, campo, valor) => {
    const nuevos = bloque.ejercicios.map((e, i) => i === ejIdx ? { ...e, [campo]: valor } : e)
    onChange({ ...bloque, ejercicios: nuevos })
  }

  const actualizarEjBulk = (ejIdx, campos) => {
    const nuevos = bloque.ejercicios.map((e, i) => i === ejIdx ? { ...e, ...campos } : e)
    onChange({ ...bloque, ejercicios: nuevos })
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{
        background: C.surface, borderRadius: 16,
        border: `0.5px solid ${tipo.color ? tipo.color + "55" : C.border}`,
        overflow: "hidden",
      }}>

      {/* Header del bloque */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: `0.5px solid ${tipo.color ? tipo.color + "33" : C.border}`, background: tipo.color ? tipo.color + "0d" : C.surface2 }}>
        {/* Número */}
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, width: 18, flexShrink: 0 }}>{bloqueIdx + 1}</div>

        {/* Selector de tipo */}
        <div style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
          {TIPOS.map(t => (
            <button
              key={t.id}
              onClick={() => cambiarTipo(t.id)}
              style={{
                padding: "3px 10px", borderRadius: 20, border: `0.5px solid ${bloque.tipo === t.id ? (t.color || C.accent) : C.border}`,
                background: bloque.tipo === t.id ? (t.color ? t.color + "22" : C.accentSub) : "transparent",
                color: bloque.tipo === t.id ? (t.color || "#a5b4fc") : C.textMuted,
                fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Mover + borrar */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={() => onMover(-1)} disabled={bloqueIdx === 0}
            style={{ background: C.surface2, border: `0.5px solid ${C.border}`, borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: bloqueIdx === 0 ? 0.3 : 1 }}>
            <IconChevronUp />
          </button>
          <button onClick={() => onMover(1)} disabled={bloqueIdx === totalBloques - 1}
            style={{ background: C.surface2, border: `0.5px solid ${C.border}`, borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: bloqueIdx === totalBloques - 1 ? 0.3 : 1 }}>
            <IconChevronDown />
          </button>
          <button onClick={onDelete}
            style={{ background: "#3a1a1a", border: "0.5px solid #ef444433", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Ejercicios */}
      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {bloque.ejercicios.map((ej, ejIdx) => (
          <div key={ejIdx}>
            {ejIdx > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, height: 0.5, background: tipo.color ? tipo.color + "55" : C.border }} />
                <div style={{ fontSize: 9, fontWeight: 700, color: tipo.color || C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
                  {tipo.label}
                </div>
                <div style={{ flex: 1, height: 0.5, background: tipo.color ? tipo.color + "55" : C.border }} />
              </div>
            )}
            <EjercicioCard
              ej={ej}
              onChange={(campo, valor) => actualizarEj(ejIdx, campo, valor)}
              onChangeBulk={(campos) => actualizarEjBulk(ejIdx, campos)}
              onDelete={() => eliminarEj(ejIdx)}
              showDelete={bloque.tipo !== "normal"}
              tipoColor={tipo.color}
              todosEjercicios={todosEjercicios}
              expanded={expandedIdx === ejIdx}
              onExpand={() => setExpandedIdx(ejIdx)}
              onConfirm={() => setExpandedIdx(null)}
            />
          </div>
        ))}

        {/* Agregar ejercicio al bloque */}
        {puedeAgregarEj && bloque.tipo !== "normal" && (
          <button onClick={agregarEj}
            style={{ background: "transparent", border: `0.5px dashed ${tipo.color ? tipo.color + "66" : C.border}`, borderRadius: 10, padding: "8px 0", color: tipo.color || C.textMuted, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <IconPlus color={tipo.color || C.textMuted} />
            Agregar ejercicio al {tipo.label.toLowerCase()}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Biblioteca ───────────────────────────────────────────────────────────────

function Biblioteca({ onAgregar, onCerrar, ejerciciosCustom, onAgregarCustom }) {
  const [busqueda, setBusqueda] = useState("")
  const [musculo, setMusculo] = useState(null)
  const [tipoBloque, setTipoBloque] = useState("normal")
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [nuevoEj, setNuevoEj] = useState({ nombre: "", youtube: "", descripcion: "" })

  const todosCustom = Object.values(ejerciciosCustom).flat()
  const lista = musculo
    ? [...(EJERCICIOS[musculo] || []), ...(ejerciciosCustom[musculo] || [])].filter(e =>
        busqueda.trim()
          ? norm(e.nombre).includes(norm(busqueda)) || (e.aliases || []).some(a => norm(a).includes(norm(busqueda)))
          : true
      )
    : busqueda.trim()
      ? buscarEjercicios(busqueda, ejerciciosCustom, 50)
      : [...Object.values(EJERCICIOS).flat(), ...todosCustom].slice(0, 50)

  const handleAgregarCustom = () => {
    if (!nuevoEj.nombre.trim()) return
    onAgregarCustom(musculo || "Custom", { ...nuevoEj })
    setNuevoEj({ nombre: "", youtube: "", descripcion: "" })
    setMostrarNuevo(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{ background: C.surface, borderRadius: 20, border: `0.5px solid ${C.border}`, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "12px 14px", borderBottom: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={T.h3}>Biblioteca de ejercicios</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setMostrarNuevo(v => !v)}
            style={{ background: C.accentSub, border: `0.5px solid ${C.accent}`, borderRadius: 8, padding: "4px 10px", color: "#a5b4fc", fontSize: 12, cursor: "pointer" }}>
            + Nuevo
          </button>
          <button onClick={onCerrar}
            style={{ background: C.surface2, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", color: C.textSub, fontSize: 12, cursor: "pointer" }}>
            Cerrar
          </button>
        </div>
      </div>

      {/* Form nuevo ejercicio */}
      <AnimatePresence>
        {mostrarNuevo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ ...T.label, marginBottom: 2 }}>Ejercicio del coach {musculo ? `— ${musculo}` : ""}</div>
              <input placeholder="Nombre del ejercicio *" value={nuevoEj.nombre} onChange={e => setNuevoEj(p => ({ ...p, nombre: e.target.value }))}
                style={{ ...inp }} />
              <input placeholder="Link de YouTube (opcional)" value={nuevoEj.youtube} onChange={e => setNuevoEj(p => ({ ...p, youtube: e.target.value }))}
                style={{ ...inp, fontSize: 12 }} />
              <input placeholder="Descripción breve" value={nuevoEj.descripcion} onChange={e => setNuevoEj(p => ({ ...p, descripcion: e.target.value }))}
                style={{ ...inp, fontSize: 12 }} />
              <button onClick={handleAgregarCustom} disabled={!nuevoEj.nombre.trim()}
                style={{ background: nuevoEj.nombre.trim() ? C.accent : C.surface2, border: "none", borderRadius: 10, padding: "9px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: nuevoEj.nombre.trim() ? 1 : 0.5 }}>
                Agregar a biblioteca
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tipo de bloque */}
      <div style={{ padding: "8px 12px", borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ ...T.label, marginBottom: 6 }}>Agregar como</div>
        <div style={{ display: "flex", gap: 5 }}>
          {TIPOS.map(t => (
            <button key={t.id} onClick={() => setTipoBloque(t.id)}
              style={{ flex: 1, padding: "5px 0", borderRadius: 10, border: `0.5px solid ${tipoBloque === t.id ? (t.color || C.accent) : C.border}`, background: tipoBloque === t.id ? (t.color ? t.color + "22" : C.accentSub) : "transparent", color: tipoBloque === t.id ? (t.color || "#a5b4fc") : C.textMuted, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{ padding: "8px 12px", borderBottom: `0.5px solid ${C.border}` }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar ejercicio..."
          autoFocus
          style={{ ...inp }}
        />
      </div>

      {/* Filtro músculo */}
      <div style={{ display: "flex", gap: 5, padding: "6px 12px", overflowX: "auto", scrollbarWidth: "none", borderBottom: `0.5px solid ${C.border}` }}>
        <button onClick={() => setMusculo(null)}
          style={{ padding: "3px 10px", borderRadius: 20, border: `0.5px solid ${!musculo ? C.accent : C.border}`, background: !musculo ? C.accentSub : "transparent", color: !musculo ? "#a5b4fc" : C.textMuted, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          Todos
        </button>
        {Object.keys(EJERCICIOS).map(m => (
          <button key={m} onClick={() => setMusculo(musculo === m ? null : m)}
            style={{ padding: "3px 10px", borderRadius: 20, border: `0.5px solid ${musculo === m ? C.accent : C.border}`, background: musculo === m ? C.accentSub : "transparent", color: musculo === m ? "#a5b4fc" : C.textMuted, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {m}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ maxHeight: 240, overflowY: "auto", scrollbarWidth: "none" }}>
        {lista.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Sin resultados</div>
        )}
        {lista.map((ej, i) => (
          <div key={i}
            style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onAgregar(ej, tipoBloque)}>
              <div style={{ fontSize: 13, color: C.text }}>{ej.nombre}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{ej.descripcion}</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              {ej.youtube ? (
                <a href={ej.youtube} target="_blank" rel="noopener noreferrer"
                  style={{ width: 28, height: 28, borderRadius: 8, background: "#3a1a1a", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                  <IconYT color={C.red} />
                </a>
              ) : (
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ej.nombre + " técnica ejercicio")}`} target="_blank" rel="noopener noreferrer"
                  style={{ width: 28, height: 28, borderRadius: 8, background: "#2a1a1a", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                  <IconYT color="#f5533844" />
                </a>
              )}
              <button onClick={() => onAgregar(ej, tipoBloque)}
                style={{ width: 28, height: 28, borderRadius: 8, background: C.accentSub, border: `0.5px solid ${C.accent}44`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconPlus color="#a5b4fc" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── AI Generator ─────────────────────────────────────────────────────────────

function GeneradorAI({ onRutinaGenerada, clientes }) {
  const [prompt, setPrompt] = useState("")
  const [clienteSel, setClienteSel] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  const generar = async () => {
    if (!prompt.trim()) return
    setCargando(true)
    setError("")
    try {
      const texto = await askClaude({
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: `Sos un personal trainer experto. Generá una rutina de entrenamiento basada en esto: "${prompt}"${clienteSel ? ` para el cliente ${clienteSel}` : ""}.
Respondé SOLO con JSON válido, sin texto extra, con este formato exacto:
{
  "nombre": "nombre de la rutina",
  "dias": [
    {
      "nombre": "Día A - Pecho y Tríceps",
      "ejercicios": [
        { "nombre": "Press de banca", "series": "4", "reps": "8-10", "rir": "2", "descanso": "120", "aclaracion": "" }
      ]
    }
  ]
}`
        }]
      })
      if (!texto) { setError("La AI no devolvió respuesta. Intentá de nuevo."); setCargando(false); return }

      const clean = texto.replace(/```json|```/g, "").trim()
      const rutina = JSON.parse(clean)

      const dias = rutina.dias.map(d => ({
        nombre: d.nombre,
        bloques: d.ejercicios.map(ej => ({
          id: Math.random().toString(36).slice(2),
          tipo: "normal",
          ejercicios: [{
            nombre: ej.nombre || "",
            series: String(ej.series || "3"),
            reps: String(ej.reps || "10"),
            rir: String(ej.rir || "2"),
            descanso: String(ej.descanso || "90"),
            aclaracion: ej.aclaracion || "",
            video: "",
          }]
        }))
      }))

      onRutinaGenerada(rutina.nombre, dias)
    } catch (e) {
      if (e.message?.includes("fetch") || e.message?.includes("network")) {
        setError("Sin conexión. Revisá tu internet.")
      } else if (e.message?.includes("401") || e.message?.includes("invalid x-api-key")) {
        setError("API key inválida. Revisá el valor de VITE_ANTHROPIC_KEY en Vercel.")
      } else {
        setError(`Error: ${e.message}`)
      }
    }
    setCargando(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      style={{ background: "#1e1b3a", borderRadius: 16, border: `0.5px solid ${C.accentSub}`, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: `0.5px solid ${C.accentSub}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#c4b5fd" }}>✨ Generar rutina con AI</div>
        <div style={{ fontSize: 12, color: "#818cf8", marginTop: 2 }}>Describí qué necesita el cliente y la AI arma la rutina completa</div>
      </div>
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {clientes.length > 0 && (
          <select value={clienteSel} onChange={e => setClienteSel(e.target.value)}
            style={{ ...inp, appearance: "none", color: clienteSel ? C.text : C.textMuted }}>
            <option value="">Seleccionar cliente (opcional)...</option>
            {clientes.map((c, i) => <option key={i} value={c.nombre}>{c.nombre}</option>)}
          </select>
        )}
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ej: Rutina de hipertrofia 3 días/semana, enfocada en pecho y espalda, nivel intermedio. Incluir biseries..."
          style={{ ...inp, minHeight: 80, resize: "none", lineHeight: 1.5, fontFamily: "-apple-system, sans-serif" }}
        />
        <button onClick={generar} disabled={cargando || !prompt.trim()}
          style={{ background: cargando || !prompt.trim() ? C.accentSub : C.accent, border: "none", borderRadius: 10, padding: "11px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: cargando || !prompt.trim() ? 0.6 : 1 }}>
          {cargando ? "Generando rutina..." : "✨ Generar rutina"}
        </button>
        {cargando && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ textAlign: "center", color: "#818cf8", fontSize: 12 }}>
            La AI está armando tu rutina...
          </motion.div>
        )}
        {error && (
          <div style={{ color: C.red, fontSize: 12, background: C.red + "11", borderRadius: 8, padding: "8px 12px", lineHeight: 1.5 }}>{error}</div>
        )}
      </div>
    </motion.div>
  )
}

// ── PDF ───────────────────────────────────────────────────────────────────────

function generarPDF(nombre, dias) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  // Encabezado
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont(undefined, "bold")
  doc.text(nombre || "Rutina", 14, 18)

  let y = 38

  dias.forEach((dia, di) => {
    const bloques = dia.bloques || []

    // Nombre del día
    doc.setFontSize(13)
    doc.setTextColor(60, 60, 60)
    doc.setFont(undefined, "bold")
    doc.text(dia.nombre, 14, y)
    doc.setDrawColor(99, 102, 241)
    doc.setLineWidth(0.5)
    doc.line(14, y + 2, pageW - 14, y + 2)
    y += 10

    if (bloques.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(180)
      doc.setFont(undefined, "normal")
      doc.text("Sin ejercicios", 14, y)
      y += 10
    }

    bloques.forEach((bloque, bi) => {
      const tipo = TIPOS.find(t => t.id === bloque.tipo) || TIPOS[0]
      const esTipado = bloque.tipo !== "normal"

      // Badge de tipo para biseries/superseries
      if (esTipado) {
        const colorMap = { biserie: [245, 158, 11], superserie: [34, 197, 94], circuito: [239, 68, 68] }
        const col = colorMap[bloque.tipo] || [99, 102, 241]
        doc.setFillColor(...col)
        doc.roundedRect(14, y - 4, 30, 7, 2, 2, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont(undefined, "bold")
        doc.text(tipo.label.toUpperCase(), 16, y + 0.5)
        y += 8
      }

      const rows = bloque.ejercicios.map((e, ei) => [
        esTipado ? `${bi + 1}${String.fromCharCode(65 + ei)}` : `${bi + 1}`,
        e.nombre || "-",
        e.series || "-",
        e.reps || "-",
        e.rir !== "" ? e.rir : "-",
        e.descanso ? `${e.descanso}s` : "-",
        e.aclaracion || "",
      ])

      autoTable(doc, {
        startY: y,
        head: [["#", "Ejercicio", "Series", "Reps", "RIR", "Desc.", "Aclaración"]],
        body: rows,
        styles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: esTipado
            ? ({ biserie: [245, 158, 11], superserie: [34, 197, 94], circuito: [239, 68, 68] }[bloque.tipo] || [99, 102, 241])
            : [99, 102, 241],
          textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          2: { cellWidth: 16, halign: "center" },
          3: { cellWidth: 14, halign: "center" },
          4: { cellWidth: 12, halign: "center" },
          5: { cellWidth: 16, halign: "center" },
        },
        alternateRowStyles: { fillColor: [248, 248, 255] },
        margin: { left: 14, right: 14 },
      })

      y = doc.lastAutoTable.finalY + (esTipado ? 8 : 6)

      if (y > 260) { doc.addPage(); y = 20 }
    })

    y += 4
    if (y > 260 && di < dias.length - 1) { doc.addPage(); y = 20 }
  })

  // Pie de página
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180)
    doc.setFont(undefined, "normal")
    doc.text("Generado con TuPersonal", 14, doc.internal.pageSize.getHeight() - 8)
    doc.text(`${i} / ${pages}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" })
  }

  doc.save(`${(nombre || "rutina").replace(/\s+/g, "_")}.pdf`)
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CreadorRutinasNuevo({ clientes = [], onGuardar }) {
  const [nombre, setNombre] = useState("")
  const [dias, setDias] = useState(DIAS_INIT)
  const [diaActivo, setDiaActivo] = useState(0)
  const [clientesAsignados, setClientesAsignados] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [biblioteca, setBiblioteca] = useState(false)
  const [aiPanel, setAiPanel] = useState(false)
  const [ejerciciosCustom, setEjerciciosCustom] = useState({})
  const tabsRef = useRef(null)

  const diaActual = dias[diaActivo]
  const bloques = diaActual.bloques || []

  // Actualizar un bloque
  const updateBloque = (bIdx, nuevoBloque) => {
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : {
      ...d, bloques: d.bloques.map((b, j) => j === bIdx ? nuevoBloque : b)
    }))
  }

  // Eliminar bloque
  const deleteBloque = (bIdx) => {
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : {
      ...d, bloques: d.bloques.filter((_, j) => j !== bIdx)
    }))
  }

  // Mover bloque
  const moverBloque = (bIdx, dir) => {
    setDias(prev => prev.map((d, i) => {
      if (i !== diaActivo) return d
      const arr = [...d.bloques]
      const newIdx = bIdx + dir
      if (newIdx < 0 || newIdx >= arr.length) return d
      ;[arr[bIdx], arr[newIdx]] = [arr[newIdx], arr[bIdx]]
      return { ...d, bloques: arr }
    }))
  }

  // Agregar bloque vacío
  const agregarBloque = (tipo = "normal") => {
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : {
      ...d, bloques: [...d.bloques, bloqueVacio(tipo)]
    }))
  }

  // AI genera rutina completa
  const handleRutinaAI = (nombreRutina, diasGenerados) => {
    setNombre(nombreRutina)
    setDias(diasGenerados)
    setDiaActivo(0)
    setAiPanel(false)
  }

  // Agregar ejercicio custom a la biblioteca
  const agregarEjercicioCustom = (musculo, ej) => {
    setEjerciciosCustom(prev => ({
      ...prev,
      [musculo]: [...(prev[musculo] || []), ej]
    }))
  }

  // Agregar desde biblioteca
  const agregarDesde = (ej, tipo) => {
    const bloque = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      tipo,
      ejercicios: [{ ...ejVacio(), nombre: ej.nombre, video: ej.youtube || "" }],
    }
    if (tipo === "biserie") bloque.ejercicios.push(ejVacio())
    setDias(prev => prev.map((d, i) => i !== diaActivo ? d : {
      ...d, bloques: [...d.bloques, bloque]
    }))
    setBiblioteca(false)
  }

  const agregarDia = () => {
    const letra = String.fromCharCode(65 + dias.length)
    setDias(prev => [...prev, { nombre: `Día ${letra}`, bloques: [] }])
    setTimeout(() => {
      if (tabsRef.current) tabsRef.current.scrollLeft = tabsRef.current.scrollWidth
    }, 50)
  }

  const renombrarDia = (val) => {
    setDias(prev => prev.map((d, i) => i === diaActivo ? { ...d, nombre: val } : d))
  }

  const handleGuardar = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    await onGuardar?.({ nombre, dias, clientesAsignados })
    setGuardando(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Título */}
      <div style={T.h1}>Crear rutina</div>

      {/* Botón AI */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAiPanel(v => !v)}
        style={{ background: aiPanel ? "#1e1b3a" : C.surface, border: `0.5px solid ${aiPanel ? C.accentSub : C.border}`, borderRadius: 14, padding: "11px 16px", color: aiPanel ? "#c4b5fd" : C.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <div>
          <div style={{ color: aiPanel ? "#c4b5fd" : C.text, fontWeight: 600, fontSize: 13 }}>Generar con AI</div>
          <div style={{ fontSize: 11, color: aiPanel ? "#818cf8" : C.textMuted, marginTop: 1 }}>Describís el objetivo y la AI arma la rutina completa</div>
        </div>
      </motion.button>

      {/* Panel AI */}
      <AnimatePresence>
        {aiPanel && (
          <GeneradorAI onRutinaGenerada={handleRutinaAI} clientes={clientes} />
        )}
      </AnimatePresence>

      {/* Nombre de la rutina */}
      <input
        placeholder="Nombre de la rutina..."
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        style={{ ...inp, fontSize: 15, padding: "12px 14px", borderRadius: 14, fontWeight: 600 }}
      />

      {/* Tabs de días */}
      <div ref={tabsRef} style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
        {dias.map((d, i) => (
          <button key={i} onClick={() => setDiaActivo(i)}
            style={{
              padding: "7px 14px", borderRadius: 20, border: `0.5px solid ${diaActivo === i ? C.accent : C.border}`,
              background: diaActivo === i ? C.accentSub : C.surface,
              color: diaActivo === i ? "#a5b4fc" : C.textSub,
              fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>
            {d.nombre}
          </button>
        ))}
        <button onClick={agregarDia}
          style={{ padding: "7px 12px", borderRadius: 20, border: `0.5px solid ${C.border}`, background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
          + Día
        </button>
      </div>

      {/* Nombre del día editable */}
      <input
        value={diaActual.nombre}
        onChange={e => renombrarDia(e.target.value)}
        style={{ ...inp, fontSize: 13, padding: "9px 12px", borderRadius: 12 }}
        placeholder="Nombre del día..."
      />

      {/* Bloques */}
      <AnimatePresence>
        {bloques.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: C.surface, borderRadius: 16, padding: "28px 20px", textAlign: "center", border: `0.5px dashed ${C.border}` }}>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>Sin ejercicios en este día</div>
            <div style={{ fontSize: 12, color: C.textMuted + "88" }}>Usá los botones de abajo para agregar</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bloques.map((bloque, bIdx) => (
          <BloqueCard
            key={bloque.id}
            bloque={bloque}
            bloqueIdx={bIdx}
            totalBloques={bloques.length}
            onChange={(nuevo) => updateBloque(bIdx, nuevo)}
            onDelete={() => deleteBloque(bIdx)}
            onMover={(dir) => moverBloque(bIdx, dir)}
            todosEjercicios={[...Object.values(EJERCICIOS).flat(), ...Object.values(ejerciciosCustom).flat()]}
          />
        ))}
      </AnimatePresence>

      {/* Botones agregar */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => { agregarBloque("normal"); setBiblioteca(false) }}
          style={{ width: 42, height: 42, background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconPlus color={C.text} />
        </button>
        {TIPOS.slice(1).map(t => (
          <button key={t.id} onClick={() => { agregarBloque(t.id); setBiblioteca(false) }}
            style={{ flex: 1, background: t.color + "11", border: `0.5px solid ${t.color}44`, borderRadius: 12, padding: "0", height: 42, color: t.color, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            + {t.label}
          </button>
        ))}
        <button onClick={() => setBiblioteca(v => !v)}
          style={{ flex: "0 0 auto", background: biblioteca ? C.accentSub : C.accent, border: `0.5px solid ${C.accent}`, borderRadius: 12, padding: "0 14px", height: 42, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Biblioteca
        </button>
      </div>

      {/* Biblioteca */}
      <AnimatePresence>
        {biblioteca && (
          <Biblioteca
            onAgregar={agregarDesde}
            onCerrar={() => setBiblioteca(false)}
            ejerciciosCustom={ejerciciosCustom}
            onAgregarCustom={agregarEjercicioCustom}
          />
        )}
      </AnimatePresence>

      {/* Asignar a clientes */}
      {clientes.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 16, padding: 14, border: `0.5px solid ${C.border}` }}>
          <div style={{ ...T.label, marginBottom: 10 }}>Asignar a clientes</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {clientes.map((c, i) => {
              const key = c.id || c.nombre
              const sel = clientesAsignados.includes(key)
              return (
                <button key={i} onClick={() => setClientesAsignados(prev => sel ? prev.filter(x => x !== key) : [...prev, key])}
                  style={{ padding: "6px 12px", borderRadius: 20, border: `0.5px solid ${sel ? C.accent : C.border}`, background: sel ? C.accentSub : C.surface2, color: sel ? "#a5b4fc" : C.textSub, fontSize: 12, cursor: "pointer" }}>
                  {sel ? "✓ " : ""}{c.nombre}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: "flex", gap: 10, paddingBottom: 8 }}>
        <button onClick={() => generarPDF(nombre, dias)}
          style={{ flex: 1, background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "13px 0", color: C.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
          PDF
        </button>
        <button onClick={handleGuardar} disabled={guardando || !nombre.trim()}
          style={{ flex: 2, background: nombre.trim() ? C.accent : C.surface2, border: "none", borderRadius: 14, padding: "13px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: nombre.trim() ? "pointer" : "default", opacity: !nombre.trim() ? 0.5 : 1 }}>
          {guardando ? "Guardando..." : "Guardar rutina"}
        </button>
      </div>
    </div>
  )
}
