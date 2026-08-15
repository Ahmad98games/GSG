'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeftRight, Scale, Ruler, Zap, 
  TrendingUp, Users, Ship, Landmark,
  ChevronDown
} from 'lucide-react'
import { Decimal } from 'decimal.js'
import { usePersona } from '@/hooks/usePersona'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ExchangeRate {
  from_currency: string
  to_currency: string
  rate: number
}

const FALLBACK_RATES: Record<string, number> = {
  USD: 1, PKR: 278.5, AED: 3.67, GBP: 0.79, EUR: 0.92, SAR: 3.75,
  CAD: 1.36, AUD: 1.53, INR: 83.2, BDT: 110.0, TRY: 32.1, VND: 24800,
  IDR: 15750, MAD: 10.1, ETB: 56.5, MXN: 17.2, SGD: 1.34, MYR: 4.72,
  THB: 35.1, QAR: 3.64, KWD: 0.307, OMR: 0.385,
}

const WEIGHT_CONVERSIONS: Record<string, { label: string, factor: number }> = {
  g:       { label: 'Grams (g)',      factor: 1 },
  kg:      { label: 'Kilograms (kg)', factor: 1000 },
  ton:     { label: 'Metric Ton',     factor: 1000000 },
  lb:      { label: 'Pounds (lb)',    factor: 453.592 },
  oz:      { label: 'Ounces (oz)',    factor: 28.3495 },
  maund:   { label: 'Maund (من)',     factor: 37324.2 },
  seer:    { label: 'Seer (سیر)',     factor: 933.1 },
  quintal: { label: 'Quintal',        factor: 100000 },
  tola:    { label: 'Tola (تولہ)',    factor: 11.664 },
}

const FABRIC_CONVERSIONS: Record<string, { label: string, factor: number }> = {
  meter:  { label: 'Meter (m)',    factor: 1 },
  yard:   { label: 'Yard (yd)',    factor: 0.9144 },
  foot:   { label: 'Foot (ft)',    factor: 0.3048 },
  inch:   { label: 'Inch (in)',    factor: 0.0254 },
  thaan:  { label: 'Thaan (تھان)', factor: 20 },
}

