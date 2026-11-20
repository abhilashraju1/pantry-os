import { sql } from 'drizzle-orm';
import { getDatabase, closeDatabase } from './connection.js';
import { runMigrations } from './migrate.js';
import { hashPassword } from './auth-crypto.js';

export async function bootstrapSystem(db?: any, options?: { orgName?: string; branchCode?: string; branchName?: string; adminEmail?: string; adminPassword?: string; adminName?: string }) {
  const targetDb = db || (await getDatabase());
  await runMigrations(targetDb);

  // Check if any admin user already exists
  const existingUsers = await targetDb.execute(sql`SELECT id, email FROM users LIMIT 1`);
  const rows = (existingUsers as any).rows || existingUsers;
  if (rows && rows.length > 0) {
    return {
      success: false,
      message: 'System already provisioned. Admin user already exists.',
      adminEmail: rows[0].email
    };
  }

  const orgId = 'org-01';
  const orgName = options?.orgName || process.env.BOOTSTRAP_ORG_NAME || 'Mandya Traditional Pantries Private Limited';
  const orgSlug = 'mandya-pantries';

  const branchId = 'branch-blr-vvp-01';
  const branchCode = options?.branchCode || process.env.BOOTSTRAP_BRANCH_CODE || 'BLR-VVP-01';
  const branchName = options?.branchName || process.env.BOOTSTRAP_BRANCH_NAME || 'VV Puram Food Street Branch';

  const adminEmail = options?.adminEmail || process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@pantryos.local';
  const adminPassword = options?.adminPassword || process.env.BOOTSTRAP_ADMIN_PASSWORD || 'password123';
  const adminName = options?.adminName || 'Suresh Kumar';
  const passwordHash = hashPassword(adminPassword);

  // 1. Organization
  await targetDb.execute(sql`
    INSERT INTO organizations (id, name, slug)
    VALUES (${orgId}, ${orgName}, ${orgSlug})
    ON CONFLICT (slug) DO NOTHING
  `);

  // 2. Branch
  await targetDb.execute(sql`
    INSERT INTO branches (id, organization_id, name, code, address, phone, is_active)
    VALUES (
      ${branchId},
      ${orgId},
      ${branchName},
      ${branchCode},
      'Food Street, Old Tharagupet, Bengaluru, Karnataka 560053',
      '+91 80 2652 0001',
      true
    )
    ON CONFLICT (code) DO NOTHING
  `);

  // 3. First Admin User
  await targetDb.execute(sql`
    INSERT INTO users (id, organization_id, branch_id, email, password_hash, full_name, phone, roles, is_active)
    VALUES (
      'usr-mgr-01',
      ${orgId},
      ${branchId},
      ${adminEmail},
      ${passwordHash},
      ${adminName},
      '+91 98450 11111',
      ARRAY['BRANCH_MANAGER', 'SUPER_ADMIN'],
      true
    )
    ON CONFLICT (email) DO NOTHING
  `);

  return {
    success: true,
    message: 'Primary organization, branch, and first admin provisioned successfully.',
    adminEmail,
    branchCode
  };
}

// CLI entry point
if (process.argv[1]?.endsWith('bootstrap.ts') || process.argv[1]?.endsWith('bootstrap.js')) {
  (async () => {
    console.log('Provisioning PantryOS first admin and branch...');
    const result = await bootstrapSystem();
    console.log(result.message);
    if (result.success) {
      console.log(`✓ Admin Email: ${result.adminEmail}`);
      console.log(`✓ Branch Code: ${result.branchCode}`);
    }
    await closeDatabase();
    process.exit(0);
  })().catch(async (err) => {
    console.error('Bootstrap failed:', err);
    await closeDatabase();
    process.exit(1);
  });
}
