/**
 * Sinh lại bộ icon PNG + favicon.ico từ SVG dựng ngay trong file này.
 *
 * `sharp` ở đây là dependency KHÔNG khai báo: nó resolve được nhờ được
 * `next` khai ở optionalDependencies và bị hoist lên node_modules đời
 * (lockfile: `node_modules/sharp` 0.35.3, `optional: true`). Nên
 * `npm ci --omit=optional` sẽ làm script chết. Cố ý không thêm sharp vào
 * package.json — đây là công cụ chạy tay một lần, không nằm trong build,
 * không nằm trong CI, không ai gọi nó từ npm script nào. Icon đã sinh xong
 * được commit vào public/, nên đổi logo thì chạy script này một lần rồi
 * commit kết quả.
 *
 * Chạy: `node scripts/generate-png-icons.cjs` (từ gốc repo).
 * Nếu vừa `npm ci --omit=optional`, cài tạm sharp trước:
 * `npm i sharp --no-save`.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Back up existing icons
const backupDir = path.join(__dirname, '../.backup/icons');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const targets = [
  'public/icons/icon-180.png',
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'public/icons/maskable-512.png',
  'public/favicon.ico'
];

for (const rel of targets) {
  const full = path.join(__dirname, '..', rel);
  if (fs.existsSync(full)) {
    const dest = path.join(backupDir, path.basename(rel));
    fs.copyFileSync(full, dest);
  }
}
console.log('Backed up existing icons to .backup/icons/');

const markD = 'M 16 6.4 C 18.2 5 20 4.4 22.2 4.4 C 25.6 4.4 28.5 7.4 28.5 11.8 C 28.5 14.5 27.2 16.5 26.2 17.5 C 25.2 18.2 25.2 18.8 26.2 19.5 C 27.2 20.5 28 22.2 27 24.2 C 25.8 26.5 23.5 27.5 20.5 27.5 C 18.5 27.5 17.2 26.8 16 25.6 C 14.8 26.8 13.5 27.5 11.5 27.5 C 8.5 27.5 6.2 26.5 5 24.2 C 4 22.2 4.8 20.5 5.8 19.5 C 6.8 18.8 6.8 18.2 5.8 17.5 C 4.8 16.5 3.5 14.5 3.5 11.8 C 3.5 7.4 6.4 4.4 9.8 4.4 C 12 4.4 13.8 5 16 6.4 Z';
const innerD = 'M 16 9.5 C 17.8 8.4 19.2 8 20.8 8 C 23.2 8 25.2 10 25.2 13 C 25.2 14.8 24.2 16.2 23.5 17 C 23 17.5 23 18 23.5 18.5 C 24.2 19.2 24.8 20.5 24 22 C 23.2 23.5 21.5 24.2 19.5 24.2 C 18 24.2 17 23.8 16 22.8 C 15 23.8 14 24.2 12.5 24.2 C 10.5 24.2 8.8 23.5 8 22 C 7.2 20.5 7.8 19.2 8.5 18.5 C 9 18 9 17.5 8.5 17 C 7.8 16.2 6.8 14.8 6.8 13 C 6.8 10 8.8 8 11.2 8 C 12.8 8 14.2 8.4 16 9.5 Z';

function buildSvgSquare({ size, logoPadding = 0.16, withSquircle = true, withInner = false, fullBleedBg = false }) {
  const pad = size * logoPadding;
  const logoSize = size - pad * 2;
  const rx = withSquircle ? Math.round(size * 0.22) : 0;
  const scale = logoSize / 32;

  const bgRect = fullBleedBg
    ? `<rect width="${size}" height="${size}" fill="#FFFFFF" />`
    : withSquircle
    ? `<rect width="${size}" height="${size}" rx="${rx}" fill="#FFFFFF" /><rect width="${size}" height="${size}" rx="${rx}" stroke="#E5E5E5" stroke-width="${Math.max(1, Math.round(size * 0.015))}" fill="none" />`
    : '';

  const innerTrack = withInner
    ? `
    <path
      d="${innerD}"
      stroke="url(#inner-grad)"
      stroke-width="1.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.9"
    />`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">
    <defs>
      <linearGradient id="outer-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#6BD265" />
        <stop offset="100%" stop-color="#11835F" />
      </linearGradient>
      <linearGradient id="inner-grad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#8CE587" />
        <stop offset="100%" stop-color="#138762" />
      </linearGradient>
    </defs>
    ${bgRect}
    <g transform="translate(${pad}, ${pad}) scale(${scale})">
      <path
        d="${markD}"
        stroke="url(#outer-grad)"
        stroke-width="${withInner ? '2.4' : '2.3'}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      ${innerTrack}
      <line x1="11.5" y1="13.5" x2="14.6" y2="13.5" stroke="#11835F" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="11.5" cy="13.5" r="1.6" fill="#11835F" />
      <line x1="17.4" y1="13.5" x2="20.5" y2="13.5" stroke="#11835F" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="20.5" cy="13.5" r="1.6" fill="#11835F" />
      <line x1="12.5" y1="19.5" x2="19.5" y2="19.5" stroke="#11835F" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="12.5" cy="19.5" r="1.6" fill="#11835F" />
      <circle cx="19.5" cy="19.5" r="1.6" fill="#11835F" />
    </g>
  </svg>`;
}

async function run() {
  // 1. icon-180.png (Apple touch icon: 180x180, white squircle)
  const svg180 = buildSvgSquare({ size: 180, logoPadding: 0.15, withSquircle: true, withInner: false });
  await sharp(Buffer.from(svg180)).png().toFile(path.join(__dirname, '../public/icons/icon-180.png'));
  console.log('Generated icon-180.png');

  // 2. icon-192.png (PWA icon: 192x192, white squircle)
  const svg192 = buildSvgSquare({ size: 192, logoPadding: 0.14, withSquircle: true, withInner: false });
  await sharp(Buffer.from(svg192)).png().toFile(path.join(__dirname, '../public/icons/icon-192.png'));
  console.log('Generated icon-192.png');

  // 3. icon-512.png (High-res PWA icon: 512x512, withInner track)
  const svg512 = buildSvgSquare({ size: 512, logoPadding: 0.14, withSquircle: true, withInner: true });
  await sharp(Buffer.from(svg512)).png().toFile(path.join(__dirname, '../public/icons/icon-512.png'));
  console.log('Generated icon-512.png');

  // 4. maskable-512.png (Full bleed solid white background, logo fits inside 410px safe circle)
  // 0.20 padding gives 307px logo size, comfortably within 410px safe circle
  const svgMaskable = buildSvgSquare({ size: 512, logoPadding: 0.20, withSquircle: false, withInner: true, fullBleedBg: true });
  await sharp(Buffer.from(svgMaskable)).png().toFile(path.join(__dirname, '../public/icons/maskable-512.png'));
  console.log('Generated maskable-512.png');

  // 5. favicon.ico (Multi-size ICO with 16x16 and 32x32 transparent PNGs)
  const svgFav16 = buildSvgSquare({ size: 16, logoPadding: 0.05, withSquircle: false, withInner: false });
  const png16 = await sharp(Buffer.from(svgFav16)).png().toBuffer();

  const svgFav32 = buildSvgSquare({ size: 32, logoPadding: 0.06, withSquircle: false, withInner: false });
  const png32 = await sharp(Buffer.from(svgFav32)).png().toBuffer();

  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(2, 4); // 2 images

  // Directory entries: 16 bytes each
  const entry16 = Buffer.alloc(16);
  entry16[0] = 16; // width
  entry16[1] = 16; // height
  entry16[2] = 0;  // palette count
  entry16[3] = 0;  // reserved
  entry16.writeUInt16LE(1, 4); // color planes
  entry16.writeUInt16LE(32, 6); // bits per pixel
  entry16.writeUInt32LE(png16.length, 8); // size
  entry16.writeUInt32LE(6 + 16 * 2, 12); // offset

  const entry32 = Buffer.alloc(16);
  entry32[0] = 32; // width
  entry32[1] = 32; // height
  entry32[2] = 0;
  entry32[3] = 0;
  entry32.writeUInt16LE(1, 4);
  entry32.writeUInt16LE(32, 6);
  entry32.writeUInt32LE(png32.length, 8);
  entry32.writeUInt32LE(6 + 16 * 2 + png16.length, 12); // offset

  const icoBuf = Buffer.concat([header, entry16, entry32, png16, png32]);
  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuf);
  console.log('Generated public/favicon.ico (16x16 + 32x32)');

  console.log('All icons generated successfully!');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
