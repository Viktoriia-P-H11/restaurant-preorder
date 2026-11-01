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
  const res = Babel.transform(script, {
    presets: [
      ['react', { runtime: 'classic' }]
    ]
  });
  console.log('Classic React.createElement compilation SUCCESS! JS length:', res.code.length);
  // Test executing in a mock window sandbox with React
  const testSandbox = {
    console,
    React: {
      useState: (init) => [init, () => {}],
      useEffect: () => {},
      useMemo: (fn) => fn(),
      createElement: () => ({})
    },
    ReactDOM: {
      createRoot: () => ({ render: () => {} })
    },
    document: {
      getElementById: () => ({})
    },
    window: {
      location: { origin: 'https://8191ergrtg.execute-api.us-west-2.amazonaws.com', href: 'https://8191ergrtg.execute-api.us-west-2.amazonaws.com' }
    }
  };
  vm.createContext(testSandbox);
  vm.runInContext(res.code, testSandbox);
  console.log('App initialization executed in sandbox with ZERO runtime errors!');
} catch(err) {
  console.error('ERROR:', err);
  process.exit(1);
}
