
import { AiDetectionEvent } from '@/lib/db/schema';

/**
 * Sentinel Intelligence Module
 * Processes raw detection data into actionable operational insights.
 */

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
}

export function processDetectionHeatmap(
  events: any[],
  nodeId: string,
  timeRangeMs = 3600000 // 1 hour
): HeatmapPoint[] {
  const cutoff = Date.now() - timeRangeMs;
  const filtered = events.filter(e => 
    e.node_id === nodeId && 
    new Date(e.created_at).getTime() >= cutoff &&
    e.bbox_x !== undefined &&
    e.bbox_y !== undefined
  );

  // Group by grid (e.g., 20x20)
  const gridSize = 20;
  const grid: Record<string, number> = {};

  filtered.forEach(e => {
    const x = Math.floor(e.bbox_x * gridSize);
    const y = Math.floor(e.bbox_y * gridSize);
    const key = `${x},${y}`;
    grid[key] = (grid[key] || 0) + 1;
  });

  return Object.entries(grid).map(([key, intensity]) => {
    const [x, y] = key.split(',').map(Number);
    return { x: x / gridSize, y: y / gridSize, intensity };
  });
}

/**
 * Identifies production bottlenecks by comparing activity levels between zones.
 */
export function detectBottlenecks(events: any[]) {
  const zones: Record<string, number> = {};
  events.forEach(e => {
    if (e.zone_id) {
      zones[e.zone_id] = (zones[e.zone_id] || 0) + 1;
    }
  });

  const sortedZones = Object.entries(zones).sort((a, b) => b[1] - a[1]);
  if (sortedZones.length < 2) return null;

  const busiest = sortedZones[0];
  const idlest = sortedZones[sortedZones.length - 1];

  return {
    busiestZone: busiest[0],
    idlestZone: idlest[0],
    variance: busiest[1] / idlest[1],
    description: `High congestion at ${busiest[0]} vs idle state at ${idlest[0]}. Recommendation: Divert workforce to ${busiest[0]}.`
  };
}
