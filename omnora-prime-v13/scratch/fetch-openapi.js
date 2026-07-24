const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(url);
  const data = await res.json();
  
  console.log("Root JSON keys:", Object.keys(data));
  console.log("Message:", data.message, "Hint:", data.hint);
  const schemas = (data.components && data.components.schemas) || data.definitions;
  if (schemas) {
    console.log("schemas keys:", Object.keys(schemas));
    if (schemas.attendance_logs) {
      console.log("attendance_logs columns:", Object.keys(schemas.attendance_logs.properties));
    } else {
      console.log("attendance_logs definition not found");
    }
    if (schemas.karigar_production_logs) {
      console.log("karigar_production_logs columns:", Object.keys(schemas.karigar_production_logs.properties));
    } else {
      console.log("karigar_production_logs definition not found");
    }
  } else {
    console.log("No definitions/schemas found");
  }
}

run();
