const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      files = files.concat(getAllFiles(filePath, exts));
    } else {
      if (exts.some(ext => filePath.endsWith(ext))) {
        files.push(filePath);
      }
    }
  }
  return files;
}

const srcFiles = getAllFiles(path.join(process.cwd(), 'src'));

console.log('=== STEP 1: TODO, FIXME, PLACEHOLDER, COMING SOON, CONSOLE LOGS ===');
const step1Patterns = [
  /TODO/i, /FIXME/i, /HACK/i, /coming soon/i, /under construction/i,
  /lorem ipsum/i, /not implemented/i, /will be added/i, /WIP/i, /work in progress/i,
  /console\.(log|error|warn)/
];

let step1Count = 0;
srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    step1Patterns.forEach(pat => {
      if (pat.test(line)) {
        const relPath = path.relative(process.cwd(), file);
        // ignore benign loggers if in logger file
        if (relPath.includes('logger') || relPath.includes('startupLog')) return;
        console.log(`${relPath}:${idx + 1}: ${line.trim()}`);
        step1Count++;
      }
    });
  });
});
console.log(`Total Step 1 issues: ${step1Count}\n`);

console.log('=== STEP 2: BUTTONS WITHOUT ONCLICK OR PERMANENTLY DISABLED ===');
srcFiles.filter(f => f.endsWith('.tsx')).forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/<button/i.test(line)) {
      if (/onClick=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(line) ||
          /onClick=\{\s*undefined\s*\}/.test(line) ||
          /disabled=\{\s*true\s*\}/.test(line) ||
          /disabled=\{!false\}/.test(line)) {
        const relPath = path.relative(process.cwd(), file);
        console.log(`${relPath}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
});

console.log('\n=== STEP 3: ROUTING & LINK AUDIT ===');
const pages = getAllFiles(path.join(process.cwd(), 'src/app'), ['.tsx'])
  .filter(f => f.endsWith('page.tsx'))
  .map(f => {
    let p = path.relative(path.join(process.cwd(), 'src/app'), f)
      .replace(/\\/g, '/')
      .replace(/\/page\.tsx$/, '')
      .replace(/^page\.tsx$/, '');
    return '/' + p;
  });

console.log(`Discovered ${pages.length} valid app routes.`);

const routeRegex = /href=["'](\/[^"']+)["']|router\.(push|replace)\(["'](\/[^"']+)["']\)/g;
const deadLinks = new Set();
srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const route = match[1] || match[3];
    if (route && route.startsWith('/')) {
      // Clean query params / hashes
      const cleanRoute = route.split('?')[0].split('#')[0];
      // Skip dynamic parameters or external links
      if (cleanRoute.includes('[') || cleanRoute.startsWith('/api') || cleanRoute === '/') continue;

      const exists = pages.some(p => {
        if (p === cleanRoute) return true;
        // handle dynamic params like /karigars/[id] matching /karigars/123
        const pParts = p.split('/').filter(Boolean);
        const rParts = cleanRoute.split('/').filter(Boolean);
        if (pParts.length !== rParts.length) return false;
        return pParts.every((part, i) => part.startsWith('[') || part === rParts[i]);
      });

      if (!exists) {
        deadLinks.add(`${path.relative(process.cwd(), file)} -> ${cleanRoute}`);
      }
    }
  }
});
console.log('Dead Links Found:');
deadLinks.forEach(dl => console.log(dl));

