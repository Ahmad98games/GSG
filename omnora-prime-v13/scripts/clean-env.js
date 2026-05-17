const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const buffer = fs.readFileSync(envPath);

// Check if it is UTF-16 (either has BOM or is double byte)
let content = '';
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
  // UTF-16 LE
  content = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
  // UTF-16 BE
  content = buffer.toString('utf16be');
} else {
  // Try to remove null bytes if any
  content = buffer.toString('utf8').replace(/\x00/g, '');
}

// Normalize spacing and newlines
content = content.split('\n').map(line => {
  // If line looks like spaced out UTF-16 character representation, compress it
  if (line.includes(' ')) {
    // Check if it has spaces between almost every letter
    const letters = line.trim().split('');
    const spaces = letters.filter(c => c === ' ').length;
    if (spaces > line.trim().length / 3) {
      return line.replace(/\s+/g, '');
    }
  }
  return line;
}).join('\n');

fs.writeFileSync(envPath, content, 'utf8');
console.log('Successfully cleaned and rewrote .env.local as UTF-8.');
