// supabase/functions/seed-cctv-brands/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const brands = [
      { name: 'Hikvision', is_popular: true },
      { name: 'Dahua', is_popular: true },
      { name: 'Axis', is_popular: true },
      { name: 'Bosch', is_popular: true },
      { name: 'Hanwha / Samsung', is_popular: true },
      { name: 'Uniview', is_popular: true },
      { name: 'TVT', is_popular: true },
      { name: 'Reolink', is_popular: true },
      { name: 'TP-Link Tapo', is_popular: true },
      { name: 'CP Plus', is_popular: true },
      { name: 'Generic / Unknown', is_popular: true }
    ];

    const types = [
      { type_code: 'dome', label: 'Dome' },
      { type_code: 'bullet', label: 'Bullet' },
      { type_code: 'ptz', label: 'PTZ (Pan-Tilt-Zoom)' },
      { type_code: 'fisheye', label: 'Fisheye 360°' },
      { type_code: 'box', label: 'Box' },
      { type_code: 'turret', label: 'Turret' },
      { type_code: 'pinhole', label: 'Pinhole / Covert' }
    ];

    await supabaseClient.from('cctv_brands').upsert(brands, { onConflict: 'name' });
    await supabaseClient.from('cctv_camera_types').upsert(types, { onConflict: 'type_code' });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

