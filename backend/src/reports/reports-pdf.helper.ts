import { Prisma } from '@prisma/client';

export interface ExportWeatherRow {
  id: number;
  period: string;
  isSunny: boolean;
  isRainy: boolean;
  isNormal: boolean;
  wind: string | null;
  wave: string | null;
  swell: string | null;
  note: string | null;
}

export interface ExportManpowerRow {
  id: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  previousQuantity: Prisma.Decimal | number | null;
  changeQuantity: Prisma.Decimal | number | null;
  todayQuantity: Prisma.Decimal | number | null;
  managerQuantity: Prisma.Decimal | number | null;
  staffQuantity: Prisma.Decimal | number | null;
  overtimeQuantity: Prisma.Decimal | number | null;
  securityQuantity: Prisma.Decimal | number | null;
  note: string | null;
}

export interface ExportEquipmentRow {
  id: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  previousQuantity: Prisma.Decimal | number | null;
  changeQuantity: Prisma.Decimal | number | null;
  todayQuantity: Prisma.Decimal | number | null;
  normalQuantity: Prisma.Decimal | number | null;
  repairingQuantity: Prisma.Decimal | number | null;
  brokenQuantity: Prisma.Decimal | number | null;
  note: string | null;
}

export interface ExportMaterialRow {
  id: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  quantity: Prisma.Decimal | number | null;
  note: string | null;
}

export interface ExportWorkItem {
  id: number;
  parentId: number | null;
  sortOrder: number;
  level: number;
  code: string | null;
  name: string;
  unit: string | null;
  designQuantity: Prisma.Decimal | number | null;
  previousAccumulatedQuantity: Prisma.Decimal | number | null;
  todayQuantity: Prisma.Decimal | number | null;
  currentAccumulatedQuantity: Prisma.Decimal | number | null;
  completionPercent: Prisma.Decimal | number | null;
  personInCharge: string | null;
  note: string | null;
  isGroup: boolean;
  isLocked: boolean;
}

export interface ExportReportImage {
  id: number;
  fileUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  sortOrder: number;
}

export interface ExportReportData {
  id: number;
  reportType: string;
  reportNo: string | null;
  reportDate: Date;
  issueDate: Date | null;
  title: string | null;
  status: string;
  project: {
    name: string;
    code: string;
    ownerName: string | null;
    supervisorName: string | null;
    contractorName: string | null;
    location: string | null;
    logoUrl: string | null;
  };
  createdBy: {
    name: string;
    email: string;
  };
  weatherRows: ExportWeatherRow[];
  manpowerRows: ExportManpowerRow[];
  equipmentRows: ExportEquipmentRow[];
  materialRows: ExportMaterialRow[];
  workItems: ExportWorkItem[];
  images: ExportReportImage[];
}

