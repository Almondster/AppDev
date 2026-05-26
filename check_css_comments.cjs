const fs = require('fs');
const css = fs.readFileSync('src/index.css', 'utf8');

let inComment = false;
let lines = css.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length - 1; j++) {
    if (!inComment && line[j] === '/' && line[j+1] === '*') {
      inComment = true;
      j++;
    } else if (inComment && line[j] === '*' && line[j+1] === '/') {
      inComment = false;
      j++;
    }
  }
}

if (inComment) {
  console.log('Error: Unclosed comment found!');
} else {
  console.log('All comments match perfectly.');
}
