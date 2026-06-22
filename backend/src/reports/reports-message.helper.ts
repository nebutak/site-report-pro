import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ExportReportData } from './reports-pdf.helper';

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
    return '0';
  const num = Number(numInput);
  if (isNaN(num)) return '0';
  return num.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Helper percent formatter
function formatPercent(numInput: any): string {
  if (numInput === null || numInput === undefined || numInput === '')
    return '0.00%';
  const num = Number(numInput);
  if (isNaN(num)) return '0.00%';
  return num.toFixed(2) + '%';
}

export function generateDailyReportMessageText(data: ExportReportData): string {
  const lines: string[] = [];
  lines.push('Kính gửi Chủ tịch và Ban lãnh đạo công ty cùng các Phòng/Ban');
  lines.push('');
  lines.push(
    `BĐH ${data.project.name} xin gửi báo cáo thi công ngày ${formatDate(data.reportDate)}:`,
  );
  lines.push('');

  // I. THỜI TIẾT
  lines.push('I. THỜI TIẾT:');
  if (data.weatherRows.length > 0) {
    for (const w of data.weatherRows) {
      const periodText =
        w.period === 'MORNING'
          ? 'Sáng'
          : w.period === 'AFTERNOON'
            ? 'Chiều'
            : w.period === 'EVENING'
              ? 'Tối'
              : w.period;
      const stateText = w.isSunny ? 'Nắng' : w.isRainy ? 'Mưa' : 'Bình thường';
      const details: string[] = [];
      if (w.wind) details.push(`Gió: ${w.wind}`);
      if (w.wave) details.push(`Sóng: ${w.wave}`);
      if (w.swell) details.push(`Dòng chảy: ${w.swell}`);
      const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';
      lines.push(
        `- Buổi ${periodText}: ${stateText}${detailsStr}${w.note ? `. Ghi chú: ${w.note}` : ''}`,
      );
    }
  } else {
    lines.push('- Không có dữ liệu thời tiết');
  }
  lines.push('');

  // II. NHÂN LỰC - THIẾT BỊ
  lines.push('II. NHÂN LỰC - THIẾT BỊ:');
  const totalManpower = data.manpowerRows.reduce(
    (sum, m) => sum + Number(m.todayQuantity || 0),
    0,
  );
  lines.push(`- Tổng nhân sự hôm nay: ${formatNumber(totalManpower)} người.`);
  if (data.manpowerRows.length > 0) {
    for (const m of data.manpowerRows) {
      lines.push(
        `  + ${m.name}: ${formatNumber(m.todayQuantity)} ${m.unit || 'Người'}${m.note ? ` (${m.note})` : ''}`,
      );
    }
  }
  const totalEquipment = data.equipmentRows.reduce(
    (sum, e) => sum + Number(e.todayQuantity || 0),
    0,
  );
  lines.push(
    `- Thiết bị thi công hôm nay: ${formatNumber(totalEquipment)} chiếc.`,
  );
  if (data.equipmentRows.length > 0) {
    for (const e of data.equipmentRows) {
      const states: string[] = [];
      if (Number(e.normalQuantity || 0) > 0)
        states.push(`${formatNumber(e.normalQuantity)} HĐ`);
      if (Number(e.repairingQuantity || 0) > 0)
        states.push(`${formatNumber(e.repairingQuantity)} SC`);
      if (Number(e.brokenQuantity || 0) > 0)
        states.push(`${formatNumber(e.brokenQuantity)} Hỏng`);
      const stateStr = states.length > 0 ? ` (${states.join(', ')})` : '';
      lines.push(
        `  + ${e.name}: ${formatNumber(e.todayQuantity)} ${e.unit || 'Chiếc'}${stateStr}${e.note ? ` - ${e.note}` : ''}`,
      );
    }
  }
  lines.push('');

  // III. KHỐI LƯỢNG THI CÔNG TRONG NGÀY
  lines.push('III. KHỐI LƯỢNG THI CÔNG TRONG NGÀY:');
  const activeWorkItems = data.workItems.filter(
    (item) => !item.isGroup && Number(item.todayQuantity || 0) > 0,
  );
  if (activeWorkItems.length > 0) {
    for (const item of activeWorkItems) {
      lines.push(
        `- ${item.name}: thực hiện ${formatNumber(item.todayQuantity)} ${item.unit || ''} (Lũy kế: ${formatNumber(item.currentAccumulatedQuantity)} ${item.unit || ''} / Thiết kế: ${formatNumber(item.designQuantity)} ${item.unit || ''} - ${formatPercent(item.completionPercent)})`,
      );
    }
  } else {
    lines.push(
      '- Không có hạng mục nào phát sinh khối lượng thi công hôm nay.',
    );
  }
  lines.push('');
  lines.push('(Chi tiết BĐH kính gửi file đính kèm)');

  return lines.join('\n');
}

export function generateDailyReportMessageHtml(
  data: ExportReportData,
  content: string,
): string {
  const formattedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/ {2}\+ /g, '&nbsp;&nbsp;&nbsp;&nbsp;+ ');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Lời dẫn báo cáo ngày</title>
  <style>
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      margin: 40px;
      background-color: #fff;
    }
    .header {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 25px;
    }
    .title {
      font-size: 16px;
      font-weight: bold;
      color: #1e3a8a;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 11px;
      font-style: italic;
      color: #666;
    }
    .content {
      font-size: 12px;
      margin-bottom: 40px;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">LỜI DẪN BÁO CÁO NHẬT KÝ THI CÔNG</div>
    <div class="subtitle">Dự án: ${data.project.name} | Số: ${data.reportNo || '---'}</div>
  </div>
  <div class="content">${formattedContent}</div>
</body>
</html>
  `;
}

export async function generateDailyReportMessageWord(
  data: ExportReportData,
  content: string,
): Promise<Buffer> {
  const lines = content.split('\n');
  const paragraphs = lines.map((line) => {
    const isHeading =
      line.startsWith('I.') ||
      line.startsWith('II.') ||
      line.startsWith('III.');
    return new Paragraph({
      spacing: { before: isHeading ? 200 : 0, after: 100 },
      children: [
        new TextRun({
          text: line,
          bold:
            isHeading || line.startsWith('Kính gửi') || line.startsWith('BĐH'),
          size: isHeading ? 24 : 20, // 12pt and 10pt
          font: 'Arial',
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'LỜI DẪN BÁO CÁO NHẬT KÝ THI CÔNG',
                bold: true,
                size: 28,
                color: '1E3A8A',
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Dự án: ${data.project.name} | Số: ${data.reportNo || '---'}`,
                italics: true,
                size: 18,
                font: 'Arial',
              }),
            ],
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
