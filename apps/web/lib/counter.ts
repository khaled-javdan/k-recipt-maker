import "server-only"

import type { CounterKind, Prisma } from "@workspace/db"

// Document numbers start at 1001 and climb, per user, per document type.
// The increment happens inside the same transaction as the document insert, so
// two tabs saving at once get different numbers — which `max(number) + 1`
// cannot guarantee.
export async function nextNumber(
  tx: Prisma.TransactionClient,
  userId: string,
  kind: CounterKind
): Promise<number> {
  const counter = await tx.counter.upsert({
    where: { userId_kind: { userId, kind } },
    create: { userId, kind, value: 1001 },
    update: { value: { increment: 1 } },
    select: { value: true },
  })
  return counter.value
}
