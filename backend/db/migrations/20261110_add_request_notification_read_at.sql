-- Add persisted read state for request notifications shown in the header.
-- Check each object separately so this migration also succeeds when the column
-- was added manually before deployment.
SET @has_notification_read_at = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_requests'
    AND COLUMN_NAME = 'notification_read_at'
);
SET @add_notification_read_at = IF(
  @has_notification_read_at = 0,
  'ALTER TABLE project_requests ADD COLUMN notification_read_at DATETIME NULL AFTER processed_at',
  'SELECT 1'
);
PREPARE add_notification_read_at_stmt FROM @add_notification_read_at;
EXECUTE add_notification_read_at_stmt;
DEALLOCATE PREPARE add_notification_read_at_stmt;

SET @has_notification_read_index = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project_requests'
    AND INDEX_NAME = 'idx_requests_notification_read'
);
SET @add_notification_read_index = IF(
  @has_notification_read_index = 0,
  'CREATE INDEX idx_requests_notification_read ON project_requests (receiver_id, status, notification_read_at)',
  'SELECT 1'
);
PREPARE add_notification_read_index_stmt FROM @add_notification_read_index;
EXECUTE add_notification_read_index_stmt;
DEALLOCATE PREPARE add_notification_read_index_stmt;
