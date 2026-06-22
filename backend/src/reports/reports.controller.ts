import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { CloneReportDto } from './dto/clone-report.dto';
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
}
