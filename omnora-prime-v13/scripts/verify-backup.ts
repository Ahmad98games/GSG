// scripts/verify-backup.ts
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../src/lib/logger';
import fs from 'fs';
import path from 'path';

/**
 * NOXIS Backup Verification Service
 * Runs weekly to ensure remote backups are not corrupted.
 */
async function verifyLatestBackup() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const businessId = process.env.BUSINESS_ID || 'default';
  const bucket = 'hub-backups';
  const tempDir = './temp_backups';

  try {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // 1. Download latest backup
    const { data: files } = await supabase.storage.from(bucket).list(`${businessId}/`, {
      sortBy: { column: 'created_at', order: 'desc' },
      limit: 1
    });

    if (!files || files.length === 0) throw new Error("No backups found in storage");

    const fileName = files[0].name;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(`${businessId}/${fileName}`);

    if (downloadError) throw downloadError;

    const localPath = path.join(tempDir, fileName);
    const arrayBuffer = await fileData.arrayBuffer();
    fs.writeFileSync(localPath, Buffer.from(arrayBuffer));

    // 2. Open and verify with SQLite
    const db = new Database(localPath, { readonly: true });
    
    // PRAGMA integrity_check
    const integrity = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    if (integrity.integrity_check !== 'ok') {
       throw new Error(`SQLite Integrity Check Failed: ${integrity.integrity_check}`);
    }

    // Business Logic Check: Ledger must have entries
    const count = db.prepare('SELECT COUNT(*) as total FROM ledger_entries').get() as { total: number };
    if (count.total === 0) {
       throw new Error("Sanity Check Failed: Database contains 0 ledger entries");
    }

    logger.info({ fileName, entries: count.total }, "Backup verification successful");
    
    // Cleanup
    db.close();
    fs.unlinkSync(localPath);

  } catch (error: any) {
    logger.error({ error: error.message }, "CRITICAL: Backup verification failed");
    // In production, trigger critical alert (PagerDuty/WhatsApp)
  }
}

verifyLatestBackup();

