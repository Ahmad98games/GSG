const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

function rawToBmp(rawBuffer, width, height) {
  // rawBuffer is top-to-bottom RGB (3 bytes per pixel)
  // BMP rows need to be padded to multiple of 4 bytes
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;

  const buffer = Buffer.alloc(fileSize);

  // File Header
  buffer.write('BM', 0, 2); // Signature
  buffer.writeUInt32LE(fileSize, 2); // File size
  buffer.writeUInt32LE(0, 6); // Reserved
  buffer.writeUInt32LE(54, 10); // Offset to pixel data

  // DIB Header
  buffer.writeUInt32LE(40, 14); // Header size
  buffer.writeInt32LE(width, 18); // Width
  buffer.writeInt32LE(height, 22); // Height
  buffer.writeUInt16LE(1, 26); // Planes
  buffer.writeUInt16LE(24, 28); // Bits per pixel
  buffer.writeUInt32LE(0, 30); // Compression (BI_RGB)
  buffer.writeUInt32LE(pixelDataSize, 34); // Image size
  buffer.writeInt32LE(2835, 38); // X pixels per meter
  buffer.writeInt32LE(2835, 42); // Y pixels per meter
  buffer.writeUInt32LE(0, 46); // Total colors
  buffer.writeUInt32LE(0, 50); // Important colors

  // Pixel data: bottom-to-top, BGR
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width * 3;
    let xOffset = 0;
    for (let x = 0; x < width; x++) {
      const r = rawBuffer[rowStart + x * 3];
      const g = rawBuffer[rowStart + x * 3 + 1];
      const b = rawBuffer[rowStart + x * 3 + 2];
      buffer[offset + xOffset] = b;
      buffer[offset + xOffset + 1] = g;
      buffer[offset + xOffset + 2] = r;
      xOffset += 3;
    }
    // Pad row to multiple of 4 bytes
    while (xOffset < rowSize) {
      buffer[offset + xOffset] = 0;
      xOffset++;
    }
    offset += rowSize;
  }

  return buffer;
}

async function generateAssets() {
  const logoPath = path.join(
    __dirname, '../public/logos/noxis.png'
  )

  // Ensure build folder exists
  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }

  console.log('Generating sidebar BMP...');
  const sidebarWidth = 164;
  const sidebarHeight = 314;
  const sidebarRaw = await sharp({
    create: {
      width: sidebarWidth, height: sidebarHeight,
      channels: 3,
      background: { r: 6, g: 7, b: 8 },
    },
  })
    .composite([{
      input: await sharp(logoPath)
        .resize(100, 100, { fit: 'contain' })
        .toBuffer(),
      top: 60,
      left: 32,
    }])
    .raw()
    .toBuffer();

  const sidebarBmp = rawToBmp(sidebarRaw, sidebarWidth, sidebarHeight);
  await fs.promises.writeFile(path.join(buildDir, 'installerSidebar.bmp'), sidebarBmp);

  console.log('Generating header BMP...');
  const headerWidth = 150;
  const headerHeight = 57;
  const headerRaw = await sharp({
    create: {
      width: headerWidth, height: headerHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{
      input: await sharp(logoPath)
        .resize(40, 40, { fit: 'contain' })
        .toBuffer(),
      top: 8,
      left: 12,
    }])
    .raw()
    .toBuffer();

  const headerBmp = rawToBmp(headerRaw, headerWidth, headerHeight);
  await fs.promises.writeFile(path.join(buildDir, 'installerHeader.bmp'), headerBmp);

  console.log('Installer assets generated successfully!');
}

generateAssets().catch(console.error)
