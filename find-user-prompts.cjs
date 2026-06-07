const fs = require('fs');

const logPath = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\8e81ef97-342e-46e8-8bc1-fab32f74e4ad\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  if (!fs.existsSync(logPath)) {
    console.log("Log path doesn't exist:", logPath);
    return;
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      const text = obj.content || '';
      if (text.includes('categories') || text.includes('store_settings') || text.includes('site_content') || text.includes('discounts')) {
        console.log(`Step ${obj.step_index} USER INPUT:`);
        console.log(text);
        console.log("=========================================\n");
      }
    }
  }
}

run();
