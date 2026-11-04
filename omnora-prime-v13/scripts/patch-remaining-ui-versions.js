const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');

function patch(relPath, fn) {
  const full = path.join(baseDir, relPath);
  if (!fs.existsSync(full)) {
    console.error(`Not found: ${relPath}`);
    return;
  }
  const prev = fs.readFileSync(full, 'utf8');
  const next = fn(prev);
  if (prev !== next) {
    fs.writeFileSync(full, next, 'utf8');
    console.log(`Patched: ${relPath}`);
  } else {
    console.warn(`No match in: ${relPath}`);
  }
}

// 1. ReleaseNotesModal.tsx
patch('src/components/shell/ReleaseNotesModal.tsx', content => {
  let res = content;
  // Replace title in first fix
  res = res.replace(
    "title: 'Noxis Hub v13.0.1 — Official Production Gold Master',",
    "title: `Noxis Hub v${CURRENT_VERSION} — Industrial Edition Gold Master`,"
  );
  res = res.replace(
    "description: 'Initial production rollout featuring full industrial ERP dual-entry Khata ledger with interactive voucher print preview, offline cache persistence, and hardware-bound security.'",
    "description: 'Enterprise release featuring silent thermal receipt printing via Electron IPC, RS-232 industrial weighbridge telemetry stream, full A4 PDF invoice generation, and double-entry ledger resilience.'"
  );
  res = res.replace(
    'Build 2026.09',
    'Build 2026.11'
  );
  return res;
});

// 2. KeyboardShortcuts.tsx
patch('src/components/shell/KeyboardShortcuts.tsx', content => {
  return content.replace(
    'Noxis OS v13.0 • Optimized for Industrial Workflow',
    'Noxis OS v{process.env.NEXT_PUBLIC_APP_VERSION || \'14.0.26\'} • Optimized for Industrial Workflow'
  );
});

// 3. settings/page.tsx
patch('src/app/settings/page.tsx', content => {
  return content.replace(
    "appVersion: '13.0.0',",
    "appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '14.0.26',"
  );
});

// 4. settings/license/page.tsx
patch('src/app/settings/license/page.tsx', content => {
  return content.replace(
    "appVersion: '13.0.3',",
    "appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '14.0.26',"
  );
});

// 5. settings/import/page.tsx
patch('src/app/settings/import/page.tsx', content => {
  return content.replace(
    'Auto-Detection v13.0.8',
    'Auto-Detection v{process.env.NEXT_PUBLIC_APP_VERSION || \'14.0.26\'}'
  );
});

// 6. export/page.tsx
patch('src/app/export/page.tsx', content => {
  return content.replace(
    'Industrial Extraction System v13.0',
    'Industrial Extraction System v{process.env.NEXT_PUBLIC_APP_VERSION || \'14.0.26\'}'
  );
});

// 7. production/page.tsx
patch('src/app/production/page.tsx', content => {
  return content.replace(
    'Live Intelligence Stream • Noxis v13.0',
    'Live Intelligence Stream • Noxis v{process.env.NEXT_PUBLIC_APP_VERSION || \'14.0.26\'}'
  );
});

// 8. purchase/suppliers/page.tsx
patch('src/app/purchase/suppliers/page.tsx', content => {
  return content.replace(
    'Performance Analytics • Noxis Industrial v13.0',
    'Performance Analytics • Noxis Industrial v{process.env.NEXT_PUBLIC_APP_VERSION || \'14.0.26\'}'
  );
});

// 9. (hub)/inventory/transfers/inter-branch/page.tsx
patch('src/app/(hub)/inventory/transfers/inter-branch/page.tsx', content => {
  return content.replace(
    'Cross-Site Asset Orchestration v13.0',
    'Cross-Site Asset Orchestration v{process.env.NEXT_PUBLIC_APP_VERSION || \'14.0.26\'}'
  );
});

// 10. network-preview/NetworkPreviewClient.tsx
patch('src/app/network-preview/NetworkPreviewClient.tsx', content => {
  return content.replace(
    'Noxis Sovereign Industrial Grid v13.0',
    'Noxis Sovereign Industrial Grid v{process.env.NEXT_PUBLIC_APP_VERSION || \'14.0.26\'}'
  );
});

// 11. components/download/OrderConfirmation.tsx
patch('src/components/download/OrderConfirmation.tsx', content => {
  let res = content.replace(
    "'Noxis Setup 13.0.0.exe'",
    "`Noxis Setup ${process.env.NEXT_PUBLIC_APP_VERSION || '14.0.26'}.exe`"
  );
  res = res.replace(
    "'Noxis Setup 13.0.0.exe'",
    "`Noxis Setup ${process.env.NEXT_PUBLIC_APP_VERSION || '14.0.26'}.exe`"
  );
  return res;
});

// 12. api/download/route.ts
patch('src/app/api/download/route.ts', content => {
  return content.replace(
    '"NOXIS_Prime_v13.0.4_x64.exe"',
    '`NOXIS_Prime_v${process.env.NEXT_PUBLIC_APP_VERSION || \'14.0.26\'}_x64.exe`'
  );
});

