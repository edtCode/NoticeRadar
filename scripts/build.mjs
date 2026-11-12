import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const runtimeDependencies = [
    "@supabase/supabase-js",
    "cors",
    "dotenv",
    "express",
    "multer",
    "pdf-parse",
    "zod"
];

const missingDependencies = runtimeDependencies.filter(
    (name) => !existsSync(join("node_modules", name, "package.json"))
);

if (missingDependencies.length > 0) {
    console.log(`Dependencies missing (${missingDependencies.join(", ")}), installing...`);

    // npm passes its own config down as env vars; some configs are invalid for
    // project-scoped installs, so drop them before installing from the build step.
    const installEnv = Object.fromEntries(
        Object.entries(process.env).filter(
            ([key]) => !key.toLowerCase().startsWith("npm_config_allow_scripts")
        )
    );

    const install = spawnSync("npm", ["ci", "--no-audit", "--no-fund"], {
        stdio: "inherit",
        env: installEnv,
        shell: process.platform === "win32"
    });

    if (install.status !== 0) {
        process.exit(install.status ?? 1);
    }
}

const check = spawnSync(process.execPath, ["--check", "src/server.js"], { stdio: "inherit" });
process.exit(check.status ?? 1);
