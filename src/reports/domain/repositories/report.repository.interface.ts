import { Report } from '../entities/report.entity';
import { ReportStatus } from '../value-objects/report-reason.vo';

export const REPORT_REPOSITORY = 'REPORT_REPOSITORY';

export interface ReportPage {
  data: Report[];
  total: number;
}

export interface ReportFilter {
  publicationId?: string;
  status?: ReportStatus;
  reason?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
}

export interface IReportRepository {
  create(report: Report): Promise<Report>;
  findPendingByReporterAndPublication(
    reporterId: string,
    publicationId: string,
  ): Promise<Report | null>;
  findFiltered(filter: ReportFilter): Promise<ReportPage>;
  findById(id: string): Promise<Report | null>;
  updateStatus(
    id: string,
    status: ReportStatus,
    resolvedBy: string,
    resolvedAt: Date,
  ): Promise<Report | null>;
  deleteByPublicationId(publicationId: string): Promise<void>;
  reopenLatestByPublicationId(publicationId: string): Promise<void>;
}
