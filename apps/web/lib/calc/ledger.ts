export type LedgerRowAmounts = {
  invoice: number
  commission: number
  cash: number
}

export function rowBalance(row: LedgerRowAmounts): number {
  return row.invoice + row.commission - row.cash
}

// مانده is a running balance: each row carries the previous rows forward, and
// the sheet's grand total is simply the last row's cumulative figure.
export function ledgerBalances(rows: LedgerRowAmounts[]): {
  cumulative: number[]
  grandTotal: number
} {
  let acc = 0
  const cumulative = rows.map((r) => (acc += rowBalance(r)))
  return { cumulative, grandTotal: cumulative[cumulative.length - 1] ?? 0 }
}
