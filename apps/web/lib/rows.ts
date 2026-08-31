// Row list helpers for the editors. All pure and non-mutating: the editors
// hold rows in state and replace the array on every change.

export function insertAt<T>(rows: T[], index: number, row: T): T[] {
  const next = [...rows]
  next.splice(Math.max(0, Math.min(index, rows.length)), 0, row)
  return next
}

export function removeAt<T>(rows: T[], index: number): T[] {
  return rows.filter((_, i) => i !== index)
}

export function replaceAt<T>(rows: T[], index: number, row: T): T[] {
  return rows.map((r, i) => (i === index ? row : r))
}

export function moveRow<T>(rows: T[], from: number, to: number): T[] {
  if (to < 0 || to >= rows.length || from === to) return rows
  const next = [...rows]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return rows
  next.splice(to, 0, moved)
  return next
}
