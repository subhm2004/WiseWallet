-- Migration: Replace Clerk auth with Google OAuth
-- Run: npm run db:migrate

-- Drop old clerk column and add googleId
ALTER TABLE "users" DROP COLUMN IF EXISTS "clerkUserId";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" TEXT;

-- Add unique constraint (only if column was just added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_googleId_key'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_googleId_key" UNIQUE ("googleId");
  END IF;
END $$;
