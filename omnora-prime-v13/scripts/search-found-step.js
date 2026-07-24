const fs = require('fs');

const path = 'C:\\Users\\omnora\\.gemini\\antigravity-ide\\brain\\064badf0-a554-4140-b831-ac26b567d4e6\\scratch\\found_step_11073.md';

function run() {
  if (!fs.existsSync(path)) {
    console.error("File does not exist:", path);
    return;
  }
  
  const content = fs.readFileSync(path, 'utf8');
  console.log("Total content length:", content.length);
  
  const index = content.indexOf('PieceRateGridPage');
  if (index === -1) {
    console.log("Could not find PieceRateGridPage in file!");
    return;
  }
  
  console.log("Found PieceRateGridPage at character index:", index);
  const substring = content.substring(index - 200, index + 4000);
  console.log("--- SUBSTRING ---");
  console.log(substring);
}

run();
