import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type IReviewRepository,
  type UpdateReviewPayload,
  REVIEW_REPOSITORY,
} from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '@/publications/domain/repositories/publication.repository.interface';
import {
  type IReleasesRepository,
  RELEASE_REPOSITORY,
} from '@/publication-details/domain/repositories/release.repository.interface';
import {
  type IContributorRepository,
  CONTRIBUTOR_REPOSITORY,
} from '@/contributors/domain/repositories/contributor.repository.interface';

@Injectable()
export class UpdateReviewUseCase {
  private readonly logger = new Logger(UpdateReviewUseCase.name);

  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly repo: IReviewRepository,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: IPublicationRepository,
    @Inject(RELEASE_REPOSITORY)
    private readonly releasesRepo: IReleasesRepository,
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly contributorRepo: IContributorRepository,
  ) {}

  async execute(id: string, data: UpdateReviewPayload): Promise<Review> {
    const existingReview = await this.repo.findById(id);
    if (!existingReview) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }

    const oldRating = existingReview.rating;
    const updated = await this.repo.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }

    // Cascade rating delta when rating changes
    if (data.rating !== undefined && data.rating !== oldRating) {
      const ratingDelta = data.rating - oldRating;
      try {
        await this.cascadeRatingDelta(
          existingReview.repoId,
          existingReview.releaseId,
          ratingDelta,
        );
      } catch (error) {
        this.logger.error(
          `Rating cascade failed after update (repoId=${existingReview.repoId}, releaseId=${existingReview.releaseId}, delta=${ratingDelta})`,
          error,
        );
      }
    }

    return updated;
  }

  private async cascadeRatingDelta(
    repoId: string,
    releaseId: string,
    ratingDelta: number,
  ): Promise<void> {
    const pub = await this.publicationRepo.findByRepoId(repoId);
    await this.publicationRepo.updateRating(repoId, {
      ratingDelta,
      reviewsDelta: 0,
    });
    await this.releasesRepo.updateRating(releaseId, {
      ratingDelta,
      reviewsDelta: 0,
    });
    if (pub) {
      await this.contributorRepo.updateStats(pub.authorId, {
        commentsDelta: 0,
        ratingDelta,
        downloadsDelta: 0,
      });
    }
  }
}
