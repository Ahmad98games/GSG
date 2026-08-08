"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Supabase Admin Client (Service Role)
 * WARNING: This client bypasses RLS. Use ONLY for server-side logic
 * that requires system-level access (e.g., portal token verification).
 */
const fetchWithTimeout = (url, options = {}) => {
    const timeout = 5000; // 5 seconds timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => {
        clearTimeout(id);
    });
};
/**
 * Supabase Admin Client (Service Role)
 * WARNING: This client bypasses RLS. Use ONLY for server-side logic
 * that requires system-level access (e.g., portal token verification).
 */
const createAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('[Supabase] Missing URL or Service Role Key');
    }
    return (0, supabase_js_1.createClient)(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            fetch: fetchWithTimeout,
        }
    });
};
exports.createAdminClient = createAdminClient;
