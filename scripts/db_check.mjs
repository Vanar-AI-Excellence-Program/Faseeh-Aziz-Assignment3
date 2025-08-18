import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', url);

const sql = postgres(url, { max: 1 });

async function main() {
  try {
    const [{ now }] = await sql`select now()`;
    console.log('DB time:', now);
    const [{ count: userCount }] = await sql`select count(*)::int as count from "user"`;
    console.log('user rows:', userCount);
    const [{ count: tokCount }] = await sql`select count(*)::int as count from verification_token`;
    console.log('verification_token rows:', tokCount);
  } catch (err) {
    console.error('DB check failed:', err);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

main();


