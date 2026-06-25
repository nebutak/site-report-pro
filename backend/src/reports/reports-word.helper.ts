import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  PageBreak,
} from 'docx';
import { ExportReportData, ExportReportImage } from './reports-pdf.helper';
import { existsSync, readFileSync } from 'fs';

// Helper date formatter
function formatDate(dateInput: Date | string | null): string {
  if (!dateInput) return '---';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '---';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper number formatter
function formatNumber(numInput: any): string {
  if (numInput === null || numInput === undefined || numInput === '')
    return '---';
  const num = Number(numInput);
  if (isNaN(num)) return '---';
  return num.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Helper to create a styled TextRun
function createText(
  text: string,
  options: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
  } = {},
): TextRun {
  return new TextRun({
    text,
    bold: options.bold ?? false,
    italics: options.italic ?? false,
    size: options.size ? options.size * 2 : 18, // 18 in half-points = 9pt
    color: options.color,
    font: 'Arial',
  });
}

// Helper to create a Paragraph
function createParagraph(
  children: (TextRun | ImageRun | string)[],
  options: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
  } = {},
): Paragraph {
  const processedChildren = children.map((child) => {
    if (typeof child === 'string') {
      return createText(child);
    }
    return child;
  });
  return new Paragraph({
    alignment: options.alignment ?? AlignmentType.LEFT,
    spacing: {
      before: options.before ?? 0,
      after: options.after ?? 0,
    },
    children: processedChildren,
  });
}

// Helper to create a Cell
function createCell(
  paragraphs: (Paragraph | Table)[],
  options: {
    widthPct?: number;
    colSpan?: number;
    rowSpan?: number;
    fillColor?: string;
    verticalAlign?: 'top' | 'bottom' | 'center';
  } = {},
): TableCell {
  return new TableCell({
    children: paragraphs,
    width: options.widthPct
      ? { size: options.widthPct, type: WidthType.PERCENTAGE }
      : undefined,
    columnSpan: options.colSpan,
    rowSpan: options.rowSpan,
    shading: options.fillColor ? { fill: options.fillColor } : undefined,
    verticalAlign: options.verticalAlign ?? 'center',
    margins: {
      top: 100, // dxa (approx 5pt)
      bottom: 100,
      left: 120, // dxa (approx 6pt)
      right: 120,
    },
  });
}

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
    console.error('Error reading image buffer in Word helper:', err);
  }
  return null;
}

// Helper to get image type
function getImageType(fileUrl: string): 'png' | 'jpg' | 'gif' {
  const lower = fileUrl.toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.gif')) return 'gif';
  return 'jpg';
}

