// Verifies that the backend can reach the configured Supabase project and that
// every table/bucket the migrations create actually exists. Prints names only,
// never key values.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const tables = [
  "institutions",
  "departments",
  "profiles",
  "student_profiles",
  "notices",
  "saved_notices",
  "notifications",
  "notice_processing_logs",
  "notice_versions",
];

const buckets = ["notice-files"];

function fail(message) {
  console.log(`FAIL  ${message}`);
  process.exitCode = 1;
}

console.log("Environment variables:");
for (const name of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  console.log(`  ${name}: ${process.env[name] ? "set" : "MISSING"}`);
}

if (!url || !anonKey || !serviceKey) {
  fail("Supabase credentials are incomplete; cannot check the project.");
  process.exit();
}

console.log(`\nProject: ${url}`);

const projectRef = new URL(url).hostname.split(".")[0];
try {
  const response = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: anonKey },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.text();
  console.log(`Auth endpoint: HTTP ${response.status} ${body.slice(0, 80)}`);
} catch (error) {
  fail(`Auth endpoint unreachable: ${error.message}`);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

console.log("\nTables:");
for (const table of tables) {
  const { error } = await admin.from(table).select("*").limit(1);
  if (error) {
    console.log(`  MISSING  ${table}  (${error.code ?? "error"})`);
  } else {
    console.log(`  OK       ${table}`);
  }
}

console.log("\nStorage buckets:");
for (const bucket of buckets) {
  const { data, error } = await admin.storage.getBucket(bucket);
  if (error || !data) {
    console.log(`  MISSING  ${bucket}  (${error?.message ?? "not found"})`);
  } else {
    console.log(`  OK       ${bucket}  (public: ${data.public})`);
  }
}

console.log(`\nProject reference: ${projectRef}`);
