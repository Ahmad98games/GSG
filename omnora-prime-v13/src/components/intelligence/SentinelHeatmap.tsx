
"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AiDetectionEvent } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

interface SentinelHeatmapProps {
  events: any[]; // AiDetectionEvent but simplified for the component
  gridSize?: number; // e.g. 20 for 20x20 grid
  width: number;
  height: number;
}

export default function SentinelHeatmap({ events, gridSize = 20, width, height }: SentinelHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Initialize grid
    const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    let maxIntensity = 0;

    events.forEach(event => {
      if (event.bbox_x === undefined || event.bbox_y === undefined) return;
      
      // Map coordinate (0-100 or 0-1) to grid index
      // Assuming coordinates are 0-1 based on usual AI output
      const xIdx = Math.floor(event.bbox_x * gridSize);
      const yIdx = Math.floor(event.bbox_y * gridSize);

      if (xIdx >= 0 && xIdx < gridSize && yIdx >= 0 && yIdx < gridSize) {
        grid[yIdx][xIdx] += 1;
        if (grid[yIdx][xIdx] > maxIntensity) maxIntensity = grid[yIdx][xIdx];
      }
    });

    return { grid, maxIntensity };
  }, [events, gridSize]);

  const { grid, maxIntensity } = heatmapData;

  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen overflow-hidden"
      style={{ width, height }}
    >
      <div 
        className="grid h-full w-full" 
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)` 
        }}
      >
        {grid.map((row, y) => (
          row.map((intensity, x) => {
            if (intensity === 0) return <div key={`${x}-${y}`} />;
            
            const normalized = intensity / maxIntensity;
            return (
              <motion.div
                key={`${x}-${y}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                style={{
                  backgroundColor: normalized > 0.7 ? '#ef4444' : normalized > 0.4 ? '#f59e0b' : '#3b82f6',
                  filter: `blur(${width / gridSize / 2}px)`,
                }}
                className="w-full h-full"
              />
            );
          })
        ))}
      </div>
    </div>
  );
}
