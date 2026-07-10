import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type IReportRepository,
  type ReportFilter,
  type ReportPage,
  REPORT_REPOSITORY,
} from '../../domain/repositories/report.repository.interface';
import { Report } from '../../domain/entities/report.entity';

@Injectable()
export class GetReportsUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly repo: IReportRepository,
  ) {}

  async getFiltered(filter: ReportFilter): Promise<ReportPage> {
    return this.repo.findFiltered(filter);
  }

  async getById(id: string): Promise<Report> {
    const report = await this.repo.findById(id);
    if (!report) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }
    return report;
  }
}
