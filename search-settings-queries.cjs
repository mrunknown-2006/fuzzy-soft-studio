const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.cjs')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes("from('settings')") || content.includes('from("settings")')) {
          console.log(`Found reference in: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes("from('settings')") || line.includes('from("settings")')) {
              console.log(`  Line ${idx+1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

searchDir('C:\\Users\\PC\\.gemini\\antigravity\\scratch\\fuzzy-soft-studio\\src');
