const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');

function getPages(dir, routes = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getPages(fullPath, routes);
    } else if (file === 'page.tsx' || file === 'page.js') {
      routes.push(fullPath);
    }
  }
  return routes;
}

const allPages = getPages(appDir);
console.log(`Found ${allPages.length} routes:`);

const cleanRoutes = allPages.map(p => {
  let relative = path.relative(appDir, p);
  // Remove page.tsx or page.js
  relative = relative.replace(/\\/g, '/');
  relative = relative.replace(/\/page\.(tsx|js)$/, '');
  relative = relative.replace(/^page\.(tsx|js)$/, '');
  
  // Remove route groups like (hub), (auth), etc.
  const parts = relative.split('/');
  const filteredParts = parts.filter(part => !part.startsWith('(') || !part.endsWith(')'));
  return '/' + filteredParts.join('/');
}).sort();

console.log(JSON.stringify(cleanRoutes, null, 2));
console.log(`Cleaned route count: ${cleanRoutes.length}`);
