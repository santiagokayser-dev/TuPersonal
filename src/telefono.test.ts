import { describe, it, expect } from "vitest"
import { normalizarTelefono, armarLinkCobro } from "./telefono"

describe("normalizarTelefono", () => {
  it("formato local con 0 inicial: 011 4555-5555 → 5491145555555", () => {
    expect(normalizarTelefono("011 4555-5555")).toBe("5491145555555")
  })

  it("celular sin código de área: 15 5555 5555 → null (no confiable)", () => {
    expect(normalizarTelefono("15 5555 5555")).toBeNull()
  })

  it("internacional completo: +54 9 11 5555 5555 → 5491155555555", () => {
    expect(normalizarTelefono("+54 9 11 5555 5555")).toBe("5491155555555")
  })

  it("ya normalizado: 5491145555555 → sin cambio", () => {
    expect(normalizarTelefono("5491145555555")).toBe("5491145555555")
  })

  it("54 sin el 9: 541145555555 → inserta el 9", () => {
    expect(normalizarTelefono("541145555555")).toBe("5491145555555")
  })

  it("15 después del código de área: 011 15 4555 5555 → lo quita", () => {
    expect(normalizarTelefono("011 15 4555 5555")).toBe("5491145555555")
  })

  it("área de 3 dígitos: 0351 15 555 5555 → 5493515555555", () => {
    expect(normalizarTelefono("0351 15 555 5555")).toBe("5493515555555")
  })

  it("10 dígitos pelados (área + local): 1145555555 → 5491145555555", () => {
    expect(normalizarTelefono("1145555555")).toBe("5491145555555")
  })

  it("vacío / null / undefined → null", () => {
    expect(normalizarTelefono("")).toBeNull()
    expect(normalizarTelefono(null)).toBeNull()
    expect(normalizarTelefono(undefined)).toBeNull()
  })

  it("basura no numérica → null", () => {
    expect(normalizarTelefono("no tengo")).toBeNull()
  })

  it("demasiado corto → null", () => {
    expect(normalizarTelefono("4555555")).toBeNull()
  })
})

describe("armarLinkCobro", () => {
  const base = { telefono: "011 4555-5555", nombre: "Juan Pérez", mesesDeuda: 2, monto: 80000 }

  it("arma wa.me con teléfono normalizado y mensaje con monto", () => {
    const url = armarLinkCobro({ ...base, mpAlias: "juantrainer" })
    expect(url).toContain("https://wa.me/5491145555555?text=")
    const msg = decodeURIComponent(url!.split("?text=")[1])
    expect(msg).toContain("Hola Juan!")
    expect(msg).toContain("2 meses")
    expect(msg).toContain("$80.000")
    expect(msg).toContain("https://link.mercadopago.com.ar/juantrainer")
  })

  it("singular para 1 mes", () => {
    const url = armarLinkCobro({ ...base, mesesDeuda: 1, monto: 40000, mpAlias: "juantrainer" })
    const msg = decodeURIComponent(url!.split("?text=")[1])
    expect(msg).toContain("1 mes —")
    expect(msg).toContain("$40.000")
  })

  it("sin mpAlias: mensaje sin link de pago", () => {
    const url = armarLinkCobro({ ...base, mpAlias: null })
    const msg = decodeURIComponent(url!.split("?text=")[1])
    expect(msg).not.toContain("link.mercadopago.com.ar")
    expect(msg).toContain("Te recuerdo tu cuota pendiente")
  })

  it("teléfono no normalizable → null", () => {
    expect(armarLinkCobro({ ...base, telefono: "15 5555 5555" })).toBeNull()
  })
})
