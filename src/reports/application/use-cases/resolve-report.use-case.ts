import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type IReportRepository,
  REPORT_REPOSITORY,
} from '../../domain/repositories/report.repository.interface';
import { Report } from '../../domain/entities/report.entity';
import { ReportStatus } from '../../domain/value-objects/report-reason.vo';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '@/publications/domain/repositories/publication.repository.interface';
import { PublicationStatus } from '@/publications/domain/value-objects/publication.vo';

export type ResolveAction = 'dismiss' | 'warn' | 'suspend';

export interface ResolveReportInput {
  id: string;
  action: ResolveAction;
  resolvedBy: string;
  resolvedByName: string;
  message?: string;
}

@Injectable()
export class ResolveReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepo: IReportRepository,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: IPublicationRepository,
  ) {}

  async execute(input: ResolveReportInput): Promise<Report> {
    const report = await this.reportRepo.findById(input.id);
    if (!report) {
      throw new NotFoundException(`Report with id ${input.id} not found`);
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new ConflictException('Report is already resolved');
    }

    const statusMap: Record<ResolveAction, ReportStatus> = {
      dismiss: ReportStatus.DISMISSED,
      warn: ReportStatus.WARNED,
      suspend: ReportStatus.SUSPENDED,
    };
    const newStatus = statusMap[input.action];

    const updated = await this.reportRepo.updateStatus(
      input.id,
      newStatus,
      input.resolvedBy,
      new Date(),
    );

    if (input.action === 'suspend') {
      await this.publicationRepo.update(report.publicationId, {
        status: PublicationStatus.SUSPENDED,
      } as Partial<
        import('@/publications/domain/entities/publication.entity').Publication
      >);
    }

    if (
      (input.action === 'warn' || input.action === 'suspend') &&
      input.message
    ) {
      // If publication is already suspended, admin is replying, not issuing a new warning
      const pub = await this.publicationRepo.findByRepoId(report.publicationId);
      const historyAction =
        input.action === 'warn' && pub?.status === PublicationStatus.SUSPENDED
          ? 'reply'
          : input.action;

      await this.publicationRepo.pushReportsHistoryEntry(report.publicationId, {
        action: historyAction,
        message: input.message,
        authorId: input.resolvedBy,
        authorName: input.resolvedByName,
      });
    }

    return updated!;
  }
}
