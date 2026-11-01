import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const babelCode = fs.readFileSync(path.join(rootDir, 'tests', 'babel.min.js'), 'utf8');
const vm = require('vm');
const sandbox = { console, process, setTimeout, clearTimeout };
vm.createContext(sandbox);
vm.runInContext(babelCode, sandbox);
const Babel = sandbox.Babel;

// Source HTML with JSX
const rawHtml = fs.readFileSync(path.join(rootDir, 'frontend', 'index.html'), 'utf8');

const startTag = '<script type="text/babel">';
const endTag = '</script>';
const startIndex = rawHtml.indexOf(startTag);
const endIndex = rawHtml.indexOf(endTag, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find script type='text/babel' tag!");
  process.exit(1);
}

let jsxScript = rawHtml.substring(startIndex + startTag.length, endIndex);
// Ensure all -> in text are clean
jsxScript = jsxScript.replaceAll('Appetizers -> Salads -> Mains -> Dessert', 'Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert');

// Transpile with classic React.createElement runtime
const transpiled = Babel.transform(jsxScript, {
  presets: [
    ['react', { runtime: 'classic' }]
  ]
});

console.log("Transpilation succeeded! Transpiled code length:", transpiled.code.length);

// Construct production-ready, ultra-fast index.html without Babel client dependency
const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Green &amp; Tasty - Multi-Role Restaurant &amp; Pre-Order Platform</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- React 18 & ReactDOM Production -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>

  <!-- Font Poppins / Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    body { font-family: 'Poppins', 'Plus Jakarta Sans', sans-serif; background-color: #FAF9F6; }
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
  </style>
</head>
<body class="min-h-screen text-gray-900 flex flex-col">

  <!-- React Root Container -->
  <div id="root" class="w-full flex-1 flex flex-col"></div>

  <!-- Pre-compiled Pure React 18 Script (Instant Load, Zero Babel Overhead) -->
  <script>
${transpiled.code}
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'frontend', 'index.html'), finalHtml);
fs.writeFileSync(path.join(rootDir, 'backend', 'index.html'), finalHtml);
console.log("Updated both frontend/index.html and backend/index.html successfully!");
