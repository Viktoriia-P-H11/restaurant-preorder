import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const babelCode = fs.readFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/tests/babel.min.js', 'utf8');
const vm = require('vm');
const sandbox = { console, process, setTimeout, clearTimeout };
vm.createContext(sandbox);
vm.runInContext(babelCode, sandbox);
const Babel = sandbox.Babel;

let jsxCode = fs.readFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/frontend/index.html', 'utf8');
const startTag = '<script type="text/babel">';
const endTag = '</script>';
const startIndex = jsxCode.indexOf(startTag);
const endIndex = jsxCode.indexOf(endTag, startIndex);
let script = jsxCode.substring(startIndex + startTag.length, endIndex);

// Test replace ->
script = script.replaceAll('Appetizers -> Salads -> Mains -> Dessert', 'Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert');

try {
  const result = Babel.transform(script, { presets: ['react'] });
  console.log("Compilation SUCCESS! Transpiled JS size:", result.code.length);
} catch (err) {
  console.error("Compilation ERROR:", err.message);
}
