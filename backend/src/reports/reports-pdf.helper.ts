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
    defaultReporterName?: string | null;
    defaultReceiver?: string | null;
    defaultCc?: string | null;
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

function getManpowerBreakdown(row: ExportManpowerRow) {
  const manager = Number(row.managerQuantity || 0);
  let staff = Number(row.staffQuantity || 0);
  const overtime = Number(row.overtimeQuantity || 0);
  const security = Number(row.securityQuantity || 0);

  if (manager + staff + overtime + security === 0) {
    staff = Number(row.todayQuantity || 0);
  }

  return { manager, staff, overtime, security };
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

  const renderPageHeaderHtml = () => {
    const logoHtml = project.logoUrl
      ? `<img src="${baseUrl}${project.logoUrl}" alt="Logo" class="logo" />`
      : `<div class="logo-text-fallback">${(project.contractorName || 'DACINCO').substring(0, 20).toUpperCase()}</div>`;

    const getPeriodWeather = (periodName: string) => {
      const keys = 
        periodName === 'Sáng' || periodName === 'MORNING' ? ['sáng', 'morning'] :
        periodName === 'Chiều' || periodName === 'AFTERNOON' ? ['chiều', 'afternoon'] :
        periodName === 'Tối' || periodName === 'EVENING' ? ['tối', 'evening'] : [periodName.toLowerCase().trim()];
      
      const row = weatherRows.find((w) => w.period && keys.includes(w.period.toLowerCase().trim()));
      return row || {
        isSunny: false,
        isRainy: false,
        isNormal: false,
        wind: '',
        wave: '',
        swell: '',
      };
    };

    const morningWeather = getPeriodWeather('Sáng');
    const afternoonWeather = getPeriodWeather('Chiều');
    const eveningWeather = getPeriodWeather('Tối');
    const dailyWeatherSummary = [
      `Sáng: ${morningWeather.isSunny ? 'Nắng' : morningWeather.isRainy ? 'Mưa' : morningWeather.isNormal ? 'BT' : '---'}`,
      `Chiều: ${afternoonWeather.isSunny ? 'Nắng' : afternoonWeather.isRainy ? 'Mưa' : afternoonWeather.isNormal ? 'BT' : '---'}`,
      `Tối: ${eveningWeather.isSunny ? 'Nắng' : eveningWeather.isRainy ? 'Mưa' : eveningWeather.isNormal ? 'BT' : '---'}`,
      morningWeather.wind || afternoonWeather.wind || eveningWeather.wind
        ? `Gió: ${morningWeather.wind || afternoonWeather.wind || eveningWeather.wind}`
        : '',
      morningWeather.wave || afternoonWeather.wave || eveningWeather.wave
        ? `Sóng: ${morningWeather.wave || afternoonWeather.wave || eveningWeather.wave}`
        : '',
    ].filter(Boolean).join(';   ');

    if (data.reportType === 'DAILY') {
      return `
      <div class="daily-template-header">
        <div class="daily-topline">
          <div class="daily-company">${project.contractorName || 'CÔNG TY TNHH ĐTXD DACINCO'}<br/>BĐH: ${project.name}</div>
          <div class="daily-national">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/><span>Độc lập - Tự do - Hạnh phúc</span></div>
        </div>
        <div class="daily-title">BÁO CÁO</div>
        <div class="daily-subtitle">KHỐI LƯỢNG THI CÔNG NGÀY ${formatDate(data.reportDate)}</div>
        <div class="daily-project">DỰ ÁN: ${project.name.toUpperCase()}</div>
        <div class="daily-weather-line"><strong>A. Thời tiết:</strong> ${dailyWeatherSummary}</div>
      </div>
      `;
    }
    const defaultReportTitle =
      data.reportType === 'V2'
        ? 'BÁO CÁO NGÀY - V2'
        : data.reportType === 'SUMMARY'
          ? 'BÁO CÁO NGÀY'
          : 'BÁO CÁO NHẬT KÝ THI CÔNG HÀNG NGÀY';
    const defaultIssueDate = data.issueDate
      ? data.issueDate
      : new Date(new Date(data.reportDate).getTime() + 86400000);

    return `
    <table class="pdf-header-table">
      <tr>
        <td rowspan="5" class="header-logo-cell">
          ${logoHtml}
        </td>
        <td class="info-lbl">Dự án:</td>
        <td class="info-val">${project.name}</td>
        <td rowspan="5" class="header-iso-cell">
          <svg class="iso-svg" width="65" height="75" viewBox="0 0 100 115">
            <!-- Globe container -->
            <g stroke="#0054a6" stroke-width="2.5" fill="none">
              <!-- Outer circle -->
              <circle cx="50" cy="42" r="38" stroke-width="3" />
              
              <!-- Top Polar Fan Lines -->
              <path d="M 50 4 L 12 42" />
              <path d="M 50 4 L 31 42" />
              <path d="M 50 4 L 50 42" />
              <path d="M 50 4 L 69 42" />
              <path d="M 50 4 L 88 42" />
              
              <!-- Bottom Polar Fan Lines -->
              <path d="M 50 80 L 12 42" />
              <path d="M 50 80 L 31 42" />
              <path d="M 50 80 L 50 42" />
              <path d="M 50 80 L 69 42" />
              <path d="M 50 80 L 88 42" />
              
              <!-- Top Latitude curves -->
              <path d="M 16 26 A 38 22 0 0 1 84 26" />
              <path d="M 12 42 A 38 10 0 0 1 88 42" />
              
              <!-- Bottom Latitude curves -->
              <path d="M 16 58 A 38 22 0 0 0 84 58" />
            </g>
            
            <!-- Text Mask Block -->
            <rect x="10" y="30" width="80" height="24" fill="#ffffff" />
            
            <!-- ISO text -->
            <text x="50" y="52" font-family="'Arial Black', Arial, sans-serif" font-size="25" font-weight="900" fill="#0054a6" text-anchor="middle" letter-spacing="-1">ISO</text>
            
            <!-- 9001:2015 text -->
            <text x="50" y="102" font-family="'Helvetica Neue', Arial, sans-serif" font-size="19" font-weight="bold" fill="#0054a6" text-anchor="middle">9001:2015</text>
          </svg>
        </td>
      </tr>
      <tr>
        <td class="info-lbl">ĐD Chủ đầu tư:</td>
        <td class="info-val">${project.ownerName || '---'}</td>
      </tr>
      <tr>
        <td class="info-lbl">Tư vấn giám sát:</td>
        <td class="info-val">${project.supervisorName || '---'}</td>
      </tr>
      <tr>
        <td class="info-lbl">Nhà thầu chính:</td>
        <td class="info-val">${project.contractorName || '---'}</td>
      </tr>
      <tr>
        <td class="info-lbl">Địa điểm:</td>
        <td class="info-val">${project.location || '---'}</td>
      </tr>
    </table>

    <div class="report-title-container">
      <h2 class="report-title">${(data.title || defaultReportTitle).toUpperCase()}</h2>
    </div>

    <table class="meta-weather-table">
      <!-- Row 1 -->
      <tr>
        <td class="meta-lbl">Người báo cáo:</td>
        <td class="meta-val">${project.defaultReporterName || data.createdBy.name}</td>
        <th rowspan="3" style="width: 70px;">Thời tiết</th>
        <th rowspan="3" style="width: 35px;">Nắng</th>
        <th rowspan="3" style="width: 35px;">Mưa</th>
        <th rowspan="3" style="width: 50px;">B.Thường</th>
        <th rowspan="3" style="width: 90px;">Gió (cấp)</th>
        <th rowspan="3" style="width: 70px;">Sóng (m)</th>
        <th rowspan="3">Sóng lừng (hướng/ m/s)</th>
      </tr>
      <!-- Row 2 -->
      <tr>
        <td class="meta-lbl">Người nhận:</td>
        <td class="meta-val">${project.defaultReceiver || 'Ban lãnh đạo công ty'}</td>
      </tr>
      <!-- Row 3 -->
      <tr>
        <td class="meta-lbl">Cc:</td>
        <td class="meta-val">${project.defaultCc || 'Ban điều hành dự án'}</td>
      </tr>
      <!-- Row 4 -->
      <tr>
        <td class="meta-lbl">Báo cáo số:</td>
        <td class="meta-val">${data.reportNo || '---'}</td>
        <td style="font-weight: bold; text-align: center; background-color: #fafafa;">Sáng</td>
        <td style="text-align: center; font-size: 13px;">${morningWeather.isSunny ? '☑' : '☐'}</td>
        <td style="text-align: center; font-size: 13px;">${morningWeather.isRainy ? '☑' : '☐'}</td>
        <td style="text-align: center; font-size: 13px;">${morningWeather.isNormal ? '☑' : '☐'}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${morningWeather.wind || ''}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${morningWeather.wave || ''}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${morningWeather.swell || ''}</td>
      </tr>
      <!-- Row 5 -->
      <tr>
        <td class="meta-lbl">Báo cáo ngày:</td>
        <td class="meta-val" style="color: red; font-weight: bold;">${formatDate(data.reportDate)}</td>
        <td style="font-weight: bold; text-align: center; background-color: #fafafa;">Chiều</td>
        <td style="text-align: center; font-size: 13px;">${afternoonWeather.isSunny ? '☑' : '☐'}</td>
        <td style="text-align: center; font-size: 13px;">${afternoonWeather.isRainy ? '☑' : '☐'}</td>
        <td style="text-align: center; font-size: 13px;">${afternoonWeather.isNormal ? '☑' : '☐'}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${afternoonWeather.wind || ''}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${afternoonWeather.wave || ''}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${afternoonWeather.swell || ''}</td>
      </tr>
      <!-- Row 6 -->
      <tr>
        <td class="meta-lbl">Ngày phát hành:</td>
        <td class="meta-val" style="color: red; font-weight: bold;">${formatDate(defaultIssueDate)}</td>
        <td style="font-weight: bold; text-align: center; background-color: #fafafa;">Tối</td>
        <td style="text-align: center; font-size: 13px;">${eveningWeather.isSunny ? '☑' : '☐'}</td>
        <td style="text-align: center; font-size: 13px;">${eveningWeather.isRainy ? '☑' : '☐'}</td>
        <td style="text-align: center; font-size: 13px;">${eveningWeather.isNormal ? '☑' : '☐'}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${eveningWeather.wind || ''}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${eveningWeather.wave || ''}</td>
        <td style="font-size: 10px; padding: 2px 4px;">${eveningWeather.swell || ''}</td>
      </tr>
    </table>
    `;
  };

  // Section I: Equipment and Materials side-by-side
  const maxEqMatRows = Math.max(equipmentRows.length, materialRows.length);
  const eqMatRows = [];
  for (let i = 0; i < maxEqMatRows; i++) {
    eqMatRows.push({
      eq: equipmentRows[i] || null,
      mat: materialRows[i] || null,
    });
  }

  const eqMatRowsHtml = eqMatRows.length > 0
    ? eqMatRows.map((row, idx) => {
        const eqCell = row.eq 
          ? `<td style="text-align: center;">${idx + 1}</td>
             <td>${(row.eq.name || '').replace(/\n/g, '<br/>')}</td>
             <td style="text-align: right; font-weight: bold;">${formatNumber(row.eq.todayQuantity)} ${row.eq.unit || 'chiếc'}</td>`
          : `<td style="text-align: center;"></td><td></td><td></td>`;
        
        const matCell = row.mat
          ? `<td>${(row.mat.name || '').replace(/\n/g, '<br/>')}</td>
             <td style="text-align: right; font-weight: bold;">${formatNumber(row.mat.quantity)} ${row.mat.unit || 'Tấn'}</td>`
          : `<td></td><td></td>`;
          
        return `<tr>${eqCell}${matCell}</tr>`;
      }).join('')
    : '<tr><td colspan="5" style="text-align: center; color: #777;">Không có dữ liệu thiết bị và vật tư</td></tr>';

  // Section II: Manpower
  let totalManager = 0;
  let totalStaff = 0;
  let totalOvertime = 0;
  let totalSecurity = 0;

  const manpowerRowsHtml = manpowerRows.length > 0
    ? manpowerRows.map((m, idx) => {
        const manpower = getManpowerBreakdown(m);
        totalManager += manpower.manager;
        totalStaff += manpower.staff;
        totalOvertime += manpower.overtime;
        totalSecurity += manpower.security;

        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>${m.name}</td>
            <td style="text-align: right;">${manpower.manager ? formatNumber(manpower.manager) : ''}</td>
            <td style="text-align: right;">${manpower.staff ? formatNumber(manpower.staff) : ''}</td>
            <td style="text-align: right;">${manpower.overtime ? formatNumber(manpower.overtime) : ''}</td>
            <td style="text-align: right;">${manpower.security ? formatNumber(manpower.security) : ''}</td>
            <td>${m.note || ''}</td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="7" style="text-align: center; color: #777;">Không có dữ liệu nhân sự</td></tr>';

  const totalManpowerToday = totalManager + totalStaff + totalOvertime + totalSecurity;

  // Section III: Work Items
  let groupIndex = 0;
  const workItemsRowsHtml = workItems.length > 0
    ? workItems.map((item) => {
        let ttVal = '&nbsp;';
        if (item.level === 0) {
          groupIndex++;
          ttVal = String(groupIndex);
        } else if (item.level === 1) {
          ttVal = '-';
        }
        const indentStyle = `padding-left: ${item.level * 16}px;`;
        const groupStyle = item.isGroup
          ? 'font-weight: bold; background-color: #fafafa;'
          : '';
        return `
          <tr style="${groupStyle}">
            <td style="text-align: center;">${ttVal}</td>
            <td style="${indentStyle}">${item.name}</td>
            <td style="text-align: center;">${item.unit || '---'}</td>
            <td style="text-align: right;">${formatNumber(item.designQuantity)}</td>
            <td style="text-align: right;">${formatNumber(item.previousAccumulatedQuantity)}</td>
            <td style="text-align: right;">${formatNumber(item.todayQuantity)}</td>
            <td style="text-align: right; font-weight: bold;">${formatNumber(item.currentAccumulatedQuantity)}</td>
            <td>${item.personInCharge || ''}</td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="8" style="text-align: center; color: #777;">Không có dữ liệu hạng mục thi công</td></tr>';

  // Section IV: Images Pages
  const imagesPagesHtml = [];
  const imagesPerPage = 3;
  if (images && images.length > 0) {
    let imgPageIdx = 0;
    for (let i = 0; i < images.length; i += imagesPerPage) {
      const pageImages = images.slice(i, i + imagesPerPage);
      
      let rowsHtml = '';
      if (pageImages.length === 3) {
        if (imgPageIdx % 2 === 0) {
          // 2 at top, 1 at bottom
          rowsHtml = `
            <tr>
              <td style="width: 40px; border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
              <td style="border: 1px solid #000; text-align: center; padding: 8px; width: calc((100% - 40px)/2);">
                <div class="img-box">
                  <img src="${baseUrl}${pageImages[0].fileUrl}" alt="${pageImages[0].caption || 'Thi công'}" />
                  <div class="image-caption">${pageImages[0].caption || 'Thi công'}</div>
                </div>
              </td>
              <td style="border: 1px solid #000; text-align: center; padding: 8px; width: calc((100% - 40px)/2);">
                <div class="img-box">
                  <img src="${baseUrl}${pageImages[1].fileUrl}" alt="${pageImages[1].caption || 'Thi công'}" />
                  <div class="image-caption">${pageImages[1].caption || 'Thi công'}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="width: 40px; border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
              <td colspan="2" style="border: 1px solid #000; text-align: center; padding: 8px;">
                <div class="img-box">
                  <img src="${baseUrl}${pageImages[2].fileUrl}" alt="${pageImages[2].caption || 'Thi công'}" />
                  <div class="image-caption">${pageImages[2].caption || 'Thi công'}</div>
                </div>
              </td>
            </tr>
          `;
        } else {
          // 1 at top, 2 at bottom
          rowsHtml = `
            <tr>
              <td style="width: 40px; border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
              <td colspan="2" style="border: 1px solid #000; text-align: center; padding: 8px;">
                <div class="img-box">
                  <img src="${baseUrl}${pageImages[0].fileUrl}" alt="${pageImages[0].caption || 'Thi công'}" />
                  <div class="image-caption">${pageImages[0].caption || 'Thi công'}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="width: 40px; border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
              <td style="border: 1px solid #000; text-align: center; padding: 8px; width: calc((100% - 40px)/2);">
                <div class="img-box">
                  <img src="${baseUrl}${pageImages[1].fileUrl}" alt="${pageImages[1].caption || 'Thi công'}" />
                  <div class="image-caption">${pageImages[1].caption || 'Thi công'}</div>
                </div>
              </td>
              <td style="border: 1px solid #000; text-align: center; padding: 8px; width: calc((100% - 40px)/2);">
                <div class="img-box">
                  <img src="${baseUrl}${pageImages[2].fileUrl}" alt="${pageImages[2].caption || 'Thi công'}" />
                  <div class="image-caption">${pageImages[2].caption || 'Thi công'}</div>
                </div>
              </td>
            </tr>
          `;
        }
      } else if (pageImages.length === 2) {
        // 2 side-by-side
        rowsHtml = `
          <tr>
            <td style="width: 40px; border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
            <td style="border: 1px solid #000; text-align: center; padding: 8px; width: calc((100% - 40px)/2);">
              <div class="img-box">
                <img src="${baseUrl}${pageImages[0].fileUrl}" alt="${pageImages[0].caption || 'Thi công'}" />
                <div class="image-caption">${pageImages[0].caption || 'Thi công'}</div>
              </div>
            </td>
            <td style="border: 1px solid #000; text-align: center; padding: 8px; width: calc((100% - 40px)/2);">
              <div class="img-box">
                <img src="${baseUrl}${pageImages[1].fileUrl}" alt="${pageImages[1].caption || 'Thi công'}" />
                <div class="image-caption">${pageImages[1].caption || 'Thi công'}</div>
              </div>
            </td>
          </tr>
        `;
      } else {
        // 1 full width
        rowsHtml = `
          <tr>
            <td style="width: 40px; border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
            <td colspan="2" style="border: 1px solid #000; text-align: center; padding: 8px;">
              <div class="img-box">
                <img src="${baseUrl}${pageImages[0].fileUrl}" alt="${pageImages[0].caption || 'Thi công'}" />
                <div class="image-caption">${pageImages[0].caption || 'Thi công'}</div>
              </div>
            </td>
          </tr>
        `;
      }

      imagesPagesHtml.push(`
        <div class="page-container">
          ${renderPageHeaderHtml()}
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
            <thead>
              <tr>
                <th style="width: 40px; border: 1px solid #000; text-align: center; background-color: #fafafa;">IV</th>
                <th colspan="2" style="border: 1px solid #000; text-align: left; padding: 6px 10px; background-color: #fafafa; font-weight: bold;">HÌNH ẢNH THI CÔNG</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `);
      
      imgPageIdx++;
    }
  }

  // Signatures Section
  const signaturesHtml = `
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
  `;

  // Construct page content flows
  let page1Content = `
    <div class="page-container">
      ${renderPageHeaderHtml()}
      
      <!-- Section I: Equipment and Materials side-by-side -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">I</th>
            <th colspan="2" style="text-align: center; background-color: #fafafa;">Các thiết bị chính trên công trường</th>
            <th colspan="2" style="text-align: center; background-color: #fafafa;">Vật liệu chính nhập vào công trường</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;">TT</th>
            <th>Tên thiết bị</th>
            <th style="width: 100px; text-align: center;">Số lượng</th>
            <th>Tên vật tư</th>
            <th style="width: 100px; text-align: center;">Khối lượng</th>
          </tr>
        </thead>
        <tbody>
          ${eqMatRowsHtml}
        </tbody>
      </table>

      <!-- Section II: Manpower -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">II</th>
            <th>Nhân sự trên công trường</th>
            <th style="width: 80px; text-align: center;">Quản lý</th>
            <th style="width: 80px; text-align: center;">Nhân sự</th>
            <th style="width: 100px; text-align: center;">Nhân sự tăng ca</th>
            <th style="width: 80px; text-align: center;">Bảo vệ</th>
            <th style="text-align: center;">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${manpowerRowsHtml}
          <tr style="font-weight: bold; background-color: #fafafa;">
            <td colspan="2" style="text-align: center;">Tổng cộng nhân sự</td>
            <td style="text-align: right;">${totalManager ? formatNumber(totalManager) : ''}</td>
            <td style="text-align: right;">${totalStaff ? formatNumber(totalStaff) : ''}</td>
            <td style="text-align: right;">${totalOvertime ? formatNumber(totalOvertime) : ''}</td>
            <td style="text-align: right;">${totalSecurity ? formatNumber(totalSecurity) : ''}</td>
            <td>Lũy kế: ${formatNumber(totalManpowerToday)} người</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  let page2Content = `
    <div class="page-container">
      ${renderPageHeaderHtml()}
      
      <!-- Section III: Work Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">III</th>
            <th>Công việc thực hiện trong ngày</th>
            <th style="width: 60px; text-align: center;">Đơn vị</th>
            <th style="width: 100px; text-align: center;">% Đánh giá</th>
            <th style="width: 100px; text-align: center;">Thực hiện</th>
            <th style="width: 100px; text-align: center;">Hôm nay</th>
            <th style="width: 100px; text-align: center;">Luỹ kế</th>
            <th style="width: 120px; text-align: center;">P. Trách</th>
          </tr>
        </thead>
        <tbody>
          ${workItemsRowsHtml}
        </tbody>
      </table>
      ${imagesPagesHtml.length === 0 ? signaturesHtml : ''}
    </div>
  `;

  let pagesHtml = page1Content + page2Content;

  if (imagesPagesHtml.length > 0) {
    const lastImgIdx = imagesPagesHtml.length - 1;
    imagesPagesHtml[lastImgIdx] = imagesPagesHtml[lastImgIdx].replace(/<\/div>\s*$/, `${signaturesHtml}</div>`);
    pagesHtml += imagesPagesHtml.join('');
  }

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo cáo nhật ký thi công hàng ngày</title>
  <style>
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11px;
      line-height: 1.3;
      color: #000;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    
    .page-container {
      width: 100%;
      box-sizing: border-box;
      padding: 10mm 15mm;
      position: relative;
      background-color: #fff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10.5px;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 4px 6px;
      text-align: left;
      vertical-align: middle;
    }
    
    th {
      font-weight: bold;
      text-align: center;
      background-color: #fafafa;
    }

    .daily-template-header {
      margin-bottom: 10px;
      font-size: 11px;
    }

    .daily-topline {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
      margin-bottom: 14px;
    }

    .daily-company,
    .daily-national {
      text-align: center;
      font-weight: bold;
      line-height: 1.45;
      white-space: pre-line;
    }

    .daily-national span {
      font-weight: normal;
    }

    .daily-title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .daily-subtitle {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .daily-project {
      text-align: center;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .daily-weather-line {
      font-size: 11px;
      margin-bottom: 8px;
    }

    /* Top Header Table */
    .pdf-header-table {
      margin-bottom: 8px;
    }
    
    .header-logo-cell {
      width: 140px;
      text-align: center;
      vertical-align: middle;
      padding: 2px;
      height: 90px;
    }
    
    .logo {
      max-height: 82px;
      max-width: 135px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    
    .logo-text-fallback {
      font-size: 14px;
      font-weight: bold;
      color: #000;
      text-align: center;
    }
    
    .info-lbl {
      width: 110px;
      font-weight: normal !important;
      font-size: 10.5px;
      color: #000;
      padding: 3px 6px;
    }
    
    .info-val {
      font-weight: bold;
      font-size: 10.5px;
      color: #000;
      padding: 3px 6px;
    }
    
    .header-iso-cell {
      width: 110px;
      text-align: center;
      vertical-align: middle;
      padding: 2px;
    }
    
    .iso-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2px;
    }
    
    .iso-svg {
      display: block;
      margin: 0 auto;
    }
    
    .iso-number {
      font-size: 11px;
      font-weight: bold;
      color: #0054a6;
      text-align: center;
      margin-top: 4px;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    
    /* Report Title */
    .report-title-container {
      text-align: center;
      margin-bottom: 8px;
    }
    
    .report-title {
      font-size: 14px;
      font-weight: bold;
      color: #000;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Meta & Weather Table */
    .meta-weather-table {
      margin-bottom: 12px;
    }
    
    .meta-lbl {
      width: 100px;
      font-weight: normal !important;
      font-size: 10.5px;
      padding: 3px 6px;
    }
    
    .meta-val {
      width: 150px;
      font-weight: bold;
      font-size: 10.5px;
      padding: 3px 6px;
    }
    
    /* Image Section inside table */
    .img-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }
    
    .img-box img {
      max-width: 100%;
      max-height: 220px;
      object-fit: contain;
      border: 1px solid #ddd;
    }
    
    .image-caption {
      color: red;
      font-weight: bold;
      font-size: 11px;
      margin-top: 6px;
      text-align: center;
    }
    
    /* Signatures Section */
    .signatures-section {
      margin-top: 25px;
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
      color: #000;
      margin-bottom: 45px;
      font-size: 10.5px;
    }
    
    .sig-name {
      font-weight: bold;
      color: #000;
      font-size: 10.5px;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page-container {
        page-break-after: always;
        page-break-inside: avoid;
      }
      .page-container:last-child {
        page-break-after: avoid;
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
  ${pagesHtml}
</body>
</html>
  `;
}