export async function generateDailyReportWord(
  data: ExportReportData,
): Promise<Buffer> {
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  const borderless = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };

  // Helper to create the repeated page header block (logo, project info, title, weather & metadata)
  const createPageHeader = (): (Table | Paragraph)[] => {
    // 1. Logo Cell Content
    let logoParagraph = createParagraph([
      createText(data.project.contractorName || 'NHÀ THẦU CHÍNH', { bold: true, size: 9 }),
    ], { alignment: AlignmentType.CENTER });

    if (data.project.logoUrl) {
      const logoBuffer = getImageBuffer(data.project.logoUrl);
      if (logoBuffer) {
        logoParagraph = createParagraph([
          new ImageRun({
            data: logoBuffer,
            transformation: {
              width: 100,
              height: 40,
            },
            type: getImageType(data.project.logoUrl),
          }),
        ], { alignment: AlignmentType.CENTER });
      }
    }

    // 2. ISO Badge Cell Content
    const isoParagraphs = [
      createParagraph([createText('🌐', { size: 16, color: '0054a6' })], { alignment: AlignmentType.CENTER }),
      createParagraph([createText('ISO', { bold: true, size: 11, color: '0054a6' })], { alignment: AlignmentType.CENTER }),
      createParagraph([createText('9001:2015', { bold: true, size: 8, color: '0054a6' })], { alignment: AlignmentType.CENTER }),
    ];

    // 3. Header Table (3-column layout)
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [
        new TableRow({
          children: [
            createCell([logoParagraph], { rowSpan: 5, widthPct: 20 }),
            createCell([createParagraph([createText('Dự án:')])], { widthPct: 15, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.project.name, { bold: true })])], { widthPct: 50 }),
            createCell(isoParagraphs, { rowSpan: 5, widthPct: 15 }),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('ĐD Chủ đầu tư:')])], { widthPct: 15, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.project.ownerName || '---', { bold: true })])]),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Tư vấn giám sát:')])], { widthPct: 15, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.project.supervisorName || '---', { bold: true })])]),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Nhà thầu chính:')])], { widthPct: 15, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.project.contractorName || '---', { bold: true })])]),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Địa điểm:')])], { widthPct: 15, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.project.location || '---', { bold: true })])]),
          ],
        }),
      ],
    });

    const titleParagraph = createParagraph(
      [
        createText((data.title || 'BÁO CÁO NHẬT KÝ THI CÔNG HÀNG NGÀY').toUpperCase(), {
          bold: true,
          size: 13,
          color: '000000',
        }),
      ],
      { alignment: AlignmentType.CENTER, before: 120, after: 120 },
    );

    // Metadata Table
    const metaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [
        new TableRow({
          children: [
            createCell([createParagraph([createText('Người báo cáo:', { size: 8 })])], { widthPct: 35, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.project.defaultReporterName || data.createdBy.name, { size: 8, bold: true })])], { widthPct: 65 }),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Người nhận:', { size: 8 })])], { widthPct: 35, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.project.defaultReceiver || 'Ban lãnh đạo công ty', { size: 8, bold: true })])], { widthPct: 65 }),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Cc:', { size: 8 })])], { widthPct: 35, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.project.defaultCc || 'Ban điều hành dự án', { size: 8, bold: true })])], { widthPct: 65 }),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Báo cáo số:', { size: 8 })])], { widthPct: 35, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(data.reportNo || '---', { size: 8, bold: true })])], { widthPct: 65 }),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Báo cáo ngày:', { size: 8 })])], { widthPct: 35, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(formatDate(data.reportDate), { size: 8, bold: true, color: 'FF0000' })])], { widthPct: 65 }),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Ngày phát hành:', { size: 8 })])], { widthPct: 35, fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(formatDate(data.issueDate || data.reportDate), { size: 8, bold: true, color: 'FF0000' })])], { widthPct: 65 }),
          ],
        }),
      ],
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

    const weatherTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createCell([createParagraph([createText('Thời tiết', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { widthPct: 15, fillColor: 'F1F5F9' }),
            createCell([createParagraph([createText('Nắng', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { widthPct: 10, fillColor: 'F1F5F9' }),
            createCell([createParagraph([createText('Mưa', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { widthPct: 10, fillColor: 'F1F5F9' }),
            createCell([createParagraph([createText('B.Thường', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { widthPct: 12, fillColor: 'F1F5F9' }),
            createCell([createParagraph([createText('Gió (cấp)', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { widthPct: 18, fillColor: 'F1F5F9' }),
            createCell([createParagraph([createText('Sóng (m)', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { widthPct: 15, fillColor: 'F1F5F9' }),
            createCell([createParagraph([createText('Sóng lừng', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { widthPct: 20, fillColor: 'F1F5F9' }),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Sáng', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(morning.isSunny ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(morning.isRainy ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(morning.isNormal ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(morning.wind || '', { size: 8 })])]),
            createCell([createParagraph([createText(morning.wave || '', { size: 8 })])]),
            createCell([createParagraph([createText(morning.swell || '', { size: 8 })])]),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Chiều', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(afternoon.isSunny ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(afternoon.isRainy ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(afternoon.isNormal ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(afternoon.wind || '', { size: 8 })])]),
            createCell([createParagraph([createText(afternoon.wave || '', { size: 8 })])]),
            createCell([createParagraph([createText(afternoon.swell || '', { size: 8 })])]),
          ],
        }),
        new TableRow({
          children: [
            createCell([createParagraph([createText('Tối', { bold: true, size: 8 })], { alignment: AlignmentType.CENTER })], { fillColor: 'F8FAFC' }),
            createCell([createParagraph([createText(evening.isSunny ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(evening.isRainy ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(evening.isNormal ? '☑' : '☐', { size: 9 })], { alignment: AlignmentType.CENTER })]),
            createCell([createParagraph([createText(evening.wind || '', { size: 8 })])]),
            createCell([createParagraph([createText(evening.wave || '', { size: 8 })])]),
            createCell([createParagraph([createText(evening.swell || '', { size: 8 })])]),
          ],
        }),
      ],
    });

    const combinedMetaWeatherTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderless,
      rows: [
        new TableRow({
          children: [
            createCell([metaTable], { widthPct: 40 }),
            createCell([], { widthPct: 2 }), // spacer
            createCell([weatherTable], { widthPct: 58 }),
          ],
        }),
      ],
    });

    return [
      headerTable,
      new Paragraph({ spacing: { after: 150 } }),
      titleParagraph,
      combinedMetaWeatherTable,
      new Paragraph({ spacing: { after: 180 } }),
    ];
  };

  // Section I: Equipment and Materials side-by-side
  const maxEqMatRows = Math.max(data.equipmentRows.length, data.materialRows.length);
  const eqMatRows = [];
  for (let i = 0; i < maxEqMatRows; i++) {
    eqMatRows.push({
      eq: data.equipmentRows[i] || null,
      mat: data.materialRows[i] || null,
    });
  }

  const eqMatTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell([createParagraph([createText('I', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 6, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Các thiết bị chính trên công trường', { bold: true })], { alignment: AlignmentType.CENTER })], { colSpan: 2, widthPct: 54, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Vật liệu chính nhập vào công trường', { bold: true })], { alignment: AlignmentType.CENTER })], { colSpan: 2, widthPct: 40, fillColor: 'F1F5F9' }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        createCell([createParagraph([createText('TT', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 6, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Tên thiết bị', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 39, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Số lượng', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 15, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Tên vật tư', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 25, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Khối lượng', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 15, fillColor: 'F1F5F9' }),
      ],
    }),
  ];

  if (eqMatRows.length > 0) {
    eqMatRows.forEach((row, idx) => {
      const eqParagraphs: Paragraph[] = [];
      if (row.eq) {
        const lines = (row.eq.name || '').split('\n');
        lines.forEach(line => eqParagraphs.push(createParagraph([createText(line)])));
      } else {
        eqParagraphs.push(createParagraph([]));
      }

      const matParagraphs: Paragraph[] = [];
      if (row.mat) {
        const lines = (row.mat.name || '').split('\n');
        lines.forEach(line => matParagraphs.push(createParagraph([createText(line)])));
      } else {
        matParagraphs.push(createParagraph([]));
      }

      eqMatTableRows.push(
        new TableRow({
          children: [
            createCell([createParagraph([createText(row.eq ? String(idx + 1) : '')], { alignment: AlignmentType.CENTER })], { widthPct: 6 }),
            createCell(eqParagraphs, { widthPct: 39 }),
            createCell(
              row.eq
                ? [
                    createParagraph(
                      [
                        createText(
                          `${formatNumber(row.eq.todayQuantity)} ${row.eq.unit || 'chiếc'}`,
                          { bold: true },
                        ),
                      ],
                      { alignment: AlignmentType.RIGHT },
                    ),
                  ]
                : [createParagraph([])],
              { widthPct: 15 },
            ),
            createCell(matParagraphs, { widthPct: 25 }),
            createCell(
              row.mat
                ? [
                    createParagraph(
                      [
                        createText(
                          `${formatNumber(row.mat.quantity)} ${row.mat.unit || 'Tấn'}`,
                          { bold: true },
                        ),
                      ],
                      { alignment: AlignmentType.RIGHT },
                    ),
                  ]
                : [createParagraph([])],
              { widthPct: 15 },
            ),
          ],
        }),
      );
    });
  } else {
    eqMatTableRows.push(
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [createText('Không có dữ liệu thiết bị và vật tư', { italic: true })],
                { alignment: AlignmentType.CENTER },
              ),
            ],
            { colSpan: 5 },
          ),
        ],
      }),
    );
  }

  const eqMatTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: eqMatTableRows,
  });

  // Section II: Manpower
  let totalManager = 0;
  let totalStaff = 0;
  let totalOvertime = 0;
  let totalSecurity = 0;

  const manpowerTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell([createParagraph([createText('II', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 6, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Nhân sự trên công trường', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 34, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Quản lý', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 10, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Nhân sự', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 10, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Nhân sự tăng ca', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 12, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Bảo vệ', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 10, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Ghi chú', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 18, fillColor: 'F1F5F9' }),
      ],
    }),
  ];

  if (data.manpowerRows.length > 0) {
    data.manpowerRows.forEach((m, idx) => {
      totalManager += Number(m.managerQuantity || 0);
      totalStaff += Number(m.staffQuantity || 0);
      totalOvertime += Number(m.overtimeQuantity || 0);
      totalSecurity += Number(m.securityQuantity || 0);

      manpowerTableRows.push(
        new TableRow({
          children: [
            createCell([createParagraph([createText(String(idx + 1))], { alignment: AlignmentType.CENTER })], { widthPct: 6 }),
            createCell([createParagraph([createText(m.name)])], { widthPct: 34 }),
            createCell([createParagraph([createText(m.managerQuantity ? formatNumber(m.managerQuantity) : '')], { alignment: AlignmentType.RIGHT })], { widthPct: 10 }),
            createCell([createParagraph([createText(m.staffQuantity ? formatNumber(m.staffQuantity) : '')], { alignment: AlignmentType.RIGHT })], { widthPct: 10 }),
            createCell([createParagraph([createText(m.overtimeQuantity ? formatNumber(m.overtimeQuantity) : '')], { alignment: AlignmentType.RIGHT })], { widthPct: 12 }),
            createCell([createParagraph([createText(m.securityQuantity ? formatNumber(m.securityQuantity) : '')], { alignment: AlignmentType.RIGHT })], { widthPct: 10 }),
            createCell([createParagraph([createText(m.note || '')])], { widthPct: 18 }),
          ],
        }),
      );
    });

    manpowerTableRows.push(
      new TableRow({
        children: [
          createCell([createParagraph([createText('Tổng cộng nhân sự', { bold: true })], { alignment: AlignmentType.CENTER })], { colSpan: 2, widthPct: 40, fillColor: 'F1F5F9' }),
          createCell([createParagraph([createText(totalManager ? formatNumber(totalManager) : '', { bold: true })], { alignment: AlignmentType.RIGHT })], { widthPct: 10, fillColor: 'F1F5F9' }),
          createCell([createParagraph([createText(totalStaff ? formatNumber(totalStaff) : '', { bold: true })], { alignment: AlignmentType.RIGHT })], { widthPct: 10, fillColor: 'F1F5F9' }),
          createCell([createParagraph([createText(totalOvertime ? formatNumber(totalOvertime) : '', { bold: true })], { alignment: AlignmentType.RIGHT })], { widthPct: 12, fillColor: 'F1F5F9' }),
          createCell([createParagraph([createText(totalSecurity ? formatNumber(totalSecurity) : '', { bold: true })], { alignment: AlignmentType.RIGHT })], { widthPct: 10, fillColor: 'F1F5F9' }),
          createCell([createParagraph([])], { widthPct: 18, fillColor: 'F1F5F9' }),
        ],
      }),
    );
  } else {
    manpowerTableRows.push(
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [createText('Không có dữ liệu nhân sự', { italic: true })],
                { alignment: AlignmentType.CENTER },
              ),
            ],
            { colSpan: 7 },
          ),
        ],
      }),
    );
  }

  const manpowerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: manpowerTableRows,
  });

  // Section III: Work Items
  const workItemTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell([createParagraph([createText('III', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 6, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Công việc thực hiện trong ngày', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 39, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Đơn vị', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 8, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('% Đánh giá', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 12, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Thực hiện', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 10, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Hôm nay', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 10, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('Luỹ kế', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 10, fillColor: 'F1F5F9' }),
        createCell([createParagraph([createText('P. Trách', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 15, fillColor: 'F1F5F9' }),
      ],
    }),
  ];

  if (data.workItems.length > 0) {
    let groupIndex = 0;
    data.workItems.forEach((item) => {
      let ttVal = '';
      if (item.level === 0) {
        groupIndex++;
        ttVal = String(groupIndex);
      } else if (item.level === 1) {
        ttVal = '-';
      }

      const isGroup = item.isGroup;
      const bgFill = isGroup ? 'FAFAFA' : undefined;

      const indentPrefix = '\u00A0'.repeat(item.level * 4);
      const itemName = indentPrefix + item.name;

      workItemTableRows.push(
        new TableRow({
          children: [
            createCell([createParagraph([createText(ttVal, { bold: isGroup })], { alignment: AlignmentType.CENTER })], { widthPct: 6, fillColor: bgFill }),
            createCell([createParagraph([createText(itemName, { bold: isGroup })])], { widthPct: 39, fillColor: bgFill }),
            createCell([createParagraph([createText(item.unit || '---')], { alignment: AlignmentType.CENTER })], { widthPct: 8, fillColor: bgFill }),
            createCell([createParagraph([createText(formatNumber(item.designQuantity))], { alignment: AlignmentType.RIGHT })], { widthPct: 12, fillColor: bgFill }),
            createCell([createParagraph([createText(formatNumber(item.previousAccumulatedQuantity))], { alignment: AlignmentType.RIGHT })], { widthPct: 10, fillColor: bgFill }),
            createCell([createParagraph([createText(formatNumber(item.todayQuantity))], { alignment: AlignmentType.RIGHT })], { widthPct: 10, fillColor: bgFill }),
            createCell([createParagraph([createText(formatNumber(item.currentAccumulatedQuantity), { bold: true })], { alignment: AlignmentType.RIGHT })], { widthPct: 10, fillColor: bgFill }),
            createCell([createParagraph([createText(item.personInCharge || '')])], { widthPct: 15, fillColor: bgFill }),
          ],
        }),
      );
    });
  } else {
    workItemTableRows.push(
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [createText('Không có dữ liệu hạng mục thi công', { italic: true })],
                { alignment: AlignmentType.CENTER },
              ),
            ],
            { colSpan: 8 },
          ),
        ],
      }),
    );
  }

  const workItemTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: workItemTableRows,
  });

  // Split images into pages of 3 images
  const imagePagesList: ExportReportImage[][] = [];
  if (data.images && data.images.length > 0) {
    for (let i = 0; i < data.images.length; i += 3) {
      imagePagesList.push(data.images.slice(i, i + 3));
    }
  }

  // Helper function to create image grid content for Word
  const createImagePageElements = (pageImages: ExportReportImage[], pIdx: number): Table => {
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell([createParagraph([createText('IV', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 6, fillColor: 'F1F5F9' }),
          createCell([createParagraph([createText('HÌNH ẢNH THI CÔNG', { bold: true })])], { colSpan: 2, widthPct: 94, fillColor: 'F1F5F9' }),
        ],
      })
    ];

    if (pageImages.length === 3) {
      const img1 = pageImages[0];
      const img2 = pageImages[1];
      const img3 = pageImages[2];
      const buf1 = getImageBuffer(img1.fileUrl);
      const buf2 = getImageBuffer(img2.fileUrl);
      const buf3 = getImageBuffer(img3.fileUrl);

      const makeImageRun = (buf: Buffer, url: string, isFull: boolean) => {
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: buf,
              transformation: {
                width: isFull ? 360 : 210,
                height: isFull ? 220 : 140,
              },
              type: getImageType(url),
            }),
          ],
        });
      };

      const makeCaptionParagraph = (captionText: string) => {
        return createParagraph(
          [createText(captionText, { italic: true, size: 8, color: 'FF0000', bold: true })],
          { alignment: AlignmentType.CENTER, before: 40, after: 40 }
        );
      };

      if (pIdx % 2 === 0) {
        // 2 at top, 1 at bottom
        // Row 1: empty 6%, image 1 (47%), image 2 (47%)
        const cell1Children: (Paragraph | Table)[] = buf1 ? [makeImageRun(buf1, img1.fileUrl, false), makeCaptionParagraph(img1.caption || 'Thi công')] : [createParagraph([])];
        const cell2Children: (Paragraph | Table)[] = buf2 ? [makeImageRun(buf2, img2.fileUrl, false), makeCaptionParagraph(img2.caption || 'Thi công')] : [createParagraph([])];

        tableRows.push(
          new TableRow({
            children: [
              createCell([createParagraph([])], { widthPct: 6 }), // Col 1
              createCell(cell1Children, { widthPct: 47, verticalAlign: 'center' }), // Col 2
              createCell(cell2Children, { widthPct: 47, verticalAlign: 'center' }), // Col 3
            ],
          })
        );

        // Row 2: empty 6%, image 3 (94% colspan 2)
        const cell3Children: (Paragraph | Table)[] = buf3 ? [makeImageRun(buf3, img3.fileUrl, true), makeCaptionParagraph(img3.caption || 'Thi công')] : [createParagraph([])];
        tableRows.push(
          new TableRow({
            children: [
              createCell([createParagraph([])], { widthPct: 6 }), // Col 1
              createCell(cell3Children, { colSpan: 2, widthPct: 94, verticalAlign: 'center' }), // Col 2 & 3
            ],
          })
        );
      } else {
        // 1 at top, 2 at bottom
        // Row 1: empty 6%, image 1 (94% colspan 2)
        const cell1Children: (Paragraph | Table)[] = buf1 ? [makeImageRun(buf1, img1.fileUrl, true), makeCaptionParagraph(img1.caption || 'Thi công')] : [createParagraph([])];
        tableRows.push(
          new TableRow({
            children: [
              createCell([createParagraph([])], { widthPct: 6 }), // Col 1
              createCell(cell1Children, { colSpan: 2, widthPct: 94, verticalAlign: 'center' }), // Col 2 & 3
            ],
          })
        );

        // Row 2: empty 6%, image 2 (47%), image 3 (47%)
        const cell2Children: (Paragraph | Table)[] = buf2 ? [makeImageRun(buf2, img2.fileUrl, false), makeCaptionParagraph(img2.caption || 'Thi công')] : [createParagraph([])];
        const cell3Children: (Paragraph | Table)[] = buf3 ? [makeImageRun(buf3, img3.fileUrl, false), makeCaptionParagraph(img3.caption || 'Thi công')] : [createParagraph([])];

        tableRows.push(
          new TableRow({
            children: [
              createCell([createParagraph([])], { widthPct: 6 }), // Col 1
              createCell(cell2Children, { widthPct: 47, verticalAlign: 'center' }), // Col 2
              createCell(cell3Children, { widthPct: 47, verticalAlign: 'center' }), // Col 3
            ],
          })
        );
      }
    } else if (pageImages.length === 2) {
      const img1 = pageImages[0];
      const img2 = pageImages[1];
      const buf1 = getImageBuffer(img1.fileUrl);
      const buf2 = getImageBuffer(img2.fileUrl);

      const makeImageRun = (buf: Buffer, url: string) => {
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: buf,
              transformation: {
                width: 210,
                height: 140,
              },
              type: getImageType(url),
            }),
          ],
        });
      };

      const makeCaptionParagraph = (captionText: string) => {
        return createParagraph(
          [createText(captionText, { italic: true, size: 8, color: 'FF0000', bold: true })],
          { alignment: AlignmentType.CENTER, before: 40, after: 40 }
        );
      };

      const cell1Children: (Paragraph | Table)[] = buf1 ? [makeImageRun(buf1, img1.fileUrl), makeCaptionParagraph(img1.caption || 'Thi công')] : [createParagraph([])];
      const cell2Children: (Paragraph | Table)[] = buf2 ? [makeImageRun(buf2, img2.fileUrl), makeCaptionParagraph(img2.caption || 'Thi công')] : [createParagraph([])];

      tableRows.push(
        new TableRow({
          children: [
            createCell([createParagraph([])], { widthPct: 6 }), // Col 1
            createCell(cell1Children, { widthPct: 47, verticalAlign: 'center' }), // Col 2
            createCell(cell2Children, { widthPct: 47, verticalAlign: 'center' }), // Col 3
          ],
        })
      );
    } else if (pageImages.length === 1) {
      const img1 = pageImages[0];
      const buf1 = getImageBuffer(img1.fileUrl);

      const makeImageRun = (buf: Buffer, url: string) => {
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: buf,
              transformation: {
                width: 360,
                height: 220,
              },
              type: getImageType(url),
            }),
          ],
        });
      };

      const makeCaptionParagraph = (captionText: string) => {
        return createParagraph(
          [createText(captionText, { italic: true, size: 8, color: 'FF0000', bold: true })],
          { alignment: AlignmentType.CENTER, before: 40, after: 40 }
        );
      };

      const cell1Children: (Paragraph | Table)[] = buf1 ? [makeImageRun(buf1, img1.fileUrl), makeCaptionParagraph(img1.caption || 'Thi công')] : [createParagraph([])];

      tableRows.push(
        new TableRow({
          children: [
            createCell([createParagraph([])], { widthPct: 6 }), // Col 1
            createCell(cell1Children, { colSpan: 2, widthPct: 94, verticalAlign: 'center' }), // Col 2 & 3
          ],
        })
      );
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: tableRows,
    });
  };

  // Signatures Table
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderless,
    rows: [
      new TableRow({
        children: [
          createCell([createParagraph([createText('ĐẠI DIỆN TƯ VẤN GIÁM SÁT', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 33 }),
          createCell([createParagraph([createText('ĐẠI DIỆN NHÀ THẦU CHÍNH', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 34 }),
          createCell([createParagraph([createText('NGƯỜI LẬP BÁO CÁO', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 33 }),
        ],
      }),
      new TableRow({
        children: [
          createCell([createParagraph([], { after: 800 })]),
          createCell([createParagraph([], { after: 800 })]),
          createCell([createParagraph([], { after: 800 })]),
        ],
      }),
      new TableRow({
        children: [
          createCell([createParagraph([createText(data.project.supervisorName || '---', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 33 }),
          createCell([createParagraph([createText(data.project.contractorName || '---', { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 34 }),
          createCell([createParagraph([createText(data.createdBy.name, { bold: true })], { alignment: AlignmentType.CENTER })], { widthPct: 33 }),
        ],
      }),
    ],
  });

  const childrenElements: (Paragraph | Table)[] = [];

  // PAGE 1: Header Block + Section I + Section II
  childrenElements.push(...createPageHeader());
  childrenElements.push(eqMatTable);
  childrenElements.push(new Paragraph({ spacing: { after: 150 } }));
  childrenElements.push(manpowerTable);

  // PAGE 2: Header Block + Section III (separated by a PageBreak!)
  childrenElements.push(new Paragraph({ children: [new PageBreak()] }));
  childrenElements.push(...createPageHeader());
  childrenElements.push(workItemTable);

  // If there are no images, signatures are placed at the bottom of Page 2
  if (imagePagesList.length === 0) {
    childrenElements.push(new Paragraph({ spacing: { after: 240 } }));
    childrenElements.push(signatureTable);
  } else {
    // PAGE 3+: Render images page by page
    imagePagesList.forEach((pageImages, pIdx) => {
      childrenElements.push(new Paragraph({ children: [new PageBreak()] }));
      childrenElements.push(...createPageHeader());
      
      childrenElements.push(createImagePageElements(pageImages, pIdx));

      // Signatures placed at the bottom of the last page of images
      if (pIdx === imagePagesList.length - 1) {
        childrenElements.push(new Paragraph({ spacing: { after: 240 } }));
        childrenElements.push(signatureTable);
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        children: childrenElements,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
