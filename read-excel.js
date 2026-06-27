const ExcelJS = require('exceljs');
const path = require('path');

async function readExcel() {
  const workbook = new ExcelJS.Workbook();
  // Read with limited options to reduce memory
  await workbook.xlsx.readFile(path.join(__dirname, 'mẫu BC 06.2026.xlsx'));

  console.log(`=== WORKBOOK INFO ===`);
  console.log(`Total sheets: ${workbook.worksheets.length}`);

  workbook.worksheets.forEach((sheet, sheetIdx) => {
    console.log(`\n========== SHEET ${sheetIdx + 1}: "${sheet.name}" ==========`);
    console.log(`Rows: ${sheet.rowCount}, Columns: ${sheet.columnCount}`);
    
    // Print column widths
    const colWidths = [];
    for (let c = 1; c <= Math.min(sheet.columnCount, 20); c++) {
      const col = sheet.getColumn(c);
      if (col.width) colWidths.push(`${String.fromCharCode(64+c)}=${col.width}`);
    }
    console.log(`Column widths: ${colWidths.join(', ')}`);
    
    // Merged cells
    if (sheet.model.merges) {
      console.log(`Merged cells (${sheet.model.merges.length}):`);
      sheet.model.merges.forEach(m => console.log(`  ${m}`));
    }

    // Images count only
    try {
      const images = sheet.getImages();
      console.log(`Images count: ${images.length}`);
    } catch(e) {
      console.log('Images: error reading');
    }
    
    console.log(`\n--- All Cell Data ---`);
    const maxRow = Math.min(sheet.rowCount, 120);
    for (let r = 1; r <= maxRow; r++) {
      const row = sheet.getRow(r);
      const cells = [];
      const maxC = Math.min(sheet.columnCount, 20);
      for (let c = 1; c <= maxC; c++) {
        const cell = row.getCell(c);
        let val = cell.value;
        if (val && typeof val === 'object') {
          if (val.richText) {
            val = val.richText.map(rt => rt.text).join('');
          } else if (val.formula) {
            val = `[F:${val.formula}=${val.result}]`;
          } else if (val.text) {
            val = val.text;
          } else if (val instanceof Date) {
            val = val.toISOString().slice(0,10);
          }
        }
        if (val !== null && val !== undefined && val !== '') {
          const colLetter = c <= 26 ? String.fromCharCode(64+c) : 'A' + String.fromCharCode(64+c-26);
          cells.push(`${colLetter}="${String(val).substring(0, 60)}"`);
        }
      }
      if (cells.length > 0) {
        const h = row.height ? `(h=${Math.round(row.height)})` : '';
        console.log(`  R${r}${h}: ${cells.join(' | ')}`);
      }
    }
  });
}

readExcel().catch(err => console.error('Error:', err.message));
