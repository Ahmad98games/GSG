"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Shirt, Droplets, Zap, 
  Banknote, Globe, Calendar, Plus, 
  TrendingUp, AlertCircle, CheckCircle2, 
  FileOutput, X, ChevronRight,
  Pill, Wheat, Scale, Ship, Landmark, Activity,
  PieChart, Box
} from "lucide-react";
import { Decimal } from "decimal.js";
import { usePersona } from "@/hooks/usePersona";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Types & Constants ---

type GarmentType = 'Shirt' | 'Trouser' | 'Jacket' | 'Custom';

const GARMENT_DEFAULTS: Record<GarmentType, { length: number; width: number; sleeve: number; wastage: number }> = {
  'Shirt':   { length: 75, width: 55, sleeve: 65, wastage: 8 },
  'Trouser': { length: 105, width: 60, sleeve: 0, wastage: 5 },
  'Jacket':  { length: 80, width: 65, sleeve: 70, wastage: 10 },
  'Custom':  { length: 0, width: 0, sleeve: 0, wastage: 5 }
};

// --- Page Component ---

export default function IndustrialCalculatorsPage() {
  const { getCalculators, fmt } = usePersona();
  const enabledCalculators = getCalculators();

  // Active drawer identifier
  const [activeCalcId, setActiveCalcId] = useState<string | null>(null);

  // --- Calculator States ---
  
  // 1. Fabric Consumption
  const [fabMode, setFabMode] = useState<'simple' | 'advanced'>('simple');
  const [fabType, setFabType] = useState<GarmentType>('Shirt');
  const [fabQty, setFabQty] = useState(1000);
  const [fabLen, setFabLen] = useState(GARMENT_DEFAULTS.Shirt.length);
  const [fabWid, setFabWid] = useState(GARMENT_DEFAULTS.Shirt.width);
  const [fabSlv, setFabSlv] = useState(GARMENT_DEFAULTS.Shirt.sleeve);
  const [fabFWid, setFabFWid] = useState(150);
  const [fabGsm, setFabGsm] = useState(180);
  const [fabWastage, setFabWastage] = useState(GARMENT_DEFAULTS.Shirt.wastage);
  const [fabCost, setFabCost] = useState(450);

  // 2. Process Loss Tracker
  const [wsMode, setWsMode] = useState<'simple' | 'advanced'>('simple');
  const [wsProcess, setWsProcess] = useState('Dyeing');
  const [wsInputQty, setWsInputQty] = useState(100);
  const [wsUnit, setWsUnit] = useState('meters');
  const [wsShrinkage, setWsShrinkage] = useState(4);
  const [wsActualQty, setWsActualQty] = useState(94);

  // 3. Machine OEE
  const [oeeMode, setOeeMode] = useState<'simple' | 'advanced'>('simple');
  const [oeeShiftHrs, setOeeShiftHrs] = useState(8);
  const [oeePlannedOff, setOeePlannedOff] = useState(0.5);
  const [oeeUnplannedOff, setOeeUnplannedOff] = useState(0.2);
  const [oeeCycleTime, setOeeCycleTime] = useState(0.5); // mins per unit
  const [oeeTotalProduced, setOeeTotalProduced] = useState(800);
  const [oeeRejected, setOeeRejected] = useState(12);

  // 4. Workforce Payroll (Piece Rate)
  const [prMode, setPrMode] = useState<'simple' | 'advanced'>('simple');
  const [prQtyA, setPrQtyA] = useState(450);
  const [prQtyB, setPrQtyB] = useState(40);
  const [prQtyC, setPrQtyC] = useState(10);
  const [prAdv, setPrAdv] = useState(2500);

  // 5. Export Costing (Export Profit)
  const [exMode, setExMode] = useState<'simple' | 'advanced'>('simple');
  const [exQty, setExQty] = useState(5000);
  const [exFob, setExFob] = useState(4.5);
  const [exFabCost, setExFabCost] = useState(1.8);
  const [exTrimsCost, setExTrimsCost] = useState(0.4);
  const [exLaborCost, setExLaborCost] = useState(0.6);
  const [exFreight, setExFreight] = useState(1200);

  // 6. Order Delivery Planner
  const [dpMode, setDpMode] = useState<'simple' | 'advanced'>('simple');
  const [dpQty, setDpQty] = useState(12000);
  const [dpDays, setDpDays] = useState(15);
  const [dpWorkers, setDpWorkers] = useState(25);
  const [dpAvgRate, setDpAvgRate] = useState(35);

  // 7. GSM Calculator
  const [gsmWeight, setGsmWeight] = useState(250); // grams
  const [gsmLength, setGsmLength] = useState(1); // meters
  const [gsmWidth, setGsmWidth] = useState(1.5); // meters

  // 8. Container Load Calculator
  const [clLength, setClLength] = useState(40); // cm
  const [clWidth, setClWidth] = useState(30);
  const [clHeight, setClHeight] = useState(40);
  const [clWeight, setClWeight] = useState(15); // kg
  const [clType, setClType] = useState('20ft');

  // 9. Margin / Markup Calculator
  const [mmCost, setMmCost] = useState(850);
  const [mmSale, setMmSale] = useState(1200);

  // 10. Batch Yield (Pharma)
  const [byMode, setByMode] = useState<'simple' | 'advanced'>('simple');
  const [byInput, setByInput] = useState(100); // kg
  const [byOutput, setByOutput] = useState(96); // kg

  // 11. Expiry Tracker (Pharma)
  const [etTotal, setEtTotal] = useState(5000);
  const [etExpired, setEtExpired] = useState(120);
  const [etNearExpiry, setEtNearExpiry] = useState(340);

  // 12. Milling Yield (Rice/Flour)
  const [myPaddy, setMyPaddy] = useState(1000); // kg
  const [myRice, setMyRice] = useState(620); // kg
  const [myBran, setMyBran] = useState(80); // kg
  const [myHusk, setMyHusk] = useState(200); // kg

  // 13. Weight Conversion
  const [wcValue, setWcValue] = useState(1000);
  const [wcUnit, setWcUnit] = useState('kg');

  // 14. EMI Calculator
  const [emiP, setEmiP] = useState(1000000);
  const [emiR, setEmiR] = useState(12);
  const [emiN, setEmiN] = useState(24);

  // --- Memoized Calculations ---

  // 1. Fabric Consumption Results
  const fabricResults = useMemo(() => {
    const bodyFabric = (fabLen * fabWid * 2) / 10000;
    const sleeveFabric = (fabSlv * 40 * 2) / 10000;
    const rawConsumption = bodyFabric + sleeveFabric;
    const withWastage = rawConsumption * (1 + fabWastage/100);
    const metersPerGarment = withWastage / (fabFWid/100);
    const totalMeters = new Decimal(metersPerGarment).times(fabQty).toDecimalPlaces(2);
    const totalCost = totalMeters.times(fabCost);
    const totalWeight = totalMeters.times(fabFWid/100).times(fabGsm).div(1000);

    return {
      metersPerGarment: metersPerGarment.toFixed(2),
      totalMeters: totalMeters.toString(),
      totalCost: totalCost.toString(),
      totalWeight: totalWeight.toFixed(1)
    };
  }, [fabQty, fabLen, fabWid, fabSlv, fabFWid, fabGsm, fabWastage, fabCost]);

  // 2. Process Loss Results
  const wastageResults = useMemo(() => {
    const expected = wsInputQty * (1 - wsShrinkage/100);
    const actualLossPct = ((wsInputQty - wsActualQty) / wsInputQty) * 100;
    const variance = ((wsActualQty - expected) / expected) * 100;
    const diff = wsActualQty - expected;

    let status: 'NORMAL' | 'WATCH' | 'INVESTIGATE' = 'NORMAL';
    if (variance < -2 && variance >= -5) status = 'WATCH';
    if (variance < -5) status = 'INVESTIGATE';

    return { expected, actualLossPct, variance, diff, status };
  }, [wsInputQty, wsShrinkage, wsActualQty]);

  // 3. OEE Machine Results
  const oeeResults = useMemo(() => {
    const plannedProdTime = oeeShiftHrs - oeePlannedOff;
    const actualRunTime = plannedProdTime - oeeUnplannedOff;
    const availability = (actualRunTime / plannedProdTime) * 100;
    const idealOutput = (actualRunTime * 60) / oeeCycleTime;
    const performance = (oeeTotalProduced / idealOutput) * 100;
    const quality = ((oeeTotalProduced - oeeRejected) / oeeTotalProduced) * 100;
    const oee = (availability * performance * quality) / 10000;

    return { 
      availability, performance, quality, oee,
      biggestLoss: availability < performance && availability < quality ? 'Availability' : performance < quality ? 'Performance' : 'Quality'
    };
  }, [oeeShiftHrs, oeePlannedOff, oeeUnplannedOff, oeeCycleTime, oeeTotalProduced, oeeRejected]);

  // 4. Workforce Payroll (Piece Rate) Results
  const prRates = useMemo(() => ({ A: 45, B: 40, C: 35 }), []);
  const pieceRateResults = useMemo(() => {
    const valA = prQtyA * prRates.A;
    const valB = prQtyB * prRates.B;
    const valC = prQtyC * prRates.C;
    const subtotal = valA + valB + valC;
    const net = subtotal - prAdv - 150; // 150 for EOBI mock
    return { valA, valB, valC, subtotal, net };
  }, [prQtyA, prQtyB, prQtyC, prAdv, prRates]);

  // 5. Export Costing Results
  const exRate = 278; // Mock USD to PKR
  const exportCostingResults = useMemo(() => {
    const overhead = 0.3;
    const unitProdCost = exFabCost + exTrimsCost + exLaborCost + overhead;
    const totalProdCost = unitProdCost * exQty;
    const revenue = exFob * exQty;
    const expExp = (exFreight) + (revenue * 0.02); // Mock 2% for bank/port
    const totalExp = totalProdCost + expExp;
    const profit = revenue - totalExp;
    const profitPerPiece = profit / exQty;
    const margin = (profit / revenue) * 100;

    return { revenue, totalExp, profit, profitPerPiece, margin, pkrEquiv: profit * exRate };
  }, [exQty, exFob, exFabCost, exTrimsCost, exLaborCost, exFreight]);

  // 6. Delivery Planner Results
  const deliveryPlannerResults = useMemo(() => {
    const reqDaily = dpQty / dpDays;
    const currentCap = dpWorkers * dpAvgRate;
    const feasibility = currentCap / reqDaily;
    
    let status: 'SUCCESS' | 'WARNING' | 'DANGER' = 'SUCCESS';
    if (feasibility < 1) status = 'WARNING';
    if (feasibility < 0.8) status = 'DANGER';

    return { reqDaily, currentCap, feasibility, status };
  }, [dpQty, dpDays, dpWorkers, dpAvgRate]);

  // 7. GSM Results
  const gsmResult = useMemo(() => {
    return (gsmLength > 0 && gsmWidth > 0) ? (gsmWeight / (gsmLength * gsmWidth)).toFixed(2) : '0';
  }, [gsmWeight, gsmLength, gsmWidth]);

  // 8. Container Load Results
  const clResults = useMemo(() => {
    const vols: Record<string, number> = { '20ft': 33200000, '40ft': 67700000, '40ft HC': 76400000 };
    const wts: Record<string, number> = { '20ft': 21700, '40ft': 26480, '40ft HC': 26500 };
    const boxVol = clLength * clWidth * clHeight;
    const boxesByVol = boxVol > 0 ? Math.floor((vols[clType] || 0) / boxVol) : 0;
    const boxesByWt = clWeight > 0 ? Math.floor((wts[clType] || 0) / clWeight) : 0;
    const finalBoxes = Math.min(boxesByVol, boxesByWt);
    const utilization = vols[clType] > 0 ? ((finalBoxes * boxVol) / vols[clType]) * 100 : 0;
    return { finalBoxes, boxesByVol, boxesByWt, utilization };
  }, [clLength, clWidth, clHeight, clWeight, clType]);

  // 9. Margin/Markup Results
  const mmResults = useMemo(() => {
    const profit = mmSale - mmCost;
    const margin = mmSale > 0 ? (profit / mmSale) * 100 : 0;
    const markup = mmCost > 0 ? (profit / mmCost) * 100 : 0;
    return { profit, margin, markup };
  }, [mmCost, mmSale]);

  // 10. Batch Yield Results
  const byResults = useMemo(() => {
    const yieldPct = byInput > 0 ? (byOutput / byInput) * 100 : 0;
    const loss = byInput - byOutput;
    return { yieldPct, loss };
  }, [byInput, byOutput]);

  // 11. Expiry Tracker Results
  const etResults = useMemo(() => {
    const safe = etTotal - etExpired - etNearExpiry;
    const expiredPct = etTotal > 0 ? (etExpired / etTotal) * 100 : 0;
    const riskPct = etTotal > 0 ? (etNearExpiry / etTotal) * 100 : 0;
    return { safe, expiredPct, riskPct };
  }, [etTotal, etExpired, etNearExpiry]);

  // 12. Milling Yield Results
  const myResults = useMemo(() => {
    const totalOut = myRice + myBran + myHusk;
    const loss = myPaddy - totalOut;
    const headRicePct = myPaddy > 0 ? (myRice / myPaddy) * 100 : 0;
    return { loss, headRicePct };
  }, [myPaddy, myRice, myBran, myHusk]);

  // 13. Weight Conversion Results
  const wcResults = useMemo(() => {
    const factors: Record<string, number> = { kg: 1000, ton: 1000000, lb: 453.592, maund: 37324.2 };
    const baseGrams = wcValue * (factors[wcUnit] || 1000);
    return {
      kg: baseGrams / 1000,
      ton: baseGrams / 1000000,
      lb: baseGrams / 453.592,
      maund: baseGrams / 37324.2
    };
  }, [wcValue, wcUnit]);

  // 14. EMI Results
  const emiResults = useMemo(() => {
    const p = new Decimal(emiP || 0);
    const r = new Decimal(emiR || 0).div(1200);
    const n = new Decimal(emiN || 1).toNumber();
    let emi = new Decimal(0);
    if (!r.isZero() && n > 0) {
      const pow = r.plus(1).pow(n);
      emi = p.mul(r).mul(pow).div(pow.minus(1));
    } else if (n > 0) {
      emi = p.div(n);
    }
    const totalPay = emi.mul(n);
    return { emi: emi.toNumber(), totalInterest: totalPay.minus(p).toNumber() };
  }, [emiP, emiR, emiN]);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-200 p-6 transition-all duration-300">
      <main className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-white">Industrial Calculators</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
              Specialized tools for manufacturing operations
            </p>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-gray-400 tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 w-fit">
            <Calculator size={12} className="text-amber-500" />
            <span>Operational Excellence Suite</span>
          </div>
        </div>

        {/* Global Overview Grid Layer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enabledCalculators.map(id => {
            
            // 1. Fabric Consumption
            if (id === 'fabric_consumption') {
              return (
                <CalculatorCard
                  key={id}
                  title="Fabric Consumption"
                  sub="Find out how much fabric and cost for your order"
                  icon={Shirt}
                  mainKpi={`Rs. ${parseFloat(fabricResults.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  secondaryMetric={`Total Needed: ${fabricResults.totalMeters} m`}
                  onClick={() => setActiveCalcId(id)}
                  themeColor="blue"
                />
              );
            }
            
            // 2. Process Loss Tracker
            if (id === 'wastage_shrinkage') {
              return (
                <CalculatorCard
                  key={id}
                  title="Process Loss Tracker"
                  sub="Wastage & Shrinkage Tracker"
                  icon={Droplets}
                  mainKpi={`${wastageResults.variance > 0 ? '+' : ''}${wastageResults.variance.toFixed(1)}%`}
                  secondaryMetric={`Stage: ${wsProcess}`}
                  onClick={() => setActiveCalcId(id)}
                  themeColor="red"
                  badgeText="Variance"
                  badgeBg={
                    wastageResults.status === 'NORMAL' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                    wastageResults.status === 'WATCH' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                    "bg-red-500/10 text-red-500 border border-red-500/20"
                  }
                />
              );
            }

            // 3. Machine OEE Monitor
            if (id === 'oee_tracker') {
              return (
                <CalculatorCard
                  key={id}
                  title="Machine OEE Monitor"
                  sub="Monitor how effectively your machines are running"
                  icon={Zap}
                  mainKpi={`${oeeResults.oee.toFixed(1)}%`}
                  secondaryMetric="Status: Optimal"
                  onClick={() => setActiveCalcId(id)}
                  themeColor="emerald"
                  badgeText={oeeResults.oee >= 85 ? "World Class" : oeeResults.oee >= 65 ? "Standard" : "Needs Review"}
                  badgeBg={
                    oeeResults.oee >= 85 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                    oeeResults.oee >= 65 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                    "bg-red-500/10 text-red-500 border border-red-500/20"
                  }
                />
              );
            }

            // 4. Workforce Payroll
            if (id === 'piece_rate') {
              return (
                <CalculatorCard
                  key={id}
                  title="Workforce Payroll"
                  sub="Calculate piece-rate earnings for your workers"
                  icon={Banknote}
                  mainKpi={fmt(pieceRateResults.net)}
                  secondaryMetric="Net Payable Earnings"
                  onClick={() => setActiveCalcId(id)}
                  themeColor="amber"
                />
              );
            }

            // 5. Export Profit
            if (id === 'export_costing') {
              return (
                <CalculatorCard
                  key={id}
                  title="Export Profit"
                  sub="Calculate true profit and margins for export orders"
                  icon={Globe}
                  mainKpi={`$${exportCostingResults.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  secondaryMetric={`Profit Margin: ${exportCostingResults.margin.toFixed(1)}%`}
                  onClick={() => setActiveCalcId(id)}
                  themeColor="emerald"
                />
              );
            }

            // 6. Delivery Plan
            if (id === 'delivery_planner') {
              return (
                <CalculatorCard
                  key={id}
                  title="Delivery Plan"
                  sub="Check if you can meet your production deadline"
                  icon={Calendar}
                  mainKpi={deliveryPlannerResults.status === 'SUCCESS' ? "Safe Delivery ✓" : deliveryPlannerResults.status === 'WARNING' ? "Needs Overtime" : "At Risk ⚠"}
                  secondaryMetric={`Required/Day: ${deliveryPlannerResults.reqDaily.toFixed(0)} pcs`}
                  onClick={() => setActiveCalcId(id)}
                  themeColor="blue"
                />
              );
            }

            // 7. GSM Calculator
            if (id === 'gsm_calculator') {
              return (
                <CalculatorCard
                  key={id}
                  title="GSM Calculator"
                  sub="Grams per Square Meter"
                  icon={Activity}
                  mainKpi={gsmResult}
                  secondaryMetric="Fabric Weight (GSM)"
                  onClick={() => setActiveCalcId(id)}
                  themeColor="blue"
                />
              );
            }

            // 8. Container Load Calculator
            if (id === 'container_load') {
              return (
                <CalculatorCard
                  key={id}
                  title="Container Load"
                  sub="Calculate shipping capacity"
                  icon={Ship}
                  mainKpi={clResults.finalBoxes.toLocaleString()}
                  secondaryMetric={`Boxes (${clType})`}
                  onClick={() => setActiveCalcId(id)}
                  themeColor="amber"
                  badgeText={`${clResults.utilization.toFixed(1)}%`}
                  badgeBg="bg-amber-500/10 text-amber-500 border border-amber-500/20"
                />
              );
            }

            // 9. Margin / Markup Calculator
            if (id === 'margin_markup') {
              return (
                <CalculatorCard
                  key={id}
                  title="Margin / Markup"
                  sub="Profitability analysis"
                  icon={TrendingUp}
                  mainKpi={`${mmResults.margin.toFixed(1)}%`}
                  secondaryMetric={`Profit: ${mmResults.profit.toLocaleString()}`}
                  onClick={() => setActiveCalcId(id)}
                  themeColor="emerald"
                />
              );
            }

            // 10. Batch Yield (Pharma)
            if (id === 'batch_yield') {
              return (
                <CalculatorCard
                  key={id}
                  title="Batch Yield"
                  sub="Track manufacturing efficiency"
                  icon={PieChart}
                  mainKpi={`${byResults.yieldPct.toFixed(1)}%`}
                  secondaryMetric={`Loss: ${byResults.loss} kg`}
                  onClick={() => setActiveCalcId(id)}
                  themeColor="blue"
                />
              );
            }

            // 11. Expiry Tracker (Pharma/Food)
            if (id === 'expiry_tracker') {
              return (
                <CalculatorCard
                  key={id}
                  title="Expiry Tracker"
                  sub="Monitor shelf life and risk"
                  icon={Pill}
                  mainKpi={`${etResults.expiredPct.toFixed(1)}%`}
                  secondaryMetric="Expired Stock"
                  onClick={() => setActiveCalcId(id)}
                  themeColor="red"
                  badgeText="High Risk"
                  badgeBg={
                    etResults.expiredPct > 5 ? "bg-red-500/10 text-red-500 border border-red-500/20" : 
                    "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  }
                />
              );
            }

            // 12. Milling Yield (Rice/Flour)
            if (id === 'milling_yield') {
              return (
                <CalculatorCard
                  key={id}
                  title="Milling Yield"
                  sub="Track paddy to rice conversion"
                  icon={Wheat}
                  mainKpi={`${myResults.headRicePct.toFixed(1)}%`}
                  secondaryMetric="Head Rice Yield"
                  onClick={() => setActiveCalcId(id)}
                  themeColor="amber"
                />
              );
            }

            // 13. Weight Conversion
            if (id === 'weight_conversion') {
              return (
                <CalculatorCard
                  key={id}
                  title="Weight Converter"
                  sub="Industrial unit scaling"
                  icon={Scale}
                  mainKpi={wcValue.toString()}
                  secondaryMetric={`Total ${wcUnit.toUpperCase()}`}
                  onClick={() => setActiveCalcId(id)}
                  themeColor="blue"
                />
              );
            }

            // 14. EMI Calculator
            if (id === 'emi') {
              return (
                <CalculatorCard
                  key={id}
                  title="Financing & EMI"
                  sub="Loan payment schedule"
                  icon={Landmark}
                  mainKpi={fmt(emiResults.emi)}
                  secondaryMetric="Monthly Payment"
                  onClick={() => setActiveCalcId(id)}
                  themeColor="blue"
                />
              );
            }

            return null;
          })}

          {enabledCalculators.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30 italic">
               <Calculator size={60} strokeWidth={0.5} />
               <p className="mt-4 uppercase tracking-[0.2em] text-[10px]">No industry-specific calculators found</p>
            </div>
          )}
        </div>

        {/* --- Drawer Rendering System --- */}
        <AnimatePresence>
          
          {/* 1. Fabric Consumption Drawer */}
          {activeCalcId === 'fabric_consumption' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'fabric_consumption'}
              onClose={() => setActiveCalcId(null)}
              title="Fabric Consumption"
              sub="Find out how much fabric and cost for your order"
              icon={Shirt}
              actionButton={
                <Link 
                  href={`/purchase/new?item=${fabType} Fabric&qty=${fabricResults.totalMeters}&cost=${fabricResults.totalCost}`}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Plus size={18} />
                  <span>Create Purchase Order</span>
                </Link>
              }
            >
              <div className="flex bg-black/45 p-1 rounded-lg border border-white/5 w-fit ml-auto">
                {(['simple', 'advanced'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFabMode(m)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                      fabMode === m ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dynamic Closed Drawer Metric Displays */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Fabric Needed</p>
                  <p className="text-2xl font-mono font-black text-white">{fabricResults.totalMeters} <span className="text-xs text-gray-500">m</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">Estimated Fabric Cost</p>
                  <p className="text-2xl font-mono font-black text-white">{fmt(fabricResults.totalCost)}</p>
                </div>
              </div>

              {/* Advanced Calculation Inputs */}
              <div className="space-y-4 pt-2">
                <CalcInput 
                  label="What are you making?" 
                  type="select" 
                  value={fabType} 
                  onChange={(val) => {
                    setFabType(val);
                    const d = GARMENT_DEFAULTS[val as GarmentType];
                    setFabLen(d.length);
                    setFabWid(d.width);
                    setFabSlv(d.sleeve);
                    setFabWastage(d.wastage);
                  }} 
                  options={['Shirt', 'Trouser', 'Jacket', 'Custom']} 
                  themeColor="blue"
                />
                
                <CalcInput 
                  label="How many pieces?" 
                  type="number" 
                  value={fabQty} 
                  onChange={setFabQty} 
                  helper="Number of garments in this order"
                  themeColor="blue"
                />

                <CalcInput 
                  label="Fabric cost per meter" 
                  type="number" 
                  value={fabCost} 
                  onChange={setFabCost} 
                  helper="Current price from supplier"
                  themeColor="blue"
                />

                {fabMode === 'advanced' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
                    <CalcInput label="Length (cm)" value={fabLen} onChange={setFabLen} helper="Typical: 75cm" themeColor="blue" />
                    <CalcInput label="Width (cm)" value={fabWid} onChange={setFabWid} helper="Typical: 55cm" themeColor="blue" />
                    <CalcInput label="Sleeve length (cm)" value={fabSlv} onChange={setFabSlv} helper="Typical: 65cm" themeColor="blue" />
                    <CalcInput label="Fabric Width (cm)" value={fabFWid} onChange={setFabFWid} helper="Standard: 150cm" themeColor="blue" />
                    <CalcInput label="Fabric weight (GSM)" value={fabGsm} onChange={setFabGsm} helper="Range: 140 - 240" themeColor="blue" />
                    <CalcInput label="Expected wastage %" value={fabWastage} onChange={setFabWastage} helper="Standard: 8%" themeColor="blue" />
                  </div>
                )}
              </div>
            </CalculatorDrawer>
          )}

          {/* 2. Process Loss Drawer */}
          {activeCalcId === 'wastage_shrinkage' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'wastage_shrinkage'}
              onClose={() => setActiveCalcId(null)}
              title="Process Loss"
              sub="Wastage & Shrinkage Tracker"
              icon={Droplets}
              actionButton={
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-xl flex items-center justify-center space-x-3 transition-all">
                  <FileOutput size={16} />
                  <span>Log Audit Finding</span>
                </button>
              }
            >
              <div className="flex bg-black/45 p-1 rounded-lg border border-white/5 w-fit ml-auto">
                {(['simple', 'advanced'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setWsMode(m)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                      wsMode === m ? "bg-red-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dynamic Metric Display */}
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Expected Output</p>
                  <p className="text-2xl font-mono font-black text-white">{wastageResults.expected.toFixed(1)} <span className="text-xs text-gray-600">{wsUnit}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Production Variance</p>
                  <p className={cn(
                    "text-2xl font-mono font-black",
                    wastageResults.status === 'NORMAL' ? "text-emerald-500" : 
                    wastageResults.status === 'WATCH' ? "text-amber-500" : 
                    "text-red-500"
                  )}>
                    {wastageResults.variance > 0 ? '+' : ''}{wastageResults.variance.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Advanced Calculation Inputs */}
              <div className="space-y-4 pt-2">
                <CalcInput 
                  label="What process is this?" 
                  type="select" 
                  value={wsProcess} 
                  onChange={(val) => {
                    setWsProcess(val);
                    if (val === 'Dyeing') setWsShrinkage(4);
                    else if (val === 'Washing') setWsShrinkage(6.5);
                    else if (val === 'Printing') setWsShrinkage(2);
                    else if (val === 'Cutting') setWsShrinkage(12);
                  }} 
                  options={['Dyeing', 'Washing', 'Printing', 'Cutting', 'Custom']} 
                  themeColor="red"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <CalcInput label="How much started?" type="number" value={wsInputQty} onChange={setWsInputQty} helper={`Total ${wsUnit}`} themeColor="red" />
                  <CalcInput label="How much got back?" type="number" value={wsActualQty} onChange={setWsActualQty} helper={`Finished ${wsUnit}`} themeColor="red" />
                </div>

                {wsMode === 'advanced' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
                    <CalcInput label="Unit of Measurement" type="select" value={wsUnit} onChange={setWsUnit} options={['meters', 'kg', 'pieces']} themeColor="red" />
                    <CalcInput label="Std Shrinkage %" type="number" value={wsShrinkage} onChange={setWsShrinkage} helper="Estimated loss" themeColor="red" />
                  </div>
                )}

                {wastageResults.status === 'INVESTIGATE' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Protocol Red Alert</p>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                        High variance detected. Expected {wastageResults.expected.toFixed(1)} {wsUnit}, received {wsActualQty} {wsUnit}. Loss of {Math.abs(wastageResults.diff).toFixed(1)} {wsUnit} exceeds normal tolerance.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CalculatorDrawer>
          )}

          {/* 3. Machine OEE Drawer */}
          {activeCalcId === 'oee_tracker' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'oee_tracker'}
              onClose={() => setActiveCalcId(null)}
              title="Machine OEE"
              sub="Monitor how effectively your machines are running"
              icon={Zap}
              actionButton={
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <p className="text-[10px] text-gray-500 font-medium italic">
                    Optimization Tip: Biggest loss is <span className="text-white font-bold">{oeeResults.biggestLoss}</span>. Focus on reducing {oeeResults.biggestLoss === 'Availability' ? 'breakdown time' : oeeResults.biggestLoss === 'Performance' ? 'cycle variance' : 'defect rates'}.
                  </p>
                </div>
              }
            >
              <div className="flex bg-black/45 p-1 rounded-lg border border-white/5 w-fit ml-auto">
                {(['simple', 'advanced'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setOeeMode(m)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                      oeeMode === m ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dynamic OEE Metric displays */}
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">OEE Efficiency Score</p>
                  <p className={cn(
                    "text-3xl font-mono font-black tabular-nums",
                    oeeResults.oee >= 85 ? "text-emerald-500" : oeeResults.oee >= 65 ? "text-amber-500" : "text-red-500"
                  )}>
                    {oeeResults.oee.toFixed(1)}%
                  </p>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                  oeeResults.oee >= 85 ? "bg-emerald-500/10 text-emerald-500" : oeeResults.oee >= 65 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                )}>
                  {oeeResults.oee >= 85 ? "World Class" : oeeResults.oee >= 65 ? "Standard" : "Needs Review"}
                </div>
              </div>

              {/* Active inputs and dynamic bars */}
              <div className="space-y-4 pt-2">
                <CalcInput label="Total production today" type="number" value={oeeTotalProduced} onChange={setOeeTotalProduced} helper="Total pieces produced by machine" themeColor="emerald" />
                <CalcInput label="Rejected / Defective pieces" type="number" value={oeeRejected} onChange={setOeeRejected} helper="Pieces that failed quality check" themeColor="emerald" />
                
                {oeeMode === 'advanced' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
                    <CalcInput label="Shift Duration (Hrs)" value={oeeShiftHrs} onChange={setOeeShiftHrs} helper="Planned work hours" themeColor="emerald" />
                    <CalcInput label="Total Break Time (Hrs)" value={oeePlannedOff} onChange={setOeePlannedOff} helper="Lunches, breaks, etc." themeColor="emerald" />
                    <CalcInput label="Breakdown Time (Hrs)" value={oeeUnplannedOff} onChange={setOeeUnplannedOff} helper="Total downtime for repairs" themeColor="emerald" />
                    <CalcInput label="Target Time (min/pc)" value={oeeCycleTime} onChange={setOeeCycleTime} helper="Ideal production speed" themeColor="emerald" />
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <MetricBar label="Availability" value={oeeResults.availability} color="blue" />
                  <MetricBar label="Performance" value={oeeResults.performance} color="amber" />
                  <MetricBar label="Quality" value={oeeResults.quality} color="emerald" />
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 4. Workforce Payroll Drawer */}
          {activeCalcId === 'piece_rate' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'piece_rate'}
              onClose={() => setActiveCalcId(null)}
              title="Workforce Payroll"
              sub="Calculate piece-rate earnings for your workers"
              icon={Banknote}
              actionButton={
                <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-emerald-600/20">
                  <CheckCircle2 size={16} />
                  <span>Mark as Paid</span>
                </button>
              }
            >
              <div className="flex bg-black/45 p-1 rounded-lg border border-white/5 w-fit ml-auto">
                {(['simple', 'advanced'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPrMode(m)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                      prMode === m ? "bg-amber-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dynamic Payroll metric Displays */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Net Payable Earnings</p>
                  <p className="text-3xl font-mono font-black text-[#C5A059]">{fmt(pieceRateResults.net)}</p>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4 pt-2">
                <CalcInput label="Total Grade A pieces" type="number" value={prQtyA} onChange={setPrQtyA} helper="Highest quality production" themeColor="amber" />
                <CalcInput label="Loan / Advance recovery" type="number" value={prAdv} onChange={setPrAdv} helper="Deduct from this pay cycle" themeColor="amber" />
                
                {prMode === 'advanced' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
                    <CalcInput label="Grade B pieces" value={prQtyB} onChange={setPrQtyB} helper="Minor repairs needed" themeColor="amber" />
                    <CalcInput label="Grade C pieces" value={prQtyC} onChange={setPrQtyC} helper="Significant rework needed" themeColor="amber" />
                  </div>
                )}

                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-gray-500 font-bold uppercase tracking-widest">Gross Earnings</span>
                    <span className="text-white font-mono">{fmt(pieceRateResults.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-gray-500 font-bold uppercase tracking-widest">Deductions</span>
                    <span className="text-red-500 font-mono">-{fmt(prAdv + 150)}</span>
                  </div>
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 5. Export Costing Drawer */}
          {activeCalcId === 'export_costing' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'export_costing'}
              onClose={() => setActiveCalcId(null)}
              title="Export Profit"
              sub="Calculate true profit and margins for export orders"
              icon={Globe}
            >
              <div className="flex bg-black/45 p-1 rounded-lg border border-white/5 w-fit ml-auto">
                {(['simple', 'advanced'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setExMode(m)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                      exMode === m ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dynamic metric displays */}
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Net Profit (USD)</p>
                  <p className="text-2xl font-mono font-black text-white">${exportCostingResults.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Profit Margin</p>
                  <p className={cn(
                    "text-2xl font-mono font-black",
                    exportCostingResults.margin > 15 ? "text-emerald-500" : exportCostingResults.margin > 5 ? "text-amber-500" : "text-red-500"
                  )}>
                    {exportCostingResults.margin.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4 pt-2">
                <CalcInput label="Total order quantity" type="number" value={exQty} onChange={setExQty} helper="Total pieces in the shipment" themeColor="emerald" />
                <CalcInput label="FOB Sale Price (USD)" type="number" value={exFob} onChange={setExFob} helper="Price per piece in Dollars" themeColor="emerald" />
                
                {exMode === 'advanced' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
                    <CalcInput label="Fabric Cost/Pc" value={exFabCost} onChange={setExFabCost} helper="Material cost" themeColor="emerald" />
                    <CalcInput label="Labor Cost/Pc" value={exLaborCost} onChange={setExLaborCost} helper="Stitching cost" themeColor="emerald" />
                    <CalcInput label="Trims Cost/Pc" value={exTrimsCost} onChange={setExTrimsCost} helper="Buttons, thread, labels" themeColor="emerald" />
                    <CalcInput label="Freight Charges" value={exFreight} onChange={setExFreight} helper="Shipping total (USD)" themeColor="emerald" />
                  </div>
                )}

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-1">Local Profit (PKR)</p>
                  <p className="text-3xl font-mono font-black text-white">{fmt(exportCostingResults.pkrEquiv.toString())}</p>
                  <p className="text-[9px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Ex. Rate: 1 USD = {exRate} PKR</p>
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 6. Order Delivery Planner Drawer */}
          {activeCalcId === 'delivery_planner' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'delivery_planner'}
              onClose={() => setActiveCalcId(null)}
              title="Delivery Plan"
              sub="Check if you can meet your production deadline"
              icon={Calendar}
              actionButton={
                <button className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center space-x-3 shadow-xl">
                  <TrendingUp size={18} />
                  <span>Set Production Target</span>
                </button>
              }
            >
              <div className="flex bg-black/45 p-1 rounded-lg border border-white/5 w-fit ml-auto">
                {(['simple', 'advanced'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDpMode(m)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                      dpMode === m ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dynamic metric displays */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Delivery Feasibility</p>
                  <p className={cn(
                    "text-2xl font-black uppercase tracking-tight",
                    deliveryPlannerResults.status === 'SUCCESS' ? "text-emerald-500" : deliveryPlannerResults.status === 'WARNING' ? "text-amber-500" : "text-red-500"
                  )}>
                    {deliveryPlannerResults.status === 'SUCCESS' ? "Safe Delivery ✓" : deliveryPlannerResults.status === 'WARNING' ? "Needs Overtime" : "At Risk ⚠"}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Required/Day</p>
                  <p className="text-2xl font-mono font-bold text-white">{deliveryPlannerResults.reqDaily.toFixed(0)} <span className="text-xs text-gray-600">pcs</span></p>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4 pt-2">
                <CalcInput label="Total order quantity" type="number" value={dpQty} onChange={setDpQty} helper="Total pieces to be delivered" themeColor="blue" />
                <CalcInput label="How many days left?" type="number" value={dpDays} onChange={setDpDays} helper="Working days remaining" themeColor="blue" />
                
                {dpMode === 'advanced' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
                    <CalcInput label="Active Workers" value={dpWorkers} onChange={setDpWorkers} helper="Total stitching staff" themeColor="blue" />
                    <CalcInput label="Pcs / Worker / Day" value={dpAvgRate} onChange={setDpAvgRate} helper="Average daily output" themeColor="blue" />
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-gray-500">
                    <span>Capacity Utilization</span>
                    <span>{Math.round(100 / deliveryPlannerResults.feasibility)}%</span>
                  </div>
                  <div className="h-4 bg-black/40 border border-white/5 rounded-full overflow-hidden flex p-1">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min(deliveryPlannerResults.feasibility * 100, 100)}%` }}
                       className={cn(
                         "h-full rounded-full transition-colors shadow-lg",
                         deliveryPlannerResults.status === 'SUCCESS' ? "bg-emerald-500 shadow-emerald-500/20" : 
                         deliveryPlannerResults.status === 'WARNING' ? "bg-amber-500 shadow-amber-500/20" : 
                         "bg-red-500 shadow-red-500/20"
                       )}
                     />
                  </div>
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 7. GSM Drawer */}
          {activeCalcId === 'gsm_calculator' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'gsm_calculator'}
              onClose={() => setActiveCalcId(null)}
              title="GSM Calculator"
              sub="Grams per Square Meter"
              icon={Activity}
            >
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Calculated GSM</p>
                <p className="text-3xl font-mono font-black text-white">{gsmResult}</p>
              </div>
              <div className="space-y-4 pt-2">
                <CalcInput label="Weight (grams)" value={gsmWeight} onChange={setGsmWeight} themeColor="blue" />
                <CalcInput label="Length (meters)" value={gsmLength} onChange={setGsmLength} themeColor="blue" />
                <CalcInput label="Width (meters)" value={gsmWidth} onChange={setGsmWidth} themeColor="blue" />
              </div>
            </CalculatorDrawer>
          )}

          {/* 8. Container Load Drawer */}
          {activeCalcId === 'container_load' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'container_load'}
              onClose={() => setActiveCalcId(null)}
              title="Container Load"
              sub="Calculate shipping capacity"
              icon={Ship}
            >
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Max Boxes</p>
                  <p className="text-3xl font-mono font-black text-[#C5A059]">{clResults.finalBoxes.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Utilization</p>
                  <p className="text-2xl font-mono font-black text-amber-500">{clResults.utilization.toFixed(1)}%</p>
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <CalcInput label="Container Type" type="select" value={clType} onChange={setClType} options={['20ft', '40ft', '40ft HC']} themeColor="amber" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <CalcInput label="Box Length (cm)" value={clLength} onChange={setClLength} themeColor="amber" />
                  <CalcInput label="Box Width (cm)" value={clWidth} onChange={setClWidth} themeColor="amber" />
                  <CalcInput label="Box Height (cm)" value={clHeight} onChange={setClHeight} themeColor="amber" />
                  <CalcInput label="Box Weight (kg)" value={clWeight} onChange={setClWeight} themeColor="amber" />
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2 mt-4">
                  <div className="flex justify-between text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                    <span>Limit by Volume</span><span className="text-white font-mono">{clResults.boxesByVol.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                    <span>Limit by Weight</span><span className="text-white font-mono">{clResults.boxesByWt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 9. Margin / Markup Drawer */}
          {activeCalcId === 'margin_markup' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'margin_markup'}
              onClose={() => setActiveCalcId(null)}
              title="Margin / Markup"
              sub="Profitability analysis"
              icon={TrendingUp}
            >
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gross Profit</p>
                  <p className="text-2xl font-mono font-black text-white">{mmResults.profit.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Margin</p>
                  <p className="text-2xl font-mono font-black text-emerald-500">{mmResults.margin.toFixed(1)}%</p>
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <CalcInput label="Cost Price" value={mmCost} onChange={setMmCost} themeColor="emerald" />
                <CalcInput label="Sale Price" value={mmSale} onChange={setMmSale} themeColor="emerald" />
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex justify-between mt-4">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Markup</span>
                  <span className="text-lg font-mono font-black text-white">{mmResults.markup.toFixed(1)}%</span>
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 10. Batch Yield Drawer */}
          {activeCalcId === 'batch_yield' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'batch_yield'}
              onClose={() => setActiveCalcId(null)}
              title="Batch Yield"
              sub="Track manufacturing efficiency"
              icon={PieChart}
            >
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Yield %</p>
                  <p className="text-3xl font-mono font-black text-blue-500">{byResults.yieldPct.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Material Loss</p>
                  <p className="text-2xl font-mono font-black text-amber-500">{byResults.loss.toFixed(1)} <span className="text-xs text-gray-600">kg</span></p>
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <CalcInput label="Input Raw Material (kg)" value={byInput} onChange={setByInput} themeColor="blue" />
                <CalcInput label="Output Finished Goods (kg)" value={byOutput} onChange={setByOutput} themeColor="blue" />
              </div>
            </CalculatorDrawer>
          )}

          {/* 11. Expiry Tracker Drawer */}
          {activeCalcId === 'expiry_tracker' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'expiry_tracker'}
              onClose={() => setActiveCalcId(null)}
              title="Expiry Tracker"
              sub="Monitor shelf life and risk"
              icon={Pill}
            >
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Risk Assessment</p>
                <div className="h-4 flex rounded-full overflow-hidden border border-white/10">
                  <div style={{width: `${100 - etResults.expiredPct - etResults.riskPct}%`}} className="bg-emerald-500 h-full" />
                  <div style={{width: `${etResults.riskPct}%`}} className="bg-amber-500 h-full" />
                  <div style={{width: `${etResults.expiredPct}%`}} className="bg-red-500 h-full" />
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <CalcInput label="Total Stock Units" value={etTotal} onChange={setEtTotal} themeColor="red" />
                <CalcInput label="Near Expiry (Within 3 months)" value={etNearExpiry} onChange={setEtNearExpiry} themeColor="amber" />
                <CalcInput label="Fully Expired" value={etExpired} onChange={setEtExpired} themeColor="red" />
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-center">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Safe</p>
                    <p className="text-emerald-500 font-mono font-bold">{etResults.safe}</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-center">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Risk</p>
                    <p className="text-amber-500 font-mono font-bold">{etResults.riskPct.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-center">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Dead</p>
                    <p className="text-red-500 font-mono font-bold">{etResults.expiredPct.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 12. Milling Yield Drawer */}
          {activeCalcId === 'milling_yield' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'milling_yield'}
              onClose={() => setActiveCalcId(null)}
              title="Milling Yield"
              sub="Track paddy to rice conversion"
              icon={Wheat}
            >
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Head Rice %</p>
                  <p className="text-3xl font-mono font-black text-[#C5A059]">{myResults.headRicePct.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Loss</p>
                  <p className="text-2xl font-mono font-black text-red-400">{myResults.loss.toFixed(1)} <span className="text-xs text-gray-600">kg</span></p>
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <CalcInput label="Input Paddy (kg)" value={myPaddy} onChange={setMyPaddy} themeColor="amber" />
                <CalcInput label="Output Head Rice (kg)" value={myRice} onChange={setMyRice} themeColor="emerald" />
                <div className="grid grid-cols-2 gap-4">
                  <CalcInput label="Bran (kg)" value={myBran} onChange={setMyBran} themeColor="amber" />
                  <CalcInput label="Husk (kg)" value={myHusk} onChange={setMyHusk} themeColor="amber" />
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 13. Weight Conversion Drawer */}
          {activeCalcId === 'weight_conversion' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'weight_conversion'}
              onClose={() => setActiveCalcId(null)}
              title="Weight Converter"
              sub="Industrial unit scaling"
              icon={Scale}
            >
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <CalcInput label="Value" value={wcValue} onChange={setWcValue} themeColor="blue" />
                  <CalcInput label="Unit" type="select" value={wcUnit} onChange={setWcUnit} options={['kg', 'ton', 'lb', 'maund']} themeColor="blue" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex flex-col">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Kilograms</span>
                    <span className="text-white font-mono">{wcResults.kg.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex flex-col">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tons</span>
                    <span className="text-white font-mono">{wcResults.ton.toLocaleString(undefined, {maximumFractionDigits: 3})}</span>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex flex-col">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Pounds (lb)</span>
                    <span className="text-white font-mono">{wcResults.lb.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex flex-col">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Maund (من)</span>
                    <span className="text-white font-mono">{wcResults.maund.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </CalculatorDrawer>
          )}

          {/* 14. EMI Drawer */}
          {activeCalcId === 'emi' && (
            <CalculatorDrawer
              isOpen={activeCalcId === 'emi'}
              onClose={() => setActiveCalcId(null)}
              title="Financing & EMI"
              sub="Loan payment schedule"
              icon={Landmark}
            >
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Monthly EMI</p>
                  <p className="text-2xl font-mono font-black text-white">{fmt(emiResults.emi)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Interest</p>
                  <p className="text-2xl font-mono font-black text-amber-500">{fmt(emiResults.totalInterest)}</p>
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <CalcInput label="Principal Amount" value={emiP} onChange={setEmiP} themeColor="blue" />
                <div className="grid grid-cols-2 gap-4">
                  <CalcInput label="Interest % (Annual)" value={emiR} onChange={setEmiR} themeColor="blue" />
                  <CalcInput label="Months" value={emiN} onChange={setEmiN} themeColor="blue" />
                </div>
              </div>
            </CalculatorDrawer>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Card Component (Closed State) ---

interface CalculatorCardProps {
  title: string;
  sub: string;
  icon: React.ElementType;
  mainKpi: string | React.ReactNode;
  secondaryMetric: string;
  onClick: () => void;
  themeColor?: 'blue' | 'red' | 'emerald' | 'amber';
  badgeText?: string;
  badgeBg?: string;
}

function CalculatorCard({
  title,
  sub,
  icon: Icon,
  mainKpi,
  secondaryMetric,
  onClick,
  themeColor = "blue",
  badgeText,
  badgeBg,
}: CalculatorCardProps) {
  
  const activeStyles = {
    blue: {
      text: "text-blue-500 group-hover:text-blue-400",
      accent: "text-blue-500",
      bg: "bg-blue-500/5",
      border: "hover:border-blue-500/20",
      shadow: "hover:shadow-blue-500/5",
      glow: "group-hover:text-blue-500/[0.03]",
      chevron: "group-hover:text-blue-500"
    },
    red: {
      text: "text-red-500 group-hover:text-red-400",
      accent: "text-red-500",
      bg: "bg-red-500/5",
      border: "hover:border-red-500/20",
      shadow: "hover:shadow-red-500/5",
      glow: "group-hover:text-red-500/[0.03]",
      chevron: "group-hover:text-red-500"
    },
    emerald: {
      text: "text-emerald-500 group-hover:text-emerald-400",
      accent: "text-emerald-500",
      bg: "bg-emerald-500/5",
      border: "hover:border-emerald-500/20",
      shadow: "hover:shadow-emerald-500/5",
      glow: "group-hover:text-emerald-500/[0.03]",
      chevron: "group-hover:text-emerald-500"
    },
    amber: {
      text: "text-amber-500 group-hover:text-amber-400",
      accent: "text-[#C5A059]",
      bg: "bg-amber-500/5",
      border: "hover:border-amber-500/20",
      shadow: "hover:shadow-amber-500/5",
      glow: "group-hover:text-amber-500/[0.03]",
      chevron: "group-hover:text-amber-500"
    }
  };

  const style = activeStyles[themeColor];

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "bg-[#121315] hover:bg-[#16181C] border border-white/5 rounded-xl p-6 shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[220px]",
        style.border,
        "hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]"
      )}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Background Watermark Icon */}
      <div className={cn("absolute right-[-10px] bottom-[-20px] text-white/[0.02] transition-colors duration-300 pointer-events-none", style.glow)}>
        <Icon size={120} strokeWidth={1} />
      </div>

      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2.5 rounded-xl transition-colors duration-300", style.bg, style.accent)}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors duration-300">{title}</h3>
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{sub}</p>
            </div>
          </div>
          {badgeText && (
            <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", badgeBg)}>
              {badgeText}
            </span>
          )}
        </div>

        {/* Card Main Metrics */}
        <div className="pt-2">
          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Main KPI</div>
          <div className={cn("text-3xl font-black tracking-tighter mt-1 font-sans text-white", style.accent)}>
            {mainKpi}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            {secondaryMetric}
          </div>
        </div>
      </div>

      {/* Card Action Trigger Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 group-hover:text-amber-500 transition-colors duration-300">
          Open Calculator
        </span>
        <ChevronRight size={14} className={cn("text-gray-500 transform group-hover:translate-x-1 transition-all duration-300", style.chevron)} />
      </div>
    </motion.div>
  );
}

// --- Drawer Container Component (Action State) ---

interface CalculatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sub: string;
  icon: React.ElementType;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

function CalculatorDrawer({
  isOpen,
  onClose,
  title,
  sub,
  icon: Icon,
  children,
  actionButton,
}: CalculatorDrawerProps) {
  return (
    <>
      {/* Drawer Backdrop Layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
      />

      {/* Drawer Container Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        className="fixed right-0 top-0 h-full w-full sm:w-[480px] md:w-[500px] lg:w-[35vw] bg-[#121315] border-l border-white/5 z-50 shadow-2xl flex flex-col justify-between"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/5 rounded-xl text-amber-500">
              <Icon size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">{title}</h2>
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{sub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {children}
        </div>

        {/* Fixed Action Button Footer Container */}
        {actionButton && (
          <div className="p-6 border-t border-white/5 bg-[#121315] shrink-0">
            {actionButton}
          </div>
        )}
      </motion.div>
    </>
  );
}

// --- Drawer-specific Custom Input Fields ---

interface CalcInputProps {
  label: string;
  value: string | number;
  onChange: (val: any) => void;
  type?: 'number' | 'text' | 'select';
  options?: string[];
  helper?: string;
  themeColor?: 'blue' | 'red' | 'emerald' | 'amber';
}

function CalcInput({ 
  label, 
  value, 
  onChange, 
  type = "number", 
  options = [],
  helper,
  themeColor = "blue"
}: CalcInputProps) {
  
  const focusColors = {
    blue: "focus:border-blue-500 focus:shadow-[0_0_8px_rgba(59,130,246,0.2)]",
    red: "focus:border-red-500 focus:shadow-[0_0_8px_rgba(239,68,68,0.2)]",
    emerald: "focus:border-emerald-500 focus:shadow-[0_0_8px_rgba(16,185,129,0.2)]",
    amber: "focus:border-amber-500 focus:shadow-[0_0_8px_rgba(245,158,11,0.2)]"
  };

  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        {helper && <p className="text-[9px] text-gray-500 font-medium italic">{helper}</p>}
      </div>
      {type === 'select' ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full bg-black/40 border border-white/10 px-4 py-3.5 text-xs text-white outline-none rounded-xl transition-all cursor-pointer",
            focusColors[themeColor]
          )}
        >
          {options.map(opt => <option key={opt} value={opt} className="bg-[#121315]">{opt}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          className={cn(
            "w-full bg-black/40 border border-white/10 px-4 py-3.5 text-xs text-white outline-none rounded-xl transition-all font-mono",
            focusColors[themeColor]
          )}
        />
      )}
    </div>
  );
}

// --- Horizontal Progress Bar Metrics ---

function MetricBar({ label, value, color }: { label: string, value: number, color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500 shadow-blue-500/25",
    amber: "bg-amber-500 shadow-amber-500/25",
    emerald: "bg-emerald-500 shadow-emerald-500/25"
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
        <span className="text-gray-500">{label}</span>
        <span className="text-white font-mono">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden p-[2px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full rounded-full transition-all shadow-md", colors[color])}
        />
      </div>
    </div>
  );
}
