const fs = require('fs');
const path = require('path');

function parseDateString(rawDateStr) {
  if (!rawDateStr || typeof rawDateStr !== 'string') {
    return { valid: false, reason: 'Empty date string' };
  }
  const cleanStr = rawDateStr.trim();
  
  // Try YYYY-MM-DD
  const ymdMatch = cleanStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    return validateDate(year, month, day, cleanStr);
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    return validateDate(year, month, day, cleanStr);
  }

  // Try MM-DD-YYYY or other common formats if applicable
  // Or DD-MM (without year)
  const dmOnlyMatch = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (dmOnlyMatch) {
    const day = parseInt(dmOnlyMatch[1], 10);
    const month = parseInt(dmOnlyMatch[2], 10);
    return validateDate(null, month, day, cleanStr);
  }

  return { valid: false, reason: 'Unrecognized date format: ' + cleanStr };
}

function validateDate(year, month, day, rawStr) {
  if (month < 1 || month > 12) {
    return { valid: false, reason: 'Invalid month: ' + month };
  }
  const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonths[month - 1]) {
    return { valid: false, reason: `Invalid day ${day} for month ${month}` };
  }

  const currentYear = new Date().getFullYear();
  let note = null;
  if (year !== null) {
    if (year > currentYear) {
      note = `Birth year (${year}) appears in the future, treated as entered`;
    } else if (year < 1900) {
      note = `Birth year (${year}) is unusually early`;
    }
  }

  const formattedMonth = String(month).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');
  const standardIso = year ? `${year}-${formattedMonth}-${formattedDay}` : `--${formattedMonth}-${formattedDay}`;

  return {
    valid: true,
    year,
    month,
    day,
    standardIso,
    raw: rawStr,
    note
  };
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const nameIdx = header.findIndex(h => /name/i.test(h));
  const dobIdx = header.findIndex(h => /birth|dob|date/i.test(h));

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // CSV split handling simple commas
    const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 2) continue;

    const rawName = parts[nameIdx !== -1 ? nameIdx : 0];
    const rawDob = parts[dobIdx !== -1 ? dobIdx : 1];

    if (!rawName) continue;

    const parsedDate = parseDateString(rawDob);
    records.push({
      id: `p-${i}`,
      name: rawName,
      rawDob: rawDob,
      birthYear: parsedDate.valid ? parsedDate.year : null,
      birthMonth: parsedDate.valid ? parsedDate.month : null,
      birthDay: parsedDate.valid ? parsedDate.day : null,
      standardIso: parsedDate.valid ? parsedDate.standardIso : null,
      dateValid: parsedDate.valid,
      dateError: parsedDate.valid ? null : parsedDate.reason,
      dateNote: parsedDate.note || null
    });
  }

  return records;
}

const csvPath = path.join(__dirname, '..', 'data', 'birthdays.csv');
const jsonDest1 = path.join(__dirname, '..', 'src', 'data', 'birthdays.json');
const jsonDest2 = path.join(__dirname, '..', 'public', 'birthdays.json');

const csvContent = fs.readFileSync(csvPath, 'utf8');
const people = parseCSV(csvContent);

console.log(`Parsed ${people.length} people from ${csvPath}`);

fs.mkdirSync(path.dirname(jsonDest1), { recursive: true });
fs.mkdirSync(path.dirname(jsonDest2), { recursive: true });

fs.writeFileSync(jsonDest1, JSON.stringify(people, null, 2), 'utf8');
fs.writeFileSync(jsonDest2, JSON.stringify(people, null, 2), 'utf8');

console.log(`Successfully generated:\n- ${jsonDest1}\n- ${jsonDest2}`);
