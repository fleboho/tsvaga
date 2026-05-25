const sharp = require('sharp');
const { writeFileSync } = require('fs');
const path = require('path');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect x="39" y="39" width="18" height="6" rx="3" fill="url(#g)" transform="rotate(45 48 42)"/>
  <circle cx="24" cy="24" r="20" fill="none" stroke="url(#g)" stroke-width="5"/>
  <circle cx="24" cy="24" r="17" fill="#f0f9ff" opacity="0.1"/>
  <!-- U-turn return arrow -->
  <path d="M32 18 
           L32 16 
           C32 14 32 14 30 14 
           L18 14 
           C16 14 16 14 16 16 
           L16 28 
           C16 30 16 30 18 30 
           L32 30"
        fill="none" stroke="url(#g)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32 30 L26 24 M32 30 L26 34"
        fill="none" stroke="url(#g)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="14" r="2.5" fill="white" opacity="0.5"/>
</svg>`;

async function main() {
  const outDir = path.join(__dirname, '..', 'public');

  // Preview
  const preview = await sharp(Buffer.from(SVG)).resize(256, 256).png().toBuffer();
  writeFileSync(path.join(outDir, 'favicon-preview.png'), preview);

  // ICO with multiple sizes
  const sizes = [16, 32, 48, 64];
  const pngBuffers = [];
  for (const size of sizes) {
    pngBuffers.push({
      size,
      buf: await sharp(Buffer.from(SVG)).resize(size, size).png().toBuffer(),
    });
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  let offset = 6 + sizes.length * 16;
  const entries = [];
  const imageDataList = [];
  for (const { size, buf } of pngBuffers) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size, 0);
    e.writeUInt8(size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    imageDataList.push(buf);
    offset += buf.length;
  }

  const ico = Buffer.concat([header, ...entries, ...imageDataList]);
  writeFileSync(path.join(outDir, 'favicon.ico'), ico);
  console.log('✅ favicon.ico - ' + sizes.join('x, ') + 'x - ' + (ico.length / 1024).toFixed(1) + ' KB');
}

main().catch(console.error);
