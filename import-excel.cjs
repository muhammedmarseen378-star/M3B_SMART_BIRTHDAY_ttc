/**
 * Excel to JSON Importer using SheetJS (xlsx)
 * Reads .xlsx or .xls file from data/ or root directory
 * Validates dates (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, Excel serial dates)
 * Preserves exact original names and dates
 * Bundles output directly into src/data/birthdays.json and public/birthdays.json
 */

const fs = require('fs');
const path = require('path');

let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  // XLSX will be loaded if installed; fallback parser for CSV is also supported
}

function parseDateValue(rawVal) {
  if (rawVal === undefined || rawVal === null) {
    return { valid: false, reason: 'Missing date value' };
  }

  // Handle Excel serial date numbers (e.g., 38718)
  if (typeof rawVal === 'number') {
    // Excel base date is 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const targetDate = new Date(excelEpoch.getTime() + rawVal * 86400000);
    if (!isNaN(targetDate.getTime())) {
      const year = targetDate.getUTCFullYear();
      const month = targetDate.getUTCMonth() + 1;
      const day = targetDate.getUTCDate();
      return validateComponents(year, month, day, String(rawVal));
    }
  }

  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    return validateComponents(rawVal.getFullYear(), rawVal.getMonth() + 1, rawVal.getDate(), rawVal.toISOString().split('T')[0]);
  }

  const str = String(rawVal).trim();
  if (!str) {
    return { valid: false, reason: 'Empty date string' };
  }

  // Try YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    return validateComponents(parseInt(ymd[1], 10), parseInt(ymd[2], 10), parseInt(ymd[3], 10), str);
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    return validateComponents(parseInt(dmy[3], 10), parseInt(dmy[2], 10), parseInt(dmy[1], 10), str);
  }

  // Try DD-MM (without year)
  const dmOnly = str.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (dmOnly) {
    return validateComponents(null, parseInt(dmOnly[2], 10), parseInt(dmOnly[1], 10), str);
  }

  return { valid: false, reason: 'Unrecognized date format: ' + str };
}

function validateComponents(year, month, day, original) {
  if (month < 1 || month > 12) {
    return { valid: false, reason: `Invalid month: ${month}` };
  }
  const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonths[month - 1]) {
    return { valid: false, reason: `Invalid day ${day} for month ${month}` };
  }

  const currentYear = new Date().getFullYear();
  let note = null;
  if (year !== null) {
    if (year > currentYear) {
      note = `Birth year (${year}) is in the future`;
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
    original,
    note
  };
}

function importDataset() {
  const rootDir = path.join(__dirname, '..');
  const dataDir = path.join(rootDir, 'data');

  // Find candidate file: .xlsx, .xls, or .csv
  let sourceFile = null;
  const candidates = [
    path.join(dataDir, 'birthdays.xlsx'),
    path.join(rootDir, 'birthdays.xlsx'),
    path.join(dataDir, 'data.xlsx'),
    path.join(rootDir, 'data.xlsx'),
    path.join(dataDir, 'birthdays.csv'),
    path.join(rootDir, 'birthdays.csv')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      sourceFile = c;
      break;
    }
  }

  if (!sourceFile) {
    console.error('No Excel or CSV dataset found in data/ or root directory.');
    process.exit(1);
  }

  console.log(`Loading dataset from: ${sourceFile}`);
  let rows = [];

  if (sourceFile.endsWith('.csv')) {
    const content = fs.readFileSync(sourceFile, 'utf8');
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const header = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const nameCol = header.findIndex(h => /name/i.test(h));
      const dobCol = header.findIndex(h => /birth|dob|date/i.test(h));
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          rows.push({
            name: parts[nameCol !== -1 ? nameCol : 0],
            dob: parts[dobCol !== -1 ? dobCol : 1]
          });
        }
      }
    }
  } else if (XLSX) {
    const workbook = XLSX.readFile(sourceFile, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    rawData.forEach(row => {
      const keys = Object.keys(row);
      const nameKey = keys.find(k => /name/i.test(k)) || keys[0];
      const dobKey = keys.find(k => /birth|dob|date/i.test(k)) || keys[1];
      if (nameKey && row[nameKey]) {
        rows.push({
          name: row[nameKey],
          dob: row[dobKey]
        });
      }
    });
  }

  const people = rows.map((r, index) => {
    const parsed = parseDateValue(r.dob);
    return {
      id: `p-${index + 1}`,
      name: String(r.name).trim(),
      rawDob: String(r.dob).trim(),
      birthYear: parsed.valid ? parsed.year : null,
      birthMonth: parsed.valid ? parsed.month : null,
      birthDay: parsed.valid ? parsed.day : null,
      standardIso: parsed.valid ? parsed.standardIso : null,
      dateValid: parsed.valid,
      dateError: parsed.valid ? null : parsed.reason,
      dateNote: parsed.note || null
    };
  });

  const out1 = path.join(rootDir, 'src', 'data', 'birthdays.json');
  const out2 = path.join(rootDir, 'public', 'birthdays.json');

  fs.mkdirSync(path.dirname(out1), { recursive: true });
  fs.mkdirSync(path.dirname(out2), { recursive: true });

  fs.writeFileSync(out1, JSON.stringify(people, null, 2), 'utf8');
  fs.writeFileSync(out2, JSON.stringify(people, null, 2), 'utf8');

  console.log(`Import successful! Processed ${people.length} records.`);
  console.log(`Saved to:\n  - ${out1}\n  - ${out2}`);
}

importDataset();
