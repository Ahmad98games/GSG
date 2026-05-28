const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/app');
const tempPath = path.join(__dirname, '../src/app-temp');

if (!fs.existsSync(tempPath)) {
  console.log('src/app-temp does not exist, nothing to restore.');
  process.exit(0);
}

const files = fs.readdirSync(tempPath);
let restoredCount = 0;

for (const file of files) {
  const fullPath = path.join(tempPath, file);
  const destPath = path.join(appPath, file);
  const stat = fs.statSync(fullPath);

  if (stat.isDirectory()) {
    console.log(`Restoring directory: ${file}`);
    fs.renameSync(fullPath, destPath);
    restoredCount++;
  }
}

console.log(`Successfully restored ${restoredCount} directories.`);

// Clean up temp directory
if (fs.existsSync(tempPath)) {
  fs.rmSync(tempPath, { recursive: true, force: true });
  console.log('Cleaned up src/app-temp.');
}
