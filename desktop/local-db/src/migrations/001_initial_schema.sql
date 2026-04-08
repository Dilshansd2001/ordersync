PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL UNIQUE,
  cloud_id TEXT,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  buying_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','pending_sync','synced','sync_failed','conflict')),
  updated_at TEXT NOT NULL,
  last_synced_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL UNIQUE,
  cloud_id TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  address_line TEXT,
  nearest_city TEXT,
  district TEXT,
  loyalty_status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','pending_sync','synced','sync_failed','conflict')),
  updated_at TEXT NOT NULL,
  last_synced_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL UNIQUE,
  cloud_id TEXT,
  order_number TEXT NOT NULL,
  customer_entity_id TEXT,
  replacement_for_order_entity_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING','DISPATCHED','DELIVERED','RETURNED','CANCELLED')),
  payment_method TEXT NOT NULL DEFAULT 'COD',
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  district TEXT,
  delivery_service TEXT,
  tracking_number TEXT,
  notes TEXT,
  subtotal_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  cod_amount NUMERIC NOT NULL DEFAULT 0,
  is_replacement_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','pending_sync','synced','sync_failed','conflict')),
  updated_at TEXT NOT NULL,
  last_synced_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_entity_id) REFERENCES customers(entity_id),
  FOREIGN KEY (replacement_for_order_entity_id) REFERENCES orders(entity_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL UNIQUE,
  order_entity_id TEXT NOT NULL,
  product_entity_id TEXT,
  description TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','pending_sync','synced','sync_failed','conflict')),
  updated_at TEXT NOT NULL,
  last_synced_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_entity_id) REFERENCES orders(entity_id) ON DELETE CASCADE,
  FOREIGN KEY (product_entity_id) REFERENCES products(entity_id)
);

CREATE TABLE IF NOT EXISTS order_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL UNIQUE,
  cloud_id TEXT,
  order_entity_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('CANCEL_ORDER','CORRECT_ORDER','MARK_RETURNED')),
  reason TEXT,
  replacement_order_entity_id TEXT,
  affects_inventory INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','pending_sync','synced','sync_failed','conflict')),
  updated_at TEXT NOT NULL,
  last_synced_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_entity_id) REFERENCES orders(entity_id) ON DELETE CASCADE,
  FOREIGN KEY (replacement_order_entity_id) REFERENCES orders(entity_id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL UNIQUE,
  cloud_id TEXT,
  product_entity_id TEXT NOT NULL,
  order_entity_id TEXT,
  order_action_entity_id TEXT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('opening_balance','sale_commit','manual_adjustment','return_restock','cancel_restock')),
  quantity_delta NUMERIC NOT NULL,
  reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','pending_sync','synced','sync_failed','conflict')),
  updated_at TEXT NOT NULL,
  last_synced_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_entity_id) REFERENCES products(entity_id),
  FOREIGN KEY (order_entity_id) REFERENCES orders(entity_id),
  FOREIGN KEY (order_action_entity_id) REFERENCES order_actions(entity_id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL UNIQUE,
  cloud_id TEXT,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  expense_date TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','pending_sync','synced','sync_failed','conflict')),
  updated_at TEXT NOT NULL,
  last_synced_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL UNIQUE,
  cloud_id TEXT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'json',
  version INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','pending_sync','synced','sync_failed','conflict')),
  updated_at TEXT NOT NULL,
  last_synced_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product','customer','order','order_item','order_action','inventory_movement','expense','setting')),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create','update','delete')),
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','retry','failed','conflict','done')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_active
  ON products(sku)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_sync_status
  ON products(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_customers_phone
  ON customers(phone)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_sync_status
  ON customers(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer
  ON orders(customer_entity_id);

CREATE INDEX IF NOT EXISTS idx_orders_sync_status
  ON orders(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items(order_entity_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product
  ON order_items(product_entity_id);

CREATE INDEX IF NOT EXISTS idx_order_actions_order
  ON order_actions(order_entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_actions_sync_status
  ON order_actions(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_created
  ON inventory_movements(product_entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_order
  ON inventory_movements(order_entity_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_action
  ON inventory_movements(order_action_entity_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_sync_status
  ON inventory_movements(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_expenses_date
  ON expenses(expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_sync_status
  ON expenses(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_settings_sync_status
  ON settings(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status_next_attempt
  ON sync_queue(status, next_attempt_at, created_at);

CREATE INDEX IF NOT EXISTS idx_sync_queue_entity
  ON sync_queue(entity_type, entity_id);
