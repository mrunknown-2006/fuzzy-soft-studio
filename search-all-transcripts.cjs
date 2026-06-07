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
  // We want to skip lines from our own current session. 
  // Let's print out lines that contain references to credentials, signUp, signIn, or passwords from earlier steps.
  if (lineNum < 3500) {
    if (line.includes('password') || line.includes('Password') || line.includes('signUp') || line.includes('signIn')) {
      // Print first 500 characters of matching lines to avoid massive output
      console.log(`Line ${lineNum}: ${line.slice(0, 500)}`);
    }
  }
});
