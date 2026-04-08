ALTER TABLE orders ADD COLUMN courier_shipment_id TEXT;
ALTER TABLE orders ADD COLUMN courier_sync_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN courier_sync_error TEXT;
ALTER TABLE orders ADD COLUMN courier_last_synced_at TEXT;
ALTER TABLE orders ADD COLUMN label_url TEXT;
