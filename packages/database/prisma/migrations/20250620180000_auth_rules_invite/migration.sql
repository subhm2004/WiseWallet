-- Split invite tokens
ALTER TABLE "split_groups" ADD COLUMN IF NOT EXISTS "inviteToken" TEXT;
UPDATE "split_groups" SET "inviteToken" = gen_random_uuid()::text WHERE "inviteToken" IS NULL;
ALTER TABLE "split_groups" ALTER COLUMN "inviteToken" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "split_groups_inviteToken_key" ON "split_groups"("inviteToken");
CREATE INDEX IF NOT EXISTS "split_groups_inviteToken_idx" ON "split_groups"("inviteToken");

-- Category auto-rules
CREATE TABLE IF NOT EXISTS "category_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_rules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "category_rules_userId_pattern_key" ON "category_rules"("userId", "pattern");
CREATE INDEX IF NOT EXISTS "category_rules_userId_idx" ON "category_rules"("userId");

DO $$ BEGIN
  ALTER TABLE "category_rules" ADD CONSTRAINT "category_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

DO $$ BEGIN
  ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
