import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateWeatherDto } from './dto/update-weather.dto';
import { UpdateManpowerDto } from './dto/update-manpower.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { UpdateImagesDto } from './dto/update-images.dto';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs';
import { join } from 'path';
import { generateDailyReportHtml } from './reports-pdf.helper';
import { generateDailyReportExcel } from './reports-excel.helper';
import { generateDailyReportWord } from './reports-word.helper';
import {
  generateDailyReportMessageText,
  generateDailyReportMessageHtml,
  generateDailyReportMessageWord,
} from './reports-message.helper';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDate(dateStr: string): Date {
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Ngày báo cáo không hợp lệ');
    }
    return new Date(
      Date.UTC(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        0,
        0,
        0,
        0,
      ),
    );
  }

  private formatDateString(date: Date): string {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  async create(createReportDto: CreateReportDto, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: createReportDto.projectId },
    });

    if (!project) {
      throw new NotFoundException(
        `Không tìm thấy dự án có ID ${createReportDto.projectId}`,
      );
    }

    const normalizedDate = this.normalizeDate(createReportDto.reportDate);

    // BR-001: For reportType = DAILY, project + reportDate must be unique
    if (createReportDto.reportType === 'DAILY') {
      const existingReport = await this.prisma.report.findFirst({
        where: {
          projectId: createReportDto.projectId,
          reportType: 'DAILY',
          reportDate: normalizedDate,
        },
      });

      if (existingReport) {
        throw new BadRequestException(
          `Dự án đã có báo cáo ngày cho ngày ${createReportDto.reportDate}`,
        );
      }
    }

    const dateStr = this.formatDateString(normalizedDate);
    const defaultReportNo =
      createReportDto.reportNo || `BC-${project.code}-${dateStr}`;
    const defaultTitle =
      createReportDto.title || `Báo cáo ngày - ${project.name}`;

    // If sourceReportId is provided, we perform a deep clone
    if (createReportDto.sourceReportId) {
      return this.cloneReport(
        createReportDto.sourceReportId,
        normalizedDate,
        defaultReportNo,
        defaultTitle,
        userId,
        createReportDto.reportType,
      );
    }

    // Standard creation without cloning
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          projectId: createReportDto.projectId,
          reportType: createReportDto.reportType,
          reportDate: normalizedDate,
          reportNo: defaultReportNo,
          title: defaultTitle,
          status: 'DRAFT',
          createdById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId: report.id,
          entityType: 'Report',
          entityId: report.id,
          action: 'CREATE_REPORT',
          newValue: JSON.stringify({
            projectId: report.projectId,
            reportType: report.reportType,
            reportDate: normalizedDate,
          }),
          reason: 'Khởi tạo báo cáo mới',
        },
      });

      return report;
    });
  }

  async findAll(
    projectId?: number,
    reportType?: string,
    status?: string,
    fromDate?: string,
    toDate?: string,
    keyword?: string,
  ) {
    const where: Prisma.ReportWhereInput = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (reportType && reportType !== 'all') {
      where.reportType = reportType;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.reportDate = {};
      if (fromDate) {
        where.reportDate.gte = this.normalizeDate(fromDate);
      }
      if (toDate) {
        where.reportDate.lte = this.normalizeDate(toDate);
      }
    }

    if (keyword) {
      where.OR = [
        { reportNo: { contains: keyword } },
        { title: { contains: keyword } },
      ];
    }

    return this.prisma.report.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ reportDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: number) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        project: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        weatherRows: true,
        manpowerRows: {
          orderBy: { sortOrder: 'asc' },
        },
        equipmentRows: {
          orderBy: { sortOrder: 'asc' },
        },
        materialRows: {
          orderBy: { sortOrder: 'asc' },
        },
        workItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Không tìm thấy báo cáo có ID ${id}`);
    }

    return report;
  }

  async update(id: number, updateReportDto: UpdateReportDto, userId: number) {
    const report = await this.findOne(id);

    // BR-004: Cannot directly modify approved/sent reports
    if (report.status === 'APPROVED' || report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể chỉnh sửa thông tin trực tiếp',
      );
    }

    const data: Prisma.ReportUpdateInput = {};

    if (updateReportDto.title !== undefined) {
      data.title = updateReportDto.title;
    }

    if (updateReportDto.reportNo !== undefined) {
      data.reportNo = updateReportDto.reportNo;
    }

    if (updateReportDto.issueDate !== undefined) {
      data.issueDate = updateReportDto.issueDate
        ? this.normalizeDate(updateReportDto.issueDate)
        : null;
    }

    if (updateReportDto.messageContent !== undefined) {
      data.messageContent = updateReportDto.messageContent;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId: report.id,
          entityType: 'Report',
          entityId: report.id,
          action: 'UPDATE_REPORT',
          oldValue: JSON.stringify({
            title: report.title,
            reportNo: report.reportNo,
            issueDate: report.issueDate,
          }),
          newValue: JSON.stringify({
            title: updated.title,
            reportNo: updated.reportNo,
            issueDate: updated.issueDate,
          }),
          reason: 'Cập nhật metadata báo cáo',
        },
      });

      return updated;
    });
  }

  async submit(id: number, userId: number) {
    const report = await this.findOne(id);

    if (report.status === 'APPROVED' || report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã duyệt hoặc gửi, không thể nộp duyệt lại',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data: { status: 'IN_REVIEW' },
      });

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId: report.id,
          entityType: 'Report',
          entityId: report.id,
          action: 'SUBMIT_REPORT',
          oldValue: report.status,
          newValue: 'IN_REVIEW',
          reason: 'Nộp báo cáo ngày để phê duyệt',
        },
      });

      return updated;
    });
  }

  async approve(id: number, userId: number) {
    const report = await this.findOne(id);

    if (report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã gửi, không thể thực hiện phê duyệt',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId: report.id,
          entityType: 'Report',
          entityId: report.id,
          action: 'APPROVE_REPORT',
          oldValue: report.status,
          newValue: 'APPROVED',
          reason: 'Phê duyệt báo cáo ngày thành công',
        },
      });

      return updated;
    });
  }

  async markSent(id: number, userId: number) {
    const report = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId: report.id,
          entityType: 'Report',
          entityId: report.id,
          action: 'MARK_SENT',
          oldValue: report.status,
          newValue: 'SENT',
          reason: 'Đánh dấu báo cáo đã gửi ra bên ngoài',
        },
      });

      return updated;
    });
  }

  async clone(id: number, targetDateStr: string, userId: number) {
    const sourceReport = await this.findOne(id);
    const targetDate = this.normalizeDate(targetDateStr);

    // Verify uniqueness for new DAILY report
    if (sourceReport.reportType === 'DAILY') {
      const existing = await this.prisma.report.findFirst({
        where: {
          projectId: sourceReport.projectId,
          reportType: 'DAILY',
          reportDate: targetDate,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Dự án đã có báo cáo ngày cho ngày ${targetDateStr}`,
        );
      }
    }

    const dateStr = this.formatDateString(targetDate);
    const reportNo = `BC-${sourceReport.project.code}-${dateStr}`;
    const title = `Báo cáo ngày - ${sourceReport.project.name}`;

    return this.cloneReport(id, targetDate, reportNo, title, userId);
  }

  private async cloneReport(
    sourceId: number,
    targetDate: Date,
    reportNo: string,
    title: string,
    userId: number,
    targetReportType?: string,
  ) {
    const source = await this.findOne(sourceId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Report header
      const targetType = targetReportType || source.reportType;

      let messageContent: string | null = null;
      if (targetType === 'MESSAGE') {
        const sourceData = await this.getReportDataForExport(sourceId);
        messageContent = generateDailyReportMessageText(sourceData);
      }

      const newReport = await tx.report.create({
        data: {
          projectId: source.projectId,
          reportType: targetType,
          reportDate: targetDate,
          reportNo,
          title,
          status: 'DRAFT',
          createdById: userId,
          sourceReportId: sourceId,
          messageContent,
        },
      });

      // 2. Clone WeatherRows
      if (source.weatherRows.length > 0) {
        await tx.weatherRow.createMany({
          data: source.weatherRows.map((w) => ({
            reportId: newReport.id,
            period: w.period,
            isSunny: w.isSunny,
            isRainy: w.isRainy,
            isNormal: w.isNormal,
            wind: w.wind,
            wave: w.wave,
            swell: w.swell,
            note: w.note,
          })),
        });
      }

      // 3. Clone ManpowerRows with BR-008 rules
      if (source.manpowerRows.length > 0) {
        await tx.manpowerRow.createMany({
          data: source.manpowerRows.map((m) => {
            const previous = m.todayQuantity ? Number(m.todayQuantity) : 0;
            return {
              reportId: newReport.id,
              sortOrder: m.sortOrder,
              name: m.name,
              unit: m.unit,
              previousQuantity: previous,
              changeQuantity: 0,
              todayQuantity: previous,
              managerQuantity: 0,
              staffQuantity: 0,
              overtimeQuantity: 0,
              securityQuantity: 0,
              note: m.note,
            };
          }),
        });
      }

      // 4. Clone EquipmentRows with BR-008 rules
      if (source.equipmentRows.length > 0) {
        await tx.equipmentRow.createMany({
          data: source.equipmentRows.map((e) => {
            const previous = e.todayQuantity ? Number(e.todayQuantity) : 0;
            return {
              reportId: newReport.id,
              sortOrder: e.sortOrder,
              name: e.name,
              unit: e.unit,
              previousQuantity: previous,
              changeQuantity: 0,
              todayQuantity: previous,
              normalQuantity: 0,
              repairingQuantity: 0,
              brokenQuantity: 0,
              note: e.note,
            };
          }),
        });
      }

      // 5. Clone MaterialRows with BR-008 rules
      if (source.materialRows.length > 0) {
        await tx.materialRow.createMany({
          data: source.materialRows.map((mat) => ({
            reportId: newReport.id,
            sortOrder: mat.sortOrder,
            name: mat.name,
            unit: mat.unit,
            quantity: 0,
            note: mat.note,
          })),
        });
      }

      // 6. Clone WorkItems (hierarchy-safe)
      if (source.workItems.length > 0) {
        // Sort items by level to ensure parents are created before child items
        const oldItems = [...source.workItems].sort(
          (a, b) => a.level - b.level,
        );
        const idMap = new Map<number, number>();

        for (const item of oldItems) {
          const newParentId = item.parentId ? idMap.get(item.parentId) : null;
          const previousAccumulated = item.currentAccumulatedQuantity
            ? Number(item.currentAccumulatedQuantity)
            : 0;
          const design = item.designQuantity ? Number(item.designQuantity) : 0;
          const completionPercent =
            design > 0 ? (previousAccumulated / design) * 100 : null;

          const created = await tx.workItem.create({
            data: {
              reportId: newReport.id,
              parentId: newParentId,
              sortOrder: item.sortOrder,
              level: item.level,
              code: item.code,
              name: item.name,
              unit: item.unit,
              designQuantity: item.designQuantity,
              previousAccumulatedQuantity: previousAccumulated,
              todayQuantity: 0,
              currentAccumulatedQuantity: previousAccumulated,
              completionPercent,
              personInCharge: item.personInCharge,
              note: item.note,
              isGroup: item.isGroup,
              isLocked: item.isLocked,
              formula: item.formula || undefined,
            },
          });

          idMap.set(item.id, created.id);
        }
      }

      // Clone ReportImages
      const sourceImages = await tx.reportImage.findMany({
        where: { reportId: sourceId },
      });
      if (sourceImages.length > 0) {
        await tx.reportImage.createMany({
          data: sourceImages.map((img) => ({
            reportId: newReport.id,
            sectionKey: img.sectionKey,
            fileUrl: img.fileUrl,
            thumbnailUrl: img.thumbnailUrl,
            caption: img.caption,
            sortOrder: img.sortOrder,
            width: img.width,
            height: img.height,
            mimeType: img.mimeType,
            sizeBytes: img.sizeBytes,
            createdById: userId,
          })),
        });
      }

      // 7. Write audit log
      await tx.auditLog.create({
        data: {
          userId,
          projectId: newReport.projectId,
          reportId: newReport.id,
          entityType: 'Report',
          entityId: newReport.id,
          action: 'CREATE_REPORT',
          newValue: JSON.stringify({
            clonedFrom: sourceId,
            reportDate: targetDate,
            reportNo,
          }),
          reason: 'Sao chép từ báo cáo trước',
        },
      });

      return newReport;
    });
  }

  async remove(id: number, userId: number) {
    const report = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // We will perform a hard delete of reports in Phase 3 if needed, or update status.
      // Wait, is there a soft delete or hard delete? The schema doesn't have a status = DELETED or active field in Report,
      // so we can delete the child rows and then the report itself.
      // Let's delete all child records first to satisfy foreign keys.
      await tx.weatherRow.deleteMany({ where: { reportId: id } });
      await tx.manpowerRow.deleteMany({ where: { reportId: id } });
      await tx.equipmentRow.deleteMany({ where: { reportId: id } });
      await tx.materialRow.deleteMany({ where: { reportId: id } });
      await tx.workItem.deleteMany({ where: { reportId: id } });
      await tx.reportImage.deleteMany({ where: { reportId: id } });
      await tx.reportExport.deleteMany({ where: { reportId: id } });
      await tx.reportVersion.deleteMany({ where: { reportId: id } });

      const deleted = await tx.report.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId: id,
          entityType: 'Report',
          entityId: id,
          action: 'DELETE_REPORT',
          oldValue: JSON.stringify(report),
          reason: 'Xóa hoàn toàn báo cáo và các dữ liệu liên quan',
        },
      });

      return deleted;
    });
  }

  // --- PHASE 4 METHODS ---

  async getWeather(reportId: number) {
    return this.prisma.weatherRow.findMany({
      where: { reportId },
    });
  }

  async updateWeather(reportId: number, dto: UpdateWeatherDto, userId: number) {
    const report = await this.findOne(reportId);

    if (report.status === 'APPROVED' || report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể chỉnh sửa thời tiết',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existingRows = await tx.weatherRow.findMany({
        where: { reportId },
      });
      for (const incomingRow of dto.rows || []) {
        const matched = existingRows.find(
          (e) => e.period === incomingRow.period,
        );
        if (matched) {
          await this.logCellChange(
            tx,
            userId,
            report.projectId,
            reportId,
            'WeatherRow',
            matched.id,
            'isSunny',
            matched.isSunny,
            incomingRow.isSunny ?? false,
          );
          await this.logCellChange(
            tx,
            userId,
            report.projectId,
            reportId,
            'WeatherRow',
            matched.id,
            'isRainy',
            matched.isRainy,
            incomingRow.isRainy ?? false,
          );
          await this.logCellChange(
            tx,
            userId,
            report.projectId,
            reportId,
            'WeatherRow',
            matched.id,
            'isNormal',
            matched.isNormal,
            incomingRow.isNormal ?? false,
          );
          await this.logCellChange(
            tx,
            userId,
            report.projectId,
            reportId,
            'WeatherRow',
            matched.id,
            'wind',
            matched.wind,
            incomingRow.wind ?? null,
          );
          await this.logCellChange(
            tx,
            userId,
            report.projectId,
            reportId,
            'WeatherRow',
            matched.id,
            'wave',
            matched.wave,
            incomingRow.wave ?? null,
          );
          await this.logCellChange(
            tx,
            userId,
            report.projectId,
            reportId,
            'WeatherRow',
            matched.id,
            'swell',
            matched.swell,
            incomingRow.swell ?? null,
          );
          await this.logCellChange(
            tx,
            userId,
            report.projectId,
            reportId,
            'WeatherRow',
            matched.id,
            'note',
            matched.note,
            incomingRow.note ?? null,
          );
        }
      }

      await tx.weatherRow.deleteMany({
        where: { reportId },
      });

      if (dto.rows && dto.rows.length > 0) {
        await tx.weatherRow.createMany({
          data: dto.rows.map((w) => ({
            reportId,
            period: w.period,
            isSunny: w.isSunny || false,
            isRainy: w.isRainy || false,
            isNormal: w.isNormal || false,
            wind: w.wind || null,
            wave: w.wave || null,
            swell: w.swell || null,
            note: w.note || null,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'Weather',
          entityId: reportId,
          action: 'UPDATE_WEATHER',
          newValue: JSON.stringify(dto.rows),
          reason: 'Cập nhật bảng thời tiết',
        },
      });

      return tx.weatherRow.findMany({
        where: { reportId },
      });
    });
  }

  async getManpower(reportId: number) {
    return this.prisma.manpowerRow.findMany({
      where: { reportId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateManpower(
    reportId: number,
    dto: UpdateManpowerDto,
    userId: number,
  ) {
    const report = await this.findOne(reportId);

    if (report.status === 'APPROVED' || report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể chỉnh sửa nhân lực',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.manpowerRow.findMany({
        where: { reportId },
      });

      const existingIds = existing.map((e) => e.id);
      const incomingIds = dto.rows
        .map((r) => r.id)
        .filter((id): id is number => !!id && id > 0);

      const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        await tx.manpowerRow.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      for (const r of dto.rows) {
        const data = {
          reportId,
          sortOrder: r.sortOrder,
          name: r.name,
          unit: r.unit || null,
          previousQuantity:
            r.previousQuantity !== undefined
              ? new Prisma.Decimal(r.previousQuantity)
              : null,
          changeQuantity:
            r.changeQuantity !== undefined
              ? new Prisma.Decimal(r.changeQuantity)
              : null,
          todayQuantity:
            r.todayQuantity !== undefined
              ? new Prisma.Decimal(r.todayQuantity)
              : null,
          managerQuantity:
            r.managerQuantity !== undefined
              ? new Prisma.Decimal(r.managerQuantity)
              : null,
          staffQuantity:
            r.staffQuantity !== undefined
              ? new Prisma.Decimal(r.staffQuantity)
              : null,
          overtimeQuantity:
            r.overtimeQuantity !== undefined
              ? new Prisma.Decimal(r.overtimeQuantity)
              : null,
          securityQuantity:
            r.securityQuantity !== undefined
              ? new Prisma.Decimal(r.securityQuantity)
              : null,
          note: r.note || null,
        };

        if (r.id && r.id > 0) {
          const matched = existing.find((e) => e.id === r.id);
          if (matched) {
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'name',
              matched.name,
              r.name,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'unit',
              matched.unit,
              r.unit ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'previousQuantity',
              matched.previousQuantity,
              r.previousQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'changeQuantity',
              matched.changeQuantity,
              r.changeQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'todayQuantity',
              matched.todayQuantity,
              r.todayQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'managerQuantity',
              matched.managerQuantity,
              r.managerQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'staffQuantity',
              matched.staffQuantity,
              r.staffQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'overtimeQuantity',
              matched.overtimeQuantity,
              r.overtimeQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'securityQuantity',
              matched.securityQuantity,
              r.securityQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'ManpowerRow',
              matched.id,
              'note',
              matched.note,
              r.note ?? null,
            );
          }
          await tx.manpowerRow.update({
            where: { id: r.id },
            data,
          });
        } else {
          await tx.manpowerRow.create({
            data,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'Manpower',
          entityId: reportId,
          action: 'UPDATE_MANPOWER',
          newValue: JSON.stringify(dto.rows),
          reason: 'Cập nhật bảng nhân lực',
        },
      });

      return tx.manpowerRow.findMany({
        where: { reportId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async getEquipment(reportId: number) {
    return this.prisma.equipmentRow.findMany({
      where: { reportId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateEquipment(
    reportId: number,
    dto: UpdateEquipmentDto,
    userId: number,
  ) {
    const report = await this.findOne(reportId);

    if (report.status === 'APPROVED' || report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể chỉnh sửa thiết bị',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.equipmentRow.findMany({
        where: { reportId },
      });

      const existingIds = existing.map((e) => e.id);
      const incomingIds = dto.rows
        .map((r) => r.id)
        .filter((id): id is number => !!id && id > 0);

      const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        await tx.equipmentRow.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      for (const r of dto.rows) {
        const data = {
          reportId,
          sortOrder: r.sortOrder,
          name: r.name,
          unit: r.unit || null,
          previousQuantity:
            r.previousQuantity !== undefined
              ? new Prisma.Decimal(r.previousQuantity)
              : null,
          changeQuantity:
            r.changeQuantity !== undefined
              ? new Prisma.Decimal(r.changeQuantity)
              : null,
          todayQuantity:
            r.todayQuantity !== undefined
              ? new Prisma.Decimal(r.todayQuantity)
              : null,
          normalQuantity:
            r.normalQuantity !== undefined
              ? new Prisma.Decimal(r.normalQuantity)
              : null,
          repairingQuantity:
            r.repairingQuantity !== undefined
              ? new Prisma.Decimal(r.repairingQuantity)
              : null,
          brokenQuantity:
            r.brokenQuantity !== undefined
              ? new Prisma.Decimal(r.brokenQuantity)
              : null,
          note: r.note || null,
        };

        if (r.id && r.id > 0) {
          const matched = existing.find((e) => e.id === r.id);
          if (matched) {
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'name',
              matched.name,
              r.name,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'unit',
              matched.unit,
              r.unit ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'previousQuantity',
              matched.previousQuantity,
              r.previousQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'changeQuantity',
              matched.changeQuantity,
              r.changeQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'todayQuantity',
              matched.todayQuantity,
              r.todayQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'normalQuantity',
              matched.normalQuantity,
              r.normalQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'repairingQuantity',
              matched.repairingQuantity,
              r.repairingQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'brokenQuantity',
              matched.brokenQuantity,
              r.brokenQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'EquipmentRow',
              matched.id,
              'note',
              matched.note,
              r.note ?? null,
            );
          }
          await tx.equipmentRow.update({
            where: { id: r.id },
            data,
          });
        } else {
          await tx.equipmentRow.create({
            data,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'Equipment',
          entityId: reportId,
          action: 'UPDATE_EQUIPMENT',
          newValue: JSON.stringify(dto.rows),
          reason: 'Cập nhật bảng thiết bị',
        },
      });

      return tx.equipmentRow.findMany({
        where: { reportId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async getMaterials(reportId: number) {
    return this.prisma.materialRow.findMany({
      where: { reportId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateMaterials(
    reportId: number,
    dto: UpdateMaterialDto,
    userId: number,
  ) {
    const report = await this.findOne(reportId);

    if (report.status === 'APPROVED' || report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể chỉnh sửa vật liệu',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.materialRow.findMany({
        where: { reportId },
      });

      const existingIds = existing.map((e) => e.id);
      const incomingIds = dto.rows
        .map((r) => r.id)
        .filter((id): id is number => !!id && id > 0);

      const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        await tx.materialRow.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      for (const r of dto.rows) {
        const data = {
          reportId,
          sortOrder: r.sortOrder,
          name: r.name,
          unit: r.unit || null,
          quantity:
            r.quantity !== undefined ? new Prisma.Decimal(r.quantity) : null,
          note: r.note || null,
        };

        if (r.id && r.id > 0) {
          const matched = existing.find((e) => e.id === r.id);
          if (matched) {
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'MaterialRow',
              matched.id,
              'name',
              matched.name,
              r.name,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'MaterialRow',
              matched.id,
              'unit',
              matched.unit,
              r.unit ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'MaterialRow',
              matched.id,
              'quantity',
              matched.quantity,
              r.quantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'MaterialRow',
              matched.id,
              'note',
              matched.note,
              r.note ?? null,
            );
          }
          await tx.materialRow.update({
            where: { id: r.id },
            data,
          });
        } else {
          await tx.materialRow.create({
            data,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'Material',
          entityId: reportId,
          action: 'UPDATE_MATERIAL',
          newValue: JSON.stringify(dto.rows),
          reason: 'Cập nhật bảng vật liệu',
        },
      });

      return tx.materialRow.findMany({
        where: { reportId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async getWorkItems(reportId: number) {
    return this.prisma.workItem.findMany({
      where: { reportId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateWorkItems(
    reportId: number,
    dto: UpdateWorkItemDto,
    userId: number,
  ) {
    const report = await this.findOne(reportId);

    if (report.status === 'APPROVED' || report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể chỉnh sửa hạng mục công việc',
      );
    }

    // 1. Calculate values for group rows recursively
    // Build a children map and root items list using unique identifiers (uid)
    const childrenMap = new Map<string, typeof dto.rows>();
    const rootUids: string[] = [];

    for (const r of dto.rows) {
      const uid = r.id ? String(r.id) : r.tempId;
      if (!uid) continue;

      let puid: string | null = null;
      if (r.parentId && r.parentId > 0) {
        puid = String(r.parentId);
      } else if (r.tempParentId) {
        puid = r.tempParentId;
      }

      if (puid) {
        if (!childrenMap.has(puid)) {
          childrenMap.set(puid, []);
        }
        childrenMap.get(puid)!.push(r);
      } else {
        rootUids.push(uid);
      }
    }

    const computeTotals = (uid: string) => {
      const row = dto.rows.find(
        (r) => (r.id ? String(r.id) : r.tempId) === uid,
      );
      if (!row) return;

      if (row.isGroup) {
        const children = childrenMap.get(uid) || [];
        let designSum = 0;
        let prevSum = 0;
        let todaySum = 0;
        let currentSum = 0;
        let hasAnyChild = false;

        for (const child of children) {
          const childUid = child.id ? String(child.id) : child.tempId;
          if (childUid) {
            computeTotals(childUid);
            designSum += child.designQuantity || 0;
            prevSum += child.previousAccumulatedQuantity || 0;
            todaySum += child.todayQuantity || 0;
            currentSum += child.currentAccumulatedQuantity || 0;
            hasAnyChild = true;
          }
        }

        row.designQuantity = hasAnyChild ? designSum : 0;
        row.previousAccumulatedQuantity = hasAnyChild ? prevSum : 0;
        row.todayQuantity = hasAnyChild ? todaySum : 0;
        row.currentAccumulatedQuantity = hasAnyChild ? currentSum : 0;
        row.completionPercent =
          row.designQuantity > 0
            ? (row.currentAccumulatedQuantity / row.designQuantity) * 100
            : undefined;
      } else {
        const prev = row.previousAccumulatedQuantity || 0;
        const today = row.todayQuantity || 0;
        row.currentAccumulatedQuantity = prev + today;
        row.completionPercent =
          row.designQuantity && row.designQuantity > 0
            ? (row.currentAccumulatedQuantity / row.designQuantity) * 100
            : undefined;
      }
    };

    for (const rootUid of rootUids) {
      computeTotals(rootUid);
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.workItem.findMany({
        where: { reportId },
      });

      const existingIds = existing.map((e) => e.id);
      const incomingIds = dto.rows
        .map((r) => r.id)
        .filter((id): id is number => !!id && id > 0);

      const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        // Delete child rows first (level descending) to avoid self-referencing foreign key issues
        const deletedItems = existing
          .filter((e) => idsToDelete.includes(e.id))
          .sort((a, b) => b.level - a.level);
        for (const item of deletedItems) {
          await tx.workItem.delete({
            where: { id: item.id },
          });
        }
      }

      // Sort rows by level ascending to ensure parents are created/updated first
      const sortedRows = [...dto.rows].sort((a, b) => a.level - b.level);
      const idMap = new Map<string | number, number>();

      for (const r of sortedRows) {
        let newParentId: number | null = null;
        if (r.parentId && r.parentId > 0) {
          newParentId = r.parentId;
        } else if (r.tempParentId) {
          newParentId = idMap.get(r.tempParentId) || null;
        }

        const data = {
          reportId,
          parentId: newParentId,
          sortOrder: r.sortOrder,
          level: r.level,
          code: r.code || null,
          name: r.name,
          unit: r.unit || null,
          designQuantity:
            r.designQuantity !== undefined && r.designQuantity !== null
              ? new Prisma.Decimal(r.designQuantity)
              : null,
          previousAccumulatedQuantity:
            r.previousAccumulatedQuantity !== undefined &&
            r.previousAccumulatedQuantity !== null
              ? new Prisma.Decimal(r.previousAccumulatedQuantity)
              : null,
          todayQuantity:
            r.todayQuantity !== undefined && r.todayQuantity !== null
              ? new Prisma.Decimal(r.todayQuantity)
              : null,
          currentAccumulatedQuantity:
            r.currentAccumulatedQuantity !== undefined &&
            r.currentAccumulatedQuantity !== null
              ? new Prisma.Decimal(r.currentAccumulatedQuantity)
              : null,
          completionPercent:
            r.completionPercent !== undefined && r.completionPercent !== null
              ? new Prisma.Decimal(r.completionPercent)
              : null,
          personInCharge: r.personInCharge || null,
          note: r.note || null,
          isGroup: r.isGroup,
          isLocked: r.isLocked,
          formula: (r.formula as Prisma.InputJsonValue) ?? null,
        };

        if (r.id && r.id > 0) {
          const matched = existing.find((e) => e.id === r.id);
          if (matched) {
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'code',
              matched.code,
              r.code ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'name',
              matched.name,
              r.name,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'unit',
              matched.unit,
              r.unit ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'designQuantity',
              matched.designQuantity,
              r.designQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'previousAccumulatedQuantity',
              matched.previousAccumulatedQuantity,
              r.previousAccumulatedQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'todayQuantity',
              matched.todayQuantity,
              r.todayQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'currentAccumulatedQuantity',
              matched.currentAccumulatedQuantity,
              r.currentAccumulatedQuantity ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'completionPercent',
              matched.completionPercent,
              r.completionPercent ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'personInCharge',
              matched.personInCharge,
              r.personInCharge ?? null,
            );
            await this.logCellChange(
              tx,
              userId,
              report.projectId,
              reportId,
              'WorkItem',
              matched.id,
              'note',
              matched.note,
              r.note ?? null,
            );
          }
          await tx.workItem.update({
            where: { id: r.id },
            data,
          });
          idMap.set(r.id, r.id);
        } else {
          const created = await tx.workItem.create({
            data,
          });
          if (r.tempId) {
            idMap.set(r.tempId, created.id);
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'WorkItem',
          entityId: reportId,
          action: 'UPDATE_WORK_ITEMS',
          newValue: JSON.stringify(dto.rows),
          reason: 'Cập nhật bảng khối lượng thi công',
        },
      });

      return tx.workItem.findMany({
        where: { reportId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async getImages(reportId: number) {
    return this.prisma.reportImage.findMany({
      where: { reportId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async uploadImage(
    reportId: number,
    file: Express.Multer.File,
    userId: number,
  ) {
    const report = await this.findOne(reportId);

    if (report.status === 'APPROVED' || report.status === 'SENT') {
      try {
        await fsPromises.unlink(file.path);
      } catch {
        // ignore
      }
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể tải lên hình ảnh mới',
      );
    }

    const mainPath = file.path;
    const thumbDir = './uploads/images/thumbnails';
    if (!existsSync(thumbDir)) {
      mkdirSync(thumbDir, { recursive: true });
    }
    const thumbPath = join(thumbDir, file.filename);

    try {
      const buffer = await fsPromises.readFile(mainPath);
      const resizedBuffer = await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .toBuffer();
      await fsPromises.writeFile(mainPath, resizedBuffer);

      await sharp(resizedBuffer).resize({ width: 400 }).toFile(thumbPath);
    } catch (err) {
      try {
        await fsPromises.unlink(mainPath);
      } catch {
        // ignore
      }
      try {
        await fsPromises.unlink(thumbPath);
      } catch {
        // ignore
      }
      throw new BadRequestException(
        `Không thể xử lý hình ảnh: ${(err as Error).message}`,
      );
    }

    const count = await this.prisma.reportImage.count({
      where: { reportId },
    });

    const fileUrl = `/uploads/images/${file.filename}`;
    const thumbnailUrl = `/uploads/images/thumbnails/${file.filename}`;

    const created = await this.prisma.reportImage.create({
      data: {
        reportId,
        fileUrl,
        thumbnailUrl,
        sortOrder: count + 1,
        caption:
          file.originalname.substring(0, file.originalname.lastIndexOf('.')) ||
          file.originalname,
        sizeBytes: file.size,
        mimeType: file.mimetype,
        createdById: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        projectId: report.projectId,
        reportId,
        entityType: 'ReportImage',
        entityId: created.id,
        action: 'UPLOAD_IMAGE',
        newValue: JSON.stringify(created),
        reason: 'Tải lên hình ảnh thi công',
      },
    });

    return created;
  }

  async updateImagesMetadata(
    reportId: number,
    dto: UpdateImagesDto,
    userId: number,
  ) {
    const report = await this.findOne(reportId);

    if (report.status === 'APPROVED' || report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể cập nhật thông tin ảnh',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const row of dto.rows) {
        await tx.reportImage.update({
          where: { id: row.id, reportId },
          data: {
            caption: row.caption || null,
            sortOrder: row.sortOrder,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'ReportImage',
          entityId: reportId,
          action: 'UPDATE_IMAGES_METADATA',
          newValue: JSON.stringify(dto.rows),
          reason: 'Cập nhật metadata chú thích và thứ tự sắp xếp ảnh',
        },
      });
    });

    return this.getImages(reportId);
  }

  async deleteImage(imageId: number, userId: number) {
    const image = await this.prisma.reportImage.findUnique({
      where: { id: imageId },
      include: { report: true },
    });

    if (!image) {
      throw new NotFoundException('Không tìm thấy hình ảnh yêu cầu');
    }

    if (image.report.status === 'APPROVED' || image.report.status === 'SENT') {
      throw new BadRequestException(
        'Báo cáo đã được duyệt hoặc gửi, không thể xóa hình ảnh',
      );
    }

    await this.prisma.reportImage.delete({
      where: { id: imageId },
    });

    if (image.fileUrl) {
      const relativeMainPath = `.${image.fileUrl}`;
      try {
        await fsPromises.unlink(relativeMainPath);
      } catch {
        // ignore
      }
    }

    if (image.thumbnailUrl) {
      const relativeThumbPath = `.${image.thumbnailUrl}`;
      try {
        await fsPromises.unlink(relativeThumbPath);
      } catch {
        // ignore
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        projectId: image.report.projectId,
        reportId: image.reportId,
        entityType: 'ReportImage',
        entityId: imageId,
        action: 'DELETE_IMAGE',
        oldValue: JSON.stringify(image),
        reason: 'Xóa hình ảnh thi công',
      },
    });

    return { success: true };
  }

  async getReportDataForExport(reportId: number) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        project: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        weatherRows: true,
        manpowerRows: {
          orderBy: { sortOrder: 'asc' },
        },
        equipmentRows: {
          orderBy: { sortOrder: 'asc' },
        },
        materialRows: {
          orderBy: { sortOrder: 'asc' },
        },
        workItems: {
          orderBy: { sortOrder: 'asc' },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo yêu cầu');
    }

    return report;
  }

  async generateReportHtml(reportId: number, baseUrl: string) {
    const reportData = await this.getReportDataForExport(reportId);
    if (reportData.reportType === 'MESSAGE') {
      let content = reportData.messageContent;
      if (!content) {
        content = generateDailyReportMessageText(reportData);
      }
      return generateDailyReportMessageHtml(reportData, content);
    }
    return generateDailyReportHtml(reportData, baseUrl);
  }

  async exportReportToPdf(reportId: number, userId: number, baseUrl: string) {
    const report = await this.findOne(reportId);

    // 1. Generate HTML content
    const htmlContent = await this.generateReportHtml(reportId, baseUrl);

    // 2. Setup export directory
    const exportDir = './uploads/exports';
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    // 3. Create filename
    const dateStr = report.reportDate.toISOString().slice(0, 10);
    const code = report.project.code.replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    let prefix = 'BC_NGAY';
    if (report.reportType === 'MESSAGE') {
      prefix = 'LOI_DAN';
    } else if (report.reportType === 'V2') {
      prefix = 'BC_V2';
    }
    const fileName = `${prefix}_${code}_${dateStr}_${uniqueSuffix}.pdf`;
    const filePath = join(exportDir, fileName);

    // 4. Render PDF using Puppeteer
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'load' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate:
          '<div style="font-size: 8px; width: 100%; text-align: center; color: #666; font-family: Arial;">Trang <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });
      await browser.close();

      // Write to disk
      await fsPromises.writeFile(filePath, pdfBuffer);

      const latestVersion = await this.prisma.reportVersion.findFirst({
        where: { reportId },
        orderBy: { versionNo: 'desc' },
      });
      const versionId = latestVersion ? latestVersion.id : null;

      // 5. Save ReportExport metadata
      const fileUrl = `/uploads/exports/${fileName}`;
      const created = await this.prisma.reportExport.create({
        data: {
          reportId,
          versionId,
          format: 'PDF',
          fileUrl,
          fileName,
          fileSize: pdfBuffer.length,
          createdById: userId,
        },
      });

      // 6. Log AuditLog
      await this.prisma.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'ReportExport',
          entityId: created.id,
          action: 'EXPORT_REPORT',
          newValue: JSON.stringify(created),
          reason: 'Kết xuất báo cáo ngày sang định dạng PDF',
        },
      });

      return created;
    } catch (err) {
      throw new BadRequestException(
        `Không thể kết xuất PDF: ${(err as Error).message}`,
      );
    }
  }

  async exportReportToExcel(reportId: number, userId: number) {
    const report = await this.findOne(reportId);
    const reportData = await this.getReportDataForExport(reportId);

    const exportDir = './uploads/exports';
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const dateStr = report.reportDate.toISOString().slice(0, 10);
    const code = report.project.code.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const fileName = `BC_KLTC_NGAY_${code}_${dateStr}_${timestamp}.xlsx`;
    const filePath = join(exportDir, fileName);

    try {
      const excelBuffer = await generateDailyReportExcel(reportData);

      await fsPromises.writeFile(filePath, excelBuffer);

      const latestVersion = await this.prisma.reportVersion.findFirst({
        where: { reportId },
        orderBy: { versionNo: 'desc' },
      });
      const versionId = latestVersion ? latestVersion.id : null;

      const fileUrl = `/uploads/exports/${fileName}`;
      const created = await this.prisma.reportExport.create({
        data: {
          reportId,
          versionId,
          format: 'EXCEL',
          fileUrl,
          fileName,
          fileSize: excelBuffer.length,
          createdById: userId,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'ReportExport',
          entityId: created.id,
          action: 'EXPORT_REPORT',
          newValue: JSON.stringify(created),
          reason: 'Kết xuất báo cáo ngày sang định dạng Excel',
        },
      });

      return created;
    } catch (err) {
      throw new BadRequestException(
        `Không thể kết xuất Excel: ${(err as Error).message}`,
      );
    }
  }

  async exportReportToWord(reportId: number, userId: number) {
    const report = await this.findOne(reportId);
    const reportData = await this.getReportDataForExport(reportId);

    const exportDir = './uploads/exports';
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const dateStr = report.reportDate.toISOString().slice(0, 10);
    const code = report.project.code.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();

    let fileName = `BCTT_${code}_${dateStr}_${timestamp}.docx`;
    if (report.reportType === 'MESSAGE') {
      fileName = `LOI_DAN_${code}_${dateStr}_${timestamp}.docx`;
    }
    const filePath = join(exportDir, fileName);

    try {
      let wordBuffer: Buffer;
      if (report.reportType === 'MESSAGE') {
        let content = reportData.messageContent;
        if (!content) {
          content = generateDailyReportMessageText(reportData);
        }
        wordBuffer = await generateDailyReportMessageWord(reportData, content);
      } else {
        wordBuffer = await generateDailyReportWord(reportData);
      }

      await fsPromises.writeFile(filePath, wordBuffer);

      const latestVersion = await this.prisma.reportVersion.findFirst({
        where: { reportId },
        orderBy: { versionNo: 'desc' },
      });
      const versionId = latestVersion ? latestVersion.id : null;

      const fileUrl = `/uploads/exports/${fileName}`;
      const created = await this.prisma.reportExport.create({
        data: {
          reportId,
          versionId,
          format: 'WORD',
          fileUrl,
          fileName,
          fileSize: wordBuffer.length,
          createdById: userId,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'ReportExport',
          entityId: created.id,
          action: 'EXPORT_REPORT',
          newValue: JSON.stringify(created),
          reason: 'Kết xuất báo cáo ngày sang định dạng Word',
        },
      });

      return created;
    } catch (err) {
      throw new BadRequestException(
        `Không thể kết xuất Word: ${(err as Error).message}`,
      );
    }
  }

  async getReportExports(reportId: number) {
    return this.prisma.reportExport.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async regenerateMessageContent(reportId: number, userId: number) {
    const report = await this.findOne(reportId);
    const reportData = await this.getReportDataForExport(reportId);
    const newContent = generateDailyReportMessageText(reportData);

    return this.prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id: reportId },
        data: { messageContent: newContent },
      });

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId: report.id,
          entityType: 'Report',
          entityId: report.id,
          action: 'REGENERATE_MESSAGE',
          oldValue: report.messageContent,
          newValue: newContent,
          reason: 'Sinh lại lời dẫn báo cáo',
        },
      });

      return { messageContent: newContent };
    });
  }

  async exportReportToTxt(reportId: number, userId: number) {
    const report = await this.findOne(reportId);
    const reportData = await this.getReportDataForExport(reportId);

    let content = report.messageContent;
    if (!content) {
      content = generateDailyReportMessageText(reportData);
    }

    const exportDir = './uploads/exports';
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const dateStr = report.reportDate.toISOString().slice(0, 10);
    const code = report.project.code.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const fileName = `LOI_DAN_${code}_${dateStr}_${timestamp}.txt`;
    const filePath = join(exportDir, fileName);

    try {
      const txtBuffer = Buffer.from(content, 'utf8');
      await fsPromises.writeFile(filePath, txtBuffer);

      const latestVersion = await this.prisma.reportVersion.findFirst({
        where: { reportId },
        orderBy: { versionNo: 'desc' },
      });
      const versionId = latestVersion ? latestVersion.id : null;

      const fileUrl = `/uploads/exports/${fileName}`;
      const created = await this.prisma.reportExport.create({
        data: {
          reportId,
          versionId,
          format: 'TXT',
          fileUrl,
          fileName,
          fileSize: txtBuffer.length,
          createdById: userId,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'ReportExport',
          entityId: created.id,
          action: 'EXPORT_REPORT',
          newValue: JSON.stringify(created),
          reason: 'Kết xuất báo cáo lời dẫn sang định dạng TXT',
        },
      });

      return created;
    } catch (err) {
      throw new BadRequestException(
        `Không thể kết xuất TXT: ${(err as Error).message}`,
      );
    }
  }

  async createAdjustment(
    reportId: number,
    changeReason: string,
    userId: number,
  ) {
    const report = await this.findOne(reportId);

    if (report.status !== 'APPROVED' && report.status !== 'SENT') {
      throw new BadRequestException(
        'Chỉ báo cáo đã phê duyệt hoặc đã gửi mới có thể tạo bản điều chỉnh',
      );
    }

    const versionCount = await this.prisma.reportVersion.count({
      where: { reportId },
    });
    const nextVersionNo = versionCount + 1;

    const reportData = await this.getReportDataForExport(reportId);

    return this.prisma.$transaction(async (tx) => {
      const version = await tx.reportVersion.create({
        data: {
          reportId,
          versionNo: nextVersionNo,
          snapshot: JSON.parse(
            JSON.stringify(reportData),
          ) as Prisma.InputJsonValue,
          changeReason,
          createdById: userId,
        },
      });

      await tx.report.update({
        where: { id: reportId },
        data: { status: 'DRAFT' },
      });

      await tx.auditLog.create({
        data: {
          userId,
          projectId: report.projectId,
          reportId,
          entityType: 'Report',
          entityId: reportId,
          action: 'CREATE_ADJUSTMENT',
          newValue: JSON.stringify({ versionNo: nextVersionNo, changeReason }),
          reason: `Tạo bản điều chỉnh phiên bản v${nextVersionNo}: ${changeReason}`,
        },
      });

      return version;
    });
  }

  async getVersions(reportId: number) {
    const versions = await this.prisma.reportVersion.findMany({
      where: { reportId },
      orderBy: { versionNo: 'desc' },
    });

    const userIds = Array.from(new Set(versions.map((v) => v.createdById)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return versions.map((v) => ({
      ...v,
      createdBy: userMap.get(v.createdById) || null,
    }));
  }

  async getVersion(reportId: number, versionId: number) {
    const version = await this.prisma.reportVersion.findFirst({
      where: { id: versionId, reportId },
    });

    if (!version) {
      throw new NotFoundException(
        `Không tìm thấy phiên bản có ID ${versionId}`,
      );
    }

    const createdBy = await this.prisma.user.findUnique({
      where: { id: version.createdById },
      select: { id: true, name: true, email: true },
    });

    return {
      ...version,
      createdBy: createdBy || null,
    };
  }

  async getAuditLogs(reportId: number) {
    const logs = await this.prisma.auditLog.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = Array.from(
      new Set(logs.map((l) => l.userId).filter((id): id is number => !!id)),
    );
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return logs.map((l) => ({
      ...l,
      user: l.userId ? userMap.get(l.userId) || null : null,
    }));
  }

  private valueToString(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) {
      return val.toISOString();
    }
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      if ('toNumber' in obj && typeof obj.toNumber === 'function') {
        const toNumberFn = obj.toNumber as () => unknown;
        return String(toNumberFn());
      }
      return JSON.stringify(val);
    }
    if (typeof val === 'string') {
      return val.trim();
    }
    if (typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    return '';
  }

  private compareValues(val1: unknown, val2: unknown): boolean {
    if (val1 === val2) return true;

    const isEmpty1 = val1 === null || val1 === undefined || val1 === '';
    const isEmpty2 = val2 === null || val2 === undefined || val2 === '';
    if (isEmpty1 && isEmpty2) return true;
    if (isEmpty1 !== isEmpty2) return false;

    const str1 = this.valueToString(val1);
    const str2 = this.valueToString(val2);

    const num1 = Number(str1);
    const num2 = Number(str2);
    if (!isNaN(num1) && !isNaN(num2) && str1 !== '' && str2 !== '') {
      return num1 === num2;
    }

    return str1 === str2;
  }

  private async logCellChange(
    tx: Prisma.TransactionClient,
    userId: number,
    projectId: number,
    reportId: number,
    entityType: string,
    entityId: number,
    fieldName: string,
    oldValue: unknown,
    newValue: unknown,
  ) {
    if (this.compareValues(oldValue, newValue)) return;

    const oldStr = this.valueToString(oldValue);
    const newStr = this.valueToString(newValue);

    await tx.auditLog.create({
      data: {
        userId,
        projectId,
        reportId,
        entityType,
        entityId,
        action: 'UPDATE_CELL',
        fieldName,
        oldValue: oldStr,
        newValue: newStr,
        reason: `Thay đổi ${fieldName} từ "${oldStr}" thành "${newStr}"`,
      },
    });
  }
}
