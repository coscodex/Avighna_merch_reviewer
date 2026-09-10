/**
 * Builds an editable Hindi-name review file from the published response sheet.
 * Run this first, review output/corrections.csv, then run generate.js.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQu5rQo-RssNCJd4W0BNMkZLOpNxkqXrtezmLq_BBTwTZhrePEbAbimKigqXO1nwOSlYi7APRZmmYNn/pub?gid=1728630863&single=true&output=csv';
const COLUMNS = {
  orderId: 'Timestamp',
  englishName: 'Name on T-shirt( If you have chosen English language)',
  fallbackName: 'Name',
  language: 'T-shirt name language',
};
const OUTPUT_PATH = path.join('./output', 'corrections.csv');
const TRANSLITERATION_URL = 'https://inputtools.google.com/request';

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function fetchCsv(url) {
  if (url.startsWith('http')) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not fetch sheet (${response.status})`);
    return response.text();
  }
  return fs.readFileSync(url, 'utf8');
}

async function transliterate(englishName) {
  const url = new URL(TRANSLITERATION_URL);
  url.searchParams.set('text', englishName);
  url.searchParams.set('itc', 'hi-t-i0-und');
  url.searchParams.set('oe', 'UTF-8');
  url.searchParams.set('app', 'demopage');

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      const result = await response.json();
      const suggestions = result?.[0] === 'SUCCESS' ? result?.[1]?.[0]?.[1] : null;
      if (suggestions?.length) return suggestions[0];
    }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500 * attempt));
  }

  return '';
}

async function run() {
  const rows = parse(await fetchCsv(SHEET_CSV_URL), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const outputRows = [];

  for (const row of rows) {
    const language = (row[COLUMNS.language] || '').trim();
    const englishName = (row[COLUMNS.englishName] || row[COLUMNS.fallbackName] || '').trim();
    const orderId = (row[COLUMNS.orderId] || englishName).toString().trim();
    const isHindi = language.toLowerCase().includes('hindi');
    const suggestedHindi = isHindi && /[A-Za-z]/.test(englishName)
      ? await transliterate(englishName)
      : isHindi && /[\u0900-\u097F]/.test(englishName) ? englishName : '';

    outputRows.push({
      OrderID: orderId,
      EnglishName: englishName,
      Language: language,
      SuggestedHindi: suggestedHindi,
      FinalHindi: suggestedHindi,
    });
    console.log(`${isHindi ? 'Hindi' : 'Skip'}: ${englishName || '(no name)'}${suggestedHindi ? ` -> ${suggestedHindi}` : ' (review needed)'}`);
  }

  const headers = ['OrderID', 'EnglishName', 'Language', 'SuggestedHindi', 'FinalHindi'];
  const csv = [headers.join(','), ...outputRows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n') + '\n';
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, csv, 'utf8');
  console.log(`\nCreated ${OUTPUT_PATH}. Review FinalHindi, then run generate.js.`);
}

run().catch(error => {
  console.error('Something went wrong:', error);
  process.exit(1);
});
