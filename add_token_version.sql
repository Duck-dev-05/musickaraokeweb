-- Add tokenVersion column to User table
-- Run this SQL script in your database to fix the tokenVersion column issue

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 1;

-- Update existing users to have tokenVersion = 1
UPDATE "User" SET "tokenVersion" = 1 WHERE "tokenVersion" IS NULL; 