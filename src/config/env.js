import "dotenv/config";

const requiredVariables = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
];

export const env = {
    port: Number(process.env.PORT || 4000),
    nodeEnv: process.env.NODE_ENV || "development",
    corsOrigin: process.env.CORS_ORIGIN || "*",
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    maxUploadBytes: 5 * 1024 * 1024,
    llm: {
        provider: process.env.LLM_PROVIDER || "openai",
        apiKey: process.env.LLM_API_KEY,
        baseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
        model: process.env.LLM_MODEL || "gpt-4o-mini"
    },
    schedulerEnabled: process.env.ENABLE_SCHEDULER === "true"
};

export const validateEnv = () => {
    const missing = requiredVariables.filter((name) => !process.env[name]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
};
