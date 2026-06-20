-- Category budget alert tracking
ALTER TABLE "category_budgets" ADD COLUMN IF NOT EXISTS "lastAlertSent" TIMESTAMP(3);

-- Email log reference for deduplication (bill reminders, etc.)
ALTER TABLE "email_logs" ADD COLUMN IF NOT EXISTS "referenceId" TEXT;
CREATE INDEX IF NOT EXISTS "email_logs_referenceId_idx" ON "email_logs"("referenceId");

-- Split expenses
CREATE TABLE IF NOT EXISTS "split_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "split_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "split_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "split_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "split_expenses" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "split_expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "split_shares" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    CONSTRAINT "split_shares_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "split_groups_userId_idx" ON "split_groups"("userId");
CREATE INDEX IF NOT EXISTS "split_members_groupId_idx" ON "split_members"("groupId");
CREATE INDEX IF NOT EXISTS "split_expenses_groupId_idx" ON "split_expenses"("groupId");
CREATE INDEX IF NOT EXISTS "split_shares_expenseId_idx" ON "split_shares"("expenseId");

DO $$ BEGIN
  ALTER TABLE "split_groups" ADD CONSTRAINT "split_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "split_members" ADD CONSTRAINT "split_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "split_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "split_expenses" ADD CONSTRAINT "split_expenses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "split_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "split_expenses" ADD CONSTRAINT "split_expenses_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "split_shares" ADD CONSTRAINT "split_shares_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "split_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "split_shares" ADD CONSTRAINT "split_shares_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
