const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'src', 'styles');
const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css') && f !== 'LandingPage.css');

const replacements = [
  // Missing background colors
  { regex: /background:\s*#28282f(?![a-zA-Z0-9])/g, replacement: 'background: var(--bg-card)' }, // In MessagesPage
  { regex: /background:\s*rgba\(0,0,0,0.04\)/g, replacement: 'background: var(--bg-card)' },
  
  // Grey text colors
  { regex: /color:\s*#[0-9a-fA-F]{6}(?![a-zA-Z0-9])/g, replacement: (match) => {
      const lower = match.toLowerCase();
      const muted = ['#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#94a3b8'];
      const secondary = ['#d4d4d8', '#e4e4e7', '#cbd5e1', '#e2e8f0', '#f4f4f5', '#dbeafe', '#93c5fd'];
      for (const m of muted) {
          if (lower.includes(m)) return 'color: var(--text-muted)';
      }
      for (const s of secondary) {
          if (lower.includes(s)) return 'color: var(--text-secondary)';
      }
      return match;
  }}
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
