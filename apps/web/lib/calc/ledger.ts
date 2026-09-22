export type LedgerRowAmounts = {
  invoice: number
  commission: number
  cash: number
}

export function rowBalance(row: LedgerRowAmounts): number {
  return row.invoice + row.commission - row.cash
}

// The running column: each row carries the previous rows forward, حق included.
export function ledgerBalances(rows: LedgerRowAmounts[]): {
  cumulative: number[]
  grandTotal: number
} {
  let acc = 0
  const cumulative = rows.map((r) => (acc += rowBalance(r)))
  return { cumulative, grandTotal: cumulative[cumulative.length - 1] ?? 0 }
}

// The sheet's closing line is a different figure from the running column: the
// customer reads it as invoiced minus paid, so حق is left out of it.
export function ledgerClosing(rows: LedgerRowAmounts[]): {
  invoiceTotal: number
  cashTotal: number
  closing: number
} {
  const invoiceTotal = rows.reduce((sum, r) => sum + r.invoice, 0)
  const cashTotal = rows.reduce((sum, r) => sum + r.cash, 0)
  return { invoiceTotal, cashTotal, closing: invoiceTotal - cashTotal }
}
