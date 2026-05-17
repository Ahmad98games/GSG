// src/lib/sentinel/recordingManager.ts
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'
);


interface DetectionEvent {
  id: string;
  business_id: string;
  node_id: string;
  detected_class: string;
}

export class RecordingManager {
  private static activeRecordings: Map<string, { recordingId: string; timeout: NodeJS.Timeout }> = new Map();

  static async onDetectionEvent(event: DetectionEvent) {
    // 1. Check Camera Config
    const { data: camera } = await supabase
      .from('cctv_nodes')
      .select('recording_enabled, business_id')
      .eq('id', event.node_id)
      .single();

    if (!camera?.recording_enabled) return;

    // 2. Check Tier Limit
    const { data: tierLimit } = await supabase.rpc('get_tier_camera_limit', { p_business_id: camera.business_id });
    const { count } = await supabase
      .from('cctv_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', camera.business_id)
      .eq('is_active', true);

    if (count && count > (tierLimit || 2)) {
      console.warn(`[Sentinel] Recording blocked for node ${event.node_id}: Tier limit reached.`);
      return;
    }

    // 3. Handle Active Recording (Cooldown/Extension)
    if (this.activeRecordings.has(event.node_id)) {
      const active = this.activeRecordings.get(event.node_id)!;
      clearTimeout(active.timeout);
      active.timeout = setTimeout(() => this.stopRecording(event.node_id), 30000);
      return;
    }

    // 4. Start New Recording
    const recordingId = await this.startRecording(event);
    if (recordingId) {
      const timeout = setTimeout(() => this.stopRecording(event.node_id), 30000);
      this.activeRecordings.set(event.node_id, { recordingId, timeout });
    }
  }

  private static async startRecording(event: DetectionEvent): Promise<string | null> {
    const { data, error } = await supabase
      .from('sentinel_recordings')
      .insert({
        business_id: event.business_id,
        camera_id: event.node_id,
        detection_event_id: event.id,
        started_at: new Date().toISOString(),
        recording_type: event.detected_class === 'person' ? 'human_detection' : 'breach',
        status: 'recording'
      })
      .select()
      .single();

    if (error) {
      console.error('[Sentinel] Failed to start recording:', error.message);
      return null;
    }

    // Signal Python Engine (via TCP or specialized RPC)
    // In this architecture, Python engine listens to sentinel_recordings INSERTs
    console.log(`[Sentinel] Recording started: ${data.id} for node ${event.node_id}`);
    return data.id;
  }

  private static async stopRecording(nodeId: string) {
    const active = this.activeRecordings.get(nodeId);
    if (!active) return;

    this.activeRecordings.delete(nodeId);

    const endedAt = new Date();
    
    // In a real implementation, we'd wait for Python engine to signal file completion
    // and provide the file path/size/hash. 
    // Here we simulate the finalization logic:
    
    const { data: recording } = await supabase
      .from('sentinel_recordings')
      .select('*')
      .eq('id', active.recordingId)
      .single();

    if (!recording) return;

    const duration = Math.floor((endedAt.getTime() - new Date(recording.started_at).getTime()) / 1000);
    
    // Simulate HMAC generation of a dummy file
    const hmac = crypto.createHmac('sha256', process.env.SENTINEL_SECRET || 'noxis-secret')
      .update(`${recording.id}_${duration}`)
      .digest('hex');

    await supabase
      .from('sentinel_recordings')
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: duration,
        hmac_hash: hmac,
        status: 'completed',
        auto_delete_at: new Date(Date.now() + 30 * 86400000).toISOString() // 30 days retention
      })
      .eq('id', active.recordingId);

    console.log(`[Sentinel] Recording stopped and finalized: ${active.recordingId}`);
  }

  static async runRetentionCleanup() {
    console.log('[Sentinel] Running retention cleanup...');
    const { data: expired } = await supabase
      .from('sentinel_recordings')
      .select('id, file_path')
      .lt('auto_delete_at', new Date().toISOString())
      .eq('flagged_permanent', false);

    if (expired && expired.length > 0) {
      for (const rec of expired) {
        if (rec.file_path) {
          await supabase.storage.from('sentinel-recordings').remove([rec.file_path]);
        }
        await supabase.from('sentinel_recordings').delete().eq('id', rec.id);
      }
      console.log(`[Sentinel] Cleaned up ${expired.length} expired recordings.`);
    }
  }
}
