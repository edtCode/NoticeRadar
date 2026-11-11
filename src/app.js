import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { getPublicClient, getAdminClient, createUserClient } from "./config/supabase.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

const defaultSupabaseClients = {
    getPublicClient,
    getAdminClient,
    createUserClient
};

export const createApp = ({ supabaseClients = defaultSupabaseClients } = {}) => {
    const app = express();

    app.locals.supabaseClients = supabaseClients;

    const corsOrigins = env.corsOrigin === "*"
        ? true
        : env.corsOrigin.split(",").map((origin) => origin.trim());

    app.use(cors({ origin: corsOrigins }));
    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true }));

    app.get("/health", (req, res) => {
        res.status(200).json({ data: { status: "ok" } });
    });

    app.use("/api/v1", routes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
};

export default createApp();
