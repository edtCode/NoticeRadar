import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const clientOptions = {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
};

let publicClient = null;
let adminClient = null;

export const getPublicClient = () => {
    if (!publicClient) {
        publicClient = createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
    }

    return publicClient;
};

export const getAdminClient = () => {
    if (!adminClient) {
        adminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, clientOptions);
    }

    return adminClient;
};

export const createUserClient = (accessToken) => {
    return createClient(env.supabaseUrl, env.supabaseAnonKey, {
        ...clientOptions,
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
};
