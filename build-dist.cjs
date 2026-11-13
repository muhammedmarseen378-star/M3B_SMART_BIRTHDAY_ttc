const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function copyFile(srcRel, destRel) {
  const src = path.join(rootDir, srcRel);
  const dest = path.join(distDir, destRel || srcRel);
  if (!fs.existsSync(src)) {
    console.warn(`Source file not found: ${srcRel}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${srcRel} -> dist/${destRel || srcRel}`);
}

function copyDir(srcRel, destRel) {
  const src = path.join(rootDir, srcRel);
  const dest = path.join(distDir, destRel || srcRel);
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcEntry = path.join(srcRel, entry.name);
    const destEntry = path.join(destRel || srcRel, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcEntry, destEntry);
    } else {
      copyFile(srcEntry, destEntry);
    }
  }
}

// Ensure clean dist dir
fs.mkdirSync(distDir, { recursive: true });

// 1. Copy index.html
copyFile('index.html');
copyFile('manifest.json');

// 2. Copy css/ and js/ and assets/
copyDir('css');
copyDir('js');
if (fs.existsSync(path.join(rootDir, 'assets'))) {
  copyDir('assets');
}

// 4. Copy raw Excel / CSV dataset files so they are confirmed in the Netlify file
copyFile('data/birthdays.csv', 'data/birthdays.csv');
copyFile('data/birthdays.csv', 'birthdays.csv');
if (fs.existsSync(path.join(rootDir, 'data', 'birthdays.xlsx'))) {
  copyFile('data/birthdays.xlsx', 'data/birthdays.xlsx');
  copyFile('data/birthdays.xlsx', 'birthdays.xlsx');
}

// 5. Copy data JSON files
copyFile('birthdays.json');
copyFile('src/data/birthdays.json', 'data/birthdays.json');

// 6. Create Netlify _redirects file for SPA
const redirectsContent = '/*    /index.html   200\n';
fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent, 'utf8');
console.log('Created dist/_redirects');

// 7. Create Netlify _headers
const headersContent = `/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`;
fs.writeFileSync(path.join(distDir, '_headers'), headersContent, 'utf8');
console.log('Created dist/_headers');

// 8. Netlify TOML in dist
const netlifyToml = `[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
fs.writeFileSync(path.join(distDir, 'netlify.toml'), netlifyToml, 'utf8');
console.log('Created dist/netlify.toml');

console.log('\n=============================================');
console.log('SUCCESS: NTTF M3B STUDENTS BIRTHDAY READY IN DIST!');
console.log('Dist Location: ' + distDir);
console.log('=============================================');
