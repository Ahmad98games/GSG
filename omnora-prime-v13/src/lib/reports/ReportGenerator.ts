// src/lib/reports/ReportGenerator.ts
import { createClient } from '@/lib/supabase/client';

export type FinancialStatementType = 'trial_balance' | 'profit_loss' | 'balance_sheet' | 'tax_return';

export class ReportGenerator {
  static async generateFinancialStatement(
    type: FinancialStatementType,
    data: any,
    businessProfile: any
  ): Promise<string> {
    const supabase = createClient();

    try {
      // 1. In a production environment, this would call a Puppeteer Edge Function 
      // or a dedicated PDF generation microservice.
      // 2. Here we simulate the process:
      
      console.log(`Generating ${type} PDF for ${businessProfile.business_name}...`);
      
      // Simulate API call to PDF service
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, profile: businessProfile })
      });

      if (!response.ok) throw new Error("PDF Generation Failed");
      
      const { storageUrl } = await response.json();
      return storageUrl;
    } catch (error) {
      console.error("Report Generation Error:", error);
      // Fallback for demo: return a local URL or rethrow
      throw error;
    }
  }

  static async exportToCSV(data: any[], filename: string) {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

