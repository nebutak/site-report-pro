import { Workbook, Worksheet } from 'exceljs';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ExportReportData, ExportWeatherRow } from './reports-pdf.helper';

type TemplateConfig = {
  sheetName: string;
  filePrefix: string;
};

const TEMPLATE_CONFIG: Record<string, TemplateConfig> = {
  DAILY: {
    sheetName: '1.BC ngay (CĐT, CMB)',
    filePrefix: 'BC_KLTC_NGAY',
  },
  SUMMARY: {
    sheetName: '3.BCTT (DCC)',
    filePrefix: 'BCTT',
  },
  V2: {
    sheetName: '2.BC Ngày (Viện KTCTĐB)',
    filePrefix: 'BC_NGAY_V2',
  },
  WEEKLY: {
    sheetName: '4.BC Tuần',
    filePrefix: 'BC_TUAN',
  },
  ADJUSTMENT: {
    sheetName: 'DIỀU CHINH',
    filePrefix: 'DIEU_CHINH',
  },
};

function resolveTemplatePath(): string | null {
  const candidates = [
    join(process.cwd(), 'yeu-cau-khach-hang', 'Mau-Bao-Cao.xlsx'),
    join(process.cwd(), '..', 'yeu-cau-khach-hang', 'Mau-Bao-Cao.xlsx'),
  ];

  return candidates.find((path) => existsSync(path)) || null;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}/${date.getFullYear()}`;
}

function excelDate(dateInput: Date | string | null | undefined): Date | string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return Number.isNaN(date.getTime()) ? '' : date;
}

function setCell(sheet: Worksheet, ref: string, value: unknown) {
  sheet.getCell(ref).value = value as any;
}

function weatherByPeriod(
  rows: ExportWeatherRow[],
  period: 'Sáng' | 'Chiều' | 'Tối',
): ExportWeatherRow | undefined {
  const aliases =
    period === 'Sáng'
      ? ['sáng', 'morning']
      : period === 'Chiều'
        ? ['chiều', 'afternoon']
        : ['tối', 'evening'];

  return rows.find((row) => aliases.includes(row.period.toLowerCase().trim()));
}

function weatherLabel(row?: ExportWeatherRow): string {
  if (!row) return '';
  if (row.isSunny) return 'Nắng';
  if (row.isRainy) return 'Mưa';
  if (row.isNormal) return 'BT';
  return row.note || '';
}

function weatherSummary(rows: ExportWeatherRow[]): string {
  const morning = weatherByPeriod(rows, 'Sáng');
  const afternoon = weatherByPeriod(rows, 'Chiều');
  const evening = weatherByPeriod(rows, 'Tối');
  const wind = morning?.wind || afternoon?.wind || evening?.wind || '';
  const wave = morning?.wave || afternoon?.wave || evening?.wave || '';
  const swell = morning?.swell || afternoon?.swell || evening?.swell || '';

  return [
    `Sáng: ${weatherLabel(morning) || '---'}`,
    `Chiều: ${weatherLabel(afternoon) || '---'}`,
    `Tối: ${weatherLabel(evening) || '---'}`,
    wind ? `Gió: ${wind}` : '',
    wave ? `Sóng: ${wave}` : '',
    swell ? `Sóng lừng: ${swell}` : '',
  ]
    .filter(Boolean)
    .join(';   ');
}

function markWeather(row: ExportWeatherRow | undefined, key: 'sun' | 'rain' | 'normal') {
  if (!row) return 'O';
  if (key === 'sun') return row.isSunny ? 'R' : 'O';
  if (key === 'rain') return row.isRainy ? 'R' : 'O';
  return row.isNormal ? 'R' : 'O';
}

function getImageBuffer(fileUrl: string): Buffer | null {
  try {
    const candidates = fileUrl.startsWith('/')
      ? [join(process.cwd(), fileUrl), join(process.cwd(), `.${fileUrl}`)]
      : [fileUrl, join(process.cwd(), fileUrl)];

    const found = candidates.find((candidate) => existsSync(candidate));
    return found ? readFileSync(found) : null;
  } catch {
    return null;
  }
}

function getImageType(fileUrl: string): 'png' | 'gif' | 'jpeg' {
  const lower = fileUrl.toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.gif')) return 'gif';
  return 'jpeg';
}

function applyWorkbookVisibility(workbook: Workbook, activeSheet: Worksheet) {
  workbook.worksheets.forEach((sheet) => {
    sheet.state = sheet.id === activeSheet.id ? 'visible' : 'veryHidden';
  });
}

function fillDailySheet(sheet: Worksheet, data: ExportReportData) {
  const dateText = formatDate(data.reportDate);
  setCell(
    sheet,
    'B2',
    `${data.project.contractorName || 'CÔNG TY TNHH ĐTXD DACINCO'}\nBĐH: ${data.project.name}`,
  );
  setCell(sheet, 'G2', 'CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc');
  setCell(sheet, 'B4', 'BÁO CÁO');
  setCell(sheet, 'B5', `KHỐI LƯỢNG THI CÔNG NGÀY ${dateText}`);
  setCell(sheet, 'B6', `DỰ ÁN: ${data.project.name.toUpperCase()}`);
  setCell(sheet, 'D7', weatherSummary(data.weatherRows));
  setCell(sheet, 'T5', excelDate(data.reportDate));
  setCell(sheet, 'T6', excelDate(new Date(data.reportDate.getTime() - 86400000)));

  data.manpowerRows.slice(0, 5).forEach((row, index) => {
    const r = 12 + index;
    setCell(sheet, `B${r}`, index + 1);
    setCell(sheet, `C${r}`, row.name);
    setCell(sheet, `E${r}`, row.unit || 'Người');
    setCell(sheet, `F${r}`, toNumber(row.previousQuantity));
    setCell(sheet, `G${r}`, toNumber(row.changeQuantity));
    setCell(sheet, `I${r}`, toNumber(row.todayQuantity));
    setCell(sheet, `J${r}`, row.note || '');
  });

  data.equipmentRows.slice(0, 39).forEach((row, index) => {
    const r = 23 + index;
    setCell(sheet, `B${r}`, index + 1);
    setCell(sheet, `C${r}`, row.name);
    setCell(sheet, `E${r}`, row.unit || '');
    setCell(sheet, `F${r}`, toNumber(row.previousQuantity));
    setCell(sheet, `G${r}`, toNumber(row.changeQuantity));
    setCell(sheet, `I${r}`, toNumber(row.todayQuantity));
    setCell(sheet, `J${r}`, toNumber(row.normalQuantity));
    setCell(sheet, `K${r}`, toNumber(row.repairingQuantity));
    setCell(sheet, `L${r}`, toNumber(row.brokenQuantity));
    setCell(sheet, `M${r}`, row.note || '');
  });

  data.workItems.slice(0, 90).forEach((row, index) => {
    const r = 66 + index;
    setCell(sheet, `B${r}`, row.code || (row.isGroup ? '' : index + 1));
    setCell(sheet, `C${r}`, `${'  '.repeat(row.level)}${row.name}`);
    setCell(sheet, `E${r}`, row.unit || '');
    setCell(sheet, `F${r}`, toNumber(row.designQuantity));
    setCell(sheet, `G${r}`, toNumber(row.previousAccumulatedQuantity));
    setCell(sheet, `I${r}`, toNumber(row.todayQuantity));
    setCell(sheet, `J${r}`, toNumber(row.currentAccumulatedQuantity));
    setCell(sheet, `K${r}`, row.completionPercent ? toNumber(row.completionPercent) / 100 : 0);
    setCell(sheet, `M${r}`, row.note || '');
  });
}

function fillSummarySheet(sheet: Worksheet, workbook: Workbook, data: ExportReportData) {
  const reportDate = excelDate(data.reportDate);
  const issueDate = excelDate(data.issueDate || new Date(data.reportDate.getTime() + 86400000));

  setCell(sheet, 'F2', data.project.name);
  setCell(sheet, 'F3', data.project.ownerName || '');
  setCell(sheet, 'F4', data.project.supervisorName || '');
  setCell(sheet, 'F5', data.project.contractorName || '');
  setCell(sheet, 'F6', data.project.location || '');
  setCell(sheet, 'B7', data.reportType === 'V2' ? 'BÁO CÁO NGÀY - V2' : 'BÁO CÁO NGÀY');
  setCell(sheet, 'D8', data.project.defaultReporterName || data.createdBy.name);
  setCell(sheet, 'D9', data.project.defaultReceiver || 'Ban lãnh đạo công ty');
  setCell(sheet, 'D10', data.project.defaultCc || 'Ban điều hành dự án');
  setCell(sheet, 'D11', data.reportNo || '');
  setCell(sheet, 'D12', reportDate);
  setCell(sheet, 'D13', issueDate);

  const periods = [
    { row: 11, value: weatherByPeriod(data.weatherRows, 'Sáng') },
    { row: 12, value: weatherByPeriod(data.weatherRows, 'Chiều') },
    { row: 13, value: weatherByPeriod(data.weatherRows, 'Tối') },
  ];

  periods.forEach(({ row, value }) => {
    setCell(sheet, `G${row}`, markWeather(value, 'sun'));
    setCell(sheet, `H${row}`, markWeather(value, 'rain'));
    setCell(sheet, `I${row}`, markWeather(value, 'normal'));
    setCell(sheet, `J${row}`, value?.wind || '');
    setCell(sheet, `K${row}`, value?.wave || '');
    setCell(sheet, `L${row}`, value?.swell || '');
  });

  data.equipmentRows.slice(0, 20).forEach((row, index) => {
    const r = 17 + index;
    setCell(sheet, `B${r}`, index + 1);
    setCell(sheet, `C${r}`, row.name);
    setCell(sheet, `G${r}`, toNumber(row.todayQuantity));
  });

  data.materialRows.slice(0, 20).forEach((row, index) => {
    const r = 17 + index;
    setCell(sheet, `I${r}`, row.name);
    setCell(sheet, `K${r}`, toNumber(row.quantity));
  });

  data.workItems
    .filter((row) => !row.isGroup || row.todayQuantity)
    .slice(0, 36)
    .forEach((row, index) => {
      const r = 39 + index;
      setCell(sheet, `C${r}`, `${'  '.repeat(row.level)}${row.name}`);
      setCell(sheet, `H${r}`, toNumber(row.todayQuantity));
      setCell(sheet, `J${r}`, row.note || '');
    });

  data.images.slice(0, 12).forEach((image, index) => {
    const buffer = getImageBuffer(image.fileUrl);
    const baseRow = 88 + Math.floor(index / 2) * 16;
    const isRight = index % 2 === 1;
    const colStart = isRight ? 7 : 2;
    const colEnd = isRight ? 12 : 7;

    if (buffer) {
      const imageId = workbook.addImage({
        buffer: buffer as any,
        extension: getImageType(image.fileUrl),
      });
      sheet.addImage(imageId, {
        tl: { col: colStart - 1, row: baseRow - 1 },
        br: { col: colEnd, row: baseRow + 7 },
        editAs: 'oneCell',
      } as any);
    }

    const captionCell = isRight ? `H${baseRow + 8}` : `C${baseRow + 8}`;
    setCell(sheet, captionCell, image.caption || `Hình ${index + 1}`);
  });
}

function fillWeeklySheet(sheet: Worksheet, data: ExportReportData) {
  const dateText = formatDate(data.reportDate);
  setCell(
    sheet,
    'B4',
    `${data.project.contractorName || 'CÔNG TY TNHH ĐTXD DACINCO'}\nBĐH: ${data.project.name}`,
  );
  setCell(sheet, 'G4', 'CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc');
  setCell(sheet, 'B6', 'BÁO CÁO TUẦN');
  setCell(sheet, 'B7', `KHỐI LƯỢNG THI CÔNG NGÀY ${dateText}`);
  setCell(sheet, 'B9', `Dự án: ${data.project.name}`);
  setCell(sheet, 'B10', `Địa điểm: ${data.project.location || ''}`);
  setCell(sheet, 'B11', `Chủ đầu tư: ${data.project.ownerName || ''}`);
  setCell(sheet, 'B12', `Tư vấn giám sát: ${data.project.supervisorName || ''}`);
  setCell(sheet, 'B13', `Nhà thầu thi công: ${data.project.contractorName || ''}`);

  data.workItems.slice(0, 120).forEach((row, index) => {
    const r = 66 + index;
    setCell(sheet, `B${r}`, row.code || (row.isGroup ? '' : index + 1));
    setCell(sheet, `C${r}`, `${'  '.repeat(row.level)}${row.name}`);
    setCell(sheet, `E${r}`, row.unit || '');
    setCell(sheet, `F${r}`, toNumber(row.designQuantity));
    setCell(sheet, `G${r}`, toNumber(row.previousAccumulatedQuantity));
    setCell(sheet, `I${r}`, toNumber(row.todayQuantity));
    setCell(sheet, `J${r}`, toNumber(row.currentAccumulatedQuantity));
    setCell(sheet, `K${r}`, row.completionPercent ? toNumber(row.completionPercent) / 100 : 0);
    setCell(sheet, `M${r}`, row.note || '');
  });
}

function fillAdjustmentSheet(sheet: Worksheet, data: ExportReportData) {
  const dateText = formatDate(data.reportDate);
  setCell(sheet, 'A1', `BÁO CÁO ĐIỀU CHỈNH NGÀY ${dateText}`);

  data.workItems.slice(0, 24).forEach((row, index) => {
    const r = 5 + index;
    setCell(sheet, `A${r}`, row.code || index + 1);
    setCell(sheet, `B${r}`, `${'  '.repeat(row.level)}${row.name}`);
    setCell(sheet, `C${r}`, row.unit || '');
    setCell(sheet, `D${r}`, toNumber(row.previousAccumulatedQuantity));
    setCell(sheet, `K${r}`, toNumber(row.todayQuantity));
    setCell(sheet, `L${r}`, toNumber(row.currentAccumulatedQuantity));
  });
}

export function getExcelTemplateFilePrefix(reportType: string): string {
  return TEMPLATE_CONFIG[reportType]?.filePrefix || 'BC_KLTC_NGAY';
}

export async function generateReportExcelFromTemplate(
  data: ExportReportData,
): Promise<Buffer | null> {
  const config = TEMPLATE_CONFIG[data.reportType];
  const templatePath = resolveTemplatePath();
  if (!config || !templatePath) return null;

  const workbook = new Workbook();
  await workbook.xlsx.readFile(templatePath);

  const sheet = workbook.getWorksheet(config.sheetName);
  if (!sheet) return null;

  applyWorkbookVisibility(workbook, sheet);

  if (data.reportType === 'DAILY') {
    fillDailySheet(sheet, data);
  } else if (data.reportType === 'WEEKLY') {
    fillWeeklySheet(sheet, data);
  } else if (data.reportType === 'ADJUSTMENT') {
    fillAdjustmentSheet(sheet, data);
  } else {
    fillSummarySheet(sheet, workbook, data);
  }

  workbook.calcProperties.fullCalcOnLoad = true;
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
