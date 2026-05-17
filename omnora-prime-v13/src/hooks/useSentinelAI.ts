// src/hooks/useSentinelAI.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSentinelAI(nodeId: string) {
  const supabase = createClient();
  const [isDetectionsActive, setIsDetectionsActive] = useState(false);
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNodeConfig() {
      const { data } = await supabase
        .from('cctv_nodes')
        .select('ai_enabled, detection_zones')
        .eq('id', nodeId)
        .single();
      
      if (data) {
        setIsDetectionsActive(data.ai_enabled);
        setZones(data.detection_zones || []);
      }
    }
    if (nodeId) fetchNodeConfig();
  }, [nodeId, supabase]);

  const isPointInPolygon = (point: {x: number, y: number}, polygon: {x: number, y: number}[]) => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  };

  const logDetection = async (detection: any) => {
    if (!isDetectionsActive) return;

    // Check zones
    let activeZoneId = null;
    const center = {
      x: detection.bbox[0] + detection.bbox[2] / 2,
      y: detection.bbox[1] + detection.bbox[3] / 2
    };

    for (const zone of zones) {
      if (isPointInPolygon(center, zone.points)) {
        activeZoneId = zone.id;
        break;
      }
    }

    // Insert into AI detection events
    await supabase.from('ai_detection_events').insert({
      node_id: nodeId,
      business_id: (await supabase.auth.getUser()).data.user?.id, // Should use real business_id from context
      detected_class: detection.class,
      confidence: detection.score,
      zone_id: activeZoneId,
      bbox_x: detection.bbox[0],
      bbox_y: detection.bbox[1],
      bbox_w: detection.bbox[2],
      bbox_h: detection.bbox[3],
      detection_source: 'browser'
    });
  };

  return { logDetection, isDetectionsActive, zones };
}

