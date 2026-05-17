const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'NOXIS-local.db');
const sqlPath = path.join(process.cwd(), 'src/lib/db/migrations/0000_demonic_silvermane.sql');

const db = new Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf8');

try {
    console.log('Applying migration...');
    // Split by statement-breakpoint
    const statements = sql.split('--> statement-breakpoint');
    
    db.transaction(() => {
        for (let statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                db.prepare(trimmed).run();
            }
        }
    })();
    
    console.log('Migration applied successfully.');

    // Add missing tables from newer schema if any (ledger_entries, ai_detection_events, security_audit, etc.)
    // Based on schema.ts view earlier
    const schemaSql = `
        CREATE TABLE IF NOT EXISTS ai_detection_events (
            id text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
            node_id text NOT NULL,
            zone_id text NOT NULL,
            detected_class text NOT NULL,
            confidence text NOT NULL,
            timestamp integer NOT NULL,
            jpeg_frame blob,
            acknowledged integer DEFAULT 0 NOT NULL,
            created_at text DEFAULT (datetime('now')) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS security_audit (
            id text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
            node_id text NOT NULL,
            event_type text NOT NULL,
            payload text,
            failed_auth_count integer DEFAULT 0 NOT NULL,
            created_at text DEFAULT (datetime('now')) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ledger_entries (
            id text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
            node_id text,
            amount text NOT NULL,
            entry_type text NOT NULL,
            description text NOT NULL,
            posted_at text DEFAULT (datetime('now')) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS authorized_devices (
            node_id text PRIMARY KEY NOT NULL,
            mesh_key text NOT NULL,
            label text,
            is_active integer DEFAULT 1 NOT NULL
        );
    `;
    
    db.exec(schemaSql);
    console.log('Additional tables checked/created.');

} catch (err) {
    console.error('Migration Error:', err.message);
    if (err.message.includes('already exists')) {
        console.log('Some tables already existed, that is fine.');
    } else {
        process.exit(1);
    }
} finally {
    db.close();
}
