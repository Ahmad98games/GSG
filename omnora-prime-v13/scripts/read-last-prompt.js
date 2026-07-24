const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\omnora\\.gemini\\antigravity-ide\\brain\\064badf0-a554-4140-b831-ac26b567d4e6\\.system_generated\\logs\\transcript_full.jsonl';

function run() {
  if (!fs.existsSync(logPath)) {
    console.error("Log file does not exist:", logPath);
    return;
  }
  
  const stats = fs.statSync(logPath);
  const bufferSize = Math.min(stats.size, 100 * 1024); // read last 100KB
  const buffer = Buffer.alloc(bufferSize);
  
  const fd = fs.openSync(logPath, 'r');
  fs.readSync(fd, buffer, 0, bufferSize, stats.size - bufferSize);
  fs.closeSync(fd);
  
  const content = buffer.toString('utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  
  // Find the last line that is a USER_INPUT or has the prompt
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.type === 'USER_INPUT') {
        console.log("FOUND STEP INDEX:", parsed.step_index);
        console.log("SOURCE:", parsed.source);
        console.log("TYPE:", parsed.type);
        console.log("CONTENT LENGTH:", parsed.content ? parsed.content.length : 0);
        
        const outPath = 'C:\\Users\\omnora\\.gemini\\antigravity-ide\\brain\\064badf0-a554-4140-b831-ac26b567d4e6\\scratch\\untruncated_user_request.md';
        fs.writeFileSync(outPath, parsed.content, 'utf8');
        console.log("Wrote untruncated content to:", outPath);
        break;
      }
    } catch (e) {
      // ignore parse errors for partial lines
    }
  }
}

run();
