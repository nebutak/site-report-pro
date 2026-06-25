import { Workbook, Cell } from 'exceljs';
import { ExportReportData } from './reports-pdf.helper';
import { existsSync, readFileSync } from 'fs';

// Helper to read image buffer from disk safely
function getImageBuffer(fileUrl: string): Buffer | null {
  try {
    let filePath = fileUrl;
    if (fileUrl.startsWith('/')) {
      filePath = '.' + fileUrl;
    }
    if (existsSync(filePath)) {
      return readFileSync(filePath);
    }
    if (existsSync(fileUrl)) {
      return readFileSync(fileUrl);
    }
  } catch (err) {
    console.error('Error reading image buffer in Excel helper:', err);
  }
  return null;
}

// Helper to get image type
function getImageType(fileUrl: string): 'png' | 'gif' | 'jpeg' {
  const lower = fileUrl.toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.gif')) return 'gif';
  return 'jpeg';
}

export async function generateDailyReportExcel(
  data: ExportReportData,
): Promise<Buffer> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Báo cáo ngày');
  worksheet.views = [{ showGridLines: true }];

  // Page setup
  worksheet.pageSetup.paperSize = 9; // A4
  worksheet.pageSetup.orientation = 'portrait';
  worksheet.pageSetup.margins = {
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3,
  };

  // Helper date formatter
  const formatDate = (dInput: string | number | Date | null | undefined) => {
    if (!dInput) return '---';
    const d = new Date(dInput);
    if (isNaN(d.getTime())) return '---';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Helper number formatter
  const formatNum = (numInput: any) => {
    if (numInput === null || numInput === undefined || numInput === '')
      return 0;
    const num = Number(numInput);
    return isNaN(num) ? 0 : num;
  };

  // Helper percent formatter
  const formatPct = (numInput: any) => {
    if (numInput === null || numInput === undefined || numInput === '')
      return 0;
    const num = Number(numInput) / 100;
    return isNaN(num) ? 0 : num;
  };

  // Column definitions
  worksheet.columns = [
    { key: 'colA', width: 28 }, // Item name, weather buổi, etc.
    { key: 'colB', width: 12 }, // Code, Sunny, etc.
    { key: 'colC', width: 10 }, // Unit, Rainy, etc.
    { key: 'colD', width: 12 }, // Design Qty, wind, etc.
    { key: 'colE', width: 12 }, // Previous Qty, wave, etc.
    { key: 'colF', width: 12 }, // Today Qty, swell, etc.
    { key: 'colG', width: 12 }, // Current Qty, etc.
    { key: 'colH', width: 12 }, // Completion %, etc.
    { key: 'colI', width: 15 }, // Person in charge, etc.
    { key: 'colJ', width: 20 }, // Notes
  ];

  // Title rows
  // Create Top Header Box (Rows 1 to 5)
  for (let rNum = 1; rNum <= 5; rNum++) {
    worksheet.addRow(['', '', '', '', '', '', '', '', '', '']);
  }
  
  worksheet.mergeCells('A1:B5'); // Logo
  worksheet.mergeCells('I1:J5'); // ISO
  
  worksheet.getCell('C1').value = 'Dự án:';
  worksheet.getCell('D1').value = data.project.name;
  worksheet.mergeCells('D1:H1');
  
  worksheet.getCell('C2').value = 'ĐD Chủ đầu tư:';
  worksheet.getCell('D2').value = data.project.ownerName || '---';
  worksheet.mergeCells('D2:H2');
  
  worksheet.getCell('C3').value = 'Tư vấn giám sát:';
  worksheet.getCell('D3').value = data.project.supervisorName || '---';
  worksheet.mergeCells('D3:H3');
  
  worksheet.getCell('C4').value = 'Nhà thầu chính:';
  worksheet.getCell('D4').value = data.project.contractorName || '---';
  worksheet.mergeCells('D4:H4');
  
  worksheet.getCell('C5').value = 'Địa điểm:';
  worksheet.getCell('D5').value = data.project.location || '---';
  worksheet.mergeCells('D5:H5');

  // Define border styles
  const thinB = { style: 'thin' as const, color: { argb: 'FF334155' } };
  const mediumB = { style: 'medium' as const, color: { argb: 'FF334155' } };
  
  // Style each cell inside A1:J5
  for (let r = 1; r <= 5; r++) {
    worksheet.getRow(r).height = 20;
    for (let c = 1; c <= 10; c++) {
      const cell = worksheet.getCell(r, c);
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: r === 1 ? mediumB : thinB,
        bottom: r === 5 ? mediumB : thinB,
        left: c === 1 ? mediumB : thinB,
        right: c === 10 ? mediumB : thinB,
      };
    }
  }
  
  // Logo Cell
  const logoCell = worksheet.getCell('A1');
  let hasLogo = false;
  if (data.project.logoUrl) {
    const logoBuffer = getImageBuffer(data.project.logoUrl);
    if (logoBuffer) {
      try {
        const ext = getImageType(data.project.logoUrl);
        const imageId = workbook.addImage({
          buffer: logoBuffer as any,
          extension: ext,
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 5 },
          editAs: 'oneCell',
        } as any);
        hasLogo = true;
      } catch (err) {
        console.error('Error adding logo to Excel:', err);
      }
    }
  }

  if (!hasLogo) {
    logoCell.value = data.project.contractorName || 'NHÀ THẦU CHÍNH';
    logoCell.font = { name: 'Arial', size: 10, bold: true };
    logoCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }
  
  // ISO Cell
  const isoCell = worksheet.getCell('I1');
  isoCell.value = '🌐\nISO\n9001:2015';
  isoCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0054A6' } };
  isoCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  
  // Style labels
  for (let r = 1; r <= 5; r++) {
    const lblCell = worksheet.getCell(r, 3);
    lblCell.font = { name: 'Arial', size: 9, bold: false };
    lblCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' }
    };
    
    // Style values to be bold in columns D to H
    for (let c = 4; c <= 8; c++) {
      worksheet.getCell(r, c).font = { name: 'Arial', size: 9, bold: true };
    }
  }

  worksheet.addRow([]); // Blank spacer row 6

  // Centered Title (Row 7)
  const rTitle = worksheet.addRow([(data.title || 'BÁO CÁO NHẬT KÝ THI CÔNG HÀNG NGÀY').toUpperCase()]);
  rTitle.height = 28;
  worksheet.mergeCells(`A${rTitle.number}:J${rTitle.number}`);
  rTitle.getCell(1).font = {
    name: 'Arial',
    size: 14,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  };
  rTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Spacer row 8

  // Helper style cell border and font
  const styleHeaderCell = (cell: Cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  };

  const styleDataCell = (
    cell: Cell,
    align: 'left' | 'center' | 'right' = 'left',
    bold = false,
  ) => {
    cell.font = { name: 'Arial', size: 9, bold };
    cell.alignment = { horizontal: align, vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  };

  // Section A: Combined Metadata & Weather Table
  const startRow = worksheet.addRow([]).number; // Row 9
  for (let offset = 1; offset < 6; offset++) {
    worksheet.addRow([]);
  }
  
  const borderThin = {
    top: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
  };

  const borderHeader = {
    top: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
    left: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
    right: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
  };

  const meta = [
    { label: 'Người báo cáo:', val: data.project.defaultReporterName || data.createdBy.name },
    { label: 'Người nhận:', val: data.project.defaultReceiver || 'Ban lãnh đạo công ty' },
    { label: 'Cc:', val: data.project.defaultCc || 'Ban điều hành dự án' },
    { label: 'Báo cáo số:', val: data.reportNo || '---' },
    { label: 'Báo cáo ngày:', val: formatDate(data.reportDate) },
    { label: 'Ngày phát hành:', val: formatDate(data.issueDate || data.reportDate) },
  ];

  meta.forEach((item, index) => {
    const rIdx = startRow + index;
    worksheet.getRow(rIdx).height = 20;
    worksheet.getCell(`A${rIdx}`).value = item.label;
    worksheet.getCell(`B${rIdx}`).value = item.val;
    worksheet.mergeCells(`B${rIdx}:C${rIdx}`);
    
    const cellA = worksheet.getCell(`A${rIdx}`);
    cellA.font = { name: 'Arial', size: 9, bold: false };
    cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    cellA.border = borderThin;
    cellA.alignment = { horizontal: 'left', vertical: 'middle' };
    
    const cellB = worksheet.getCell(`B${rIdx}`);
    const isRedDate = item.label === 'Báo cáo ngày:' || item.label === 'Ngày phát hành:';
    cellB.font = {
      name: 'Arial',
      size: 9,
      bold: isRedDate,
      color: isRedDate ? { argb: 'FFFF0000' } : undefined,
    };
    cellB.border = borderThin;
    cellB.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`C${rIdx}`).border = borderThin;
  });

  const getPeriodWeather = (periodName: string) => {
    const keys = 
      periodName === 'Sáng' || periodName === 'MORNING' ? ['sáng', 'morning'] :
      periodName === 'Chiều' || periodName === 'AFTERNOON' ? ['chiều', 'afternoon'] :
      periodName === 'Tối' || periodName === 'EVENING' ? ['tối', 'evening'] : [periodName.toLowerCase().trim()];
    const row = data.weatherRows.find((w) => w.period && keys.includes(w.period.toLowerCase().trim()));
    return row || {
      isSunny: false,
      isRainy: false,
      isNormal: false,
      wind: '',
      wave: '',
      swell: '',
    };
  };

  const morning = getPeriodWeather('Sáng');
  const afternoon = getPeriodWeather('Chiều');
  const evening = getPeriodWeather('Tối');

  worksheet.getCell(`D${startRow}`).value = 'Thời tiết';
  worksheet.getCell(`E${startRow}`).value = 'Nắng';
  worksheet.getCell(`F${startRow}`).value = 'Mưa';
  worksheet.getCell(`G${startRow}`).value = 'B.Thường';
  worksheet.getCell(`H${startRow}`).value = 'Gió (cấp)';
  worksheet.getCell(`I${startRow}`).value = 'Sóng (m)';
  worksheet.getCell(`J${startRow}`).value = 'Sóng lừng';

  for (let c = 4; c <= 10; c++) {
    const cell = worksheet.getCell(startRow, c);
    cell.font = { name: 'Arial', size: 8, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderHeader;
  }

  const weatherRowsData = [
    { label: 'Sáng', w: morning },
    { label: 'Chiều', w: afternoon },
    { label: 'Tối', w: evening },
  ];

  weatherRowsData.forEach((rowInfo, index) => {
    const rIdx = startRow + 1 + index;
    worksheet.getCell(`D${rIdx}`).value = rowInfo.label;
    worksheet.getCell(`E${rIdx}`).value = rowInfo.w.isSunny ? '☑' : '☐';
    worksheet.getCell(`F${rIdx}`).value = rowInfo.w.isRainy ? '☑' : '☐';
    worksheet.getCell(`G${rIdx}`).value = rowInfo.w.isNormal ? '☑' : '☐';
    worksheet.getCell(`H${rIdx}`).value = rowInfo.w.wind || '';
    worksheet.getCell(`I${rIdx}`).value = rowInfo.w.wave || '';
    worksheet.getCell(`J${rIdx}`).value = rowInfo.w.swell || '';

    for (let c = 4; c <= 10; c++) {
      const cell = worksheet.getCell(rIdx, c);
      const isPeriodCol = c === 4;
      const isCheckCol = c >= 5 && c <= 7;
      cell.font = { name: 'Arial', size: isPeriodCol ? 8 : 9, bold: isPeriodCol };
      if (isPeriodCol) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      cell.alignment = { 
        horizontal: isPeriodCol || isCheckCol ? 'center' : 'left', 
        vertical: 'middle' 
      };
      cell.border = borderThin;
    }
  });

  // Row 14 (startRow + 5) columns 4-10 left empty and borderless for clean weather grid layout

  worksheet.addRow([]); // Spacer

  // Section I: Equipment and Materials side-by-side
  const rSecI = worksheet.addRow(['I. Các thiết bị chính trên công trường & Vật liệu chính nhập vào công trường']);
  worksheet.mergeCells(`A${rSecI.number}:J${rSecI.number}`);
  rSecI.getCell(1).font = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  };

  // Header row 1
  const mH1 = worksheet.addRow([
    'I. Các thiết bị chính trên công trường',
    '',
    '',
    '',
    '',
    'Vật liệu chính nhập vào công trường',
    '',
    '',
    '',
    '',
  ]);
  mH1.height = 22;
  worksheet.mergeCells(`A${mH1.number}:E${mH1.number}`);
  worksheet.mergeCells(`F${mH1.number}:J${mH1.number}`);

  // Header row 2
  const mH2 = worksheet.addRow([
    'TT',
    'Tên thiết bị',
    '',
    '',
    'Số lượng',
    'Tên vật tư',
    '',
    '',
    'Khối lượng',
    '',
  ]);
  mH2.height = 22;
  worksheet.mergeCells(`B${mH2.number}:D${mH2.number}`);
  worksheet.mergeCells(`F${mH2.number}:H${mH2.number}`);
  worksheet.mergeCells(`I${mH2.number}:J${mH2.number}`);

  for (let col = 1; col <= 10; col++) {
    styleHeaderCell(mH1.getCell(col));
    styleHeaderCell(mH2.getCell(col));
  }

  // Rows data zip
  const maxEqMatRows = Math.max(data.equipmentRows.length, data.materialRows.length);
  if (maxEqMatRows > 0) {
    for (let i = 0; i < maxEqMatRows; i++) {
      const eq = data.equipmentRows[i] || null;
      const mat = data.materialRows[i] || null;

      const r = worksheet.addRow([
        eq ? i + 1 : '',
        eq ? eq.name : '',
        '',
        '',
        eq ? formatNum(eq.todayQuantity) : '',
        mat ? mat.name : '',
        '',
        '',
        mat ? formatNum(mat.quantity) : '',
        '',
      ]);
      r.height = 20;

      worksheet.mergeCells(`B${r.number}:D${r.number}`);
      worksheet.mergeCells(`F${r.number}:H${r.number}`);
      worksheet.mergeCells(`I${r.number}:J${r.number}`);

      // Style Equipment side
      styleDataCell(r.getCell(1), 'center'); // TT
      styleDataCell(r.getCell(2), 'left');   // Name (B-D)
      styleDataCell(r.getCell(3), 'left');   // merged C
      styleDataCell(r.getCell(4), 'left');   // merged D
      styleDataCell(r.getCell(5), 'right', true); // Qty (E)
      if (eq) {
        r.getCell(5).numFmt = '#,##0';
      }

      // Style Material side
      styleDataCell(r.getCell(6), 'left');   // Name (F-H)
      styleDataCell(r.getCell(7), 'left');   // merged G
      styleDataCell(r.getCell(8), 'left');   // merged H
      styleDataCell(r.getCell(9), 'right', true); // Qty (I-J)
      styleDataCell(r.getCell(10), 'right', true); // merged J
      if (mat) {
        r.getCell(9).numFmt = '#,##0.00';
      }
    }
  } else {
    const r = worksheet.addRow(['Không có dữ liệu thiết bị và vật tư']);
    worksheet.mergeCells(`A${r.number}:J${r.number}`);
    r.eachCell((c) => styleDataCell(c, 'center'));
  }

  worksheet.addRow([]); // Spacer

  // Section II: Manpower
  const rSecII = worksheet.addRow(['II. Nhân sự trên công trường']);
  worksheet.mergeCells(`A${rSecII.number}:J${rSecII.number}`);
  rSecII.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };

  const mHeader = worksheet.addRow([
    'TT',
    'Nhân sự trên công trường',
    '',
    '',
    'Quản lý',
    'Nhân sự',
    'Nhân sự tăng ca',
    'Bảo vệ',
    'Ghi chú',
    '',
  ]);
  mHeader.height = 24;
  worksheet.mergeCells(`B${mHeader.number}:D${mHeader.number}`);
  worksheet.mergeCells(`I${mHeader.number}:J${mHeader.number}`);

  for (let col = 1; col <= 10; col++) {
    styleHeaderCell(mHeader.getCell(col));
  }

  let totalManager = 0;
  let totalStaff = 0;
  let totalOvertime = 0;
  let totalSecurity = 0;

  if (data.manpowerRows.length > 0) {
    for (let i = 0; i < data.manpowerRows.length; i++) {
      const m = data.manpowerRows[i];
      totalManager += Number(m.managerQuantity || 0);
      totalStaff += Number(m.staffQuantity || 0);
      totalOvertime += Number(m.overtimeQuantity || 0);
      totalSecurity += Number(m.securityQuantity || 0);

      const r = worksheet.addRow([
        i + 1,
        m.name,
        '',
        '',
        m.managerQuantity ? formatNum(m.managerQuantity) : '',
        m.staffQuantity ? formatNum(m.staffQuantity) : '',
        m.overtimeQuantity ? formatNum(m.overtimeQuantity) : '',
        m.securityQuantity ? formatNum(m.securityQuantity) : '',
        m.note || '',
        '',
      ]);
      r.height = 20;

      worksheet.mergeCells(`B${r.number}:D${r.number}`);
      worksheet.mergeCells(`I${r.number}:J${r.number}`);

      styleDataCell(r.getCell(1), 'center'); // TT
      styleDataCell(r.getCell(2), 'left');   // Name
      styleDataCell(r.getCell(3), 'left');
      styleDataCell(r.getCell(4), 'left');
      styleDataCell(r.getCell(5), 'right');  // Manager
      styleDataCell(r.getCell(6), 'right');  // Staff
      styleDataCell(r.getCell(7), 'right');  // Overtime
      styleDataCell(r.getCell(8), 'right');  // Security
      styleDataCell(r.getCell(9), 'left');   // Note
      styleDataCell(r.getCell(10), 'left');

      if (m.managerQuantity) r.getCell(5).numFmt = '#,##0';
      if (m.staffQuantity) r.getCell(6).numFmt = '#,##0';
      if (m.overtimeQuantity) r.getCell(7).numFmt = '#,##0';
      if (m.securityQuantity) r.getCell(8).numFmt = '#,##0';
    }

    // Total manpower row
    const totalManpowerToday = totalManager + totalStaff + totalOvertime + totalSecurity;
    const rTotal = worksheet.addRow([
      'Tổng cộng nhân sự',
      '',
      '',
      '',
      totalManager ? formatNum(totalManager) : '',
      totalStaff ? formatNum(totalStaff) : '',
      totalOvertime ? formatNum(totalOvertime) : '',
      totalSecurity ? formatNum(totalSecurity) : '',
      `Lũy kế: ${formatNum(totalManpowerToday)} người`,
      '',
    ]);
    rTotal.height = 20;
    worksheet.mergeCells(`A${rTotal.number}:D${rTotal.number}`);
    worksheet.mergeCells(`I${rTotal.number}:J${rTotal.number}`);

    for (let col = 1; col <= 10; col++) {
      const isQtyCol = col >= 5 && col <= 8;
      styleDataCell(rTotal.getCell(col), col === 1 ? 'center' : isQtyCol ? 'right' : 'left', true);
      rTotal.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
      if (isQtyCol && rTotal.getCell(col).value !== '') {
        rTotal.getCell(col).numFmt = '#,##0';
      }
    }
  } else {
    const r = worksheet.addRow(['Không có dữ liệu nhân sự']);
    worksheet.mergeCells(`A${r.number}:J${r.number}`);
    r.eachCell((c) => styleDataCell(c, 'center'));
  }

  worksheet.addRow([]); // Spacer

  // Section III: Work Items
  const rSecIII = worksheet.addRow(['III. Công việc thực hiện trong ngày']);
  worksheet.mergeCells(`A${rSecIII.number}:J${rSecIII.number}`);
  rSecIII.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };

  const wiHeader = worksheet.addRow([
    'TT',
    'Tên công việc',
    '',
    '',
    'Đơn vị',
    '% Đánh giá',
    'Thực hiện',
    'Hôm nay',
    'Luỹ kế',
    'P. Trách',
  ]);
  wiHeader.height = 24;
  worksheet.mergeCells(`B${wiHeader.number}:D${wiHeader.number}`);

  for (let col = 1; col <= 10; col++) {
    styleHeaderCell(wiHeader.getCell(col));
  }

  if (data.workItems.length > 0) {
    let groupIndex = 0;
    for (const item of data.workItems) {
      let ttVal = '';
      if (item.level === 0) {
        groupIndex++;
        ttVal = String(groupIndex);
      } else if (item.level === 1) {
        ttVal = '-';
      }

      const prefix = ' '.repeat(item.level * 4);
      const nameVal = prefix + item.name;

      const r = worksheet.addRow([
        ttVal,
        nameVal,
        '',
        '',
        item.unit || '',
        item.designQuantity !== null ? formatNum(item.designQuantity) : null,
        item.previousAccumulatedQuantity !== null ? formatNum(item.previousAccumulatedQuantity) : null,
        item.todayQuantity !== null ? formatNum(item.todayQuantity) : null,
        item.currentAccumulatedQuantity !== null ? formatNum(item.currentAccumulatedQuantity) : null,
        item.personInCharge || '',
      ]);
      r.height = 20;

      worksheet.mergeCells(`B${r.number}:D${r.number}`);

      const isGroup = item.isGroup;

      for (let col = 1; col <= 10; col++) {
        const cell = r.getCell(col);
        const align =
          col === 1
            ? 'center'
            : col === 2
              ? 'left'
              : col === 5
                ? 'center'
                : col >= 6 && col <= 9
                  ? 'right'
                  : 'left';

        styleDataCell(cell, align, isGroup);
        if (isGroup) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFAFAFA' },
          };
        }

        if (col >= 6 && col <= 9 && cell.value !== null) {
          cell.numFmt = '#,##0.00';
        }
      }
    }
  } else {
    const r = worksheet.addRow(['Không có dữ liệu hạng mục thi công']);
    worksheet.mergeCells(`A${r.number}:J${r.number}`);
    r.eachCell((c) => styleDataCell(c, 'center'));
  }

  worksheet.addRow([]); // Spacer

  // Section IV: Images
  if (data.images && data.images.length > 0) {
    const rSecIV = worksheet.addRow(['IV. Hình ảnh thi công']);
    worksheet.mergeCells(`A${rSecIV.number}:J${rSecIV.number}`);
    rSecIV.getCell(1).font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FF1E3A8A' },
    };
    worksheet.addRow([]); // Spacer
    
    let imgIndex = 0;
    while (imgIndex < data.images.length) {
      const rowStart = worksheet.addRow([]).number;
      
      for (let i = 1; i <= 9; i++) {
        worksheet.addRow([]);
      }
      
      const captionRow = worksheet.addRow([]);
      worksheet.addRow([]); // Spacer row
      
      const leftImg = data.images[imgIndex];
      const rightImg = data.images[imgIndex + 1];
      
      for (let r = rowStart; r < rowStart + 10; r++) {
        worksheet.getRow(r).height = 20;
      }
      
      // Left image
      if (leftImg) {
        const buf = getImageBuffer(leftImg.fileUrl);
        if (buf) {
          try {
            const ext = getImageType(leftImg.fileUrl);
            const imgId = workbook.addImage({
              buffer: buf as any,
              extension: ext,
            });
            worksheet.addImage(imgId, {
              tl: { col: 0, row: rowStart - 1 },
              br: { col: 5, row: rowStart + 9 },
              editAs: 'oneCell'
            } as any);
          } catch (err) {
            console.error('Error adding left image to excel:', err);
          }
        }
        worksheet.getCell(`A${captionRow.number}`).value = `Hình: ${leftImg.caption || 'Thi công'}`;
        worksheet.mergeCells(`A${captionRow.number}:E${captionRow.number}`);
        const capCell = worksheet.getCell(`A${captionRow.number}`);
        capCell.font = { name: 'Arial', size: 9, italic: true };
        capCell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      // Right image
      if (rightImg) {
        const buf = getImageBuffer(rightImg.fileUrl);
        if (buf) {
          try {
            const ext = getImageType(rightImg.fileUrl);
            const imgId = workbook.addImage({
              buffer: buf as any,
              extension: ext,
            });
            worksheet.addImage(imgId, {
              tl: { col: 5, row: rowStart - 1 },
              br: { col: 10, row: rowStart + 9 },
              editAs: 'oneCell'
            } as any);
          } catch (err) {
            console.error('Error adding right image to excel:', err);
          }
        }
        worksheet.getCell(`F${captionRow.number}`).value = `Hình: ${rightImg.caption || 'Thi công'}`;
        worksheet.mergeCells(`F${captionRow.number}:J${captionRow.number}`);
        const capCell = worksheet.getCell(`F${captionRow.number}`);
        capCell.font = { name: 'Arial', size: 9, italic: true };
        capCell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      imgIndex += 2;
    }
  }

  worksheet.addRow([]); // Spacer
  worksheet.addRow([]); // Spacer

  // Signatures
  const rSig = worksheet.addRow([
    'ĐẠI DIỆN TƯ VẤN GIÁM SÁT',
    '',
    '',
    'ĐẠI DIỆN NHÀ THẦU CHÍNH',
    '',
    '',
    'NGƯỜI LẬP BÁO CÁO',
    '',
    '',
    '',
  ]);
  worksheet.mergeCells(`A${rSig.number}:C${rSig.number}`);
  worksheet.mergeCells(`D${rSig.number}:F${rSig.number}`);
  worksheet.mergeCells(`G${rSig.number}:J${rSig.number}`);
  rSig.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  rSig.getCell(4).font = { name: 'Arial', size: 10, bold: true };
  rSig.getCell(7).font = { name: 'Arial', size: 10, bold: true };
  rSig.getCell(1).alignment = { horizontal: 'center' };
  rSig.getCell(4).alignment = { horizontal: 'center' };
  rSig.getCell(7).alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Signature spacing
  worksheet.addRow([]); // Signature spacing
  worksheet.addRow([]); // Signature spacing

  const rSigName = worksheet.addRow([
    data.project.supervisorName || '---',
    '',
    '',
    data.project.contractorName || '---',
    '',
    '',
    data.createdBy.name,
    '',
    '',
    '',
  ]);
  worksheet.mergeCells(`A${rSigName.number}:C${rSigName.number}`);
  worksheet.mergeCells(`D${rSigName.number}:F${rSigName.number}`);
  worksheet.mergeCells(`G${rSigName.number}:J${rSigName.number}`);
  rSigName.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  rSigName.getCell(4).font = { name: 'Arial', size: 9, bold: true };
  rSigName.getCell(7).font = { name: 'Arial', size: 9, bold: true };
  rSigName.getCell(1).alignment = { horizontal: 'center' };
  rSigName.getCell(4).alignment = { horizontal: 'center' };
  rSigName.getCell(7).alignment = { horizontal: 'center' };

  // Return workbook buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
