"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DailyBrief() {
  const { businessId, fmt } = usePersona();
  const supabase = createClient();

  const { data: brief, isLoading } = useQuery({
    queryKey: ["daily-brief", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_brief", {
        p_business_id: businessId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  if (isLoading || !brief) return null;

  const {
    today_revenue,
    revenue_change_pct,
    today_units,
    top_karigar,
    overdue_count,
    overdue_amount,
    low_stock_count,
    day_of_week,
  } = brief;

  const isNew = today_revenue === 0 && today_units === 0 && overdue_count === 0 && low_stock_count === 0;

  if (isNew) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg text-white font-inter"
      >
        Welcome.{" "}
        <Link href="/inventory" className="text-[#C5A059] hover:underline decoration-2 underline-offset-4">
          Add your first product
        </Link>{" "}
        to get started.
      </motion.div>
    );
  }

  const renderGold = (text: string | number) => (
    <span className="font-mono text-[#C5A059] font-bold">{text}</span>
  );

  let message = "";
  if (day_of_week === "Monday") message += "New week. ";

  if (today_revenue > 0) {
    if (revenue_change_pct > 0) {
      message = `Good morning. Revenue is ${fmt(today_revenue)} today, ${revenue_change_pct}% ahead of yesterday. `;
    } else if (revenue_change_pct < 0) {
      message = `Revenue is ${fmt(today_revenue)} today, ${Math.abs(revenue_change_pct)}% below yesterday. `;
      if (overdue_count > 0) {
        message += `${overdue_count} invoices are overdue — follow up to recover ${fmt(overdue_amount)}. `;
      }
    } else {
      message = `Good morning. Revenue is ${fmt(today_revenue)} today. `;
    }
  }

  let productionMessage = "";
  if (today_units > 0 && top_karigar) {
    productionMessage = `${top_karigar} leads production with ${today_units} units today. `;
  }

  let stockMessage = "";
  if (low_stock_count > 0) {
    stockMessage = `${low_stock_count} items are below reorder level.`;
  }

  // To handle the "Gold" styling, we need to split and map or use a custom renderer.
  // Since the user wants specific parts in JetBrains Mono Gold, I'll build the component with structured elements.

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-lg text-white font-inter leading-relaxed"
    >
      {day_of_week === "Monday" && "New week. "}
      
      {today_revenue > 0 ? (
        <>
          {revenue_change_pct > 0 ? (
            <>
              Good morning. Revenue is {renderGold(fmt(today_revenue))} today,{" "}
              {renderGold(`${revenue_change_pct}%`)} ahead of yesterday.
            </>
          ) : revenue_change_pct < 0 ? (
            <>
              Revenue is {renderGold(fmt(today_revenue))} today,{" "}
              {renderGold(`${Math.abs(revenue_change_pct)}%`)} below yesterday.{" "}
              {overdue_count > 0 && (
                <>
                  {renderGold(overdue_count)} invoices are overdue — follow up to recover{" "}
                  {renderGold(fmt(overdue_amount))}.
                </>
              )}
            </>
          ) : (
            <>Good morning. Revenue is {renderGold(fmt(today_revenue))} today.</>
          )}
        </>
      ) : (
        <>Good morning. {overdue_count > 0 && (
          <>
            {renderGold(overdue_count)} invoices are overdue — follow up to recover{" "}
            {renderGold(fmt(overdue_amount))}.
          </>
        )}</>
      )}

      {" "}
      {today_units > 0 && top_karigar && (
        <>
          {renderGold(top_karigar)} leads production with {renderGold(today_units)} units today.
        </>
      )}

      {" "}
      {low_stock_count > 0 && (
        <>
          {renderGold(low_stock_count)} items are below reorder level.
        </>
      )}
    </motion.div>
  );
}
