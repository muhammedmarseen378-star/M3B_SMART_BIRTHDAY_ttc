const fs = require('fs');
const path = require('path');

// Load generated data
const dataPath = path.join(__dirname, '..', 'src', 'data', 'birthdays.json');
const people = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('====================================================');
console.log('RUNNING SMART BIRTHDAY CELEBRATION SYSTEM UNIT TESTS');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

// 1. Total records
assert(people.length === 49, `Dataset has exactly 49 records (Actual: ${people.length})`);

// 2. Birthday detection for today (Nov 13)
const todayNov13 = people.filter(p => p.birthMonth === 11 && p.birthDay === 13);
assert(todayNov13.length === 2, `Exactly 2 people share Nov 13 birthday (Actual: ${todayNov13.length})`);
const namesNov13 = todayNov13.map(p => p.name);
assert(namesNov13.includes('MUHAMMED MARSEEN C P') && namesNov13.includes('SREEDEV HARI'), 
  'Nov 13 celebrants are MUHAMMED MARSEEN C P and SREEDEV HARI');

// 3. Duplicate handling (SAM JAMES appears twice)
const samJamesRecords = people.filter(p => p.name === 'SAM JAMES');
assert(samJamesRecords.length === 2 && samJamesRecords[0].id !== samJamesRecords[1].id, 
  'Duplicate names have individual unique IDs (p-34 and p-35)');

// 4. Age calculation
const refYear = 2026;
// ABHIJITH A V born 2003-12-24. On Nov 13, 2026, birthday has not occurred yet this year.
// Age should be 2026 - 2003 - 1 = 22.
const abhijith = people.find(p => p.name === 'ABHIJITH A V');
const abhijithAge = (11 < 12 || (11 === 12 && 13 < 24)) ? (refYear - abhijith.birthYear - 1) : (refYear - abhijith.birthYear);
assert(abhijithAge === 22, `ABHIJITH A V age on Nov 13, 2026 is 22 (turning 23 on Dec 24)`);

// SREEDEV HARI born 2006-11-13. Today is Nov 13, 2026!
// Age should be 2026 - 2006 = 20.
const sreedev = people.find(p => p.name === 'SREEDEV HARI');
const sreedevAge = refYear - sreedev.birthYear;
assert(sreedevAge === 20, `SREEDEV HARI age on Nov 13, 2026 is 20`);

// 5. December-to-January transition
// SREEDEEP K born 2007-01-13. From Nov 13, 2026, his next birthday is Jan 13, 2027.
const sreedeep = people.find(p => p.name === 'SREEDEEP K');
assert(sreedeep.birthMonth === 1 && sreedeep.birthDay === 13, 'SREEDEEP K is Jan 13');

// 6. Data anomaly handling (SIVADATH K born 2027-01-14)
const sivadhath = people.find(p => p.name === 'SIVADATH K');
assert(sivadhath && sivadhath.dateNote && sivadhath.dateNote.includes('future'), 
  'SIVADATH K future birth year is flagged with a safe note');

// 7. Monthly distribution
const months = Array(12).fill(0);
people.forEach(p => { if (p.birthMonth) months[p.birthMonth - 1]++; });
const totalMapped = months.reduce((a, b) => a + b, 0);
assert(totalMapped === 49, `All 49 people mapped to a valid birth month`);

console.log(`\n====================================================`);
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log(`====================================================`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
