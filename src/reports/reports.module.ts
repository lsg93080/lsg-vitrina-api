import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicationsModule } from '@/publications/publications.module';
import { ContributorsModule } from '@/contributors/contributors.module';
import {
  ReportSchemaClass,
  ReportSchema,
} from './infrastructure/schemas/report.schema';
import { MongoReportRepository } from './infrastructure/repositories/mongo-report.repository';
import { REPORT_REPOSITORY } from './domain/repositories/report.repository.interface';
import { CreateReportUseCase } from './application/use-cases/create-report.use-case';
import { GetReportsUseCase } from './application/use-cases/get-reports.use-case';
import { ResolveReportUseCase } from './application/use-cases/resolve-report.use-case';
import { ReportsController } from './presentation/controllers/reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReportSchemaClass.name, schema: ReportSchema },
    ]),
    forwardRef(() => PublicationsModule),
    ContributorsModule,
  ],
  controllers: [ReportsController],
  providers: [
    { provide: REPORT_REPOSITORY, useClass: MongoReportRepository },
    CreateReportUseCase,
    GetReportsUseCase,
    ResolveReportUseCase,
  ],
  exports: [REPORT_REPOSITORY, CreateReportUseCase],
})
export class ReportsModule {}
