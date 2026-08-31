// Catalog entries are matched case-insensitively and ignoring stray whitespace,
// so "Oil  Change" and "oil change" are one entry. The database's unique index
// is on this key, which is what actually prevents duplicates.
export function catalogKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase()
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ")
}
