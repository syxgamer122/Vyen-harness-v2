const fs = require('fs');
const path = require('path');

const markD = 'M 16 6.4 C 18.2 5 20 4.4 22.2 4.4 C 25.6 4.4 28.5 7.4 28.5 11.8 C 28.5 14.5 27.2 16.5 26.2 17.5 C 25.2 18.2 25.2 18.8 26.2 19.5 C 27.2 20.5 28 22.2 27 24.2 C 25.8 26.5 23.5 27.5 20.5 27.5 C 18.5 27.5 17.2 26.8 16 25.6 C 14.8 26.8 13.5 27.5 11.5 27.5 C 8.5 27.5 6.2 26.5 5 24.2 C 4 22.2 4.8 20.5 5.8 19.5 C 6.8 18.8 6.8 18.2 5.8 17.5 C 4.8 16.5 3.5 14.5 3.5 11.8 C 3.5 7.4 6.4 4.4 9.8 4.4 C 12 4.4 13.8 5 16 6.4 Z';

const innerD = 'M 16 9.5 C 17.8 8.4 19.2 8 20.8 8 C 23.2 8 25.2 10 25.2 13 C 25.2 14.8 24.2 16.2 23.5 17 C 23 17.5 23 18 23.5 18.5 C 24.2 19.2 24.8 20.5 24 22 C 23.2 23.5 21.5 24.2 19.5 24.2 C 18 24.2 17 23.8 16 22.8 C 15 23.8 14 24.2 12.5 24.2 C 10.5 24.2 8.8 23.5 8 22 C 7.2 20.5 7.8 19.2 8.5 18.5 C 9 18 9 17.5 8.5 17 C 7.8 16.2 6.8 14.8 6.8 13 C 6.8 10 8.8 8 11.2 8 C 12.8 8 14.2 8.4 16 9.5 Z';

// 1. vyen-logo-mark.svg (16-32px)
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="vyen-mark-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6BD265" />
      <stop offset="100%" stop-color="#11835F" />
    </linearGradient>
  </defs>
  <path
    d="${markD}"
    stroke="url(#vyen-mark-grad)"
    stroke-width="2.4"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <!-- Circuit Eyes -->
  <line x1="11.5" y1="13.5" x2="14.6" y2="13.5" stroke="#11835F" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="11.5" cy="13.5" r="1.6" fill="#11835F" />
  <line x1="17.4" y1="13.5" x2="20.5" y2="13.5" stroke="#11835F" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="20.5" cy="13.5" r="1.6" fill="#11835F" />
  <!-- Circuit Mouth -->
  <line x1="12.5" y1="19.5" x2="19.5" y2="19.5" stroke="#11835F" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="12.5" cy="19.5" r="1.6" fill="#11835F" />
  <circle cx="19.5" cy="19.5" r="1.6" fill="#11835F" />
</svg>
`;

// 2. vyen-logo-full.svg (48px+)
const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="vyen-full-outer" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6BD265" />
      <stop offset="100%" stop-color="#11835F" />
    </linearGradient>
    <linearGradient id="vyen-full-inner" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8CE587" />
      <stop offset="100%" stop-color="#138762" />
    </linearGradient>
    <linearGradient id="vyen-eye-left" x1="11.5" y1="13.5" x2="14.6" y2="13.5" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#11835F" />
      <stop offset="100%" stop-color="#6BD265" />
    </linearGradient>
    <linearGradient id="vyen-eye-right" x1="17.4" y1="13.5" x2="20.5" y2="13.5" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6BD265" />
      <stop offset="100%" stop-color="#11835F" />
    </linearGradient>
  </defs>
  <!-- Outer Outline Ribbon -->
  <path
    d="${markD}"
    stroke="url(#vyen-full-outer)"
    stroke-width="2.4"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <!-- Inner Highlight Track -->
  <path
    d="${innerD}"
    stroke="url(#vyen-full-inner)"
    stroke-width="1.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    opacity="0.9"
  />
  <!-- Circuit Eyes -->
  <line x1="11.5" y1="13.5" x2="14.6" y2="13.5" stroke="url(#vyen-eye-left)" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="11.5" cy="13.5" r="1.6" fill="#11835F" />
  <line x1="17.4" y1="13.5" x2="20.5" y2="13.5" stroke="url(#vyen-eye-right)" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="20.5" cy="13.5" r="1.6" fill="#11835F" />
  <!-- Circuit Mouth -->
  <line x1="12.5" y1="19.5" x2="19.5" y2="19.5" stroke="#11835F" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="12.5" cy="19.5" r="1.6" fill="#11835F" />
  <circle cx="19.5" cy="19.5" r="1.6" fill="#11835F" />
</svg>
`;

// 3. vyen-logo-mono.svg (currentColor)
const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <path
    d="${markD}"
    stroke="currentColor"
    stroke-width="2.4"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <!-- Circuit Eyes -->
  <line x1="11.5" y1="13.5" x2="14.6" y2="13.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="11.5" cy="13.5" r="1.6" fill="currentColor" />
  <line x1="17.4" y1="13.5" x2="20.5" y2="13.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="20.5" cy="13.5" r="1.6" fill="currentColor" />
  <!-- Circuit Mouth -->
  <line x1="12.5" y1="19.5" x2="19.5" y2="19.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="12.5" cy="19.5" r="1.6" fill="currentColor" />
  <circle cx="19.5" cy="19.5" r="1.6" fill="currentColor" />
</svg>
`;

// 4. app/icon.svg
const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="vyen-icon-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6BD265" />
      <stop offset="100%" stop-color="#11835F" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="#FFFFFF" />
  <rect width="32" height="32" rx="8" stroke="#E5E5E5" stroke-width="1" />
  <path
    d="${markD}"
    stroke="url(#vyen-icon-grad)"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <!-- Circuit Eyes -->
  <line x1="11.5" y1="13.5" x2="14.6" y2="13.5" stroke="#11835F" stroke-width="1.7" stroke-linecap="round" />
  <circle cx="11.5" cy="13.5" r="1.5" fill="#11835F" />
  <line x1="17.4" y1="13.5" x2="20.5" y2="13.5" stroke="#11835F" stroke-width="1.7" stroke-linecap="round" />
  <circle cx="20.5" cy="13.5" r="1.5" fill="#11835F" />
  <!-- Circuit Mouth -->
  <line x1="12.5" y1="19.5" x2="19.5" y2="19.5" stroke="#11835F" stroke-width="1.7" stroke-linecap="round" />
  <circle cx="12.5" cy="19.5" r="1.5" fill="#11835F" />
  <circle cx="19.5" cy="19.5" r="1.5" fill="#11835F" />
</svg>
`;

fs.writeFileSync(path.join(__dirname, '../public/icons/vyen-logo-mark.svg'), markSvg);
fs.writeFileSync(path.join(__dirname, '../public/icons/vyen-logo-full.svg'), fullSvg);
fs.writeFileSync(path.join(__dirname, '../public/icons/vyen-logo-mono.svg'), monoSvg);
fs.writeFileSync(path.join(__dirname, '../public/vyen-logo-mark.svg'), markSvg);
fs.writeFileSync(path.join(__dirname, '../public/vyen-logo-full.svg'), fullSvg);
fs.writeFileSync(path.join(__dirname, '../public/vyen-logo-mono.svg'), monoSvg);
fs.writeFileSync(path.join(__dirname, '../app/icon.svg'), appIconSvg);

console.log('SVGs generated successfully!');
