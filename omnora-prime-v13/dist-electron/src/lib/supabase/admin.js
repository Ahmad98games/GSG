"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Offline-safe fetch wrapper with strict timeout to prevent hangs when offline or on poor network.
 */
const fetchWithTimeout = (url, options = {}, timeoutMs = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => {
        clearTimeout(id);
    });
};
/**
 * Supabase Admin Client (Service Role)
 * Safe for both online and offline usage — never blocks indefinitely.
 */
const createAdminClient = (timeoutMs = 3000) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';
    return (0, supabase_js_1.createClient)(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            fetch: (u, o) => fetchWithTimeout(u, o, timeoutMs),
        }
    });
};
exports.createAdminClient = createAdminClient;
