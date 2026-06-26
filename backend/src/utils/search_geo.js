import fs from 'fs';
import path from 'path';

const searchDir = 'd:/Semester 6/KBT/WarungNear/frontend/src';

function searchFiles(dir, keyword) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath, keyword);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(keyword)) {
        console.log(`Found "${keyword}" in file: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes(keyword)) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchFiles(searchDir, 'setUserLocation');
console.log('\n--- Geolocation ---');
searchFiles(searchDir, 'navigator.geolocation');
searchFiles(searchDir, 'getCurrentPosition');
