-- Persist user-defined ordering inside each learning goal status column.
ALTER TABLE "learning_goal" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