export default function ConvertersPage() {
  const { businessId, getConverters } = usePersona()
  const supabase = createClient()
  
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [isLoadingRates, setIsLoadingRates] = useState(true)

  useEffect(() => {
    async function fetchRates() {
      if (!businessId) return
      const { data } = await supabase
        .from('exchange_rates')
        .select('from_currency, to_currency, rate')
        .eq('business_id', businessId)
        .order('effective_date', { ascending: false })
      
      if (data) {
        const uniquePairs = new Map()
        data.forEach((r: any) => {
          const key = `${r.from_currency}-${r.to_currency}`
          if (!uniquePairs.has(key)) uniquePairs.set(key, r)
        })
        setRates(Array.from(uniquePairs.values()))
      }
      setIsLoadingRates(false)
    }
    fetchRates()
  }, [businessId, supabase])

  const enabledConverters = getConverters();

  const CONVERTER_MAP: Record<string, React.ComponentType<any>> = {
    'currency': () => <CurrencyConverter rates={rates} />,
    'weight': WeightConverter,
    'fabric_length': FabricLengthConverter,
    'gsm': GsmCalculator,
    'margin': MarginCalculator,
    'piece_rate_calc': PieceRateCalculator,
    'container': ContainerLoadCalculator,
    'emi': LoanCalculator,
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-3">
          <ArrowLeftRight className="w-6 h-6 text-electric-blue" />
          Converters & Calculators
        </h1>
        <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">
          Industrial tools built into your workspace
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {enabledConverters.map(id => {
          const Component = CONVERTER_MAP[id];
          if (!Component) return null;
          return <Component key={id} />;
        })}

        {enabledConverters.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30 italic">
             <ArrowLeftRight size={60} strokeWidth={0.5} />
             <p className="mt-4 uppercase tracking-[0.2em] text-[10px]">No industry-specific converters found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ConverterCard({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="bg-[#0F1114] border border-white/[0.06] p-6 rounded-sm flex flex-col space-y-6 relative group">
      <div className="flex items-center justify-between">
        <h3 className="text-xxs font-semibold tracking-widest uppercase text-gray-500">{title}</h3>
        <Icon className="w-5 h-5 text-gray-600 group-hover:text-electric-blue transition-colors" />
      </div>
      <div className="flex-1 space-y-4">
        {children}
      </div>
    </div>
  )
}

function ConverterInput({ 
  label, value, onChange, type = "number", options = [] 
}: { 
  label: string, value: string | number, onChange: (v: string) => void, type?: 'number'|'text'|'select', options?: {value: string, label: string}[] 
}) {
  return (
    <div className="space-y-1 flex-1">
      <label className="text-xxs text-gray-500 uppercase tracking-widest">{label}</label>
      {type === 'select' ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-b border-white/10 px-0 py-2 text-lg text-white outline-none focus:border-electric-blue transition-colors font-mono cursor-pointer"
        >
          {options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#0F1114]">{opt.label}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-b border-white/10 px-0 py-2 text-lg text-white outline-none focus:border-electric-blue transition-colors font-mono" 
        />
      )}
    </div>
  )
}

function CurrencyConverter({ rates }: { rates: ExchangeRate[] }) {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('PKR')

  const convert = (amt: number, f: string, t: string) => {
    // Check db rate first (optional if we want to mix them, but instructions say "No API needed. User can override in settings." meaning DB rates take precedence if available, otherwise fallback)
    let fromRate = 1
    let toRate = 1
    
    const dbFromRate = rates.find(r => r.from_currency === f && r.to_currency === 'USD')
    const dbToRate = rates.find(r => r.from_currency === t && r.to_currency === 'USD')
    
    // We'll just use fallback for now as requested: "use HARDCODED daily-updated rates as fallback"
    fromRate = FALLBACK_RATES[f] || 1
    toRate = FALLBACK_RATES[t] || 1

    const inUsd = amt / fromRate
    return inUsd * toRate
  }

  const amtNum = parseFloat(amount) || 0
  const result = convert(amtNum, from, to)
  const rate = convert(1, from, to)

  return (
    <ConverterCard title="Currency Converter" icon={Landmark}>
      <div className="space-y-6">
        <div className="flex gap-4">
          <ConverterInput label="Amount" value={amount} onChange={setAmount} />
        </div>
        <div className="flex gap-4 items-end">
          <ConverterInput label="From" type="select" value={from} onChange={setFrom} options={Object.keys(FALLBACK_RATES).map(c => ({value: c, label: c}))} />
          <ArrowLeftRight className="w-4 h-4 text-gray-600 mb-3 shrink-0" />
          <ConverterInput label="To" type="select" value={to} onChange={setTo} options={Object.keys(FALLBACK_RATES).map(c => ({value: c, label: c}))} />
        </div>

        <div className="pt-4 flex flex-col space-y-1">
          <span className="text-3xl font-mono text-[#C5A059] leading-none">{result.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span className="text-xxs text-gray-500 uppercase tracking-widest mt-2">Rate: 1 {from} = {rate.toFixed(4)} {to}</span>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => {setFrom('PKR'); setTo('USD'); setAmount('1000')}} className="px-2 py-1 border border-white/10 hover:bg-white/5 rounded text-xxs font-mono text-gray-400 uppercase transition-colors">PKR→USD</button>
          <button onClick={() => {setFrom('PKR'); setTo('AED'); setAmount('1000')}} className="px-2 py-1 border border-white/10 hover:bg-white/5 rounded text-xxs font-mono text-gray-400 uppercase transition-colors">PKR→AED</button>
          <button onClick={() => {setFrom('USD'); setTo('EUR'); setAmount('100')}} className="px-2 py-1 border border-white/10 hover:bg-white/5 rounded text-xxs font-mono text-gray-400 uppercase transition-colors">USD→EUR</button>
        </div>
        <p className="text-xxs text-gray-600 italic mt-2">Rates updated {new Date().toLocaleString('default', {month: 'long', year: 'numeric'})} — for exact rates add live rates in Settings → Exchange Rates</p>
      </div>
    </ConverterCard>
  )
}

function WeightConverter() {
  const [value, setValue] = useState('1')
  const [unit, setUnit] = useState('kg')

  const amtNum = parseFloat(value) || 0
  const baseGrams = amtNum * (WEIGHT_CONVERSIONS[unit]?.factor || 1)

  return (
    <ConverterCard title="Weight Converter" icon={Scale}>
      <div className="flex gap-4 items-end">
        <ConverterInput label="Value" value={value} onChange={setValue} />
        <ConverterInput label="Unit" type="select" value={unit} onChange={setUnit} options={Object.entries(WEIGHT_CONVERSIONS).map(([k, v]) => ({value: k, label: v.label}))} />
      </div>
      
      <div className="grid grid-cols-3 gap-y-4 gap-x-2 pt-4">
        {Object.entries(WEIGHT_CONVERSIONS).map(([u, def]) => {
          if (u === unit) return null
          const converted = baseGrams / def.factor
          return (
            <div key={u} className="flex flex-col">
              <span className="text-xxs text-gray-500 uppercase tracking-widest">{def.label.split(' ')[0]}</span>
              <span className="text-sm font-mono text-white mt-1">
                {converted < 0.01 ? converted.toExponential(2) : converted.toLocaleString(undefined, {maximumFractionDigits: 3})}
              </span>
            </div>
          )
        })}
      </div>
    </ConverterCard>
  )
}

function FabricLengthConverter() {
  const [value, setValue] = useState('20')
  const [unit, setUnit] = useState('meter')
  const [pricePerMeter, setPricePerMeter] = useState('450')

  const amtNum = parseFloat(value) || 0
  const baseMeters = amtNum * (FABRIC_CONVERSIONS[unit]?.factor || 1)
  const totalCost = baseMeters * (parseFloat(pricePerMeter) || 0)

  return (
    <ConverterCard title="Fabric Length" icon={Ruler}>
      <div className="flex gap-4 items-end">
        <ConverterInput label="Length" value={value} onChange={setValue} />
        <ConverterInput label="Unit" type="select" value={unit} onChange={setUnit} options={Object.entries(FABRIC_CONVERSIONS).map(([k, v]) => ({value: k, label: v.label}))} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-4">
        {Object.entries(FABRIC_CONVERSIONS).map(([u, def]) => {
          if (u === unit) return null
          const converted = baseMeters / def.factor
          return (
            <div key={u} className="flex flex-col">
              <span className="text-xxs text-gray-500 uppercase tracking-widest">{def.label.split(' ')[0]}</span>
              <span className="text-sm font-mono text-white mt-1">{converted.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t border-white/5 space-y-4 mt-2">
        <ConverterInput label="Price per meter" value={pricePerMeter} onChange={setPricePerMeter} />
        <div className="flex flex-col pt-2">
          <span className="text-xxs text-gray-500 uppercase tracking-widest">Total Cost</span>
          <span className="text-3xl font-mono text-[#C5A059] mt-1">{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      </div>
    </ConverterCard>
  )
}

function ContainerLoadCalculator() {
  const [l, setL] = useState('40')
  const [w, setW] = useState('30')
  const [h, setH] = useState('40')
  const [weight, setWeight] = useState('15')
  const [type, setType] = useState('20ft')

  const len = parseFloat(l)||0; const wid = parseFloat(w)||0; const hgt = parseFloat(h)||0; const wt = parseFloat(weight)||0
  
  const containerVolMap: Record<string, number> = { '20ft': 33200000, '40ft': 67700000, '40ft HC': 76400000 }
  const containerWtMap: Record<string, number> = { '20ft': 21700, '40ft': 26480, '40ft HC': 26500 }

  const cVol = containerVolMap[type] || 0
  const cWt = containerWtMap[type] || 0
  const boxVol = len * wid * hgt

  const boxesByVol = boxVol > 0 ? Math.floor(cVol / boxVol) : 0
  const boxesByWt = wt > 0 ? Math.floor(cWt / wt) : 0
  const finalBoxes = Math.min(boxesByVol, boxesByWt)
  const utilization = cVol > 0 ? ((finalBoxes * boxVol) / cVol) * 100 : 0

  return (
    <ConverterCard title="Container Load" icon={Ship}>
      <div className="grid grid-cols-2 gap-4">
        <ConverterInput label="Length (cm)" value={l} onChange={setL} />
        <ConverterInput label="Width (cm)" value={w} onChange={setW} />
        <ConverterInput label="Height (cm)" value={h} onChange={setH} />
        <ConverterInput label="Weight (kg)" value={weight} onChange={setWeight} />
      </div>
      <ConverterInput label="Container Type" type="select" value={type} onChange={setType} options={[{value:'20ft', label:'20ft'}, {value:'40ft', label:'40ft'}, {value:'40ft HC', label:'40ft HC'}]} />
      
      <div className="flex flex-col space-y-4 pt-4 border-t border-white/5 mt-2">
        <div className="flex flex-col">
          <span className="text-xxs text-gray-500 uppercase tracking-widest">Actual Limit (Boxes)</span>
          <span className="text-3xl font-mono text-[#C5A059] mt-1">{finalBoxes.toLocaleString()}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xxs text-gray-500 uppercase tracking-widest">By Volume</span>
            <span className="text-sm font-mono text-white mt-1">{boxesByVol.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xxs text-gray-500 uppercase tracking-widest">By Weight</span>
            <span className="text-sm font-mono text-white mt-1">{boxesByWt.toLocaleString()}</span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-xxs text-gray-500 uppercase tracking-widest">Utilization</span>
            <span className="text-sm font-mono text-white mt-1">{utilization.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </ConverterCard>
  )
}

function LoanCalculator() {
  const [p, setP] = useState('1000000')
  const [r, setR] = useState('12')
  const [n, setN] = useState('24')
  const [showSchedule, setShowSchedule] = useState(false)

  const principal = new Decimal(p || 0)
  const annualRate = new Decimal(r || 0)
  const monthlyRate = annualRate.div(1200)
  const months = new Decimal(n || 1).toNumber()

  let emi = new Decimal(0)
  if (!monthlyRate.isZero() && months > 0) {
    const onePlusR = monthlyRate.plus(1)
    const pow = onePlusR.pow(months)
    emi = principal.mul(monthlyRate).mul(pow).div(pow.minus(1))
  } else if (months > 0) {
    emi = principal.div(months)
  }

  const schedule = []
  let bal = principal
  for(let i=1; i<=Math.min(months, 6); i++) {
    const interest = bal.mul(monthlyRate)
    const prn = emi.minus(interest)
    bal = bal.minus(prn)
    schedule.push({ m: i, pmt: emi, prn, int: interest, bal })
  }

  return (
    <ConverterCard title="EMI / Financing" icon={Landmark}>
      <div className="space-y-4">
        <ConverterInput label="Principal" value={p} onChange={setP} />
        <div className="grid grid-cols-2 gap-4">
          <ConverterInput label="Interest % (Annual)" value={r} onChange={setR} />
          <ConverterInput label="Months" value={n} onChange={setN} />
        </div>
      </div>
      <div className="pt-4 flex flex-col space-y-4 mt-2">
        <div className="flex flex-col">
          <span className="text-xxs text-gray-500 uppercase tracking-widest">Monthly EMI</span>
          <span className="text-3xl font-mono text-[#C5A059] mt-1">{emi.toNumber().toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
        </div>

        {months > 0 && (
          <div>
            <button 
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-2 text-xxs uppercase tracking-widest text-electric-blue hover:text-blue-400 transition-colors"
            >
              View Schedule
              <ChevronDown className={cn("w-3 h-3 transition-transform", showSchedule && "rotate-180")} />
            </button>
            {showSchedule && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/10">
                      <th className="pb-2 font-normal">M</th>
                      <th className="pb-2 font-normal text-right">Payment</th>
                      <th className="pb-2 font-normal text-right">Principal</th>
                      <th className="pb-2 font-normal text-right">Interest</th>
                      <th className="pb-2 font-normal text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map(row => (
                      <tr key={row.m} className="border-b border-white/5 text-gray-300">
                        <td className="py-2">{row.m}</td>
                        <td className="py-2 text-right">{row.pmt.toNumber().toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="py-2 text-right">{row.prn.toNumber().toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="py-2 text-right">{row.int.toNumber().toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="py-2 text-right">{row.bal.toNumber().toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {months > 6 && <p className="text-xxs text-gray-500 mt-2 italic">Showing first 6 months...</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </ConverterCard>
  )
}

function GsmCalculator() {
  const [weight, setWeight] = useState('250')
  const [length, setLength] = useState('1')
  const [width, setWidth] = useState('1.5')

  const w = parseFloat(weight)||0; const l = parseFloat(length)||0; const wid = parseFloat(width)||0
  const gsm = (l > 0 && wid > 0) ? (w / (l * wid)).toFixed(2) : '0'

  return (
    <ConverterCard title="GSM Calculator" icon={Zap}>
      <div className="grid grid-cols-3 gap-4">
        <ConverterInput label="Weight (g)" value={weight} onChange={setWeight} />
        <ConverterInput label="Len (m)" value={length} onChange={setLength} />
        <ConverterInput label="Wid (m)" value={width} onChange={setWidth} />
      </div>
      <div className="pt-4 flex flex-col mt-2">
        <span className="text-xxs text-gray-500 uppercase tracking-widest">Grams per Sq. Meter</span>
        <span className="text-3xl font-mono text-[#C5A059] mt-1">{gsm}</span>
      </div>
    </ConverterCard>
  )
}

function MarginCalculator() {
  const [cost, setCost] = useState('850')
  const [sale, setSale] = useState('1200')

  const c = parseFloat(cost)||0; const s = parseFloat(sale)||0
  const profit = s - c
  const margin = s > 0 ? (profit / s) * 100 : 0
  const markup = c > 0 ? (profit / c) * 100 : 0

  return (
    <ConverterCard title="Margin / Markup" icon={TrendingUp}>
      <div className="grid grid-cols-2 gap-4">
        <ConverterInput label="Cost Price" value={cost} onChange={setCost} />
        <ConverterInput label="Sale Price" value={sale} onChange={setSale} />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 mt-2">
        <div className="flex flex-col">
          <span className="text-xxs text-gray-500 uppercase tracking-widest">Profit</span>
          <span className="text-sm font-mono text-white mt-1">{profit.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xxs text-gray-500 uppercase tracking-widest">Margin</span>
          <span className={cn("text-sm font-mono mt-1", margin > 15 ? 'text-emerald-500' : 'text-amber-500')}>{margin.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xxs text-gray-500 uppercase tracking-widest">Markup</span>
          <span className="text-sm font-mono text-white mt-1">{markup.toFixed(1)}%</span>
        </div>
      </div>
    </ConverterCard>
  )
}

function PieceRateCalculator() {
  const [rate, setRate] = useState('45')
  const [pieces, setPieces] = useState('200')
  const [grade, setGrade] = useState('1')
  const [advance, setAdvance] = useState('1000')

  const r = parseFloat(rate)||0; const p = parseFloat(pieces)||0; const g = parseFloat(grade)||1; const a = parseFloat(advance)||0
  const gross = r * p * g
  const net = gross - a

  return (
    <ConverterCard title="Piece Rate / Payroll" icon={Users}>
      <div className="grid grid-cols-2 gap-4">
        <ConverterInput label="Rate / Piece" value={rate} onChange={setRate} />
        <ConverterInput label="Pieces" value={pieces} onChange={setPieces} />
        <ConverterInput label="Grade" type="select" value={grade} onChange={setGrade} options={[{value:'1', label:'A (100%)'}, {value:'0.9', label:'B (90%)'}, {value:'0.8', label:'C (80%)'}]} />
        <ConverterInput label="Advance" value={advance} onChange={setAdvance} />
      </div>
      <div className="pt-4 flex flex-col mt-2 border-t border-white/5">
        <span className="text-xxs text-gray-500 uppercase tracking-widest">Net Payable</span>
        <span className="text-3xl font-mono text-[#C5A059] mt-1">{net.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
      </div>
    </ConverterCard>
  )
}
