const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\omnora\\.gemini\\antigravity-ide\\brain\\064badf0-a554-4140-b831-ac26b567d4e6\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  if (!fs.existsSync(logPath)) {
    console.error("Log file does not exist:", logPath);
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let stepCount = 0;
  for await (const line of rl) {
    stepCount++;
    try {
      const parsed = JSON.parse(line);
      const content = parsed.content || '';
      if (content.includes('grid/page.tsx')) {
        console.log(`FOUND matches at step ${parsed.step_index} (Step count: ${stepCount})`);
        console.log(`Content length: ${content.length}`);
        
        const outPath = `C:\\Users\\omnora\\.gemini\\antigravity-ide\\brain\\064badf0-a554-4140-b831-ac26b567d4e6\\scratch\\found_step_${parsed.step_index}.md`;
        fs.writeFileSync(outPath, content, 'utf8');
        console.log(`Wrote full text to ${outPath}`);
      }
    } catch (e) {
      // ignore JSON parse errors on malformed lines
    }
  }
  console.log(`Processed ${stepCount} lines.`);
}

run();
