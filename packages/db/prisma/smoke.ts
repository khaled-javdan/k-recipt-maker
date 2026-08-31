import "./env.js"

import { prisma } from "../src/index.js"

const counts = {
  users: await prisma.user.count(),
  receipts: await prisma.receipt.count(),
  ledgers: await prisma.ledger.count(),
  priceLists: await prisma.priceList.count(),
  manReceipts: await prisma.manReceipt.count(),
  catalog: await prisma.catalogItem.count(),
  counters: await prisma.counter.count(),
}
console.log(JSON.stringify(counts))
await prisma.$disconnect()
