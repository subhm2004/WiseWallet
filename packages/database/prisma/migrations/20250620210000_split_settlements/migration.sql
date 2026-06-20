-- Split settlements (mark payments between members)
CREATE TABLE IF NOT EXISTS "split_settlements" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_settlements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "split_settlements_groupId_idx" ON "split_settlements"("groupId");

ALTER TABLE "split_settlements" ADD CONSTRAINT "split_settlements_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "split_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "split_settlements" ADD CONSTRAINT "split_settlements_fromMemberId_fkey"
    FOREIGN KEY ("fromMemberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "split_settlements" ADD CONSTRAINT "split_settlements_toMemberId_fkey"
    FOREIGN KEY ("toMemberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
