import bcrypt from "bcryptjs"

// Shared by the app's admin screens and the seed script so the cost factor
// can never drift between the two. bcryptjs is pure JavaScript, which avoids a
// native build step on Vercel.
const COST = 12

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// Usernames are matched case-insensitively: the admin types "Ali", the user
// types "ali", and both must reach the same row.
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase()
}
