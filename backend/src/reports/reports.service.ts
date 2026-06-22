import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Prisma } from '@prisma/client';

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
  ) {
    const source = await this.findOne(sourceId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Report header
      const newReport = await tx.report.create({
        data: {
          projectId: source.projectId,
          reportType: source.reportType,
          reportDate: targetDate,
          reportNo,
          title,
          status: 'DRAFT',
          createdById: userId,
          sourceReportId: sourceId,
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
}
