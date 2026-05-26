const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'src', 'styles');
const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));

for (const file of files) {
  const filePath = path.join(stylesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  content = content.replace(/var\(--text-primary\);fff;/g, 'var(--text-primary);');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed fff in', file);
  }
}
