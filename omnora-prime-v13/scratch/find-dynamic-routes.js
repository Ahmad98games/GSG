const fs = require('fs');
const path = require('path');

function findDynamicPages(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findDynamicPages(filePath, fileList);
    } else if (file === 'page.tsx' || file === 'page.js') {
      if (filePath.includes('[') && filePath.includes(']')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const srcApp = path.join(process.cwd(), 'src/app');
const dynamicPages = findDynamicPages(srcApp);
console.log('DYNAMIC PAGES FOUND:');
dynamicPages.forEach(p => console.log(p));
