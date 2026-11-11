// Applies supabase/migrations/*.sql in filename order over a direct Postgres
// connection and records them in Supabase's migration history table.
// Usage: DATABASE_URL=postgresql://... node scripts/apply-migrations.mjs
import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

await client.connect();
await client.query("create schema if not exists supabase_migrations");
await client.query(`
  create table if not exists supabase_migrations.schema_migrations (
    version text not null primary key,
    statements text[],
    name text,
    created_by text,
    idempotency_key text,
    rollback text[]
  )
`);

const { rows: applied } = await client.query(
  "select version from supabase_migrations.schema_migrations"
);
const appliedVersions = new Set(applied.map((row) => row.version));

for (const file of files) {
  const version = file.split("_")[0];
  const name = file.replace(/^\d+_/, "").replace(/\.sql$/, "");

  if (appliedVersions.has(version)) {
    console.log(`skip    ${file} (already applied)`);
    continue;
  }

  const sql = await readFile(path.join(migrationsDir, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query(
      `insert into supabase_migrations.schema_migrations (version, name, statements, created_by)
       values ($1, $2, $3, 'codebuff')`,
      [version, name, [sql]]
    );
    await client.query("commit");
    console.log(`applied ${file}`);
  } catch (error) {
    await client.query("rollback");
    console.error(`FAILED  ${file}\n  ${error.message}`);
    await client.end();
    process.exit(1);
  }
}

const { rows: tables } = await client.query(`
  select tablename, rowsecurity
  from pg_tables
  where schemaname = 'public'
  order by tablename
`);
console.log("\npublic tables (rls):");
for (const table of tables) console.log(`  ${table.tablename} -> rls=${table.rowsecurity}`);

const { rows: policies } = await client.query(`
  select tablename, count(*)::int as policies
  from pg_policies
  where schemaname in ('public', 'storage')
  group by tablename
  order by tablename
`);
console.log("\npolicies:");
for (const row of policies) console.log(`  ${row.tablename}: ${row.policies}`);

const { rows: buckets } = await client.query("select id, public from storage.buckets where id = 'notice-files'");
console.log("\nnotice-files bucket:", buckets.length ? `present (public: ${buckets[0].public})` : "MISSING");

await client.end();
