-- 手动应用 AddBookCategoryCustomFeatures 迁移

ALTER TABLE "AccountBookCategoryLinks"
    ADD COLUMN IF NOT EXISTS "SortOrder" integer NOT NULL DEFAULT 0;

ALTER TABLE "Categories"
    ADD COLUMN IF NOT EXISTS "IsUserCustomRoot" boolean NOT NULL DEFAULT false;

-- INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
-- VALUES ('20260616120000_AddBookCategoryCustomFeatures', '9.0.0');
