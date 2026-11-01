import fs from 'fs';

const html = fs.readFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/frontend/index.html', 'utf8');
const startTag = '<script type="text/babel">';
const endTag = '</script>';

const startIndex = html.indexOf(startTag);
if (startIndex === -1) {
  console.error("Start tag not found!");
  process.exit(1);
}

const endIndex = html.indexOf(endTag, startIndex);
if (endIndex === -1) {
  console.error("End tag not found!");
  process.exit(1);
}

const script = html.substring(startIndex + startTag.length, endIndex);
fs.writeFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/tests/extracted.jsx', script);
console.log("Extracted jsx size:", script.length);
