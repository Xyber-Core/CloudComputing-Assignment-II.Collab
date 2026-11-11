-- Apply to an existing D1 database; new databases should apply schema.sql only.
ALTER TABLE PrintRequest ADD COLUMN rejectedAt TEXT;
ALTER TABLE PrintRequest ADD COLUMN rejectedBy TEXT;
ALTER TABLE PrintRequest ADD COLUMN rejectionReason TEXT;
ALTER TABLE PrintRequest ADD COLUMN deletedAt TEXT;
ALTER TABLE PrintRequest ADD COLUMN deletedBy TEXT;
ALTER TABLE StatusHistory ADD COLUMN eventType TEXT NOT NULL DEFAULT 'Status';
ALTER TABLE StatusHistory ADD COLUMN note TEXT;
CREATE INDEX IF NOT EXISTS idx_request_deleted ON PrintRequest(deletedAt);
CREATE INDEX IF NOT EXISTS idx_request_rejected ON PrintRequest(rejectedAt);
