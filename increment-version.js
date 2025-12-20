const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, 'version.json');

// Read current version
let versionData;
try {
  const content = fs.readFileSync(versionFile, 'utf8');
  versionData = JSON.parse(content);
} catch (error) {
  console.error('Error reading version.json:', error);
  process.exit(1);
}

// Parse version string (e.g., "0.0.0")
const versionParts = versionData.version.split('.').map(Number);
let [major, minor, patch] = versionParts;

// Increment patch
patch += 1;

// Rollover logic: each decimal goes to 99 before moving to next
if (patch > 99) {
  patch = 0;
  minor += 1;
  
  if (minor > 99) {
    minor = 0;
    major += 1;
  }
}

// Format back to string
const newVersion = `${major}.${minor}.${patch}`;
versionData.version = newVersion;

// Write back to file
try {
  fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`Version incremented: ${newVersion}`);
} catch (error) {
  console.error('Error writing version.json:', error);
  process.exit(1);
}
