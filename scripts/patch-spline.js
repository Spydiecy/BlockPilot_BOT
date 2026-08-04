#!/usr/bin/env node

/**
 * Patch @splinetool/react-spline package.json to allow imports
 * This is needed because the package has restrictive exports that prevent webpack from resolving it
 */

const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../node_modules/@splinetool/react-spline/package.json');

try {
  if (!fs.existsSync(pkgPath)) {
    console.log('Spline package not found, skipping patch');
    process.exit(0);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Add main and module fields
  pkg.main = './dist/react-spline.js';
  pkg.module = './dist/react-spline.js';
  
  // Add default export
  if (pkg.exports && pkg.exports['.']) {
    pkg.exports['.'].default = './dist/react-spline.js';
  }
  
  // Allow dist/* imports
  if (pkg.exports) {
    pkg.exports['./dist/*'] = './dist/*';
  }
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('✓ Patched @splinetool/react-spline package successfully');
} catch (error) {
  console.error('Failed to patch Spline package:', error.message);
  process.exit(1);
}
