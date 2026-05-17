const fs = require('fs');
const path = require('path');

const rootDir = path.join(process.cwd(), 'src');

const replacements = [
  { from: /'PKR'/g, to: "profile?.currency || 'PKR'" },
  { from: /"PKR"/g, to: "profile?.currency || 'PKR'" },
  // For labels, we'll try to find common patterns
  { from: /\(Rs\.\)/g, to: "(${currencySymbol})" },
  { from: /Rs\./g, to: "${currencySymbol}" },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Special handling for useBusinessProfile and PersonaEngine which we already fixed or will fix manually
      if (fullPath.includes('useBusinessProfile.ts') || fullPath.includes('PersonaEngine.ts') || fullPath.includes('currencies.ts')) {
        continue;
      }

      for (const r of replacements) {
        if (r.from.test(content)) {
          content = content.replace(r.from, r.to);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

walk(rootDir);
