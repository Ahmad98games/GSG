// app/api/download/route.ts
export const dynamic = 'force-dynamic';

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "License key is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Validate License
  const { data: license, error: lError } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", key)
    .eq("status", "active")
    .single();

  if (lError || !license) {
    return NextResponse.json({ error: "Invalid or inactive license key" }, { status: 403 });
  }

  // 2. Check Tier (Lite cannot download .exe)
  if (license.tier === 'lite') {
    return NextResponse.json({ 
      error: "Lite tier is web-only. Upgrade to Pro or Elite to download the Windows Hub." 
    }, { status: 403 });
  }

  // 3. Generate Signed URL for installer
  const { data: urlData, error: uError } = await supabase.storage
    .from("installers")
    .createSignedUrl("NOXIS_Prime_v13.0.4_x64.exe", 900); // 15 mins

  if (uError || !urlData) {
    return NextResponse.json({ error: "Storage connection failure" }, { status: 500 });
  }

  // 4. Log Download
  await supabase.from("downloads_log").insert({
    license_id: license.id,
    ip_address: req.headers.get("x-forwarded-for") || "unknown",
    user_agent: req.headers.get("user-agent") || "unknown"
  });

  return NextResponse.json({ url: urlData.signedUrl });
}

