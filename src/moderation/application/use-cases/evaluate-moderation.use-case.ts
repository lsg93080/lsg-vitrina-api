import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  REVIEWER_ASSIGNMENT_REPOSITORY,
  type IReviewerAssignmentRepository,
} from '../../domain/repositories/reviewer-assignment.repository.interface';
import {
  PUBLICATION_REPOSITORY,
  type IPublicationRepository,
} from '../../../publications/domain/repositories/publication.repository.interface';
import { CreateReportUseCase } from '../../../reports/application/use-cases/create-report.use-case';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.vo';
import { PublicationStatus } from '../../../publications/domain/value-objects/publication.vo';
import { ReportReason } from '../../../reports/domain/value-objects/report-reason.vo';

@Injectable()
export class EvaluateModerationUseCase {
  constructor(
    @Inject(REVIEWER_ASSIGNMENT_REPOSITORY)
    private readonly repo: IReviewerAssignmentRepository,
    @Inject(forwardRef(() => PUBLICATION_REPOSITORY))
    private readonly publicationRepo: IPublicationRepository,
    private readonly createReport: CreateReportUseCase,
  ) {}

  async execute(publicationRepoId: string): Promise<void> {
    try {
      const assignments =
        await this.repo.findByPublicationRepoId(publicationRepoId);
      const done = assignments.filter(
        (a) => a.status === AssignmentStatus.DONE,
      );
      if (done.length === 0) return;

      const unsafeCount = done.filter(
        (a) => a.verdict?.isSafe === false,
      ).length;
      const unsafeRatio = unsafeCount / done.length;
      const threshold = parseFloat(
        process.env.MODERATION_UNSAFE_THRESHOLD ?? '0.5',
      );
      const autoSuspend = process.env.MODERATION_AUTO_SUSPEND === 'true';

      if (unsafeRatio < threshold) return;

      if (autoSuspend) {
        void this.publicationRepo.update(publicationRepoId, {
          status: PublicationStatus.SUSPENDED,
        });
        return;
      }

      await this.createReport.execute({
        publicationId: publicationRepoId,
        reporterId: 'SYSTEM',
        reason: ReportReason.OTHER,
        description: `Auto-moderation: unsafe ratio ${unsafeRatio.toFixed(2)} reached threshold ${threshold}`,
      });
    } catch (error) {
      console.error('[EvaluateModeration]', error);
    }
  }
}
