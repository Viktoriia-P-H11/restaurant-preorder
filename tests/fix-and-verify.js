import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const babelCode = fs.readFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/tests/babel.min.js', 'utf8');
const vm = require('vm');
const sandbox = { console, process, setTimeout, clearTimeout };
vm.createContext(sandbox);
vm.runInContext(babelCode, sandbox);
const Babel = sandbox.Babel;

let html = fs.readFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/frontend/index.html', 'utf8');
html = html.replaceAll('Appetizers -> Salads -> Mains -> Dessert', 'Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert');

// Write back the fixed html
fs.writeFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/frontend/index.html', html);
fs.writeFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/backend/index.html', html);

const startTag = '<script type="text/babel">';
const endTag = '</script>';
const startIndex = html.indexOf(startTag);
const endIndex = html.indexOf(endTag, startIndex);
let script = html.substring(startIndex + startTag.length, endIndex);

try {
  const result = Babel.transform(script, { presets: ['react'] });
  console.log("Transpilation SUCCESS! Transpiled JS size:", result.code.length);
} catch (err) {
  console.error("Transpilation ERROR:", err.message);
  process.exit(1);
}
