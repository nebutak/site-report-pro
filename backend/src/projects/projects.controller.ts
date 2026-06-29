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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';
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

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: unknown,
  ) {
    this.checkRoles(user, ['ADMIN', 'PROJECT_MANAGER']);
    return this.projectsService.create(createProjectDto);
  }

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.projectsService.getDashboardStats();
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.projectsService.findAll(status, keyword);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: unknown,
  ) {
    this.checkRoles(user, ['ADMIN', 'PROJECT_MANAGER']);
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: unknown,
  ) {
    this.checkRoles(user, ['ADMIN', 'PROJECT_MANAGER']);
    return this.projectsService.remove(id);
  }

  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          const uploadPath = './uploads/logos';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const id =
            typeof req.params['id'] === 'string' ? req.params['id'] : 'unknown';
          cb(null, `logo-${id}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: BadRequestException | null, acceptFile: boolean) => void,
      ) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException(
              'Chỉ cho phép tải lên file ảnh (jpg, jpeg, png)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
      },
    }),
  )
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: unknown,
  ) {
    this.checkRoles(user, ['ADMIN', 'PROJECT_MANAGER']);
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file logo để tải lên');
    }

    const logoUrl = `/uploads/logos/${file.filename}`;
    return this.projectsService.update(id, { logoUrl });
  }
}
