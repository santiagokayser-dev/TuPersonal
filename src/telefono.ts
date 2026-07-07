// Normalización de teléfonos argentinos para wa.me
// Regla: formato internacional sin "+", con el 9 después del 54.
// Si no se puede normalizar con confianza, devuelve null — el caller
// muestra "revisá el teléfono" en vez de mandar el mensaje a un desconocido.

export function normalizarTelefono(raw: string | null | undefined): string | null {
  let d = (raw || "").replace(/\D/g, "")
  if (!d) return null

  // Ya normalizado: 549 + área + local (12-13 dígitos)
  if (d.startsWith("549")) {
    return d.length >= 12 && d.length <= 13 ? d : null
  }

  // 54 sin el 9 (fijo o mal cargado): insertar el 9
  if (d.startsWith("54")) {
    const conNueve = "549" + d.slice(2)
    return conNueve.length >= 12 && conNueve.length <= 13 ? conNueve : null
  }

  // 0 inicial (formato local): quitarlo
  if (d.startsWith("0")) d = d.slice(1)

  // 15 al inicio = celular sin código de área — no se puede normalizar con confianza
  if (d.startsWith("15")) return null

  // 15 después del código de área (ej: 11 15 45555555): quitarlo
  const con15 = d.match(/^(\d{2})15(\d{8})$/) || d.match(/^(\d{3})15(\d{7})$/) || d.match(/^(\d{4})15(\d{6})$/)
  if (con15) d = con15[1] + con15[2]

  // Número local completo: área + local = 10 dígitos
  if (d.length === 10) return "549" + d

  return null
}

// Arma la URL de wa.me con el mensaje de cobro pre-armado.
// Devuelve null si el teléfono no se puede normalizar.
export function armarLinkCobro(opts: {
  telefono: string | null | undefined
  nombre: string
  mesesDeuda: number
  monto: number
  mpAlias?: string | null
}): string | null {
  const tel = normalizarTelefono(opts.telefono)
  if (!tel) return null
  const primerNombre = (opts.nombre || "").trim().split(" ")[0] || "Hola"
  const desc = opts.mesesDeuda === 1 ? "1 mes" : `${opts.mesesDeuda} meses`
  const montoFmt = "$" + opts.monto.toLocaleString("es-AR")
  let msg = `Hola ${primerNombre}! Te recuerdo tu cuota pendiente (${desc} — ${montoFmt}).`
  if (opts.mpAlias) {
    msg += ` Podés pagarla acá: https://link.mercadopago.com.ar/${opts.mpAlias}`
  }
  msg += " 💪"
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`
}
