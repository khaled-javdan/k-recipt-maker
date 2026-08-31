function stripTrailingZeros(s: string): string {
  if (!s.includes(".")) return s
  return s.replace(/0+$/, "").replace(/\.$/, "")
}

export function formatUnitWeight(value: number): string {
  if (!Number.isFinite(value)) return ""
  return stripTrailingZeros(value.toFixed(2))
}

export function formatTotalWeight(kg: number): string {
  if (!Number.isFinite(kg)) return ""
  return `${stripTrailingZeros(kg.toFixed(2))} kg`
}
