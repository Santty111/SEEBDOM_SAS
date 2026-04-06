/**
 * Crea usuarios de prueba si no existen (mismo hash bcrypt que authService).
 *
 * Docker (recomendado):
 *   docker compose exec backend node scripts/seedTestUsers.js
 *
 * Local (requiere MONGODB_URI apuntando a Mongo, p. ej. con puerto 27017 publicado):
 *   cd backend && npm run seed
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../src/models/User.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

const SALT_ROUNDS = 12;

/** Credenciales solo para desarrollo / pruebas. */
const SEED_USERS = [
  { email: 'admin@sebdom.test', password: 'AdminTest1234', role: UserRole.Admin },
  { email: 'operador@sebdom.test', password: 'OperTest1234', role: UserRole.Operador },
];

async function seed() {
  await connectDatabase();

  for (const u of SEED_USERS) {
    const email = u.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`[seed] Ya existe (omitido): ${email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await User.create({
      email,
      password: passwordHash,
      role: u.role,
    });
    console.log(`[seed] Creado: ${email} → rol ${u.role}`);
  }

  console.log('');
  console.log('[seed] Usuarios de prueba (contraseñas en texto plano solo para copiar al login):');
  for (const u of SEED_USERS) {
    console.log(`  • ${u.email} / ${u.password}`);
  }
  console.log('');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('[seed] Error:', err.message || err);
  process.exit(1);
});
