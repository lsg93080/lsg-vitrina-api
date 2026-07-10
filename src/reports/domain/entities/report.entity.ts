import { ReportReason, ReportStatus } from '../value-objects/report-reason.vo';

export class Report {
  constructor(
    readonly id: string | undefined,
    readonly publicationId: string,
    readonly reporterId: string,
    readonly reason: ReportReason,
    readonly description: string,
    readonly status: ReportStatus,
    readonly resolvedBy: string | null,
    readonly resolvedAt: Date | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
