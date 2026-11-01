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
const startTag = '<script type="text/babel">';
const endTag = '</script>';
const startIndex = html.indexOf(startTag);
const endIndex = html.indexOf(endTag, startIndex);
let script = html.substring(startIndex + startTag.length, endIndex);

try {
  const res = Babel.transform(script, { presets: ['react'] });
  console.log('Babel successfully compiled jsx! JS length:', res.code.length);
  vm.compileFunction(res.code, ['React', 'ReactDOM']);
  console.log('Compiled JS function is 100% syntactically valid in V8 engine!');
} catch(err) {
  console.error('ERROR:', err);
  process.exit(1);
}
