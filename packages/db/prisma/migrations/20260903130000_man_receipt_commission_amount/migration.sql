-- حق, resolved to currency and stored — the same column فیش مزاد already has,
-- so earnings can be summed over a date range without loading every line item.
ALTER TABLE "ManReceipt" ADD COLUMN "commissionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill existing sheets with the figure the printed sheet shows. A فیش من
-- line is priced weight ÷ من × rate, and *each line* snaps to the nearest five
-- before the subtotal is taken — see manLineAmount() in apps/web/lib/calc/man.ts.
-- The literal 4 is MAN_KG (one من = 4 kg) from that same file.
-- A percentage حق then applies to that subtotal and snaps again; ROUND() on
-- numeric rounds halves away from zero, matching Math.round() for the
-- non-negative amounts involved here.
UPDATE "ManReceipt" m
SET "commissionAmount" = ROUND(
  (
    CASE
      WHEN m."commissionIsPercent" THEN
        (
          SELECT COALESCE(SUM(ROUND((i."weight" / 4 * i."pricePerMan") / 5) * 5), 0)
          FROM "ManReceiptItem" i
          WHERE i."manReceiptId" = m."id"
        ) * COALESCE(m."commission", 0) / 100
      ELSE COALESCE(m."commission", 0)
    END
  ) / 5
) * 5;

-- CreateIndex
CREATE INDEX "ManReceipt_userId_date_idx" ON "ManReceipt"("userId", "date");
