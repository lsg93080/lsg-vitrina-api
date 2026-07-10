import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  type IReviewRepository,
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

export interface CreateReviewInput {
  repoId: string;
  releaseId: string;
  authorId: string;
  rating: number;
  title: string;
  comment: string;
}

@Injectable()
export class CreateReviewUseCase {
  private readonly logger = new Logger(CreateReviewUseCase.name);

  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: IReviewRepository,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: IPublicationRepository,
    @Inject(RELEASE_REPOSITORY)
    private readonly releasesRepo: IReleasesRepository,
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly contributorRepo: IContributorRepository,
  ) {}

  async execute(input: CreateReviewInput): Promise<Review> {
    // Prevent self-reviews: publication author cannot review their own work
    const publication = await this.publicationRepo.findByRepoId(input.repoId);
    if (publication && publication.authorId === input.authorId) {
      throw new ForbiddenException('Cannot review your own publication');
    }

    // Prevent duplicate reviews: one review per author per release
    const existing = await this.reviewRepo.findByAuthorAndRelease(
      input.authorId,
      input.releaseId,
    );
    if (existing) {
      throw new ConflictException('You already reviewed this release');
    }

    const review = new Review(
      undefined,
      input.repoId,
      input.releaseId,
      input.authorId,
      input.rating,
      input.title,
      input.comment,
      new Date(),
      new Date(),
    );

    const created = await this.reviewRepo.create(review);
    try {
      await this.cascade(input.repoId, input.releaseId, input.rating);
    } catch (error) {
      this.logger.error(
        `Rating cascade failed after create (repoId=${input.repoId}, releaseId=${input.releaseId})`,
        error,
      );
    }
    return created;
  }

  private async cascade(
    repoId: string,
    releaseId: string,
    rating: number,
  ): Promise<void> {
    const pub = await this.publicationRepo.findByRepoId(repoId);
    await this.publicationRepo.updateRating(repoId, {
      ratingDelta: rating,
      reviewsDelta: 1,
    });
    await this.releasesRepo.updateRating(releaseId, {
      ratingDelta: rating,
      reviewsDelta: 1,
    });
    if (pub) {
      await this.contributorRepo.updateStats(pub.authorId, {
        commentsDelta: 1,
        ratingDelta: rating,
        downloadsDelta: 0,
      });
    }
  }
}
