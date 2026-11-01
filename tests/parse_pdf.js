import fs from 'fs';
import zlib from 'zlib';

const buf = fs.readFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/tests/user_story_download');
const streamMarker = Buffer.from('stream\r\n');
let streamStart = buf.indexOf(streamMarker);
if (streamStart === -1) {
  streamStart = buf.indexOf(Buffer.from('stream\n'));
  streamStart += 7;
} else {
  streamStart += 8;
}

const endMarker = Buffer.from('endstream');
const streamEnd = buf.indexOf(endMarker, streamStart);

const compressed = buf.subarray(streamStart, streamEnd);
try {
  const decompressed = zlib.inflateSync(compressed);
  const text = decompressed.toString('utf8');
  fs.writeFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/tests/user_story_text.txt', text);
  console.log("Decompressed successfully! Size:", text.length);
  // Extract readable text from PDF operators (Tj, TJ)
  const lines = text.match(/\((.*?)\)\s*Tj/g) || [];
  console.log("Extracted lines count:", lines.length);
  const cleanText = lines.map(l => l.replace(/^\(|\)\s*Tj$/g, '')).join('\n');
  fs.writeFileSync('c:/Users/torri/OneDrive/Рабочий стол/таски/restaurant-js/tests/clean_user_story.txt', cleanText);
  console.log("--- PREVIEW ---");
  console.log(cleanText.substring(0, 500));
} catch (e) {
  console.error("Inflation error:", e);
}
