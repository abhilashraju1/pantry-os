import { sql } from 'drizzle-orm';
import { getDatabase, closeDatabase } from './connection.js';

export const MIGRATION_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  branch_id TEXT NOT NULL REFERENCES branches(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  roles TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_sessions (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  branch_id TEXT NOT NULL REFERENCES branches(id),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token ON staff_sessions(token);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_user ON staff_sessions(user_id);

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_kn TEXT NOT NULL,
  category TEXT NOT NULL,
  base_unit TEXT NOT NULL,
  purchase_unit TEXT NOT NULL,
  conversion_ratio_to_base NUMERIC(10, 3) NOT NULL,
  reorder_level NUMERIC(12, 3) NOT NULL,
  current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
  storage_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingredients_branch ON ingredients(branch_id);

CREATE TABLE IF NOT EXISTS stock_lots (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  lot_number TEXT NOT NULL,
  initial_quantity NUMERIC(12, 3) NOT NULL,
  available_quantity NUMERIC(12, 3) NOT NULL,
  reserved_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
  unit_cost_paise INTEGER NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
);
CREATE INDEX IF NOT EXISTS idx_stock_lots_ingredient ON stock_lots(ingredient_id, status);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  lot_id TEXT REFERENCES stock_lots(id),
  movement_type TEXT NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL,
  unit_cost_paise INTEGER,
  reference_id TEXT,
  reason TEXT,
  actor_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_kn TEXT NOT NULL,
  description_en TEXT,
  description_kn TEXT,
  preparation_policy TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_versions (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  base_yield_quantity NUMERIC(12, 3) NOT NULL,
  yield_unit TEXT NOT NULL,
  approved_at TIMESTAMPTZ,
  approved_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_version_id TEXT NOT NULL REFERENCES recipe_versions(id),
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  quantity NUMERIC(12, 3) NOT NULL,
  unit TEXT NOT NULL,
  waste_factor_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
  is_sub_recipe BOOLEAN NOT NULL DEFAULT FALSE,
  sub_recipe_id TEXT
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id TEXT PRIMARY KEY,
  recipe_version_id TEXT NOT NULL REFERENCES recipe_versions(id),
  step_order INTEGER NOT NULL,
  title_en TEXT NOT NULL,
  title_kn TEXT NOT NULL,
  instruction_en TEXT NOT NULL,
  instruction_kn TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  equipment_type_needed TEXT,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  active_version_id TEXT NOT NULL REFERENCES recipe_versions(id),
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_kn TEXT NOT NULL,
  description_en TEXT,
  description_kn TEXT,
  preparation_policy TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dish_variants (
  id TEXT PRIMARY KEY,
  dish_id TEXT NOT NULL REFERENCES dishes(id),
  name_en TEXT NOT NULL,
  name_kn TEXT NOT NULL,
  portion_quantity NUMERIC(12, 3) NOT NULL,
  portion_unit TEXT NOT NULL,
  price_paise INTEGER NOT NULL,
  packaging_item_id TEXT REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS kitchen_stations (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  name_en TEXT NOT NULL,
  name_kn TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kitchen_equipment (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  station_id TEXT NOT NULL REFERENCES kitchen_stations(id),
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_kn TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  is_exclusive BOOLEAN NOT NULL DEFAULT TRUE,
  current_task_id TEXT,
  locked_until TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS production_batches (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  batch_code TEXT NOT NULL,
  recipe_version_id TEXT NOT NULL REFERENCES recipe_versions(id),
  dish_id TEXT NOT NULL REFERENCES dishes(id),
  status TEXT NOT NULL DEFAULT 'PLANNED',
  planned_yield NUMERIC(12, 3) NOT NULL,
  actual_usable_yield NUMERIC(12, 3),
  remaining_usable_yield NUMERIC(12, 3),
  yield_unit TEXT NOT NULL,
  assigned_equipment_id TEXT,
  assigned_chef_id TEXT REFERENCES users(id),
  cooked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  quality_approved_at TIMESTAMPTZ,
  quality_approved_by TEXT REFERENCES users(id),
  quality_core_temperature_c NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_reservations (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES production_batches(id),
  order_item_id TEXT NOT NULL,
  portions_reserved INTEGER NOT NULL,
  quantity_deducted NUMERIC(12, 3) NOT NULL,
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RESERVED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cooking_tasks (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  equipment_id TEXT NOT NULL REFERENCES kitchen_equipment(id),
  dish_id TEXT NOT NULL REFERENCES dishes(id),
  recipe_version_id TEXT NOT NULL REFERENCES recipe_versions(id),
  batch_id TEXT REFERENCES production_batches(id),
  order_item_id TEXT,
  chef_user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  current_step_order INTEGER NOT NULL DEFAULT 1,
  current_step_started_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  quality_check_temp_c NUMERIC(5, 2),
  quality_check_passed BOOLEAN,
  quality_checked_by_user_id TEXT REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dining_tables (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  table_number TEXT NOT NULL,
  qr_token TEXT NOT NULL UNIQUE,
  seating_capacity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
);

CREATE TABLE IF NOT EXISTS table_sessions (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  table_id TEXT NOT NULL REFERENCES dining_tables(id),
  session_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bill_requested_at TIMESTAMPTZ,
  bill_acknowledged_at TIMESTAMPTZ,
  bill_acknowledged_by_user_id TEXT REFERENCES users(id),
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_table_sessions_token ON table_sessions(session_token);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  order_number TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  table_id TEXT REFERENCES dining_tables(id),
  table_session_id TEXT REFERENCES table_sessions(id),
  customer_name TEXT,
  customer_phone TEXT,
  subtotal_paise INTEGER NOT NULL,
  tax_paise INTEGER NOT NULL,
  packaging_fee_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'UNPAID',
  requested_pickup_at TIMESTAMPTZ,
  promised_ready_at TIMESTAMPTZ,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  dish_id TEXT NOT NULL REFERENCES dishes(id),
  variant_id TEXT NOT NULL REFERENCES dish_variants(id),
  quantity INTEGER NOT NULL,
  unit_price_paise INTEGER NOT NULL,
  subtotal_paise INTEGER NOT NULL,
  special_instructions TEXT,
  allocated_batch_id TEXT REFERENCES production_batches(id),
  status TEXT NOT NULL DEFAULT 'PENDING'
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  cashier_user_id TEXT NOT NULL REFERENCES users(id),
  opening_cash_paise INTEGER NOT NULL,
  closing_cash_paise INTEGER,
  counted_cash_paise INTEGER,
  variance_paise INTEGER,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  cash_session_id TEXT REFERENCES cash_sessions(id),
  amount_paise INTEGER NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  transaction_ref TEXT,
  gateway_event_id TEXT,
  verified_at TIMESTAMPTZ,
  verified_by_user_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_branch ON audit_events(branch_id);
`;

export async function runMigrations(db?: any): Promise<void> {
  const targetDb = db || (await getDatabase());
  const statements = MIGRATION_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await targetDb.execute(sql.raw(statement));
    } catch (err: any) {
      // Ignore extension errors if non-superuser
      if (!statement.includes('CREATE EXTENSION')) {
        console.error(`Migration error executing: ${statement.slice(0, 50)}...`, err);
        throw err;
      }
    }
  }
}

// CLI entrypoint
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  (async () => {
    console.log('Running PantryOS database migrations...');
    const db = await getDatabase();
    await runMigrations(db);
    console.log('✓ PantryOS migrations completed successfully.');
    await closeDatabase();
    process.exit(0);
  })().catch(async (err) => {
    console.error('Migration failed:', err);
    await closeDatabase();
    process.exit(1);
  });
}
