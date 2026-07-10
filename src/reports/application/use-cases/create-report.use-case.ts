import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type IReportRepository,
  REPORT_REPOSITORY,
} from '../../domain/repositories/report.repository.interface';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '@/publications/domain/repositories/publication.repository.interface';
import { Report } from '../../domain/entities/report.entity';
import {
  ReportReason,
  ReportStatus,
} from '../../domain/value-objects/report-reason.vo';

export interface CreateReportInput {
  publicationId: string;
  reporterId: string;
  reason: ReportReason;
  description: string;
}

@Injectable()
export class CreateReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly repo: IReportRepository,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: IPublicationRepository,
  ) {}

  async execute(input: CreateReportInput): Promise<Report> {
    // Prevent self-reporting: publication owner cannot report their own work
    const publication = await this.publicationRepo.findByRepoId(
      input.publicationId,
    );
    if (!publication) {
      throw new NotFoundException('Publication not found');
    }
    if (publication.authorId === input.reporterId) {
      throw new ForbiddenException('Cannot report your own publication');
    }

    // Prevent duplicate pending reports from the same reporter
    const existing = await this.repo.findPendingByReporterAndPublication(
      input.reporterId,
      input.publicationId,
    );
    if (existing) {
      throw new ConflictException(
        'You already have a pending report for this publication',
      );
    }

    const report = new Report(
      undefined,
      input.publicationId,
      input.reporterId,
      input.reason,
      input.description,
      ReportStatus.PENDING,
      null,
      null,
      new Date(),
      new Date(),
    );

    return this.repo.create(report);
  }
}
