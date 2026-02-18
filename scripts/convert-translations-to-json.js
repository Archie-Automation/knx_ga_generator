// Script to convert translations.ts to JSON files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the translations.ts file
const translationsFile = path.join(__dirname, '../src/i18n/translations.ts');
const content = fs.readFileSync(translationsFile, 'utf8');

function extractLanguageObject(lang, content) {
  // Find the language object block
  // Pattern: lang: { ... }
  // We need to handle nested braces correctly
  const langPattern = new RegExp(`\\s+${lang}:\\s*\\{`, 'm');
  const startIndex = content.search(langPattern);
  
  if (startIndex === -1) {
    console.warn(`No match found for language: ${lang}`);
    return {};
  }
  
  // Find the opening brace after the language name
  let braceIndex = content.indexOf('{', startIndex);
  let braceDepth = 0;
  let inString = false;
  let quoteChar = null;
  let escapeNext = false;
  let endIndex = -1;
  
  for (let i = braceIndex; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    
    if (!inString && (char === "'" || char === '"' || char === '`')) {
      inString = true;
      quoteChar = char;
    } else if (inString && char === quoteChar) {
      inString = false;
      quoteChar = null;
    } else if (!inString) {
      if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          endIndex = i;
          break;
        }
      }
    }
  }
  
  if (endIndex === -1) {
    console.warn(`Could not find end of language object: ${lang}`);
    return {};
  }
  
  // Extract the object content (without the outer braces)
  const objContent = content.substring(braceIndex + 1, endIndex);
  
  // Parse key-value pairs
  const result = {};
  const lines = objContent.split('\n');
  
  let currentKey = null;
  let currentValue = '';
  let valueInString = false;
  let valueQuoteChar = null;
  let valueStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    // Check for key: value pattern
    const keyMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    
    if (keyMatch && !valueInString) {
      // Save previous key-value
      if (currentKey && currentValue) {
        // Clean up the value
        currentValue = currentValue.trim();
        // Remove trailing comma
        currentValue = currentValue.replace(/,$/, '');
        // Remove surrounding quotes
        currentValue = currentValue.replace(/^['"`](.*)['"`]$/, '$1');
        // Unescape
        currentValue = currentValue
          .replace(/\\n/g, '\n')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\\`/g, '`')
          .replace(/\\\\/g, '\\');
        result[currentKey] = currentValue;
      }
      
      // Start new key-value pair
      currentKey = keyMatch[1];
      const valuePart = keyMatch[2].trim();
      
      // Check if value starts with a quote
      if (valuePart.match(/^['"`]/)) {
        valueInString = true;
        valueQuoteChar = valuePart[0];
        currentValue = valuePart;
        valueStartIndex = valuePart.indexOf(valueQuoteChar);
        
        // Check if string ends on same line (before comma)
        const lastQuoteMatch = valuePart.match(new RegExp(`${valueQuoteChar}(?![^\\\\]*\\\\),?$`));
        if (lastQuoteMatch) {
          valueInString = false;
        }
      } else {
        currentValue = valuePart;
      }
    } else if (valueInString) {
      // Continue collecting string value
      currentValue += '\n' + line;
      
      // Check if string ends on this line
      if (line.includes(valueQuoteChar)) {
        // Check if the quote is not escaped and followed by comma or end of line
        const quoteRegex = new RegExp(`${valueQuoteChar}(?!.*\\\\${valueQuoteChar})(?=[,\\s]*$)`, 'm');
        if (quoteRegex.test(line)) {
          valueInString = false;
        }
      }
    }
  }
  
  // Save last key-value
  if (currentKey && currentValue) {
    currentValue = currentValue.trim().replace(/,$/, '');
    currentValue = currentValue.replace(/^['"`](.*)['"`]$/, '$1');
    currentValue = currentValue
      .replace(/\\n/g, '\n')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\`/g, '`')
      .replace(/\\\\/g, '\\');
    result[currentKey] = currentValue;
  }
  
  return result;
}

// Extract each language object
console.log('Extracting translations...');
const nl = extractLanguageObject('nl', content);
const en = extractLanguageObject('en', content);
const es = extractLanguageObject('es', content);
const fr = extractLanguageObject('fr', content);
const de = extractLanguageObject('de', content);

// Create locales directory if it doesn't exist
const localesDir = path.join(__dirname, '../src/locales');
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

// Write JSON files with proper formatting
fs.writeFileSync(path.join(localesDir, 'nl.json'), JSON.stringify(nl, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'de.json'), JSON.stringify(de, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'fr.json'), JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'es.json'), JSON.stringify(es, null, 2), 'utf8');

console.log('✓ Generated JSON files in src/locales/');
console.log(`  - nl.json (${Object.keys(nl).length} keys)`);
console.log(`  - en.json (${Object.keys(en).length} keys)`);
console.log(`  - de.json (${Object.keys(de).length} keys)`);
console.log(`  - fr.json (${Object.keys(fr).length} keys)`);
console.log(`  - es.json (${Object.keys(es).length} keys)`);
