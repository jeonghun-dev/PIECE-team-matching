-- Add persisted read state for request notifications shown in the header.
ALTER TABLE project_requests
  ADD COLUMN notification_read_at DATETIME NULL AFTER processed_at,
  ADD INDEX idx_requests_notification_read (receiver_id, status, notification_read_at);
