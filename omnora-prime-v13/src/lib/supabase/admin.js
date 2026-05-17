"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Supabase Admin Client (Service Role)
 * WARNING: This client bypasses RLS. Use ONLY for server-side logic
 * that requires system-level access (e.g., portal token verification).
 */
const createAdminClient = () => {
    return (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
exports.createAdminClient = createAdminClient;
