-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "CatalogKind" AS ENUM ('PRICE', 'MAN');

-- CreateEnum
CREATE TYPE "CounterKind" AS ENUM ('RECEIPT', 'LEDGER', 'PRICE_LIST', 'MAN_RECEIPT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1f2937',
    "accentColor" TEXT NOT NULL DEFAULT '#7c3aed',
    "receiptColumns" JSONB NOT NULL DEFAULT '{"sign":true,"count":true,"unitWeight":true,"totalWeight":true}',
    "ledgerColumns" JSONB NOT NULL DEFAULT '{"invoice":true,"commission":true,"cash":true,"balance":true,"date":true}',
    "priceListConfig" JSONB NOT NULL DEFAULT '{"itemsPerColumn":30,"maxColumns":3}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "unitWeight" DECIMAL(10,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT,
    "date" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptItem" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "unitWeight" DECIMAL(10,3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weight" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "ReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerRow" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT,
    "invoice" DECIMAL(12,2) NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL,
    "cash" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "LedgerRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "basketCount" INTEGER,
    "commission" DECIMAL(12,2),
    "commissionIsPercent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListExpense" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PriceListExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManReceipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "basketCount" INTEGER,
    "commission" DECIMAL(12,2),
    "commissionIsPercent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManReceiptItem" (
    "id" TEXT NOT NULL,
    "manReceiptId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DECIMAL(10,3) NOT NULL,
    "pricePerMan" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ManReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManReceiptExpense" (
    "id" TEXT NOT NULL,
    "manReceiptId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ManReceiptExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CatalogKind" NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CounterKind" NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- CreateIndex
CREATE INDEX "Client_userId_createdAt_idx" ON "Client"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_userId_createdAt_idx" ON "Product"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Receipt_userId_createdAt_idx" ON "Receipt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_userId_number_key" ON "Receipt"("userId", "number");

-- CreateIndex
CREATE INDEX "ReceiptItem_receiptId_position_idx" ON "ReceiptItem"("receiptId", "position");

-- CreateIndex
CREATE INDEX "Ledger_userId_createdAt_idx" ON "Ledger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_userId_number_key" ON "Ledger"("userId", "number");

-- CreateIndex
CREATE INDEX "LedgerRow_ledgerId_position_idx" ON "LedgerRow"("ledgerId", "position");

-- CreateIndex
CREATE INDEX "PriceList_userId_createdAt_idx" ON "PriceList"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_userId_number_key" ON "PriceList"("userId", "number");

-- CreateIndex
CREATE INDEX "PriceListItem_priceListId_position_idx" ON "PriceListItem"("priceListId", "position");

-- CreateIndex
CREATE INDEX "PriceListExpense_priceListId_position_idx" ON "PriceListExpense"("priceListId", "position");

-- CreateIndex
CREATE INDEX "ManReceipt_userId_createdAt_idx" ON "ManReceipt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ManReceipt_userId_number_key" ON "ManReceipt"("userId", "number");

-- CreateIndex
CREATE INDEX "ManReceiptItem_manReceiptId_position_idx" ON "ManReceiptItem"("manReceiptId", "position");

-- CreateIndex
CREATE INDEX "ManReceiptExpense_manReceiptId_position_idx" ON "ManReceiptExpense"("manReceiptId", "position");

-- CreateIndex
CREATE INDEX "CatalogItem_userId_kind_createdAt_idx" ON "CatalogItem"("userId", "kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_userId_kind_nameKey_key" ON "CatalogItem"("userId", "kind", "nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "Counter_userId_kind_key" ON "Counter"("userId", "kind");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptItem" ADD CONSTRAINT "ReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerRow" ADD CONSTRAINT "LedgerRow_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListExpense" ADD CONSTRAINT "PriceListExpense_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManReceipt" ADD CONSTRAINT "ManReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManReceiptItem" ADD CONSTRAINT "ManReceiptItem_manReceiptId_fkey" FOREIGN KEY ("manReceiptId") REFERENCES "ManReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManReceiptExpense" ADD CONSTRAINT "ManReceiptExpense_manReceiptId_fkey" FOREIGN KEY ("manReceiptId") REFERENCES "ManReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
