// supabase/functions/generate-payroll/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://noxis.industrial";
const rateLimitMap = new Map<string, number[]>();

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Karigar {
  id: string;
  wage_type: 'piece_rate' | 'daily_wage' | 'monthly_salary';
  daily_rate?: number;
  monthly_salary?: number;
  eobi_enrolled: boolean;
}

interface Attendance {
  karigar_id: string;
  status: string;
  overtime_hrs: number;
}

interface Production {
  karigar_id: string;
  effective_earning: number;
  qty_produced: number;
}

interface Advance {
  karigar_id: string;
  amount: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown";

  // 1. Rate Limiting (10 req/min)
  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < 60_000);
  
  if (timestamps.length >= 10) {
    return new Response(JSON.stringify({ error: 'TOO_MANY_REQUESTS' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      status: 429,
    });
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  try {
    // 2. Request Validation
    if (req.headers.get("content-type") !== "application/json") {
      throw new Error('INVALID_CONTENT_TYPE');
    }

    const body = await req.json();
    const { periodId } = body;

    if (!periodId) {
      return new Response(JSON.stringify({ error: 'MISSING_FIELDS' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Load Period Details
    const { data: period, error: periodErr } = await supabaseClient
      .from('payroll_periods')
      .select('*')
      .eq('id', periodId)
      .single();

    if (periodErr || !period) throw new Error("Payroll period not found");
    if (period.status !== 'open') throw new Error("Period is already locked or paid");

    // 2. Load Karigars, Attendance, Production, and Advances for the period
    const [
      { data: karigarsData },
      { data: attendanceData },
      { data: productionData },
      { data: advancesData }
    ] = await Promise.all([
      supabaseClient.from('karigars').select('*').eq('business_id', period.business_id).eq('status', 'active'),
      supabaseClient.from('attendance_logs').select('*').eq('business_id', period.business_id).gte('log_date', period.period_start).lte('log_date', period.period_end),
      supabaseClient.from('karigar_production_logs').select('*').eq('business_id', period.business_id).gte('log_date', period.period_start).lte('log_date', period.period_end),
      supabaseClient.from('karigar_advances').select('*').eq('business_id', period.business_id).eq('status', 'approved')
    ]);

    if (!karigarsData) throw new Error("No active karigars found");
    
    const karigars = karigarsData as Karigar[];
    const attendance = (attendanceData || []) as Attendance[];
    const production = (productionData || []) as Production[];
    const advances = (advancesData || []) as Advance[];

    // 3. Process each Karigar
    const slips = karigars.map((k: Karigar) => {
      const kAttendance = attendance.filter((a: Attendance) => a.karigar_id === k.id);
      const kProduction = production.filter((p: Production) => p.karigar_id === k.id);
      const kAdvances = advances.filter((ad: Advance) => ad.karigar_id === k.id);

      // Logic replication
      const pieceRateEarning = kProduction.reduce((sum: number, p: Production) => sum + Number(p.effective_earning), 0);
      
      const daysPresent = kAttendance.reduce((sum: number, a: Attendance) => {
        if (a.status === 'present' || a.status === 'holiday' || a.status === 'leave') return sum + 1;
        if (a.status === 'half_day') return sum + 0.5;
        return sum;
      }, 0);

      let dailyWageEarning = 0;
      let monthlyBase = 0;
      let overtimeEarning = 0;

      if (k.wage_type === 'daily_wage' && k.daily_rate) {
        dailyWageEarning = daysPresent * k.daily_rate;
        const otHrs = kAttendance.reduce((sum: number, a: Attendance) => sum + Number(a.overtime_hrs), 0);
        overtimeEarning = otHrs * (k.daily_rate / 8) * 1.5;
      } else if (k.wage_type === 'monthly_salary' && k.monthly_salary) {
        monthlyBase = (k.monthly_salary * daysPresent) / 26;
      }

      const gross = pieceRateEarning + dailyWageEarning + monthlyBase + overtimeEarning;
      
      const totalPendingAdvance = kAdvances.reduce((sum: number, ad: Advance) => sum + Number(ad.amount), 0);
      const advanceDeduction = Math.min(gross * 0.5, totalPendingAdvance);
      
      const eobi = k.eobi_enrolled ? 370 : 0;
      const net = Math.max(0, gross - advanceDeduction - eobi);

      return {
        business_id: period.business_id,
        period_id: periodId,
        karigar_id: k.id,
        piece_rate_earning: pieceRateEarning,
        daily_wage_earning: dailyWageEarning,
        monthly_base: monthlyBase,
        overtime_earning: overtimeEarning,
        gross_earning: gross,
        advance_deduction: advanceDeduction,
        eobi_deduction: eobi,
        total_deductions: advanceDeduction + eobi,
        net_payable: net,
        days_present: daysPresent,
        days_absent: Math.max(0, 26 - daysPresent),
        total_units: kProduction.reduce((sum: number, p: Production) => sum + Number(p.qty_produced), 0)
      };
    });

    // 4. Upsert slips
    const { error: upsertErr } = await supabaseClient
      .from('payroll_slips')
      .upsert(slips, { onConflict: 'period_id,karigar_id' });

    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ 
      status: "success", 
      slipCount: slips.length,
      totalNet: slips.reduce((sum: number, s: { net_payable: number }) => sum + s.net_payable, 0)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[Edge Error] Payroll generation failed: ${error.message}`);
    return new Response(JSON.stringify({ error: 'VERIFICATION_FAILED' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

