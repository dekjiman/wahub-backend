import { db } from '../config/database.js';
import { admins } from '../../drizzle/schema.js';
import { hashPassword } from '../utils/password.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@wahub.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';

async function bootstrap() {
  const existing = await db.query.admins.findFirst();

  if (existing) {
    console.log('Bootstrap admin skipped: admins table already has data.');
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await db
    .insert(admins)
    .values({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: 'super_admin',
      status: 'active',
    })
    .onConflictDoNothing();

  console.log(`Bootstrap admin created: ${ADMIN_EMAIL.toLowerCase()}`);
}

bootstrap()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Bootstrap admin failed:', err);
    process.exit(1);
  });
