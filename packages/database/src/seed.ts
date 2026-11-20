import { sql } from 'drizzle-orm';
import { getDatabase, closeDatabase } from './connection.js';
import { bootstrapSystem } from './bootstrap.js';
import { hashPassword } from './auth-crypto.js';

export async function seedDemoData(db?: any) {
  const targetDb = db || (await getDatabase());
  await bootstrapSystem(targetDb);

  const orgId = 'org-01';
  const branchId = 'branch-blr-vvp-01';
  const defaultPasswordHash = hashPassword('password123');

  const exec = async (query: string) => {
    const stmts = query
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const s of stmts) {
      await targetDb.execute(sql.raw(s));
    }
  };

  // Staff accounts
  const staff = [
    { id: 'usr-chef-01', email: 'chef@pantryos.local', name: 'Manjunath Bhat', roles: "ARRAY['CHEF']" },
    { id: 'usr-cash-01', email: 'cashier@pantryos.local', name: 'Deepa Gowda', roles: "ARRAY['CASHIER']" },
    { id: 'usr-pack-01', email: 'packer@pantryos.local', name: 'Ramesh Nayak', roles: "ARRAY['PACKER']" }
  ];

  for (const s of staff) {
    await exec(`
      INSERT INTO users (id, organization_id, branch_id, email, password_hash, full_name, phone, roles, is_active)
      VALUES ('${s.id}', '${orgId}', '${branchId}', '${s.email}', '${defaultPasswordHash}', '${s.name}', '+91 98450 00000', ${s.roles}, true)
      ON CONFLICT (id) DO NOTHING
    `);
  }

  // Dining tables
  const tables = [
    { id: 'tbl-01', num: 'T1', token: 'token_t1_98a7f', cap: 4 },
    { id: 'tbl-02', num: 'T2', token: 'token_t2_11b3c', cap: 2 },
    { id: 'tbl-03', num: 'T3', token: 'token_t3_44c2d', cap: 4 },
    { id: 'tbl-04', num: 'T4', token: 'token_t4_77e8f', cap: 6 },
    { id: 'tbl-05', num: 'T5', token: 'token_t5_22d9a', cap: 2 },
    { id: 'tbl-06', num: 'T6', token: 'token_t6_55f1b', cap: 4 }
  ];

  for (const t of tables) {
    await exec(`
      INSERT INTO dining_tables (id, branch_id, table_number, qr_token, seating_capacity, status)
      VALUES ('${t.id}', '${branchId}', '${t.num}', '${t.token}', ${t.cap}, 'AVAILABLE')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  // Kitchen stations & equipment
  await exec(`
    INSERT INTO kitchen_stations (id, branch_id, name_en, name_kn)
    VALUES
      ('stn-stove', '${branchId}', 'Main Stove Station', 'ಮುಖ್ಯ ಒಲೆ ವಿಭಾಗ'),
      ('stn-tawa', '${branchId}', 'Tawa Griddle Station', 'ಹಂಚು ವಿಭಾಗ'),
      ('stn-holding', '${branchId}', 'Holding Station', 'ಬಿಸಿ ಕಾಯ್ದಿರಿಸುವ ವಿಭಾಗ')
    ON CONFLICT (id) DO NOTHING
  `);

  await exec(`
    INSERT INTO kitchen_equipment (id, branch_id, station_id, code, name_en, name_kn, type, status, is_exclusive)
    VALUES
      ('eq-burner-1', '${branchId}', 'stn-stove', 'BURNER-01', 'Commercial Gas Burner 1', 'ವಾಣಿಜ್ಯ ಗ್ಯಾಸ್ ಬರ್ನರ್ ೧', 'GAS_STOVE', 'AVAILABLE', true),
      ('eq-burner-2', '${branchId}', 'stn-stove', 'BURNER-02', 'Commercial Gas Burner 2', 'ವಾಣಿಜ್ಯ ಗ್ಯಾಸ್ ಬರ್ನರ್ ೨', 'GAS_STOVE', 'AVAILABLE', true),
      ('eq-tawa-1', '${branchId}', 'stn-tawa', 'TAWA-01', 'Heavy Cast Iron Akki Rotti Tawa 1', 'ಭಾರವಾದ ಬೀಡು ಕಬ್ಬಿಣದ ಅಕ್ಕಿ ರೊಟ್ಟಿ ಹಂಚು ೧', 'TAWA', 'AVAILABLE', true),
      ('eq-warmer-1', '${branchId}', 'stn-holding', 'WARMER-01', 'Thermal Holding Warmer Pot 1', 'ಉಷ್ಣತೆ ಕಾಯ್ದಿರಿಸುವ ಆಹಾರ ಪಾತ್ರೆ ೧', 'WARMER', 'AVAILABLE', false)
    ON CONFLICT (id) DO NOTHING
  `);

  // Ingredients & packaging
  await exec(`
    INSERT INTO ingredients (id, branch_id, code, name_en, name_kn, category, base_unit, purchase_unit, conversion_ratio_to_base, reorder_level, current_stock)
    VALUES
      ('ing-rice', '${branchId}', 'ING-001', 'Sona Masoori Rice', 'ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ', 'GRAINS', 'g', 'kg', 1000, 10000, 45000),
      ('ing-toor-dal', '${branchId}', 'ING-002', 'Toor Dal', 'ತೊಗರಿ ಬೇಳೆ', 'PULSES', 'g', 'kg', 1000, 5000, 22000),
      ('ing-rice-flour', '${branchId}', 'ING-003', 'Fine Rice Flour', 'ಅಕ್ಕಿ ಹಿಟ್ಟು', 'FLOURS', 'g', 'kg', 1000, 8000, 25000),
      ('ing-greens', '${branchId}', 'ING-005', 'Fresh Leafy Greens', 'ತಾಜಾ ಸೊಪ್ಪು', 'VEGETABLES', 'g', 'kg', 1000, 2000, 8500),
      ('ing-onion', '${branchId}', 'ING-006', 'Onion', 'ಈರುಳ್ಳಿ', 'VEGETABLES', 'g', 'kg', 1000, 5000, 30000),
      ('ing-tomato', '${branchId}', 'ING-007', 'Tomato', 'ಟೊಮೆಟೊ', 'VEGETABLES', 'g', 'kg', 1000, 3000, 15000),
      ('ing-coconut', '${branchId}', 'ING-011', 'Fresh Grated Coconut', 'ತೆಂಗಿನಕಾಯಿ ತುರಿ', 'PERISHABLES', 'g', 'kg', 1000, 1000, 4500),
      ('ing-oil', '${branchId}', 'ING-021', 'Sunflower Cooking Oil', 'ಅಡುಗೆ ಎಣ್ಣೆ', 'OILS', 'ml', 'l', 1000, 5000, 18000),
      ('ing-ghee', '${branchId}', 'ING-022', 'Pure Cow Ghee', 'ಶುದ್ಧ ಹಸುವಿನ ತುಪ್ಪ', 'OILS', 'ml', 'l', 1000, 2000, 6000),
      ('ing-pkg-container', '${branchId}', 'PKG-001', '250ml Biodegradable Container', '೨೫೦ ಮಿಲಿ ಪರಿಸರಸ್ನೇಹಿ ಡಬ್ಬಿ', 'PACKAGING', 'pcs', 'pack', 50, 50, 350)
    ON CONFLICT (id) DO NOTHING
  `);

  await exec(`
    INSERT INTO stock_lots (id, branch_id, ingredient_id, lot_number, initial_quantity, available_quantity, reserved_quantity, unit_cost_paise, expires_at, status)
    VALUES
      ('lot-rice-01', '${branchId}', 'ing-rice', 'LOT-RICE-01', 50000, 45000, 0, 6, NOW() + INTERVAL '180 days', 'AVAILABLE'),
      ('lot-dal-01', '${branchId}', 'ing-toor-dal', 'LOT-DAL-01', 25000, 22000, 0, 16, NOW() + INTERVAL '180 days', 'AVAILABLE'),
      ('lot-flour-01', '${branchId}', 'ing-rice-flour', 'LOT-FLOUR-01', 30000, 25000, 0, 8, NOW() + INTERVAL '90 days', 'AVAILABLE')
    ON CONFLICT (id) DO NOTHING
  `);

  // Recipes, versions, dishes & dish variants
  await exec(`
    INSERT INTO recipes (id, branch_id, code, name_en, name_kn, preparation_policy)
    VALUES
      ('rcp-bassaru', '${branchId}', 'RCP-BAS', 'Bassaru (Broth & Palya)', 'ಬಸ್ಸಾರು (ಸೊಪ್ಪಿನ ಸಾರು ಮತ್ತು ಪಲ್ಯ)', 'READY_BATCH'),
      ('rcp-bbb', '${branchId}', 'RCP-BBB', 'Bisi Bele Bath', 'ಬಿಸಿ ಬೇಳೆ ಬಾತ್', 'READY_BATCH'),
      ('rcp-rotti', '${branchId}', 'RCP-ROTTI', 'Akki Rotti (2 Pieces)', 'ಅಕ್ಕಿ ರೊಟ್ಟಿ (೨ ರೊಟ್ಟಿ)', 'FRESH_ORDER')
    ON CONFLICT (id) DO NOTHING
  `);

  await exec(`
    INSERT INTO recipe_versions (id, recipe_id, version_number, status, base_yield_quantity, yield_unit)
    VALUES
      ('rcp-v-bassaru-01', 'rcp-bassaru', 1, 'APPROVED', 2500, 'ml'),
      ('rcp-v-bbb-01', 'rcp-bbb', 1, 'APPROVED', 3000, 'g'),
      ('rcp-v-rotti-01', 'rcp-rotti', 1, 'APPROVED', 2, 'pcs')
    ON CONFLICT (id) DO NOTHING
  `);

  await exec(`
    INSERT INTO dishes (id, branch_id, recipe_id, active_version_id, code, name_en, name_kn, description_en, description_kn, preparation_policy, image_url, is_active)
    VALUES
      ('dish-bassaru', '${branchId}', 'rcp-bassaru', 'rcp-v-bassaru-01', 'DISH-BAS', 'Bassaru (Broth & Palya)', 'ಬಸ್ಸಾರು (ಸೊಪ್ಪಿನ ಸಾರು ಮತ್ತು ಪಲ್ಯ)', 'Strained toor dal & greens broth tempered with spices, served with palya', 'ತೊಗರಿ ಬೇಳೆ ಮತ್ತು ಸೊಪ್ಪಿನ ಬಸ್ಸಾರು, ಒಗ್ಗರಣೆ ಪಲ್ಯ ಮತ್ತು ರಾಗಿ ಮುದ್ದೆ ಜೊತೆ', 'READY_BATCH', '/demo-media/dishes/bassaru.webp', true),
      ('dish-bbb', '${branchId}', 'rcp-bbb', 'rcp-v-bbb-01', 'DISH-BBB', 'Bisi Bele Bath', 'ಬಿಸಿ ಬೇಳೆ ಬಾತ್', 'Mysore authentic spicy rice, dal & vegetable pot with pure ghee', 'ತರಕಾರಿ, ಬೇಳೆ, ಅಕ್ಕಿ ಮತ್ತು ತುಪ್ಪದ ಒಗ್ಗರಣೆಯ ರುಚಿಕರ ಬಿಸಿ ಬೇಳೆ ಬಾತ್', 'READY_BATCH', '/demo-media/dishes/bisi-bele-bath.webp', true),
      ('dish-akki-rotti', '${branchId}', 'rcp-rotti', 'rcp-v-rotti-01', 'DISH-ROTTI', 'Akki Rotti (2 Pieces)', 'ಅಕ್ಕಿ ರೊಟ್ಟಿ (೨ ರೊಟ್ಟಿ)', 'Crispy rice flour flatbread with onion, chillies & fresh coconut chutney', 'ಈರುಳ್ಳಿ, ಮೆಣಸಿನಕಾಯಿ ಮತ್ತು ಕೊತ್ತಂಬರಿಯ ಗರಿಗರಿ ಅಕ್ಕಿ ರೊಟ್ಟಿ, ತೆಂಗಿನಕಾಯಿ ಚಟ್ನಿ ಜೊತೆ', 'FRESH_ORDER', '/demo-media/dishes/akki-rotti.webp', true)
    ON CONFLICT (id) DO NOTHING
  `);

  await exec(`
    INSERT INTO dish_variants (id, dish_id, name_en, name_kn, portion_quantity, portion_unit, price_paise, packaging_item_id)
    VALUES
      ('var-bassaru-reg', 'dish-bassaru', 'Regular Serving (250 ml)', 'ಸಾಮಾನ್ಯ ಪ್ರಮಾಣ (೨೫೦ ಮಿಲಿ)', 250, 'ml', 6500, 'ing-pkg-container'),
      ('var-bbb-reg', 'dish-bbb', 'Regular Plate (300 g)', 'ಸಾಮಾನ್ಯ ತಟ್ಟೆ (೩೦೦ ಗ್ರಾಂ)', 300, 'g', 9000, 'ing-pkg-container'),
      ('var-rotti-pair', 'dish-akki-rotti', '2 Pieces + Chutney', '೨ ರೊಟ್ಟಿಗಳು + ಚಟ್ನಿ', 2, 'pcs', 8000, 'ing-pkg-container')
    ON CONFLICT (id) DO NOTHING
  `);

  // Initial ready batches
  await exec(`
    INSERT INTO production_batches (id, branch_id, batch_code, recipe_version_id, dish_id, status, planned_yield, actual_usable_yield, remaining_usable_yield, yield_unit, assigned_equipment_id, assigned_chef_id, cooked_at, expires_at, quality_approved_at, quality_approved_by, quality_core_temperature_c)
    VALUES
      ('batch-bassaru-01', '${branchId}', 'BATCH-BAS-101', 'rcp-v-bassaru-01', 'dish-bassaru', 'READY', 2500, 2500, 2000, 'ml', 'eq-burner-1', 'usr-chef-01', NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '4 hours', NOW() - INTERVAL '40 minutes', 'usr-chef-01', 82.5),
      ('batch-bbb-01', '${branchId}', 'BATCH-BBB-102', 'rcp-v-bbb-01', 'dish-bbb', 'READY', 3000, 3120, 1800, 'g', 'eq-warmer-1', 'usr-chef-01', NOW() - INTERVAL '60 minutes', NOW() + INTERVAL '3 hours', NOW() - INTERVAL '55 minutes', 'usr-chef-01', 85.0)
    ON CONFLICT (id) DO NOTHING
  `);

  return { success: true, message: 'Synthetic demo data seeded successfully.' };
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    console.log('Seeding PantryOS demo data...');
    const result = await seedDemoData();
    console.log(`✓ ${result.message}`);
    await closeDatabase();
    process.exit(0);
  })().catch(async (err) => {
    console.error('Seed failed:', err);
    await closeDatabase();
    process.exit(1);
  });
}
