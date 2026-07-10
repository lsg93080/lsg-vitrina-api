import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type IReviewRepository,
  REVIEW_REPOSITORY,
} from '../../domain/repositories/review.repository.interface';
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
export class DeleteReviewUseCase {
  private readonly logger = new Logger(DeleteReviewUseCase.name);

  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: IReviewRepository,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: IPublicationRepository,
    @Inject(RELEASE_REPOSITORY)
    private readonly releasesRepo: IReleasesRepository,
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly contributorRepo: IContributorRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const review = await this.reviewRepo.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }

    await this.reviewRepo.delete(id);
    try {
      await this.cascade(review.repoId, review.releaseId, review.rating);
    } catch (error) {
      this.logger.error(
        `Rating cascade failed after delete (repoId=${review.repoId}, releaseId=${review.releaseId})`,
        error,
      );
    }
  }

  private async cascade(
    repoId: string,
    releaseId: string,
    rating: number,
  ): Promise<void> {
    const pub = await this.publicationRepo.findByRepoId(repoId);
    await this.publicationRepo.updateRating(repoId, {
      ratingDelta: -rating,
      reviewsDelta: -1,
    });
    await this.releasesRepo.updateRating(releaseId, {
      ratingDelta: -rating,
      reviewsDelta: -1,
    });
    if (pub) {
      await this.contributorRepo.updateStats(pub.authorId, {
        commentsDelta: -1,
        ratingDelta: -rating,
        downloadsDelta: 0,
      });
    }
  }
}
