-- Hardening: add missing performance indexes

-- sessions: fast refresh token lookup
CREATE INDEX IF NOT EXISTS "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash");

-- journal_entries: cursor-based pagination by creation time
CREATE INDEX IF NOT EXISTS "journal_entries_org_id_created_at_idx" ON "journal_entries"("org_id", "created_at");

-- journal_entry_lines: compound index for balance queries by account + direction
CREATE INDEX IF NOT EXISTS "journal_entry_lines_ledger_account_id_direction_idx" ON "journal_entry_lines"("ledger_account_id", "direction");
