const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'src', 'styles');
const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css') && f !== 'LandingPage.css');

const replacements = [
  // Backgrounds
  { regex: /background:\s*#18181b;?/g, replacement: 'background: var(--bg-secondary);' },
  { regex: /background-color:\s*#18181b;?/g, replacement: 'background-color: var(--bg-secondary);' },
  { regex: /background:\s*#0e0e11;?/g, replacement: 'background: var(--bg-primary);' },
  { regex: /background:\s*#141417;?/g, replacement: 'background: var(--bg-secondary);' },
  { regex: /background:\s*#050505;?/g, replacement: 'background: var(--bg-primary);' },
  { regex: /background:\s*#0a0a0a;?/g, replacement: 'background: var(--bg-secondary);' },
  { regex: /background:\s*#27272a;?/g, replacement: 'background: var(--bg-card);' },
  
  // Text colors
  { regex: /color:\s*#fff;?/gi, replacement: 'color: var(--text-primary);' },
  { regex: /color:\s*#ffffff;?/gi, replacement: 'color: var(--text-primary);' },
  { regex: /color:\s*#fafafa;?/gi, replacement: 'color: var(--text-primary);' },
  { regex: /color:\s*#a1a1aa;?/gi, replacement: 'color: var(--text-muted);' },
  { regex: /color:\s*#d4d4d8;?/gi, replacement: 'color: var(--text-secondary);' },
  { regex: /color:\s*#71717a;?/gi, replacement: 'color: var(--text-dim);' },
  
  // Borders
  { regex: /border:\s*1px solid #27272a;?/g, replacement: 'border: 1px solid var(--border);' },
  { regex: /border-bottom:\s*1px solid #27272a;?/g, replacement: 'border-bottom: 1px solid var(--border);' },
  { regex: /border-top:\s*1px solid #27272a;?/g, replacement: 'border-top: 1px solid var(--border);' },
  { regex: /border-right:\s*1px solid #27272a;?/g, replacement: 'border-right: 1px solid var(--border);' },
  { regex: /border-left:\s*1px solid #27272a;?/g, replacement: 'border-left: 1px solid var(--border);' },
  
  { regex: /border-color:\s*#27272a;?/g, replacement: 'border-color: var(--border);' },
  { regex: /border-color:\s*#3f3f46;?/g, replacement: 'border-color: var(--border-hover);' }
];

for (const file of files) {
  const filePath = path.join(stylesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Skip :root and [data-theme="light"] blocks if modifying index.css directly? 
  // No, we can just replace globally, but avoid replacing the variables themselves.
  // The variables are --bg-primary: #050505; so our regex (background: #18181b) won't match them!
  // Wait, our regexes look for ackground: #hex or color: #hex, so they won't match --var: #hex.
  
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  }
}
