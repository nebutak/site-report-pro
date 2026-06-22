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
} from 'docx';
import { ExportReportData } from './reports-pdf.helper';
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

// Helper percent formatter
function formatPercent(numInput: any): string {
  if (numInput === null || numInput === undefined || numInput === '')
    return '---';
  const num = Number(numInput);
  if (isNaN(num)) return '---';
  return num.toFixed(2) + '%';
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
  paragraphs: Paragraph[],
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
    top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
  };

  const borderless = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };

  // Header Table (Contractor vs Republic title)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderless,
    rows: [
      new TableRow({
        children: [
          createCell(
            [
              createParagraph([
                createText(data.project.contractorName || 'NHÀ THẦU CHÍNH', {
                  bold: true,
                  size: 10,
                }),
              ]),
              createParagraph([
                createText(`Dự án: ${data.project.name}`, {
                  italic: true,
                  size: 9,
                }),
              ]),
            ],
            { widthPct: 50 },
          ),
          createCell(
            [
              createParagraph(
                [
                  createText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
                    bold: true,
                    size: 9,
                  }),
                ],
                { alignment: AlignmentType.CENTER },
              ),
              createParagraph(
                [
                  createText('Độc lập - Tự do - Hạnh phúc', {
                    italic: true,
                    size: 9,
                  }),
                ],
                { alignment: AlignmentType.CENTER },
              ),
            ],
            { widthPct: 50 },
          ),
        ],
      }),
    ],
  });

  // Project Info Table
  const projectInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      new TableRow({
        children: [
          createCell(
            [createParagraph([createText('Dự án:', { bold: true })])],
            { widthPct: 15, fillColor: 'F8FAFC' },
          ),
          createCell(
            [
              createParagraph([
                createText(`${data.project.name} (${data.project.code})`),
              ]),
            ],
            { widthPct: 35 },
          ),
          createCell(
            [createParagraph([createText('Địa điểm:', { bold: true })])],
            { widthPct: 15, fillColor: 'F8FAFC' },
          ),
          createCell(
            [createParagraph([createText(data.project.location || '---')])],
            {
              widthPct: 35,
            },
          ),
        ],
      }),
      new TableRow({
        children: [
          createCell(
            [createParagraph([createText('Chủ đầu tư:', { bold: true })])],
            { widthPct: 15, fillColor: 'F8FAFC' },
          ),
          createCell(
            [createParagraph([createText(data.project.ownerName || '---')])],
            {
              widthPct: 35,
            },
          ),
          createCell(
            [createParagraph([createText('Tư vấn giám sát:', { bold: true })])],
            { widthPct: 15, fillColor: 'F8FAFC' },
          ),
          createCell(
            [
              createParagraph([
                createText(data.project.supervisorName || '---'),
              ]),
            ],
            { widthPct: 35 },
          ),
        ],
      }),
      new TableRow({
        children: [
          createCell(
            [createParagraph([createText('Nhà thầu chính:', { bold: true })])],
            { widthPct: 15, fillColor: 'F8FAFC' },
          ),
          createCell(
            [
              createParagraph([
                createText(data.project.contractorName || '---'),
              ]),
            ],
            { widthPct: 35 },
          ),
          createCell(
            [createParagraph([createText('Người lập:', { bold: true })])],
            { widthPct: 15, fillColor: 'F8FAFC' },
          ),
          createCell(
            [
              createParagraph([
                createText(`${data.createdBy.name} (${data.createdBy.email})`),
              ]),
            ],
            { widthPct: 35 },
          ),
        ],
      }),
    ],
  });

  // Weather Table rows
  const weatherRowsList = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell(
          [
            createParagraph([createText('Buổi', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 12, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Nắng', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Mưa', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Bình thường', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 12, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Gió', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 12, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Sóng biển', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 12, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Dòng chảy', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 12, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Ghi chú', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 24, fillColor: 'F1F5F9' },
        ),
      ],
    }),
  ];

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
      weatherRowsList.push(
        new TableRow({
          children: [
            createCell([createParagraph([createText(pText, { bold: true })])], {
              widthPct: 12,
            }),
            createCell(
              [
                createParagraph([createText(w.isSunny ? '✓' : '')], {
                  alignment: AlignmentType.CENTER,
                }),
              ],
              { widthPct: 8 },
            ),
            createCell(
              [
                createParagraph([createText(w.isRainy ? '✓' : '')], {
                  alignment: AlignmentType.CENTER,
                }),
              ],
              { widthPct: 8 },
            ),
            createCell(
              [
                createParagraph([createText(w.isNormal ? '✓' : '')], {
                  alignment: AlignmentType.CENTER,
                }),
              ],
              { widthPct: 12 },
            ),
            createCell([createParagraph([createText(w.wind || '')])], {
              widthPct: 12,
            }),
            createCell([createParagraph([createText(w.wave || '')])], {
              widthPct: 12,
            }),
            createCell([createParagraph([createText(w.swell || '')])], {
              widthPct: 12,
            }),
            createCell([createParagraph([createText(w.note || '')])], {
              widthPct: 24,
            }),
          ],
        }),
      );
    }
  } else {
    weatherRowsList.push(
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [createText('Không có dữ liệu thời tiết', { italic: true })],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { colSpan: 8 },
          ),
        ],
      }),
    );
  }

  // Manpower Table rows
  const manpowerRowsList = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell(
          [
            createParagraph(
              [createText('Hạng mục nhân sự / Tổ đội', { bold: true })],
              {
                alignment: AlignmentType.CENTER,
              },
            ),
          ],
          { rowSpan: 2, widthPct: 20, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Đơn vị', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { rowSpan: 2, widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph(
              [createText('Khối lượng nhân sự', { bold: true })],
              {
                alignment: AlignmentType.CENTER,
              },
            ),
          ],
          { colSpan: 3, widthPct: 24, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Phân bổ chi tiết', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { colSpan: 4, widthPct: 32, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Ghi chú', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { rowSpan: 2, widthPct: 16, fillColor: 'F1F5F9' },
        ),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        createCell(
          [
            createParagraph([createText('Lũy kế trước', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Thay đổi', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Hôm nay', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('BĐH / GS', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Trực tiếp', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Tăng ca', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Bảo vệ', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
      ],
    }),
  ];

  if (data.manpowerRows.length > 0) {
    for (const m of data.manpowerRows) {
      const mismatch =
        m.previousQuantity !== null &&
        m.changeQuantity !== null &&
        m.todayQuantity !== null &&
        Number(m.previousQuantity) + Number(m.changeQuantity) !==
          Number(m.todayQuantity);

      const rowFill = mismatch ? 'FFF9E6' : undefined;
      const changeSign =
        m.changeQuantity !== null && Number(m.changeQuantity) >= 0 ? '+' : '';

      manpowerRowsList.push(
        new TableRow({
          children: [
            createCell([createParagraph([createText(m.name)])], {
              fillColor: rowFill,
            }),
            createCell(
              [
                createParagraph([createText(m.unit || 'Người')], {
                  alignment: AlignmentType.CENTER,
                }),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(m.previousQuantity))],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(changeSign + formatNumber(m.changeQuantity))],
                  { alignment: AlignmentType.RIGHT },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(m.todayQuantity), { bold: true })],
                  { alignment: AlignmentType.RIGHT },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph([createText(formatNumber(m.managerQuantity))], {
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph([createText(formatNumber(m.staffQuantity))], {
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(m.overtimeQuantity))],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(m.securityQuantity))],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell([createParagraph([createText(m.note || '')])], {
              fillColor: rowFill,
            }),
          ],
        }),
      );
    }
  } else {
    manpowerRowsList.push(
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [createText('Không có dữ liệu nhân sự', { italic: true })],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { colSpan: 10 },
          ),
        ],
      }),
    );
  }

  // Equipment Table rows
  const equipmentRowsList = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell(
          [
            createParagraph(
              [createText('Tên thiết bị / Chủng loại', { bold: true })],
              {
                alignment: AlignmentType.CENTER,
              },
            ),
          ],
          { rowSpan: 2, widthPct: 22, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Đơn vị', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { rowSpan: 2, widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Số lượng thi công', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { colSpan: 3, widthPct: 24, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph(
              [createText('Trạng thái hiện trạng', { bold: true })],
              {
                alignment: AlignmentType.CENTER,
              },
            ),
          ],
          { colSpan: 3, widthPct: 24, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Ghi chú', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { rowSpan: 2, widthPct: 22, fillColor: 'F1F5F9' },
        ),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        createCell(
          [
            createParagraph([createText('Lũy kế trước', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Thay đổi', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Hôm nay', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Hoạt động', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Sửa chữa', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Hỏng hóc', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
      ],
    }),
  ];

  if (data.equipmentRows.length > 0) {
    for (const e of data.equipmentRows) {
      const mismatchState =
        e.normalQuantity !== null &&
        e.repairingQuantity !== null &&
        e.brokenQuantity !== null &&
        e.todayQuantity !== null &&
        Number(e.normalQuantity) +
          Number(e.repairingQuantity) +
          Number(e.brokenQuantity) !==
          Number(e.todayQuantity);

      const rowFill = mismatchState ? 'FFF9E6' : undefined;
      const changeSign =
        e.changeQuantity !== null && Number(e.changeQuantity) >= 0 ? '+' : '';

      equipmentRowsList.push(
        new TableRow({
          children: [
            createCell([createParagraph([createText(e.name)])], {
              fillColor: rowFill,
            }),
            createCell(
              [
                createParagraph([createText(e.unit || 'Chiếc')], {
                  alignment: AlignmentType.CENTER,
                }),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(e.previousQuantity))],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(changeSign + formatNumber(e.changeQuantity))],
                  { alignment: AlignmentType.RIGHT },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(e.todayQuantity), { bold: true })],
                  { alignment: AlignmentType.RIGHT },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph([createText(formatNumber(e.normalQuantity))], {
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(e.repairingQuantity))],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { fillColor: rowFill },
            ),
            createCell(
              [
                createParagraph([createText(formatNumber(e.brokenQuantity))], {
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              { fillColor: rowFill },
            ),
            createCell([createParagraph([createText(e.note || '')])], {
              fillColor: rowFill,
            }),
          ],
        }),
      );
    }
  } else {
    equipmentRowsList.push(
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [
                  createText('Không có dữ liệu thiết bị thi công', {
                    italic: true,
                  }),
                ],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { colSpan: 9 },
          ),
        ],
      }),
    );
  }

  // Materials Table
  const materialRowsList = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell(
          [
            createParagraph(
              [createText('Tên vật tư / Chủng loại', { bold: true })],
              {
                alignment: AlignmentType.CENTER,
              },
            ),
          ],
          { widthPct: 40, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Đơn vị', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 15, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph(
              [createText('Số lượng nhập trong ngày', { bold: true })],
              {
                alignment: AlignmentType.CENTER,
              },
            ),
          ],
          { widthPct: 20, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Ghi chú', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 25, fillColor: 'F1F5F9' },
        ),
      ],
    }),
  ];

  if (data.materialRows.length > 0) {
    for (const m of data.materialRows) {
      materialRowsList.push(
        new TableRow({
          children: [
            createCell([createParagraph([createText(m.name)])], {
              widthPct: 40,
            }),
            createCell(
              [
                createParagraph([createText(m.unit || 'Tấn')], {
                  alignment: AlignmentType.CENTER,
                }),
              ],
              { widthPct: 15 },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(m.quantity), { bold: true })],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { widthPct: 20 },
            ),
            createCell([createParagraph([createText(m.note || '')])], {
              widthPct: 25,
            }),
          ],
        }),
      );
    }
  } else {
    materialRowsList.push(
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [createText('Không có dữ liệu vật tư', { italic: true })],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { colSpan: 4 },
          ),
        ],
      }),
    );
  }

  // Work Items Table
  const workItemRowsList = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell(
          [
            createParagraph(
              [createText('Tên hạng mục thi công', { bold: true })],
              {
                alignment: AlignmentType.CENTER,
              },
            ),
          ],
          { widthPct: 26, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Mã hiệu', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Đơn vị', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 6, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('KL thiết kế', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 9, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Lũy kế trước', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 9, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('KL hôm nay', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 9, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Lũy kế hiện tại', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 9, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('% Hoàn thành', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Người phụ trách', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
        createCell(
          [
            createParagraph([createText('Ghi chú', { bold: true })], {
              alignment: AlignmentType.CENTER,
            }),
          ],
          { widthPct: 8, fillColor: 'F1F5F9' },
        ),
      ],
    }),
  ];

  if (data.workItems.length > 0) {
    for (const item of data.workItems) {
      const isGroup = item.isGroup;
      const bgFill = isGroup ? 'FAFAFA' : undefined;

      const indentPrefix =
        '\u00A0'.repeat(item.level * 4) + (isGroup ? '📁 ' : '');
      const itemName = indentPrefix + item.name;

      workItemRowsList.push(
        new TableRow({
          children: [
            createCell(
              [createParagraph([createText(itemName, { bold: isGroup })])],
              {
                fillColor: bgFill,
              },
            ),
            createCell(
              [
                createParagraph([createText(item.code || '')], {
                  alignment: AlignmentType.CENTER,
                }),
              ],
              { fillColor: bgFill },
            ),
            createCell(
              [
                createParagraph([createText(item.unit || '---')], {
                  alignment: AlignmentType.CENTER,
                }),
              ],
              { fillColor: bgFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(item.designQuantity))],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { fillColor: bgFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(item.previousAccumulatedQuantity))],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { fillColor: bgFill },
            ),
            createCell(
              [
                createParagraph(
                  [createText(formatNumber(item.todayQuantity))],
                  {
                    alignment: AlignmentType.RIGHT,
                  },
                ),
              ],
              { fillColor: bgFill },
            ),
            createCell(
              [
                createParagraph(
                  [
                    createText(formatNumber(item.currentAccumulatedQuantity), {
                      bold: true,
                    }),
                  ],
                  { alignment: AlignmentType.RIGHT },
                ),
              ],
              { fillColor: bgFill },
            ),
            createCell(
              [
                createParagraph(
                  [
                    createText(formatPercent(item.completionPercent), {
                      bold: true,
                    }),
                  ],
                  { alignment: AlignmentType.RIGHT },
                ),
              ],
              { fillColor: bgFill },
            ),
            createCell(
              [createParagraph([createText(item.personInCharge || '')])],
              {
                fillColor: bgFill,
              },
            ),
            createCell([createParagraph([createText(item.note || '')])], {
              fillColor: bgFill,
            }),
          ],
        }),
      );
    }
  } else {
    workItemRowsList.push(
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [
                  createText('Không có dữ liệu hạng mục thi công', {
                    italic: true,
                  }),
                ],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { colSpan: 10 },
          ),
        ],
      }),
    );
  }

  // Construction Images
  const imageElements: Paragraph[] = [];
  if (data.images && data.images.length > 0) {
    imageElements.push(
      createParagraph(
        [
          createText('E. Hình ảnh thi công', {
            bold: true,
            size: 11,
            color: '1E3A8A',
          }),
        ],
        { before: 240, after: 120 },
      ),
    );
    for (const img of data.images) {
      const buffer = getImageBuffer(img.fileUrl);
      if (buffer) {
        imageElements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: buffer,
                transformation: {
                  width: 360,
                  height: 240,
                },
                type: getImageType(img.fileUrl),
              }),
            ],
          }),
        );
        imageElements.push(
          createParagraph(
            [
              createText(`Hình: ${img.caption || 'Thi công'}`, {
                italic: true,
                size: 9,
              }),
            ],
            { alignment: AlignmentType.CENTER, before: 60, after: 180 },
          ),
        );
      }
    }
  }

  // Signatures Table
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderless,
    rows: [
      new TableRow({
        children: [
          createCell(
            [
              createParagraph(
                [createText('ĐẠI DIỆN TƯ VẤN GIÁM SÁT', { bold: true })],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { widthPct: 33 },
          ),
          createCell(
            [
              createParagraph(
                [createText('ĐẠI DIỆN NHÀ THẦU CHÍNH', { bold: true })],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { widthPct: 34 },
          ),
          createCell(
            [
              createParagraph(
                [createText('NGƯỜI LẬP BÁO CÁO', { bold: true })],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { widthPct: 33 },
          ),
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
          createCell(
            [
              createParagraph(
                [
                  createText(data.project.supervisorName || '---', {
                    bold: true,
                  }),
                ],
                { alignment: AlignmentType.CENTER },
              ),
            ],
            { widthPct: 33 },
          ),
          createCell(
            [
              createParagraph(
                [
                  createText(data.project.contractorName || '---', {
                    bold: true,
                  }),
                ],
                { alignment: AlignmentType.CENTER },
              ),
            ],
            { widthPct: 34 },
          ),
          createCell(
            [
              createParagraph(
                [createText(data.createdBy.name, { bold: true })],
                {
                  alignment: AlignmentType.CENTER,
                },
              ),
            ],
            { widthPct: 33 },
          ),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          // Header Contractor / Country Title
          headerTable,
          new Paragraph({ spacing: { after: 200 } }),

          // Title
          createParagraph(
            [
              createText(data.title || 'BÁO CÁO NHẬT KÝ THI CÔNG HÀNG NGÀY', {
                bold: true,
                size: 14,
                color: '1E3A8A',
              }),
            ],
            { alignment: AlignmentType.CENTER },
          ),
          createParagraph(
            [
              createText(
                `Số báo cáo: ${data.reportNo || '---'} | Ngày báo cáo: ${formatDate(data.reportDate)}`,
                { italic: true, size: 10 },
              ),
            ],
            { alignment: AlignmentType.CENTER, after: 240 },
          ),

          // Project general info table
          projectInfoTable,
          new Paragraph({ spacing: { after: 200 } }),

          // Section A: Weather
          createParagraph(
            [
              createText('A. Tình hình thời tiết', {
                bold: true,
                size: 11,
                color: '1E3A8A',
              }),
            ],
            { before: 240, after: 120 },
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: weatherRowsList,
          }),

          // Section B: Manpower & Equipment
          createParagraph(
            [
              createText('B. Tình hình nhân sự & thiết bị thi công', {
                bold: true,
                size: 11,
                color: '1E3A8A',
              }),
            ],
            { before: 240, after: 120 },
          ),
          createParagraph(
            [createText('B1. Nhân sự thi công', { bold: true, size: 10 })],
            {
              before: 120,
              after: 60,
            },
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: manpowerRowsList,
          }),
          new Paragraph({ spacing: { after: 120 } }),

          createParagraph(
            [
              createText('B2. Thiết bị thi công chính', {
                bold: true,
                size: 10,
              }),
            ],
            { before: 120, after: 60 },
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: equipmentRowsList,
          }),

          // Section C: Materials
          createParagraph(
            [
              createText('C. Vật tư nhập kho trong ngày', {
                bold: true,
                size: 11,
                color: '1E3A8A',
              }),
            ],
            { before: 240, after: 120 },
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: materialRowsList,
          }),

          // Section D: Work Items
          createParagraph(
            [
              createText('D. Khối lượng hạng mục thực hiện', {
                bold: true,
                size: 11,
                color: '1E3A8A',
              }),
            ],
            { before: 240, after: 120 },
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: workItemRowsList,
          }),
          new Paragraph({ spacing: { after: 240 } }),

          // Section E: Images
          ...imageElements,
          new Paragraph({ spacing: { after: 240 } }),

          // Foot Signatures
          signatureTable,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
