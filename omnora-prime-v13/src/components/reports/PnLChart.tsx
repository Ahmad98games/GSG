"use client";

import React, { memo, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface PnLData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface PnLChartProps {
  data: PnLData[];
}

/**
 * Noxis v13.0 — PnLChart
 * Optimized with React.memo and  useMemo, memo  for report performance.
 */
const PnLChart = memo(({ data }: PnLChartProps) => {
  // Memoize data transformations to prevent unnecessary recalculations
   const chartData = useMemo(() => data.map(item => ({
    ...item,
    profit: item.revenue - item.expenses
  })), [data]);

  return (
    <div className="h-[400px] w-full bg-onyx/50 p-6 border border-electric-blue/10">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#666" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#666" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333' }}
            itemStyle={{ color: '#00E5FF' }}
          />
          <Legend iconType="circle" />
          <Bar 
            dataKey="revenue" 
            fill="#00E5FF" 
            radius={[4, 4, 0, 0]} 
            isAnimationActive={false} // Performance: disable animation on data updates
          />
          <Bar 
            dataKey="expenses" 
            fill="#FF3D00" 
            radius={[4, 4, 0, 0]} 
            isAnimationActive={false} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

PnLChart.displayName = 'PnLChart';

export default PnLChart;

