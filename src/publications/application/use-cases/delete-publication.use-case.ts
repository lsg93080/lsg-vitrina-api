import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '../../domain/repositories/publication.repository.interface';
import {
  type IPublicationDetailsRepository,
  PUBLICATION_DETAILS_REPOSITORY,
} from '@/publication-details/domain/repositories/publication-details.repository.interface';
import {
  type IReleasesRepository,
  RELEASE_REPOSITORY,
} from '@/publication-details/domain/repositories/release.repository.interface';
import {
  type IReviewRepository,
  REVIEW_REPOSITORY,
} from '@/reviews/domain/repositories/review.repository.interface';
import {
  type IReportRepository,
  REPORT_REPOSITORY,
} from '@/reports/domain/repositories/report.repository.interface';
import {
  type IReviewerAssignmentRepository,
  REVIEWER_ASSIGNMENT_REPOSITORY,
} from '@/moderation/domain/repositories/reviewer-assignment.repository.interface';

@Injectable()
export class DeletePublicationUseCase {
  constructor(
    @Inject(PUBLICATION_REPOSITORY)
    private readonly repo: IPublicationRepository,
    @Inject(PUBLICATION_DETAILS_REPOSITORY)
    private readonly detailsRepo: IPublicationDetailsRepository,
    @Inject(RELEASE_REPOSITORY)
    private readonly releasesRepo: IReleasesRepository,
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewsRepo: IReviewRepository,
    @Inject(REPORT_REPOSITORY)
    private readonly reportsRepo: IReportRepository,
    @Inject(REVIEWER_ASSIGNMENT_REPOSITORY)
    private readonly assignmentsRepo: IReviewerAssignmentRepository,
  ) {}

  async execute(id: string, repoId: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundException(`Publication ${id} not found`);
    void this.cascadeDetails(repoId);
    void this.releasesRepo.deleteByRepoId(repoId);
    void this.reviewsRepo.deleteByRepoId(repoId);
    void this.reportsRepo.deleteByPublicationId(id);
    void this.assignmentsRepo.deleteByRepoId(repoId);
  }

  private async cascadeDetails(repoId: string): Promise<void> {
    const details = await this.detailsRepo.findByRepoId(repoId);
    if (details?.id) void this.detailsRepo.delete(details.id);
  }
}
