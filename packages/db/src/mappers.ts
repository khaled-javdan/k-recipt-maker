import type { Prisma } from "../generated/client/client"

// Postgres stores money and weights as exact decimals; the calculation core
// works in plain numbers. Everything crossing out of the database goes through
// here so the rest of the app never handles a Decimal.
//
// This is safe for the amounts involved: figures are AED in the thousands with
// at most three decimal places, and every derived total snaps to a multiple of
// five before anyone reads it.

type DecimalLike = Prisma.Decimal | number | string | null | undefined

export function toNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  const n = Number(value.toString())
  return Number.isFinite(n) ? n : 0
}

/** Same as toNumber, but preserves "not set" for optional fields. */
export function toOptionalNumber(value: DecimalLike): number | undefined {
  if (value === null || value === undefined) return undefined
  return toNumber(value)
}
