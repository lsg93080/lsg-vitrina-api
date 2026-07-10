import { Report } from '../../domain/entities/report.entity';
import type { ReportDocument } from '../schemas/report.schema';

interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export class ReportMapper {
  static toDomain(doc: ReportDocument): Report {
    const timestamps = doc as unknown as WithTimestamps;

    return new Report(
      doc._id.toString(),
      doc.publicationId,
      doc.reporterId,
      doc.reason,
      doc.description,
      doc.status,
      doc.resolvedBy ?? null,
      doc.resolvedAt ?? null,
      timestamps.createdAt ?? new Date(),
      timestamps.updatedAt ?? new Date(),
    );
  }

  static toPersistence(report: Report): Record<string, unknown> {
    return {
      publicationId: report.publicationId,
      reporterId: report.reporterId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      resolvedBy: report.resolvedBy ?? null,
      resolvedAt: report.resolvedAt ?? null,
    };
  }
}
