import { createApp } from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { startScheduler, stopScheduler } from "./scheduler/index.js";

validateEnv();

const app = createApp();

app.listen(env.port, () => {
    console.log(`Oppora API listening on port ${env.port}`);
});

startScheduler();

const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    stopScheduler();
    process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
