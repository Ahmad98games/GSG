// supabase/functions/post-payroll/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Slip {
  id: string;
  gross_earning: number;
  advance_deduction: number;
  eobi_deduction: number;
  net_payable: number;
  karigars: { name: string };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { periodId } = await req.json();
    if (!periodId) throw new Error("Period ID is required");

    // 1. Get Period and Slips
    const { data: period, error: periodErr } = await supabaseClient
      .from('payroll_periods')
      .select('*')
      .eq('id', periodId)
      .single();

    if (periodErr || !period) throw new Error("Period not found");
    if (period.status === 'paid') throw new Error("Period already paid and posted");

    const { data: slipsData, error: slipsErr } = await supabaseClient
      .from('payroll_slips')
      .select('*, karigars(name)')
      .eq('period_id', periodId);

    if (slipsErr || !slipsData || slipsData.length === 0) throw new Error("No slips found for this period");
    
    const slips = slipsData as unknown as Slip[];

    // 2. Resolve System Accounts
    const { data: accounts, error: accErr } = await supabaseClient
      .from('accounts')
      .select('id, account_code')
      .eq('business_id', period.business_id)
      .in('account_code', ['5100', '1300', '2300', '2200']); // Wages, Advances, EOBI, Salaries Payable

    if (accErr || !accounts) throw accErr || new Error("Failed to load accounts");

    const getAccId = (code: string) => accounts.find((a: { account_code: string, id: string }) => a.account_code === code)?.id;
    const wagesAcc = getAccId('5100');
    const advanceAcc = getAccId('1300');
    const eobiAcc = getAccId('2300');
    const payableAcc = getAccId('2200');

    if (!wagesAcc || !advanceAcc || !payableAcc) {
      throw new Error("Required system accounts (5100, 1300, 2200) missing. Please seed Chart of Accounts.");
    }

    const txRef = `PAYROLL-${period.period_label}-${Date.now()}`;
    const ledgerEntries = [];

    for (const slip of slips) {
      // a. DEBIT Wages & Salaries (Gross)
      ledgerEntries.push({
        business_id: period.business_id,
        tx_ref: txRef,
        entry_type: 'debit',
        account_id: wagesAcc,
        amount: slip.gross_earning,
        description: `Gross Wages for ${slip.karigars.name} (${period.period_label})`,
        metadata: { slip_id: slip.id, type: 'payroll_gross' }
      });

      // b. CREDIT Karigar Advance (Asset Recovery) - "Peshgi Recovery"
      if (slip.advance_deduction > 0) {
        ledgerEntries.push({
          business_id: period.business_id,
          tx_ref: txRef,
          entry_type: 'credit',
          account_id: advanceAcc,
          amount: slip.advance_deduction,
          description: `Advance Recovery (Peshgi) - ${slip.karigars.name}`,
          metadata: { slip_id: slip.id, type: 'advance_recovery' }
        });
      }

      // c. CREDIT EOBI Payable (Liability)
      if (slip.eobi_deduction > 0 && eobiAcc) {
        ledgerEntries.push({
          business_id: period.business_id,
          tx_ref: txRef,
          entry_type: 'credit',
          account_id: eobiAcc,
          amount: slip.eobi_deduction,
          description: `EOBI Deduction - ${slip.karigars.name}`,
          metadata: { slip_id: slip.id, type: 'eobi_contribution' }
        });
      }

      // d. CREDIT Salaries Payable (Liability) - "Net Payable"
      ledgerEntries.push({
        business_id: period.business_id,
        tx_ref: txRef,
        entry_type: 'credit',
        account_id: payableAcc,
        amount: slip.net_payable,
        description: `Net Salary Payable to ${slip.karigars.name}`,
        metadata: { slip_id: slip.id, type: 'net_salary_payable' }
      });
    }

    // 3. Batch Post to Ledger
    const { error: ledgerErr } = await supabaseClient
      .from('ledger_entries')
      .insert(ledgerEntries);

    if (ledgerErr) throw ledgerErr;

    // 4. Update Period Status
    const { error: updateErr } = await supabaseClient
      .from('payroll_periods')
      .update({ 
        status: 'paid', 
        paid_at: new Date().toISOString(),
        total_payroll: slips.reduce((sum: number, s: Slip) => sum + s.gross_earning, 0)
      })
      .eq('id', periodId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payroll successfully posted to Ledger. Advance recoveries credited.",
      entriesCreated: ledgerEntries.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

