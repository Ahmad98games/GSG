const http = require('http');

const routes = [
  "",
  "license",
  "setup",
  "dashboard",
  "inventory",
  "karigars",
  "karigars/network",
  "production",
  "production/analytics",
  "production/batches",
  "payroll",
  "dispatch",
  "invoices",
  "invoices/new",
  "invoices/recurring",
  "parties",
  "promises",
  "purchase",
  "purchase/new",
  "purchase/suppliers",
  "khata",
  "cashflow",
  "reports",
  "cctv",
  "intelligence",
  "finance",
  "network",
  "quick-entry",
  "import",
  "generators/invoice",
  "generators/payslip",
  "generators/purchase-order",
  "generators/export-docs",
  "converters",
  "calculators",
  "file-morph",
  "audit",
  "settings",
  "settings/backup",
  "settings/api",
  "settings/whatsapp",
  "settings/users",
  "profile"
];

function checkRoute(route) {
  return new Promise((resolve) => {
    const url = `http://localhost:3000/${route}`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          route: `/${route}`,
          statusCode: res.statusCode,
          headers: res.headers,
          bodyLength: data.length,
          preview: data.substring(0, 200).replace(/\n/g, ' ')
        });
      });
    }).on('error', (err) => {
      resolve({
        route: `/${route}`,
        statusCode: 500,
        error: err.message
      });
    });
  });
}

async function run() {
  console.log("Pinging routes on dev server...");
  const results = [];
  for (const route of routes) {
    const res = await checkRoute(route);
    results.push(res);
    console.log(`${res.statusCode === 200 ? '✓' : '✗'} ${res.route} -> ${res.statusCode} (Length: ${res.bodyLength || 0})`);
  }
  
  // Write report
  const fs = require('fs');
  fs.writeFileSync('scratch/ping_results.json', JSON.stringify(results, null, 2));
  console.log("Pinging completed. Results written to scratch/ping_results.json");
}

run();
