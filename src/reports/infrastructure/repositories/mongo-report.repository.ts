import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  type IReportRepository,
  type ReportFilter,
  type ReportPage,
} from '../../domain/repositories/report.repository.interface';
import { Report } from '../../domain/entities/report.entity';
import { ReportStatus } from '../../domain/value-objects/report-reason.vo';
import {
  ReportSchemaClass,
  type ReportDocument,
} from '../schemas/report.schema';
import { ReportMapper } from '../mappers/report.mapper';

@Injectable()
export class MongoReportRepository implements IReportRepository {
  constructor(
    @InjectModel(ReportSchemaClass.name)
    private readonly model: Model<ReportDocument>,
  ) {}

  async create(report: Report): Promise<Report> {
    const doc = await this.model.create(ReportMapper.toPersistence(report));
    return ReportMapper.toDomain(doc);
  }

  async findPendingByReporterAndPublication(
    reporterId: string,
    publicationId: string,
  ): Promise<Report | null> {
    const doc = await this.model
      .findOne({ reporterId, publicationId, status: ReportStatus.PENDING })
      .exec();
    return doc ? ReportMapper.toDomain(doc) : null;
  }

  async findFiltered(filter: ReportFilter): Promise<ReportPage> {
    const skip = (filter.page - 1) * filter.limit;
    const match: Record<string, unknown> = {};

    if (filter.publicationId) {
      match['publicationId'] = filter.publicationId;
    }
    if (filter.status) {
      match['status'] = filter.status;
    }
    if (filter.reason) {
      match['reason'] = filter.reason;
    }
    if (filter.dateFrom || filter.dateTo) {
      const range: Record<string, Date> = {};
      if (filter.dateFrom) range['$gte'] = filter.dateFrom;
      if (filter.dateTo) {
        const end = new Date(filter.dateTo);
        end.setUTCHours(23, 59, 59, 999);
        range['$lte'] = end;
      }
      match['createdAt'] = range;
    }

    const [data, total] = await Promise.all([
      this.model
        .find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filter.limit)
        .exec(),
      this.model.countDocuments(match).exec(),
    ]);

    return { data: data.map((doc) => ReportMapper.toDomain(doc)), total };
  }

  async findById(id: string): Promise<Report | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? ReportMapper.toDomain(doc) : null;
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    resolvedBy: string,
    resolvedAt: Date,
  ): Promise<Report | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { $set: { status, resolvedBy, resolvedAt } },
        { returnDocument: 'after' },
      )
      .exec();
    return doc ? ReportMapper.toDomain(doc) : null;
  }

  async deleteByPublicationId(publicationId: string): Promise<void> {
    await this.model.deleteMany({ publicationId }).exec();
  }

  async reopenLatestByPublicationId(publicationId: string): Promise<void> {
    const latest = await this.model
      .findOne({ publicationId })
      .sort({ createdAt: -1 })
      .exec();
    if (latest && latest.status !== ReportStatus.PENDING) {
      latest.status = ReportStatus.PENDING;
      await latest.save();
    }
  }
}
