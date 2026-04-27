const fs = require('fs');
const path = 'order.ts';
let content = fs.readFileSync(path, 'utf8');

// Lines have \r\n endings
const oldBlock = `  "fee_incurred",\r\n  "completed",\r\n  "cancelled",\r\n];`;
const newBlock = `  "fee_incurred",\r\n  "completed",\r\n  "laundry",\r\n  "cancelled",\r\n];`;

if (content.includes(oldBlock)) {
  const idx = content.indexOf(oldBlock);
  content = content.slice(0, idx) + newBlock + content.slice(idx + oldBlock.length);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Done: laundry added to allowedStatuses');
} else {
  console.log('Pattern not found');
}
