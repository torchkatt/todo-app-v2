// Quick PWA icon generator — generates PNG icons from SVG
// Run with: node scripts/generate-pwa-icons.mjs
const { writeFileSync } = require('fs');

function createSVG(size, bg = '#7c3aed', text = 'T') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${bg}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui" font-weight="800" font-size="${size * 0.5}" fill="white">${text}</text>
</svg>`;
}

// Write SVGs (browsers can convert these)
writeFileSync('public/pwa-icon-192.svg', createSVG(192));
writeFileSync('public/pwa-icon-512.svg', createSVG(512));
console.log('✅ PWA icon SVGs generated');
console.log('   To convert to PNG: open the SVGs in browser and screenshot,');
console.log('   or use an online SVG→PNG converter to create pwa-192x192.png and pwa-512x512.png');
console.log('   Place them in the public/ directory.');
