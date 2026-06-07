const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream("C:\\Users\\PC\\.gemini\\antigravity\\brain\\8e81ef97-342e-46e8-8bc1-fab32f74e4ad\\.system_generated\\logs\\transcript.jsonl");

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
  lineNum++;
  if (line.includes('password') || line.includes('Password')) {
    // Look for lines containing signUp or signIn
    if (line.includes('signUp') || line.includes('signIn') || line.includes('auth') || line.includes('Password') || line.includes('success')) {
      console.log(`Line ${lineNum}: ${line.slice(0, 300)}...`);
    }
  }
});
