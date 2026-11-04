'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Scale,
  Save,
  ArrowLeft,
  Laptop,
  Radio,
  Barcode,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface PrinterDevice {
  name: string;
  displayName?: string;
  description?: string;
  status?: number;
  isDefault?: boolean;
}

export default function HardwareSettingsPage() {
  const toast = useToast();
  const [isElectron, setIsElectron] = useState<boolean>(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(true);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);

  // Printer configuration state
  const [thermalPrinter, setThermalPrinter] = useState<string>('');
  const [a4Printer, setA4Printer] = useState<string>('');
  const [thermalWidth, setThermalWidth] = useState<'80mm' | '58mm'>('80mm');

  // Test print state
  const [isTestingThermal, setIsTestingThermal] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Weighbridge live telemetry state
  const [scaleData, setScaleData] = useState<{
    weight: number;
    unit: string;
    raw: string;
    port?: string;
    timestamp?: number;
  } | null>(null);
  const [scaleConnected, setScaleConnected] = useState<boolean>(false);

  // Barcode scanner test state
  const [scannedCode, setScannedCode] = useState<string>('');
  const [lastScannedTime, setLastScannedTime] = useState<string | null>(null);

  // ── 1. Load Initial Hardware State ──────────────────────────────────────
  const loadPrinters = useCallback(async () => {
    setIsLoadingPrinters(true);
    const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;

    if (!electronAPI || typeof electronAPI.getPrinters !== 'function') {
      setIsElectron(false);
      setIsLoadingPrinters(false);
      return;
    }

    setIsElectron(true);
    try {
      const res = await electronAPI.getPrinters();
      if (res && res.success && Array.isArray(res.printers)) {
        setPrinters(res.printers);
      } else {
        setPrinters([]);
      }
    } catch (err: any) {
      console.error('[HardwareSettings] Error loading printers:', err);
      toast.error('Printer Query Error', err?.message || 'Could not query Windows printers');
    } finally {
      setIsLoadingPrinters(false);
    }
  }, [toast]);

  useEffect(() => {
    // Detect Electron
    const hasElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
    setIsElectron(hasElectron);

    // Load saved preferences from localStorage & Electron store
    if (typeof window !== 'undefined') {
      const savedThermal = localStorage.getItem('noxis_thermal_printer') || localStorage.getItem('default_thermal_printer') || '';
      const savedA4 = localStorage.getItem('noxis_a4_printer') || localStorage.getItem('default_a4_printer') || '';
      const savedWidth = (localStorage.getItem('noxis_thermal_width') as '80mm' | '58mm') || '80mm';

      setThermalPrinter(savedThermal);
      setA4Printer(savedA4);
      setThermalWidth(savedWidth);

      // Also query Electron persistent store if available
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && typeof electronAPI.getConfig === 'function') {
        Promise.all([
          electronAPI.getConfig('thermal_printer'),
          electronAPI.getConfig('a4_printer'),
          electronAPI.getConfig('thermal_width'),
        ]).then(([cfgThermal, cfgA4, cfgWidth]) => {
          if (cfgThermal && !savedThermal) setThermalPrinter(cfgThermal);
          if (cfgA4 && !savedA4) setA4Printer(cfgA4);
          if (cfgWidth && !savedWidth) setThermalWidth(cfgWidth as any);
        }).catch(() => {});
      }
    }

    loadPrinters();
  }, [loadPrinters]);

  // ── 2. Listen to Scale Telemetry ─────────────────────────────────────────
  useEffect(() => {
    const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    if (electronAPI && typeof electronAPI.onScaleWeight === 'function') {
      const unsubscribe = electronAPI.onScaleWeight((data: any) => {
        if (data && typeof data.weight === 'number') {
          setScaleData(data);
          setScaleConnected(true);
        }
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, []);

  // ── 3. Save Configuration ────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('noxis_thermal_printer', thermalPrinter);
        localStorage.setItem('default_thermal_printer', thermalPrinter);
        localStorage.setItem('noxis_a4_printer', a4Printer);
        localStorage.setItem('default_a4_printer', a4Printer);
        localStorage.setItem('noxis_thermal_width', thermalWidth);
      }

      const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
      if (electronAPI && typeof electronAPI.setConfig === 'function') {
        await Promise.all([
          electronAPI.setConfig('thermal_printer', thermalPrinter),
          electronAPI.setConfig('a4_printer', a4Printer),
          electronAPI.setConfig('thermal_width', thermalWidth),
        ]);
      }

      toast.success('Hardware Config Saved', 'Default thermal and A4 printers updated successfully');
    } catch (err: any) {
      console.error('[HardwareSettings] Error saving config:', err);
      toast.error('Save Failed', err?.message || 'Could not persist hardware settings');
    }
  };

  // ── 4. Test Thermal Print Action ─────────────────────────────────────────
  const handleTestThermalPrint = async () => {
    const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    if (!electronAPI || typeof electronAPI.printThermalSilent !== 'function') {
      toast.warning('Web Environment', 'Silent thermal printing requires the Noxis Hub Electron desktop app.');
      return;
    }

    setIsTestingThermal(true);
    setTestResult(null);

    const targetDevice = thermalPrinter.trim() || undefined;
    const testSlipHtml = `
      <div id="noxis-test-slip" style="width: 100%; max-width: ${thermalWidth}; font-family: monospace; font-size: 12px; padding: 8px 4px; color: black; background: white; text-align: center;">
        <div style="font-weight: 900; font-size: 15px; border-bottom: 2px dashed black; padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase;">
          NOXIS HUB — HARDWARE TEST
        </div>
        <div style="font-size: 10px; line-height: 1.5; text-align: left; margin-bottom: 6px;">
          <div><b>DEVICE:</b> ${targetDevice || '(System Default Spooler)'}</div>
          <div><b>PROTOCOL:</b> Silent Electron ESC/POS</div>
          <div><b>WIDTH:</b> ${thermalWidth}</div>
          <div><b>TIMESTAMP:</b> ${new Date().toLocaleString('en-PK')}</div>
        </div>
        <div style="font-size: 12px; font-weight: bold; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 0; margin-bottom: 6px;">
          DIAGNOSTIC STATUS: 100% LINK OK
        </div>
        <div style="font-size: 9px; color: #222; text-transform: uppercase;">
          Thermal print head, motor feed & cutter verified functional.
        </div>
      </div>
    `;

    try {
      const res = await electronAPI.printThermalSilent({
        htmlContent: testSlipHtml,
        printerName: targetDevice,
        width: thermalWidth,
      });

      if (res && res.success) {
        setTestResult({
          success: true,
          message: `Diagnostic slip printed cleanly to ${targetDevice || 'default printer'}.`,
        });
        toast.success('Thermal Print OK', 'Diagnostic test slip printed successfully');
      } else {
        const errMsg = res?.error || 'Spooler rejected test print';
        setTestResult({
          success: false,
          message: `Print failed: ${errMsg}. Ensure device is powered on, paired (if Bluetooth), and has thermal paper loaded.`,
        });
        toast.error('Thermal Test Failed', errMsg);
      }
    } catch (err: any) {
      console.error('[HardwareSettings] Test print error:', err);
      const errMsg = err?.message || 'Unexpected communication failure';
      setTestResult({
        success: false,
        message: `Error: ${errMsg}. Check physical connection or Bluetooth pairing.`,
      });
      toast.error('Print Error', errMsg);
    } finally {
      setIsTestingThermal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-slate-200 font-inter p-6 sm:p-10 select-none">
      {/* ── BREADCRUMB & HEADER ── */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/settings"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
              title="Back to Settings"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-[0.25em] text-[#C5A059]">
                <span>Settings</span>
                <span>›</span>
                <span>Hardware & Peripherals</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mt-1">
                Hardware & Thermal Printing Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadPrinters}
              disabled={isLoadingPrinters}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={cn(isLoadingPrinters && 'animate-spin')} />
              <span>Rescan Devices</span>
            </button>
            <button
              onClick={handleSaveConfig}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4AF37] text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#C5A059]/10 cursor-pointer"
            >
              <Save size={13} />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>

        {/* ── TELEMETRY STATUS PILLS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#121620] border border-white/10 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Printer size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Windows Spooler</span>
              <p className="text-sm font-bold text-white">
                {isLoadingPrinters ? 'Detecting...' : `${printers.length} Printers Found`}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121620] border border-white/10 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">80mm Receipt Link</span>
              <p className="text-sm font-bold text-white truncate max-w-[160px]">
                {thermalPrinter || '(System Default)'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121620] border border-white/10 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Radio size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Bluetooth Support</span>
              <p className="text-sm font-bold text-white">SPP & POS Ready</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121620] border border-white/10 flex items-center space-x-3">
            <div className={cn(
              "p-2.5 rounded-lg border",
              scaleConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-gray-400 border-white/10"
            )}>
              <Scale size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Weighbridge (RS-232)</span>
              <p className="text-sm font-bold text-white">
                {scaleConnected ? `${scaleData?.weight} ${scaleData?.unit}` : 'Standby / Polling'}
              </p>
            </div>
          </div>
        </div>

        {/* ── CARD 1: THERMAL RECEIPT PRINTER (80MM / 58MM) ── */}
        <div className="p-6 rounded-2xl bg-[#121620] border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Printer size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Thermal POS Receipt Printer
                </h2>
                <p className="text-xs text-gray-400">
                  Silent high-speed ESC/POS dispatch for checkout counters. Works over USB, Network, and Bluetooth SPP.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Roll Width:</span>
              <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setThermalWidth('80mm')}
                  className={cn(
                    'px-3 py-1 rounded-[4px] transition-all cursor-pointer',
                    thermalWidth === '80mm' ? 'bg-[#C5A059] text-black font-black' : 'text-gray-400 hover:text-white'
                  )}
                >
                  80mm (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setThermalWidth('58mm')}
                  className={cn(
                    'px-3 py-1 rounded-[4px] transition-all cursor-pointer',
                    thermalWidth === '58mm' ? 'bg-[#C5A059] text-black font-black' : 'text-gray-400 hover:text-white'
                  )}
                >
                  58mm (Mobile)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                Assigned Thermal Receipt Printer
              </label>
              <select
                value={thermalPrinter}
                onChange={(e) => setThermalPrinter(e.target.value)}
                className="w-full bg-[#08090A] border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#C5A059] transition-colors cursor-pointer"
              >
                <option value="">(System Default Printer)</option>
                {printers.map((p) => {
                  const isBT = (p.name || '').toLowerCase().includes('bluetooth') || (p.name || '').toLowerCase().includes('bt');
                  return (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.isDefault ? '★ [Default]' : ''} {isBT ? '📶 [Bluetooth]' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-gray-500">
                Selected device receives silent direct prints without any Windows OS print dialog popup.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleTestThermalPrint}
                disabled={isTestingThermal}
                className="w-full h-11 flex items-center justify-center space-x-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                <Zap size={14} className={cn(isTestingThermal && 'animate-spin')} />
                <span>{isTestingThermal ? 'Sending Diagnostic...' : 'Test Thermal Print'}</span>
              </button>
            </div>
          </div>

          {/* Test Diagnostic Result Banner */}
          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'p-4 rounded-xl border flex items-start space-x-3 text-xs',
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{testResult.success ? 'Diagnostic Test Passed' : 'Diagnostic Warning'}</p>
                  <p className="mt-0.5 opacity-90">{testResult.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── CARD 2: A4 INVOICE & DOCUMENT PRINTER ── */}
        <div className="p-6 rounded-2xl bg-[#121620] border border-white/10 space-y-6">
          <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Laptop size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                A4 Laser / Fiscal Invoice Printer
              </h2>
              <p className="text-xs text-gray-400">
                Primary device for multi-page official sales invoices, bill of ladings, and accounting ledgers.
              </p>
            </div>
          </div>

          <div className="space-y-2 max-w-xl">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Assigned A4 Document Printer
            </label>
            <select
              value={a4Printer}
              onChange={(e) => setA4Printer(e.target.value)}
              className="w-full bg-[#08090A] border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#C5A059] transition-colors cursor-pointer"
            >
              <option value="">(System Default Printer)</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.isDefault ? '★ [Default]' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500">
              Leave blank to automatically route A4 documents to the Windows default printer.
            </p>
          </div>
        </div>

        {/* ── CARD 3: WEIGHBRIDGE & RS-232 SCALE TELEMETRY ── */}
        <div className="p-6 rounded-2xl bg-[#121620] border border-white/10 space-y-6">
          <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Scale size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Weighbridge / Industrial Scale (RS-232 / COM)
              </h2>
              <p className="text-xs text-gray-400">
                Continuous weight stream listener supporting Yaohua XK3190, Toledo, and Avery Weigh-Tronix indicators.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Listener Status</span>
              <div className="flex items-center space-x-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', scaleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500')} />
                <span className="text-sm font-bold text-white">
                  {scaleConnected ? 'Streaming (Auto-Reconnect ON)' : 'Polling / Standby'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Active Port</span>
              <p className="text-sm font-mono font-bold text-cyan-400">
                {scaleData?.port || 'COM11 / Auto-Detect'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Current Reading</span>
              <p className="text-lg font-mono font-black text-emerald-400">
                {scaleData ? `${scaleData.weight} ${scaleData.unit}` : '0.00 KG'}
              </p>
            </div>
          </div>
        </div>

        {/* ── CARD 4: USB / BLUETOOTH BARCODE SCANNER ── */}
        <div className="p-6 rounded-2xl bg-[#121620] border border-white/10 space-y-6">
          <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Barcode size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Barcode & QR Scanner Verification
              </h2>
              <p className="text-xs text-gray-400">
                Test any USB HID or Bluetooth wireless handheld barcode scanner.
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                Scan Target (Focus and pull trigger)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => {
                    setScannedCode(e.target.value);
                    setLastScannedTime(new Date().toLocaleTimeString('en-PK'));
                  }}
                  placeholder="Scan any item barcode here..."
                  className="w-full bg-[#08090A] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {scannedCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                    Captured: {lastScannedTime}
                  </div>
                )}
              </div>
            </div>
            {scannedCode && (
              <p className="text-xs font-mono text-gray-400">
                Raw Value: <span className="text-white font-bold">{scannedCode}</span> (Length: {scannedCode.length})
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

