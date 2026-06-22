import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [PrismaModule, AuthModule, ProjectsModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
