import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const babelCode = fs.readFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/tests/babel.min.js', 'utf8');
// Babel Standalone attaches to global or window
const vm = require('vm');
const sandbox = { console, process, setTimeout, clearTimeout };
vm.createContext(sandbox);
vm.runInContext(babelCode, sandbox);

const Babel = sandbox.Babel;
console.log("Babel loaded successfully, version:", Babel ? Babel.version : "not found");

const jsxCode = fs.readFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/tests/extracted.jsx', 'utf8');
try {
  const result = Babel.transform(jsxCode, { presets: ['react'] });
  console.log("Compilation SUCCESS! Output code length:", result.code.length);
} catch (err) {
  console.error("Compilation ERROR:", err.message);
}
