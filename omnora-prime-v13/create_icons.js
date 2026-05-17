const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIco() {
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }

  // Create multiple sizes for ICO (not strictly needed as PNG works for electron-builder, but good for local)
  const sizes = [16, 32, 48, 64, 128, 256];
  
  // Save 256x256 PNG as icon (electron-builder handles ICO conversion)
  // Using a solid background for the taskbar icon to ensure visibility
  await sharp('public/logos/noxis.png')
    .resize(256, 256, { fit: 'contain', background: { r: 18, g: 20, b: 23, alpha: 1 } })
    .png()
    .toFile('build/icon.png');
  
  // Also save a transparent one
  await sharp('public/logos/noxis.png')
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('build/icon-transparent.png');

  // electron-builder will handle ICO conversion from icon.png automatically
  
  console.log('Icons created in build/');
}

createIco().catch(console.error);
