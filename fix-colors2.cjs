const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'src', 'styles');
const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css') && f !== 'LandingPage.css');

const replacements = [
  // Backgrounds without trailing semicolon
  { regex: /background:\s*#18181b(?![a-zA-Z0-9])/g, replacement: 'background: var(--bg-secondary)' },
  { regex: /background-color:\s*#18181b(?![a-zA-Z0-9])/g, replacement: 'background-color: var(--bg-secondary)' },
  { regex: /background:\s*#0e0e11(?![a-zA-Z0-9])/g, replacement: 'background: var(--bg-primary)' },
  { regex: /background:\s*#141417(?![a-zA-Z0-9])/g, replacement: 'background: var(--bg-secondary)' },
  { regex: /background:\s*#050505(?![a-zA-Z0-9])/g, replacement: 'background: var(--bg-primary)' },
  { regex: /background:\s*#0a0a0a(?![a-zA-Z0-9])/g, replacement: 'background: var(--bg-secondary)' },
  { regex: /background:\s*#27272a(?![a-zA-Z0-9])/g, replacement: 'background: var(--bg-card)' },
  
  // Color without trailing semicolon
  { regex: /color:\s*#fff(?![a-zA-Z0-9])/gi, replacement: 'color: var(--text-primary)' },
  { regex: /color:\s*#ffffff(?![a-zA-Z0-9])/gi, replacement: 'color: var(--text-primary)' },
  { regex: /color:\s*#fafafa(?![a-zA-Z0-9])/gi, replacement: 'color: var(--text-primary)' },
  { regex: /color:\s*#a1a1aa(?![a-zA-Z0-9])/gi, replacement: 'color: var(--text-muted)' },
  { regex: /color:\s*#d4d4d8(?![a-zA-Z0-9])/gi, replacement: 'color: var(--text-secondary)' },
  { regex: /color:\s*#71717a(?![a-zA-Z0-9])/gi, replacement: 'color: var(--text-dim)' },
  
  // Borders
  { regex: /border:\s*1px solid #27272a(?![a-zA-Z0-9])/g, replacement: 'border: 1px solid var(--border)' },
  { regex: /border-color:\s*#27272a(?![a-zA-Z0-9])/g, replacement: 'border-color: var(--border)' }
];

for (const file of files) {
  const filePath = path.join(stylesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  }
}
