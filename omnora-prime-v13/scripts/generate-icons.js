const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const rawPngToIco = require('png-to-ico');
const pngToIco = rawPngToIco.default || rawPngToIco;

async function generateAllIcons() {
  const root = path.resolve(__dirname, '..');
  const buildDir = path.join(root, 'build');
  const logoSrc = path.join(root, 'public', 'logos', 'noxis.png');

  if (!fs.existsSync(logoSrc)) {
    console.error('Source logo not found at:', logoSrc);
    process.exit(1);
  }

  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = [];

  for (const size of sizes) {
    const buf = await sharp(logoSrc)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push(buf);
  }

  // 1. Generate master 256x256 PNG
  await sharp(logoSrc)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(buildDir, 'icon.png'));

  // 2. Generate multi-resolution ICO for Windows
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(root, 'icon.ico'), icoBuffer);

  console.log('✓ Successfully generated build/icon.ico and build/icon.png with all Windows resolutions (16-256px)');
}

generateAllIcons().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
