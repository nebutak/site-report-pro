import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    const existingProject = await this.prisma.project.findUnique({
      where: { code: createProjectDto.code.toUpperCase() },
    });

    if (existingProject) {
      throw new BadRequestException('Mã dự án đã tồn tại trong hệ thống');
    }

    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        code: createProjectDto.code.toUpperCase(),
      },
    });
  }

  async findAll(status?: string, keyword?: string) {
    const where: Prisma.ProjectWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ];
    }

    return this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án có ID ${id}`);
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(id);

    if (
      updateProjectDto.code &&
      updateProjectDto.code.toUpperCase() !== project.code
    ) {
      const existingProject = await this.prisma.project.findUnique({
        where: { code: updateProjectDto.code.toUpperCase() },
      });

      if (existingProject) {
        throw new BadRequestException('Mã dự án đã tồn tại trong hệ thống');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        code: updateProjectDto.code
          ? updateProjectDto.code.toUpperCase()
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async getDashboardStats() {
    const totalProjects = await this.prisma.project.count({
      where: { status: 'ACTIVE' },
    });
    const totalReports = await this.prisma.report.count();
    const totalUsers = await this.prisma.user.count({
      where: { status: 'ACTIVE' },
    });
    const pendingApproval = await this.prisma.report.count({
      where: { status: 'IN_REVIEW' },
    });

    return {
      totalProjects,
      totalReports,
      totalUsers,
      pendingApproval,
    };
  }
}
