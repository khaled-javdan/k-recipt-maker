-- حق, resolved to currency and stored, so earnings can be summed over a date
-- range without loading every line item.
ALTER TABLE "PriceList" ADD COLUMN "commissionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill existing sheets with the same figure the printed sheet shows:
-- a percentage commission applies to the items subtotal, and the result snaps
-- to the nearest five — see deductionTotals() and snapToFive() in
-- apps/web/lib/calc. ROUND() on numeric rounds halves away from zero, which is
-- what Math.round() does for the non-negative amounts involved here.
UPDATE "PriceList" p
SET "commissionAmount" = ROUND(
  (
    CASE
      WHEN p."commissionIsPercent" THEN
        (
          SELECT COALESCE(SUM(i."price"), 0)
          FROM "PriceListItem" i
          WHERE i."priceListId" = p."id"
        ) * COALESCE(p."commission", 0) / 100
      ELSE COALESCE(p."commission", 0)
    END
  ) / 5
) * 5;

-- CreateIndex
CREATE INDEX "PriceList_userId_date_idx" ON "PriceList"("userId", "date");
