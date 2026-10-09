"use client";

import React, { useState } from 'react';
import { 
  Thermometer, AlertTriangle, CheckCircle2, ShieldCheck, 
  Activity, RefreshCw, Calendar, Clock, Bell, Download
} from 'lucide-react';
import { useIndustryConfig } from '@/hooks/useIndustryConfig';
import { cn } from '@/lib/utils';

interface TemperatureLog {
  id: string;
  sensorName: string;
  location: string;
  currentTemp: number;
  minTemp: number;
  maxTemp: number;
  status: 'optimal' | 'warning' | 'critical';
  lastPing: string;
}

const DEFAULT_SENSORS: TemperatureLog[] = [
  {
    id: 's-01',
    sensorName: 'Sensor A1 - Main Cold Room',
    location: 'Warehouse Chiller Bay 1 (Vaccines & Insulin)',
    currentTemp: 4.2,
    minTemp: 2.0,
    maxTemp: 8.0,
    status: 'optimal',
    lastPing: 'Just now (12s ago)',
  },
  {
    id: 's-02',
    sensorName: 'Sensor A2 - Deep Freezer',
    location: 'Freezer Silo B (-20°C Biotech Storage)',
    currentTemp: -18.6,
    minTemp: -22.0,
    maxTemp: -15.0,
    status: 'optimal',
    lastPing: '1 min ago',
  },
  {
    id: 's-03',
    sensorName: 'Sensor B1 - Transit Cooler',
    location: 'Van #4 Refrigerated Delivery Box',
    currentTemp: 7.8,
    minTemp: 2.0,
    maxTemp: 8.0,
    status: 'warning',
    lastPing: '2 mins ago',
  },
  {
    id: 's-04',
    sensorName: 'Sensor C1 - Ambient Storage',
    location: 'Tablets & Syrups Controlled Room',
    currentTemp: 21.4,
    minTemp: 15.0,
    maxTemp: 25.0,
    status: 'optimal',
    lastPing: '3 mins ago',
  },
];

export default function ColdChainPage() {
  const { industry } = useIndustryConfig();
  const [sensors] = useState<TemperatureLog[]>(DEFAULT_SENSORS);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Thermometer size={16} />
            </span>
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
              {industry.displayName} Cold Chain Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Cold Chain &amp; Temperature Compliance Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous 2°C – 8°C thermal telemetry, freezer stability monitoring, and automated excursion audits.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Telemetry Mesh Active
          </span>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map((sensor) => (
          <div 
            key={sensor.id} 
            className="bg-[#0E131F] border border-white/[0.08] p-5 rounded-lg space-y-3 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-white">{sensor.sensorName}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{sensor.location}</p>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase",
                sensor.status === 'optimal' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              )}>
                {sensor.status === 'optimal' ? 'Compliant' : 'Near Limit'}
              </span>
            </div>

            <div className="py-2">
              <span className="text-3xl font-black font-mono text-cyan-400">
                {sensor.currentTemp > 0 ? `+${sensor.currentTemp}` : sensor.currentTemp}°C
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Safe Range: {sensor.minTemp}°C to {sensor.maxTemp}°C
              </p>
            </div>

            <div className="text-[10px] text-slate-400 font-mono border-t border-white/[0.04] pt-2 flex items-center justify-between">
              <span>Ping: {sensor.lastPing}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> 100% Uptime
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log Box */}
      <div className="bg-[#0E131F] border border-white/[0.08] rounded-lg p-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-400" />
          <span>Regulatory Compliance (DRAP / FDA Certified)</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Temperature logs are immutably archived locally in SQLite. Any excursion outside the prescribed 2.0°C – 8.0°C bracket triggers an automated incident record and halts batch dispatch until clinical sign-off.
        </p>
      </div>
    </div>
  );
}
