// Import the AISHE college and university tab-separated exports into Supabase.
// Usage: node scripts/import-aishe-institutions.mjs <colleges.txt> <universities.txt>
import "dotenv/config";
import { readFile } from "node:fs/promises";
import pg from "pg";

const [collegePath, universityPath] = process.argv.slice(2);
const connectionString = process.env.DATABASE_URL;
if (!collegePath || !universityPath) {
  console.error("Provide the college and university export paths.");
  process.exit(1);
}
if (!connectionString) {
  console.error("DATABASE_URL is required (Supabase direct Postgres connection string).");
  process.exit(1);
}

function parseRows(text, prefix, expectedFields) {
  const rows = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith(`${prefix}-`)) continue;
    const fields = line.split("\t").map((field) => field.trim());
    // The source has a few quoted fields containing tabs. Join those interior
    // fragments back together before validating the export's column count.
    while (fields.length > expectedFields) {
      let quoteAt = -1;
      for (let i = 1; i < fields.length - 1; i++) {
        if (fields[i].startsWith('"') && !fields[i].endsWith('"')) { quoteAt = i; break; }
      }
      if (quoteAt < 0) throw new Error(`Unexpected ${fields.length} columns for ${fields[0]}`);
      let quoteEnd = quoteAt + 1;
      while (quoteEnd < fields.length && !fields[quoteEnd].endsWith('"')) quoteEnd++;
      if (quoteEnd >= fields.length) throw new Error(`Unclosed quoted field for ${fields[0]}`);
      fields.splice(quoteAt, quoteEnd - quoteAt + 1, fields.slice(quoteAt, quoteEnd + 1).join(" "));
    }
    if (fields.length !== expectedFields) throw new Error(`Expected ${expectedFields} columns for ${fields[0]}, got ${fields.length}`);
    const code = fields[0];
    if (seen.has(code)) throw new Error(`Duplicate AISHE code in input: ${code}`);
    seen.add(code);
    const name = fields[1].replace(/^"|"$/g, "").replace(/\s+/g, " ").trim();
    const state = fields[2];
    const district = fields[3];
    const established = fields[5];
    if (!name || !state || !district) throw new Error(`Missing required field for ${code}`);
    const slug = `${code.toLowerCase()}-${name.toLowerCase()}`
      .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
    rows.push({
      aishe_code: code,
      name,
      slug: slug || code.toLowerCase(),
      city: district,
      state,
      institution_type: prefix === "C" ? fields[7] : "UNIVERSITY",
      aliases: [],
      established_year: /^\d{4}$/.test(established) ? Number(established) : null,
    });
  }
  return rows;
}

const colleges = parseRows(await readFile(collegePath, "utf8"), "C", 12);
const universities = parseRows(await readFile(universityPath, "utf8"), "U", 7);
const rows = [...colleges, ...universities];
console.log(`Parsed ${colleges.length} colleges and ${universities.length} universities.`);

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
await client.connect();
try {
  await client.query("begin");
  await client.query("alter table public.institutions add column if not exists aishe_code text");
  await client.query("alter table public.institutions add column if not exists established_year integer");
  await client.query("create unique index if not exists institutions_aishe_code_unique_idx on public.institutions (aishe_code) where aishe_code is not null");
  let imported = 0;
  for (let offset = 0; offset < rows.length; offset += 500) {
    const batch = rows.slice(offset, offset + 500);
    const values = [];
    const tuples = batch.map((row, index) => {
      const base = index * 8;
      values.push(row.aishe_code, row.name, row.slug, row.city, row.state, row.institution_type, row.aliases, row.established_year);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
    });
    const result = await client.query(`
      insert into public.institutions
        (aishe_code, name, slug, city, state, institution_type, aliases, established_year)
      values ${tuples.join(",")}
      on conflict (aishe_code) where aishe_code is not null do update set
        name = excluded.name, city = excluded.city, state = excluded.state,
        institution_type = excluded.institution_type, established_year = excluded.established_year,
        updated_at = now()
    `, values);
    imported += result.rowCount;
    if ((offset + batch.length) % 5000 === 0 || offset + batch.length === rows.length) {
      console.log(`Processed ${offset + batch.length}/${rows.length}`);
    }
  }
  const { rows: counts } = await client.query(`
    select institution_type, count(*)::int as count
    from public.institutions where aishe_code is not null
    group by institution_type order by institution_type
  `);
  await client.query("commit");
  console.log(`Upserted ${imported} source rows. AISHE totals: ${counts.map((r) => `${r.institution_type}=${r.count}`).join(", ")}`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
