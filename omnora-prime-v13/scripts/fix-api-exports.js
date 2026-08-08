const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const appDir = path.join(__dirname, '../src/app');
let count = 0;

walkDir(appDir, (filePath) => {
  if (filePath.endsWith('route.ts') || filePath.endsWith('route.js')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    if (content.includes("export const dynamic = 'force-dynamic'") || content.includes('export const dynamic = "force-dynamic"')) {
      content = content.replace(/export const dynamic = ['"]force-dynamic['"];?/g, "export const dynamic = 'force-static';");
      modified = true;
    } else if (!content.includes("export const dynamic = 'force-static'") && !content.includes('export const dynamic = "force-static"')) {
      content = `export const dynamic = 'force-static';\n` + content;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      count++;
      console.log(`Updated ${filePath}`);
    }
  }
});

console.log(`Updated ${count} route files to include force-static.`);