function formatDate(dateInput: Date | string | null): string {
  if (!dateInput) return '---';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '---';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

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

function formatPercent(numInput: any): string {
  if (numInput === null || numInput === undefined || numInput === '')
    return '---';
  const num = Number(numInput);
  if (isNaN(num)) return '---';
  return num.toFixed(2) + '%';
}

export function generateDailyReportHtml(
  data: ExportReportData,
  baseUrl: string,
): string {
  const {
    project,
    weatherRows,
    manpowerRows,
    equipmentRows,
    materialRows,
    workItems,
    images,
  } = data;

  const logoHtml = project.logoUrl
    ? `<img src="${baseUrl}${project.logoUrl}" alt="Logo" class="logo" />`
    : '<div class="logo-placeholder"></div>';

  // Weather rows HTML
  const weatherRowsHtml =
    weatherRows.length > 0
      ? weatherRows
          .map(
            (w) => `
        <tr>
          <td style="font-weight: bold; width: 120px;">Buổi ${w.period === 'MORNING' ? 'Sáng' : w.period === 'AFTERNOON' ? 'Chiều' : w.period === 'EVENING' ? 'Tối' : w.period}</td>
          <td style="text-align: center;">${w.isSunny ? '✓' : ''}</td>
          <td style="text-align: center;">${w.isRainy ? '✓' : ''}</td>
          <td style="text-align: center;">${w.isNormal ? '✓' : ''}</td>
          <td>${w.wind || ''}</td>
          <td>${w.wave || ''}</td>
          <td>${w.swell || ''}</td>
          <td>${w.note || ''}</td>
        </tr>
      `,
          )
          .join('')
      : '<tr><td colspan="8" style="text-align: center; color: #777;">Không có dữ liệu thời tiết</td></tr>';

  // Manpower rows HTML
  const manpowerRowsHtml =
    manpowerRows.length > 0
      ? manpowerRows
          .map((m) => {
            const mismatch =
              m.previousQuantity !== null &&
              m.changeQuantity !== null &&
              m.todayQuantity !== null &&
              Number(m.previousQuantity) + Number(m.changeQuantity) !==
                Number(m.todayQuantity);
            const warningStyle = mismatch
              ? 'background-color: #fff9e6; color: #b27a00; font-weight: 500;'
              : '';

            return `
          <tr style="${warningStyle}">
            <td>${m.name}</td>
            <td style="text-align: center;">${m.unit || '---'}</td>
            <td style="text-align: right;">${formatNumber(m.previousQuantity)}</td>
            <td style="text-align: right;">${m.changeQuantity !== null && Number(m.changeQuantity) >= 0 ? '+' : ''}${formatNumber(m.changeQuantity)}</td>
            <td style="text-align: right; font-weight: bold;">${formatNumber(m.todayQuantity)}</td>
            <td style="text-align: right;">${formatNumber(m.managerQuantity)}</td>
            <td style="text-align: right;">${formatNumber(m.staffQuantity)}</td>
            <td style="text-align: right;">${formatNumber(m.overtimeQuantity)}</td>
            <td style="text-align: right;">${formatNumber(m.securityQuantity)}</td>
            <td>${m.note || ''}</td>
          </tr>
        `;
          })
          .join('')
      : '<tr><td colspan="10" style="text-align: center; color: #777;">Không có dữ liệu nhân sự</td></tr>';

  // Equipment rows HTML
  const equipmentRowsHtml =
    equipmentRows.length > 0
      ? equipmentRows
          .map((e) => {
            const mismatchState =
              e.normalQuantity !== null &&
              e.repairingQuantity !== null &&
              e.brokenQuantity !== null &&
              e.todayQuantity !== null &&
              Number(e.normalQuantity) +
                Number(e.repairingQuantity) +
                Number(e.brokenQuantity) !==
                Number(e.todayQuantity);
            const warningStyle = mismatchState
              ? 'background-color: #fff9e6; color: #b27a00; font-weight: 500;'
              : '';

            return `
          <tr style="${warningStyle}">
            <td style="white-space: pre-wrap;">${e.name}</td>
            <td style="text-align: center;">${e.unit || '---'}</td>
            <td style="text-align: right;">${formatNumber(e.previousQuantity)}</td>
            <td style="text-align: right;">${e.changeQuantity !== null && Number(e.changeQuantity) >= 0 ? '+' : ''}${formatNumber(e.changeQuantity)}</td>
            <td style="text-align: right; font-weight: bold;">${formatNumber(e.todayQuantity)}</td>
            <td style="text-align: right;">${formatNumber(e.normalQuantity)}</td>
            <td style="text-align: right;">${formatNumber(e.repairingQuantity)}</td>
            <td style="text-align: right;">${formatNumber(e.brokenQuantity)}</td>
            <td>${e.note || ''}</td>
          </tr>
        `;
          })
          .join('')
      : '<tr><td colspan="9" style="text-align: center; color: #777;">Không có dữ liệu thiết bị thi công</td></tr>';

  // Material rows HTML
  const materialRowsHtml =
    materialRows.length > 0
      ? materialRows
          .map(
            (m) => `
        <tr>
          <td>${m.name}</td>
          <td style="text-align: center;">${m.unit || '---'}</td>
          <td style="text-align: right; font-weight: bold;">${formatNumber(m.quantity)}</td>
          <td>${m.note || ''}</td>
        </tr>
      `,
          )
          .join('')
      : '<tr><td colspan="4" style="text-align: center; color: #777;">Không có dữ liệu vật tư</td></tr>';

  // Work items tree-grid rows HTML
  const workItemsRowsHtml =
    workItems.length > 0
      ? workItems
          .map((item) => {
            const indentStyle = `padding-left: ${item.level * 16}px;`;
            const groupStyle = item.isGroup
              ? 'font-weight: bold; background-color: #fafafa;'
              : '';
            return `
          <tr style="${groupStyle}">
            <td style="${indentStyle}">${item.isGroup ? '📁 ' : ''}${item.name}</td>
            <td style="text-align: center; font-size: 10px; color: #555;">${item.code || ''}</td>
            <td style="text-align: center;">${item.unit || '---'}</td>
            <td style="text-align: right;">${formatNumber(item.designQuantity)}</td>
            <td style="text-align: right;">${formatNumber(item.previousAccumulatedQuantity)}</td>
            <td style="text-align: right;">${formatNumber(item.todayQuantity)}</td>
            <td style="text-align: right; font-weight: bold;">${formatNumber(item.currentAccumulatedQuantity)}</td>
            <td style="text-align: right; font-weight: bold; color: ${item.completionPercent && Number(item.completionPercent) >= 100 ? '#10b981' : '#4b5563'};">${formatPercent(item.completionPercent)}</td>
            <td style="font-size: 10px;">${item.personInCharge || ''}</td>
            <td style="font-size: 10px;">${item.note || ''}</td>
          </tr>
        `;
          })
          .join('')
      : '<tr><td colspan="10" style="text-align: center; color: #777;">Không có dữ liệu hạng mục thi công</td></tr>';

  // Images grid HTML
  const imagesHtml =
    images.length > 0
      ? `
      <div class="images-section">
        <h3>IV. Hình ảnh thi công</h3>
        <div class="images-grid">
          ${images
            .map(
              (img) => `
            <div class="image-card">
              <div class="image-container">
                <img src="${baseUrl}${img.fileUrl}" alt="${img.caption || 'Thi công'}" />
              </div>
              <div class="image-caption">${img.caption || 'Thi công'}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `
      : '';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo cáo nhật ký thi công hàng ngày</title>
  <style>
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    
    .logo-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 12px;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 60%;
    }
    
    .logo {
      max-height: 48px;
      max-width: 140px;
      object-fit: contain;
    }
    
    .logo-placeholder {
      width: 4px;
      height: 36px;
      background-color: #3b82f6;
    }
    
    .company-info h1 {
      font-size: 14px;
      margin: 0 0 3px 0;
      color: #1e3a8a;
      font-weight: bold;
    }
    
    .company-info p {
      font-size: 9px;
      margin: 0;
      color: #666;
    }
    
    .report-meta {
      text-align: right;
      width: 35%;
      font-size: 10px;
      color: #444;
    }
    
    .report-title-container {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .report-title {
      font-size: 16px;
      font-weight: bold;
      color: #1e3a8a;
      text-transform: uppercase;
      margin: 0 0 5px 0;
    }
    
    .report-subtitle {
      font-size: 11px;
      font-style: italic;
      color: #555;
      margin: 0;
    }
    
    .info-section {
      margin-bottom: 20px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 20px;
    }
    
    .info-item {
      display: flex;
    }
    
    .info-label {
      font-weight: bold;
      width: 140px;
      color: #475569;
    }
    
    .info-value {
      flex: 1;
      color: #0f172a;
    }
    
    h3 {
      font-size: 12px;
      font-weight: bold;
      color: #1e3a8a;
      margin: 18px 0 8px 0;
      border-left: 3px solid #3b82f6;
      padding-left: 8px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 10px;
    }
    
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      text-align: left;
    }
    
    th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: bold;
      text-align: center;
    }
    
    .text-center {
      text-align: center;
    }
    
    .text-right {
      text-align: right;
    }
    
    .images-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 10px;
    }
    
    .image-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      background-color: #fff;
      display: flex;
      flex-direction: column;
      page-break-inside: avoid;
    }
    
    .image-container {
      height: 180px;
      background-color: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .image-container img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    
    .image-caption {
      padding: 6px 8px;
      font-size: 9px;
      font-style: italic;
      color: #475569;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    
    .signatures-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      text-align: center;
      page-break-inside: avoid;
    }
    
    .sig-block {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .sig-title {
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 60px;
    }
    
    .sig-name {
      font-weight: bold;
      color: #475569;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      tr {
        page-break-inside: avoid;
      }
      
      thead {
        display: table-header-group;
      }
      
      tfoot {
        display: table-footer-group;
      }
    }
  </style>
</head>
<body>

  <!-- Logo and Header -->
  <div class="logo-header">
    <div class="logo-container">
      ${logoHtml}
      <div class="company-info">
        <h1>${project.contractorName || 'NHÀ THẦU CHÍNH'}</h1>
        <p>Báo cáo Nhật ký thi công - Dự án: ${project.name}</p>
      </div>
    </div>
    <div class="report-meta">
      <div><strong>Số báo cáo:</strong> ${data.reportNo || '---'}</div>
      <div><strong>Ngày báo cáo:</strong> ${formatDate(data.reportDate)}</div>
      <div><strong>Trạng thái:</strong> ${data.status === 'APPROVED' ? 'Đã duyệt' : data.status === 'SENT' ? 'Đã gửi' : data.status === 'IN_REVIEW' ? 'Đang duyệt' : 'Bản nháp'}</div>
    </div>
  </div>

  <!-- Report Title -->
  <div class="report-title-container">
    <h2 class="report-title">${data.title || 'BÁO CÁO NHẬT KÝ THI CÔNG HÀNG NGÀY'}</h2>
    <p class="report-subtitle">Dự án: ${project.name}</p>
  </div>

  <!-- General Info Section -->
  <div class="info-section">
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Dự án:</span>
        <span class="info-value">${project.name} (${project.code})</span>
      </div>
      <div class="info-item">
        <span class="info-label">Địa điểm:</span>
        <span class="info-value">${project.location || '---'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Chủ đầu tư:</span>
        <span class="info-value">${project.ownerName || '---'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Tư vấn giám sát:</span>
        <span class="info-value">${project.supervisorName || '---'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Nhà thầu chính:</span>
        <span class="info-value">${project.contractorName || '---'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Người lập báo cáo:</span>
        <span class="info-value">${data.createdBy.name} (${data.createdBy.email})</span>
      </div>
    </div>
  </div>

  <!-- Weather Section -->
  <h3>A. Tình hình thời tiết</h3>
  <table>
    <thead>
      <tr>
        <th>Buổi</th>
        <th style="width: 50px;">Nắng</th>
        <th style="width: 50px;">Mưa</th>
        <th style="width: 50px;">Bình thường</th>
        <th>Gió</th>
        <th>Sóng biển</th>
        <th>Dòng chảy</th>
        <th>Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      ${weatherRowsHtml}
    </tbody>
  </table>

  <!-- Manpower Section -->
  <h3>B. Tình hình nhân sự & thiết bị thi công</h3>
  <h4>B1. Nhân sự thi công</h4>
  <table>
    <thead>
      <tr>
        <th rowspan="2">Hạng mục nhân sự / Tổ đội</th>
        <th rowspan="2" style="width: 55px;">Đơn vị</th>
        <th colspan="3">Khối lượng nhân sự</th>
        <th colspan="4">Phân bổ chi tiết</th>
        <th rowspan="2">Ghi chú</th>
      </tr>
      <tr>
        <th style="width: 50px;">Lũy kế</th>
        <th style="width: 50px;">Thay đổi</th>
        <th style="width: 50px;">Hôm nay</th>
        <th style="width: 50px;">BĐH / GS</th>
        <th style="width: 50px;">Trực tiếp</th>
        <th style="width: 50px;">Tăng ca</th>
        <th style="width: 50px;">Bảo vệ</th>
      </tr>
    </thead>
    <tbody>
      ${manpowerRowsHtml}
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- Equipment Section -->
  <h4>B2. Thiết bị thi công chính</h4>
  <table>
    <thead>
      <tr>
        <th rowspan="2">Tên thiết bị / Chủng loại</th>
        <th rowspan="2" style="width: 55px;">Đơn vị</th>
        <th colspan="3">Số lượng thi công</th>
        <th colspan="3">Trạng thái hiện trạng</th>
        <th rowspan="2">Ghi chú</th>
      </tr>
      <tr>
        <th style="width: 50px;">Lũy kế trước</th>
        <th style="width: 50px;">Thay đổi</th>
        <th style="width: 50px;">Hôm nay</th>
        <th style="width: 50px;">Hoạt động</th>
        <th style="width: 50px;">Sửa chữa</th>
        <th style="width: 50px;">Hỏng hóc</th>
      </tr>
    </thead>
    <tbody>
      ${equipmentRowsHtml}
    </tbody>
  </table>

  <!-- Materials Section -->
  <h3>C. Vật tư nhập kho trong ngày</h3>
  <table>
    <thead>
      <tr>
        <th>Tên vật tư / Chủng loại</th>
        <th style="width: 80px;">Đơn vị</th>
        <th style="width: 100px;">Số lượng</th>
        <th>Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      ${materialRowsHtml}
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- Work Items Section -->
  <h3>D. Khối lượng hạng mục thực hiện</h3>
  <table>
    <thead>
      <tr>
        <th>Tên hạng mục thi công</th>
        <th style="width: 70px;">Mã hiệu</th>
        <th style="width: 50px;">Đơn vị</th>
        <th style="width: 65px;">Khối lượng<br>thiết kế</th>
        <th style="width: 65px;">Lũy kế trước</th>
        <th style="width: 65px;">Thực hiện<br>hôm nay</th>
        <th style="width: 65px;">Lũy kế<br>hiện tại</th>
        <th style="width: 55px;">% Hoàn<br>thành</th>
        <th style="width: 80px;">Người phụ trách</th>
        <th>Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      ${workItemsRowsHtml}
    </tbody>
  </table>

  <!-- Images Section -->
  ${imagesHtml}

  <!-- Signatures Footer -->
  <div class="signatures-section">
    <div class="sig-block">
      <div class="sig-title">ĐẠI DIỆN TƯ VẤN GIÁM SÁT</div>
      <div class="sig-name">${project.supervisorName || '---'}</div>
    </div>
    <div class="sig-block">
      <div class="sig-title">ĐẠI DIỆN NHÀ THẦU CHÍNH</div>
      <div class="sig-name">${project.contractorName || '---'}</div>
    </div>
    <div class="sig-block">
      <div class="sig-title">NGƯỜI LẬP BÁO CÁO</div>
      <div class="sig-name">${data.createdBy.name}</div>
    </div>
  </div>

</body>
</html>
  `;
}
