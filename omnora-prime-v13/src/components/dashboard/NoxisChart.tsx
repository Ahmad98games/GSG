"use client";

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface NoxisChartProps {
  telemetryPoints: { timestamp: number; value: number }[];
}

/**
 * Noxis v13.0 — NoxisChart (ECharts)
 * Tuned for 100ms real-time telemetry updates.
 */
export default function NoxisChart({ telemetryPoints }: NoxisChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, 'dark');

    const option = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'time', splitLine: { show: false } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#333' } } },
      series: [{
        type: 'line',
        showSymbol: false,
        data: [],
        lineStyle: { color: '#00E5FF', width: 2 },
        areaStyle: {
          color: 'rgba(0, 229, 255, 0.05)' // Solid subtle fill instead of gradient
        }
      }]
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose(); // Critical: prevent memory leaks
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current) return;

    // PERFORMANCE: Data Windowing (Only keep last 300 points)
    const MAX_POINTS = 300;
    const windowedData = telemetryPoints.slice(-MAX_POINTS).map(p => [p.timestamp, p.value]);

    // PERFORMANCE: Use lazyUpdate=true and notMerge=false to batch renders
    chartInstance.current.setOption({
      series: [{ data: windowedData }]
    }, { notMerge: false, lazyUpdate: true });

  }, [telemetryPoints]);

  return (
    <div ref={chartRef} className="h-full w-full" />
  );
}
