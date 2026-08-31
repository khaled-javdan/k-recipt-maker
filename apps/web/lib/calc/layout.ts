// Flow items into columns column-major (fill the first column top-to-bottom,
// then the next) so the printed sheet reads like a hand-written ledger. A new
// column is added each time an existing one fills past `itemsPerColumn`, capped
// at `maxColumns`. Beyond that cap the columns simply grow taller.
export function layoutColumns<T>(
  items: T[],
  itemsPerColumn: number,
  maxColumns: number
): T[][] {
  const count = items.length
  if (count === 0) return [[]]
  const perColumn = Math.max(1, Math.floor(itemsPerColumn) || 1)
  const cap = Math.max(1, Math.floor(maxColumns) || 1)
  const columns = Math.min(Math.ceil(count / perColumn), cap)
  const balanced = Math.ceil(count / columns)
  const result: T[][] = []
  for (let i = 0; i < count; i += balanced) {
    result.push(items.slice(i, i + balanced))
  }
  return result
}
