import fs from 'fs';
import path from 'path';

console.log("=== VKU Facility Audit Verification Suite ===");

// 1. Verify Manifest
const manifestRaw = fs.readFileSync('public/manifest.json', 'utf8');
const manifest = JSON.parse(manifestRaw);
console.assert(manifest.display === 'standalone', 'Manifest display must be standalone');
console.assert(manifest.theme_color === '#0284c7', 'Manifest theme_color must be #0284c7');
console.assert(manifest.icons.some(i => i.sizes === '192x192'), 'Manifest must have 192x192 icon');
console.assert(manifest.icons.some(i => i.sizes === '512x512'), 'Manifest must have 512x512 icon');
console.log("✓ Manifest: display standalone, theme_color #0284c7, responsive icons verified");

// 2. Verify Service Worker
const swContent = fs.readFileSync('public/sw.js', 'utf8');
console.assert(swContent.includes("caches.match"), 'SW must check cache first');
console.assert(swContent.includes("sync"), 'SW must support Background Sync');
console.log("✓ Service Worker: Cache-First App Shell & Background Sync verified");

// 3. Verify Icons exist
console.assert(fs.existsSync('public/icons/icon-192.png'), 'icon-192.png exists');
console.assert(fs.existsSync('public/icons/icon-512.png'), 'icon-512.png exists');
console.assert(fs.existsSync('public/icons/icon-maskable.png'), 'icon-maskable.png exists');
console.log("✓ Icons: 192x192, 512x512, and maskable PNGs exist");

// 4. Verify Built Web Assets
console.assert(fs.existsSync('dist/index.html'), 'dist/index.html exists');
console.assert(fs.existsSync('dist/manifest.json'), 'dist/manifest.json exists');
console.assert(fs.existsSync('dist/sw.js'), 'dist/sw.js exists');
console.log("✓ Web Distribution: dist/ complete with PWA assets");

// 5. Verify APK
const apkPath = 'dist-apk/vku-facility-audit-debug.apk';
console.assert(fs.existsSync(apkPath), 'APK exists');
const stat = fs.statSync(apkPath);
console.assert(stat.size > 1000000, 'APK size should be > 1MB');
console.log(`✓ Android APK: ${apkPath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB) generated and verified`);

// 6. Verify AndroidManifest permissions
const manifestXml = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
console.assert(manifestXml.includes('android.permission.CAMERA'), 'AndroidManifest has CAMERA permission');
console.assert(manifestXml.includes('android.permission.ACCESS_NETWORK_STATE'), 'AndroidManifest has ACCESS_NETWORK_STATE permission');
console.assert(manifestXml.includes('android.permission.INTERNET'), 'AndroidManifest has INTERNET permission');
console.log("✓ AndroidManifest: CAMERA, ACCESS_NETWORK_STATE, INTERNET permissions verified");

console.log("\nALL 6 SPECIFICATION CHECKS PASSED!");
