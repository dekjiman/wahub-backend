import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema.js';
import { env } from './env.js';

const connectionString = env.DATABASE_URL;

// Disable prepare statements for serverless/pooled connections if needed, standard postgres.js works well
const client = postgres(connectionString, { max: 10 });

export const db = drizzle(client, { schema });
export { client };
