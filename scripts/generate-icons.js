import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const svgBuffer = fs.readFileSync(path.join(publicDir, 'icon.svg'));

// 1. Generate 192x192 PNG
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile(path.join(publicDir, 'pwa-192x192.png'));

// 2. Generate 512x512 PNG
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(path.join(publicDir, 'pwa-512x512.png'));

// 3. Generate 180x180 Apple Touch Icon
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(path.join(publicDir, 'apple-touch-icon.png'));

// 4. Generate Maskable Icon (with 15% safe-zone margin on solid background)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#111111" />
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Outer Orbit Ring -->
    <circle cx="256" cy="256" r="170" fill="none" stroke="#FF530D" stroke-width="10" stroke-dasharray="16 12" opacity="0.6" />
    <circle cx="256" cy="256" r="120" fill="none" stroke="#FBBF3D" stroke-width="8" opacity="0.8" />
    <!-- Stylized M -->
    <path d="M 160 340 L 160 172 L 256 268 L 352 172 L 352 340" fill="none" stroke="#FF530D" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="256" cy="330" r="18" fill="#FBBF3D" />
  </g>
</svg>`;

await sharp(Buffer.from(maskableSvg))
  .resize(512, 512)
  .png()
  .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

// 5. Generate Favicon 48x48
await sharp(svgBuffer)
  .resize(48, 48)
  .png()
  .toFile(path.join(publicDir, 'favicon.ico'));

console.log('All PWA PNG icons generated successfully in /public!');
