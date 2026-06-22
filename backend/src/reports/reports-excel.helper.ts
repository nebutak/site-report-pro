import { Workbook, Cell } from 'exceljs';
import { ExportReportData } from './reports-pdf.helper';

export async function generateDailyReportExcel(
  data: ExportReportData,
): Promise<Buffer> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Báo cáo ngày');

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
  const row1 = worksheet.addRow([
    data.project.contractorName || 'NHÀ THẦU CHÍNH',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
  ]);
  worksheet.mergeCells('A1:D1');
  worksheet.mergeCells('I1:J1');
  row1.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  row1.getCell(9).font = { name: 'Arial', size: 9, bold: true };
  row1.getCell(9).alignment = { horizontal: 'center' };

  const row2 = worksheet.addRow([
    'Dự án: ' + data.project.name,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Độc lập - Tự do - Hạnh phúc',
  ]);
  worksheet.mergeCells('A2:D2');
  worksheet.mergeCells('I2:J2');
  row2.getCell(1).font = { name: 'Arial', size: 9, italic: true };
  row2.getCell(9).font = { name: 'Arial', size: 9, italic: true };
  row2.getCell(9).alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Blank spacer

  const rowTitle = worksheet.addRow(['BÁO CÁO NHẬT KÝ THI CÔNG HÀNG NGÀY']);
  worksheet.mergeCells('A4:J4');
  rowTitle.getCell(1).font = {
    name: 'Arial',
    size: 14,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  };
  rowTitle.getCell(1).alignment = { horizontal: 'center' };

  const rowSubtitle = worksheet.addRow([
    `Số báo cáo: ${data.reportNo || '---'} | Ngày báo cáo: ${formatDate(data.reportDate)}`,
  ]);
  worksheet.mergeCells('A5:J5');
  rowSubtitle.getCell(1).font = { name: 'Arial', size: 10, italic: true };
  rowSubtitle.getCell(1).alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Spacer

  // Project Info
  const addInfoRow = (
    label1: string,
    val1: string,
    label2: string,
    val2: string,
  ) => {
    const r = worksheet.addRow([label1, val1, '', '', label2, val2]);
    worksheet.mergeCells(`B${r.number}:D${r.number}`);
    worksheet.mergeCells(`F${r.number}:J${r.number}`);
    r.getCell(1).font = { name: 'Arial', size: 9, bold: true };
    r.getCell(5).font = { name: 'Arial', size: 9, bold: true };
    r.getCell(2).font = { name: 'Arial', size: 9 };
    r.getCell(6).font = { name: 'Arial', size: 9 };
  };

  addInfoRow(
    'Dự án:',
    `${data.project.name} (${data.project.code})`,
    'Địa điểm:',
    data.project.location || '---',
  );
  addInfoRow(
    'Chủ đầu tư:',
    data.project.ownerName || '---',
    'Tư vấn giám sát:',
    data.project.supervisorName || '---',
  );
  addInfoRow(
    'Nhà thầu chính:',
    data.project.contractorName || '---',
    'Người lập báo cáo:',
    `${data.createdBy.name} (${data.createdBy.email})`,
  );

  worksheet.addRow([]); // Spacer

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

  // Section A: Weather
  const rSecA = worksheet.addRow(['A. Tình hình thời tiết']);
  worksheet.mergeCells(`A${rSecA.number}:J${rSecA.number}`);
  rSecA.getCell(1).font = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  };

  const wHeader = worksheet.addRow([
    'Buổi',
    'Nắng',
    'Mưa',
    'Bình thường',
    'Gió',
    'Sóng biển',
    'Dòng chảy',
    'Ghi chú',
  ]);
  worksheet.mergeCells(`H${wHeader.number}:J${wHeader.number}`);
  wHeader.eachCell((c) => styleHeaderCell(c));

  if (data.weatherRows.length > 0) {
    for (const w of data.weatherRows) {
      const pText =
        w.period === 'MORNING'
          ? 'Buổi Sáng'
          : w.period === 'AFTERNOON'
            ? 'Buổi Chiều'
            : w.period === 'EVENING'
              ? 'Buổi Tối'
              : w.period;
      const r = worksheet.addRow([
        pText,
        w.isSunny ? '✓' : '',
        w.isRainy ? '✓' : '',
        w.isNormal ? '✓' : '',
        w.wind || '',
        w.wave || '',
        w.swell || '',
        w.note || '',
      ]);
      worksheet.mergeCells(`H${r.number}:J${r.number}`);
      styleDataCell(r.getCell(1), 'left', true);
      styleDataCell(r.getCell(2), 'center');
      styleDataCell(r.getCell(3), 'center');
      styleDataCell(r.getCell(4), 'center');
      styleDataCell(r.getCell(5), 'left');
      styleDataCell(r.getCell(6), 'left');
      styleDataCell(r.getCell(7), 'left');
      styleDataCell(r.getCell(8), 'left');
      styleDataCell(r.getCell(9), 'left');
      styleDataCell(r.getCell(10), 'left');
    }
  } else {
    const r = worksheet.addRow(['Không có dữ liệu thời tiết']);
    worksheet.mergeCells(`A${r.number}:J${r.number}`);
    r.eachCell((c) => styleDataCell(c, 'center'));
  }

  worksheet.addRow([]); // Spacer

  // Section B: Manpower & Equipment
  const rSecB = worksheet.addRow(['B. Tình hình nhân sự & thiết bị thi công']);
  worksheet.mergeCells(`A${rSecB.number}:J${rSecB.number}`);
  rSecB.getCell(1).font = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  };

  const rSubB1 = worksheet.addRow(['B1. Nhân sự thi công']);
  worksheet.mergeCells(`A${rSubB1.number}:J${rSubB1.number}`);
  rSubB1.getCell(1).font = { name: 'Arial', size: 9, bold: true };

  // Double header manpower
  const mH1 = worksheet.addRow([
    'Hạng mục nhân sự / Tổ đội',
    'Đơn vị',
    'Khối lượng nhân sự',
    '',
    '',
    'Phân bổ chi tiết',
    '',
    '',
    '',
    'Ghi chú',
  ]);
  const mH2 = worksheet.addRow([
    '',
    '',
    'Lũy kế trước',
    'Thay đổi',
    'Hôm nay',
    'BĐH / GS',
    'Trực tiếp',
    'Tăng ca',
    'Bảo vệ',
    '',
  ]);

  worksheet.mergeCells(`A${mH1.number}:A${mH2.number}`);
  worksheet.mergeCells(`B${mH1.number}:B${mH2.number}`);
  worksheet.mergeCells(`C${mH1.number}:E${mH1.number}`);
  worksheet.mergeCells(`F${mH1.number}:I${mH1.number}`);
  worksheet.mergeCells(`J${mH1.number}:J${mH2.number}`);

  for (let col = 1; col <= 10; col++) {
    styleHeaderCell(worksheet.getRow(mH1.number).getCell(col));
    styleHeaderCell(worksheet.getRow(mH2.number).getCell(col));
  }

  if (data.manpowerRows.length > 0) {
    for (const m of data.manpowerRows) {
      const r = worksheet.addRow([
        m.name,
        m.unit || 'Người',
        formatNum(m.previousQuantity),
        formatNum(m.changeQuantity),
        formatNum(m.todayQuantity),
        formatNum(m.managerQuantity),
        formatNum(m.staffQuantity),
        formatNum(m.overtimeQuantity),
        formatNum(m.securityQuantity),
        m.note || '',
      ]);

      const mismatch =
        m.previousQuantity !== null &&
        m.changeQuantity !== null &&
        m.todayQuantity !== null &&
        Number(m.previousQuantity) + Number(m.changeQuantity) !==
          Number(m.todayQuantity);

      const fgColor = mismatch ? { argb: 'FFFFF9E6' } : undefined;

      for (let col = 1; col <= 10; col++) {
        const cell = r.getCell(col);
        const align = col === 1 ? 'left' : col === 2 ? 'center' : 'right';
        const isBold = col === 5;
        styleDataCell(cell, align, isBold);
        if (fgColor) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor };
        }
        if (col >= 3 && col <= 9) {
          cell.numFmt = '#,##0';
        }
      }
    }
  } else {
    const r = worksheet.addRow(['Không có dữ liệu nhân sự']);
    worksheet.mergeCells(`A${r.number}:J${r.number}`);
    r.eachCell((c) => styleDataCell(c, 'center'));
  }

  worksheet.addRow([]); // Spacer

  const rSubB2 = worksheet.addRow(['B2. Thiết bị thi công chính']);
  worksheet.mergeCells(`A${rSubB2.number}:J${rSubB2.number}`);
  rSubB2.getCell(1).font = { name: 'Arial', size: 9, bold: true };

  // Double header equipment
  const eH1 = worksheet.addRow([
    'Tên thiết bị / Chủng loại',
    'Đơn vị',
    'Số lượng thi công',
    '',
    '',
    'Trạng thái hiện trạng',
    '',
    '',
    'Ghi chú',
    '',
  ]);
  const eH2 = worksheet.addRow([
    '',
    '',
    'Lũy kế trước',
    'Thay đổi',
    'Hôm nay',
    'Hoạt động',
    'Sửa chữa',
    'Hỏng hóc',
    '',
    '',
  ]);

  worksheet.mergeCells(`A${eH1.number}:A${eH2.number}`);
  worksheet.mergeCells(`B${eH1.number}:B${eH2.number}`);
  worksheet.mergeCells(`C${eH1.number}:E${eH1.number}`);
  worksheet.mergeCells(`F${eH1.number}:H${eH1.number}`);
  worksheet.mergeCells(`I${eH1.number}:J${eH2.number}`);

  for (let col = 1; col <= 10; col++) {
    styleHeaderCell(worksheet.getRow(eH1.number).getCell(col));
    styleHeaderCell(worksheet.getRow(eH2.number).getCell(col));
  }

  if (data.equipmentRows.length > 0) {
    for (const e of data.equipmentRows) {
      const r = worksheet.addRow([
        e.name,
        e.unit || 'Chiếc',
        formatNum(e.previousQuantity),
        formatNum(e.changeQuantity),
        formatNum(e.todayQuantity),
        formatNum(e.normalQuantity),
        formatNum(e.repairingQuantity),
        formatNum(e.brokenQuantity),
        e.note || '',
        '',
      ]);
      worksheet.mergeCells(`I${r.number}:J${r.number}`);

      const mismatchState =
        e.normalQuantity !== null &&
        e.repairingQuantity !== null &&
        e.brokenQuantity !== null &&
        e.todayQuantity !== null &&
        Number(e.normalQuantity) +
          Number(e.repairingQuantity) +
          Number(e.brokenQuantity) !==
          Number(e.todayQuantity);

      const fgColor = mismatchState ? { argb: 'FFFFF9E6' } : undefined;

      for (let col = 1; col <= 9; col++) {
        const cell = r.getCell(col);
        const align = col === 1 ? 'left' : col === 2 ? 'center' : 'right';
        const isBold = col === 5;
        styleDataCell(cell, align, isBold);
        if (fgColor) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor };
        }
        if (col >= 3 && col <= 8) {
          cell.numFmt = '#,##0';
        }
      }
      styleDataCell(r.getCell(10), 'left');
      if (fgColor) {
        r.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor };
      }
    }
  } else {
    const r = worksheet.addRow(['Không có dữ liệu thiết bị thi công']);
    worksheet.mergeCells(`A${r.number}:J${r.number}`);
    r.eachCell((c) => styleDataCell(c, 'center'));
  }

  worksheet.addRow([]); // Spacer

  // Section C: Materials
  const rSecC = worksheet.addRow(['C. Vật tư nhập kho trong ngày']);
  worksheet.mergeCells(`A${rSecC.number}:J${rSecC.number}`);
  rSecC.getCell(1).font = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  };

  const mHeader = worksheet.addRow([
    'Tên vật tư / Chủng loại',
    'Đơn vị',
    'Số lượng nhập trong ngày',
    'Ghi chú',
  ]);
  worksheet.mergeCells('A' + mHeader.number + ':D' + mHeader.number);
  worksheet.mergeCells('F' + mHeader.number + ':J' + mHeader.number);
  styleHeaderCell(mHeader.getCell(1));
  styleHeaderCell(mHeader.getCell(5));
  styleHeaderCell(mHeader.getCell(6));

  if (data.materialRows.length > 0) {
    for (const m of data.materialRows) {
      const r = worksheet.addRow([
        m.name,
        '',
        '',
        '',
        m.unit || 'Tấn',
        formatNum(m.quantity),
        m.note || '',
        '',
        '',
        '',
      ]);
      worksheet.mergeCells(`A${r.number}:D${r.number}`);
      worksheet.mergeCells(`G${r.number}:J${r.number}`);

      styleDataCell(r.getCell(1), 'left');
      styleDataCell(r.getCell(5), 'center');
      styleDataCell(r.getCell(6), 'right', true);
      r.getCell(6).numFmt = '#,##0.00';
      styleDataCell(r.getCell(7), 'left');

      for (let c = 8; c <= 10; c++) {
        styleDataCell(r.getCell(c), 'left');
      }
    }
  } else {
    const r = worksheet.addRow(['Không có dữ liệu vật tư']);
    worksheet.mergeCells(`A${r.number}:J${r.number}`);
    r.eachCell((c) => styleDataCell(c, 'center'));
  }

  worksheet.addRow([]); // Spacer

  // Section D: Work Items
  const rSecD = worksheet.addRow(['D. Khối lượng hạng mục thực hiện']);
  worksheet.mergeCells(`A${rSecD.number}:J${rSecD.number}`);
  rSecD.getCell(1).font = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  };

  const wiHeader = worksheet.addRow([
    'Tên hạng mục thi công',
    'Mã hiệu',
    'Đơn vị',
    'KL thiết kế',
    'Lũy kế trước',
    'KL hôm nay',
    'Lũy kế hiện tại',
    '% Hoàn thành',
    'Người phụ trách',
    'Ghi chú',
  ]);
  wiHeader.eachCell((c) => styleHeaderCell(c));

  if (data.workItems.length > 0) {
    for (const item of data.workItems) {
      const prefix = ' '.repeat(item.level * 4) + (item.isGroup ? '📁 ' : '');
      const nameVal = prefix + item.name;

      const r = worksheet.addRow([
        nameVal,
        item.code || '',
        item.unit || '',
        item.designQuantity !== null ? formatNum(item.designQuantity) : null,
        item.previousAccumulatedQuantity !== null
          ? formatNum(item.previousAccumulatedQuantity)
          : null,
        item.todayQuantity !== null ? formatNum(item.todayQuantity) : null,
        item.currentAccumulatedQuantity !== null
          ? formatNum(item.currentAccumulatedQuantity)
          : null,
        item.completionPercent !== null
          ? formatPct(item.completionPercent)
          : null,
        item.personInCharge || '',
        item.note || '',
      ]);

      const isGroup = item.isGroup;

      for (let col = 1; col <= 10; col++) {
        const cell = r.getCell(col);
        const align =
          col === 1
            ? 'left'
            : col === 2 || col === 3
              ? 'center'
              : col === 8
                ? 'right'
                : col >= 4 && col <= 7
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

        if (col >= 4 && col <= 7 && cell.value !== null) {
          cell.numFmt = '#,##0.00';
        }
        if (col === 8 && cell.value !== null) {
          cell.numFmt = '0.00%';
        }
      }
    }
  } else {
    const r = worksheet.addRow(['Không có dữ liệu hạng mục thi công']);
    worksheet.mergeCells(`A${r.number}:J${r.number}`);
    r.eachCell((c) => styleDataCell(c, 'center'));
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
