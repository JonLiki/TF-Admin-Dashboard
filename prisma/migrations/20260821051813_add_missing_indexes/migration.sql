-- CreateIndex
CREATE INDEX "PointLedger_teamId_blockId_idx" ON "PointLedger"("teamId", "blockId");

-- CreateIndex
CREATE INDEX "WeighIn_date_idx" ON "WeighIn"("date");
