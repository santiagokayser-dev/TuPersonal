import { motion, AnimatePresence } from "framer-motion"

const C = {
  bg: "#111111", surface: "#191919", surface2: "#222222",
  border: "#2a2a2a", text: "#ececec", textSub: "#888888", red: "#ef4444",
}

export default function ConfirmModal({ open, onConfirm, onCancel, mensaje = "¿Estás seguro de que querés realizar esta acción?" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "#000000aa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            style={{ background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`, padding: "24px 20px", width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{mensaje}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onCancel}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface2, color: C.textSub, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={onConfirm}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #ef444433", background: "#3a1a1a", color: C.red, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Sí, eliminar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
