import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { CloneReportDto } from './dto/clone-report.dto';
import { UpdateWeatherDto } from './dto/update-weather.dto';
import { UpdateManpowerDto } from './dto/update-manpower.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { UpdateImagesDto } from './dto/update-images.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface RequestUser {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private checkRoles(user: unknown, allowedRoles: string[]): RequestUser {
    const reqUser = user as RequestUser;
    const roleName = reqUser?.role?.name;
    if (!roleName || !allowedRoles.includes(roleName)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
    return reqUser;
  }

  @Post()
  create(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.create(createReportDto, reqUser.id);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('reportType') reportType?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('keyword') keyword?: string,
  ) {
    const parsedProjectId = projectId ? parseInt(projectId, 10) : undefined;
    return this.reportsService.findAll(
      parsedProjectId,
      reportType,
      status,
      fromDate,
      toDate,
      keyword,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportDto: UpdateReportDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.update(id, updateReportDto, reqUser.id);
  }

  @Post(':id/clone')
  clone(
    @Param('id', ParseIntPipe) id: number,
    @Body() cloneReportDto: CloneReportDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.clone(id, cloneReportDto.reportDate, reqUser.id);
  }

  @Post(':id/submit')
  submit(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: unknown) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.submit(id, reqUser.id);
  }

  @Post(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: unknown) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REVIEWER',
    ]);
    return this.reportsService.approve(id, reqUser.id);
  }

  @Post(':id/mark-sent')
  markSent(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.markSent(id, reqUser.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: unknown) {
    const reqUser = this.checkRoles(user, ['ADMIN', 'PROJECT_MANAGER']);
    return this.reportsService.remove(id, reqUser.id);
  }

  // --- PHASE 4 ENDPOINTS ---

  @Get(':id/weather')
  getWeather(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getWeather(id);
  }

  @Put(':id/weather')
  updateWeather(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWeatherDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.updateWeather(id, dto, reqUser.id);
  }

  @Get(':id/manpower')
  getManpower(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getManpower(id);
  }

  @Put(':id/manpower')
  updateManpower(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateManpowerDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.updateManpower(id, dto, reqUser.id);
  }

  @Get(':id/equipment')
  getEquipment(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getEquipment(id);
  }

  @Put(':id/equipment')
  updateEquipment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.updateEquipment(id, dto, reqUser.id);
  }

  // Materials routes (mapping both /material and /materials)
  @Get([':id/materials', ':id/material'])
  getMaterials(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getMaterials(id);
  }

  @Put([':id/materials', ':id/material'])
  updateMaterials(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.updateMaterials(id, dto, reqUser.id);
  }

  @Get(':id/work-items')
  getWorkItems(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getWorkItems(id);
  }

  @Put(':id/work-items')
  updateWorkItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkItemDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.updateWorkItems(id, dto, reqUser.id);
  }

  @Get(':id/images')
  getImages(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getImages(id);
  }

  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/images';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const id =
            typeof req.params['id'] === 'string' ? req.params['id'] : 'unknown';
          cb(null, `img-${id}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(
            new BadRequestException(
              'Chỉ cho phép tải lên file ảnh (jpg, jpeg, png, webp)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: unknown,
  ) {
    if (!file) {
      throw new BadRequestException('Không nhận được file tải lên');
    }
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.uploadImage(id, file, reqUser.id);
  }

  @Put(':id/images')
  updateImagesMetadata(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImagesDto,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.updateImagesMetadata(id, dto, reqUser.id);
  }

  @Delete('images/:imageId')
  deleteImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.deleteImage(imageId, reqUser.id);
  }

  @Get(':id/preview')
  async previewReport(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: unknown,
    @Req() req: Request,
  ) {
    this.checkRoles(user, ['ADMIN', 'PROJECT_MANAGER', 'REPORTER', 'REVIEWER']);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportsService.generateReportHtml(id, baseUrl);
  }

  @Get(':id/exports')
  async getReportExports(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: unknown,
  ) {
    this.checkRoles(user, ['ADMIN', 'PROJECT_MANAGER', 'REPORTER', 'REVIEWER']);
    return this.reportsService.getReportExports(id);
  }

  @Post(':id/regenerate-message')
  async regenerateMessage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: unknown,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    return this.reportsService.regenerateMessageContent(id, reqUser.id);
  }

  @Post(':id/export')
  async exportReport(
    @Param('id', ParseIntPipe) id: number,
    @Body('format') format: string,
    @CurrentUser() user: unknown,
    @Req() req: Request,
  ) {
    const reqUser = this.checkRoles(user, [
      'ADMIN',
      'PROJECT_MANAGER',
      'REPORTER',
    ]);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    if (format === 'PDF') {
      return this.reportsService.exportReportToPdf(id, reqUser.id, baseUrl);
    } else if (format === 'EXCEL') {
      return this.reportsService.exportReportToExcel(id, reqUser.id);
    } else if (format === 'WORD') {
      return this.reportsService.exportReportToWord(id, reqUser.id);
    } else if (format === 'TXT') {
      return this.reportsService.exportReportToTxt(id, reqUser.id);
    } else {
      throw new BadRequestException(
        'Định dạng xuất bản không hợp lệ (chỉ hỗ trợ PDF, EXCEL, WORD, TXT)',
      );
    }
  }
}
