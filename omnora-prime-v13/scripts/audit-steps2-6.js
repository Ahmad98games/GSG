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

console.log('=== STEP 2 DETAILED BUTTON AUDIT ===');
srcFiles.filter(f => f.endsWith('.tsx')).forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/<button/i.test(line)) {
      if (/onClick=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(line) ||
          /onClick=\{\s*\(\s*\)\s*=>\s*void\s*0\s*\}/.test(line) ||
          /disabled=\{true\}/.test(line) ||
          /disabled=\{!false\}/.test(line) ||
          /cursor-not-allowed/.test(line)) {
        console.log(`${path.relative(process.cwd(), file)}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
});

console.log('\n=== STEP 4: USEEFFECT DEPENDENCY AUDIT ===');
srcFiles.filter(f => f.endsWith('.tsx') || f.endsWith('.ts')).forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const effectRegex = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[\s*\]\s*\)/g;
  let match;
  while ((match = effectRegex.exec(content)) !== null) {
    const body = match[1];
    // Check if body uses state setters, props, or local state variables that are not global
    // Simple heuristic: check for non-global function calls or identifiers defined in component scope
    const usedVars = [];
    const varMatches = body.match(/\b(profile|tier|user|partyId|karigarId|id|skuId|activeTab|selected[A-Z]\w*|fetch[A-Z]\w*|load[A-Z]\w*)\b/g);
    if (varMatches) {
      const relPath = path.relative(process.cwd(), file);
      console.log(`${relPath}: useEffect [] references possible dynamic vars: ${[...new Set(varMatches)].join(', ')}`);
    }
  }
});

console.log('\n=== STEP 5: ASYNC ERROR HANDLING AUDIT ===');
srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/\basync\b/.test(line) && (line.includes('=>') || line.includes('function'))) {
      // Check surrounding lines for try {
      const start = Math.max(0, idx - 2);
      const end = Math.min(lines.length, idx + 20);
      const chunk = lines.slice(start, end).join('\n');
      if (!chunk.includes('try {') && !chunk.includes('.catch(')) {
        console.log(`${path.relative(process.cwd(), file)}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
});

console.log('\n=== STEP 6: FORM SUBMIT VALIDATION AUDIT ===');
srcFiles.filter(f => f.endsWith('.tsx')).forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/onSubmit|handleSubmit|handleSave|handleCreate|handlePost/.test(line)) {
      console.log(`${path.relative(process.cwd(), file)}:${idx + 1}: ${line.trim()}`);
    }
  });
});
