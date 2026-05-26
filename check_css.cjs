const fs = require('fs');
const css = fs.readFileSync('src/index.css', 'utf8');

let depth = 0;
let lines = css.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') depth++;
    if (line[j] === '}') depth--;
  }
  if (depth < 0) {
    console.log(`Error: Extra } at line ${i + 1}`);
    break;
  }
}
if (depth > 0) {
  console.log(`Error: Missing ${depth} closing } brace(s)`);
} else if (depth === 0) {
  console.log('All braces match perfectly.');
}
