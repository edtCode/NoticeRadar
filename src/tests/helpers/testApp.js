import { createApp } from "../../app.js";
import { createMockSupabase } from "./mockSupabase.js";

// The suite covers the Supabase mailer path with mocked clients, so a real
// RESEND_API_KEY in a developer's .env must not redirect registration through
// Resend (which would also hit the network).
process.env.RESEND_API_KEY = "";

export const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
export const ADMIN_ID = "22222222-2222-4222-8222-222222222222";
export const INSTITUTION_ID = "33333333-3333-4333-8333-333333333333";
export const OTHER_INSTITUTION_ID = "44444444-4444-4444-8444-444444444444";
export const DEPARTMENT_ID = "55555555-5555-4555-8555-555555555555";
export const OTHER_DEPARTMENT_ID = "66666666-6666-4666-8666-666666666666";
export const NOTICE_ID = "77777777-7777-4777-8777-777777777777";

export const studentProfileRow = {
    id: STUDENT_ID,
    name: "Student One",
    email: "student@example.com",
    role: "STUDENT",
    institution_id: INSTITUTION_ID
};

export const adminProfileRow = {
    id: ADMIN_ID,
    name: "Admin One",
    email: "admin@example.com",
    role: "ADMIN",
    institution_id: INSTITUTION_ID
};

export const createUserClient = ({ profile, tables = {}, storage = {}, rpc = {}, token = "valid-token" }) => {
    return createMockSupabase({
        tables: {
            profiles: { select: { data: profile } },
            ...tables
        },
        storage,
        rpc,
        auth: {
            getUser: async (receivedToken) => {
                if (receivedToken !== token) {
                    return { data: { user: null }, error: { message: "invalid token" } };
                }

                return { data: { user: { id: profile.id } }, error: null };
            },
            signOut: async () => ({ error: null })
        }
    });
};

export const buildTestApp = ({ adminClient, userClient, publicClient }) => {
    return createApp({
        supabaseClients: {
            getAdminClient: () => adminClient,
            getPublicClient: () => publicClient ?? adminClient,
            createUserClient: () => userClient
        }
    });
};
