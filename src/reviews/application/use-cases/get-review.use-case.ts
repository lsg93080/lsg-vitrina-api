import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type IReviewRepository,
  type ReviewPage,
  REVIEW_REPOSITORY,
} from '../../domain/repositories/review.repository.interface';
import {
  type IContributorRepository,
  CONTRIBUTOR_REPOSITORY,
} from '@/contributors/domain/repositories/contributor.repository.interface';
import { Review } from '../../domain/entities/review.entity';

@Injectable()
export class GetReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly repo: IReviewRepository,
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly contributorRepo: IContributorRepository,
  ) {}

  async getAll(page: number, limit: number): Promise<ReviewPage> {
    return this.repo.findAll(page, limit);
  }

  async getByAuthor(authorId: string): Promise<Review[]> {
    return this.repo.findByAuthor(authorId);
  }

  async getByRelease(
    repoId: string,
    releaseId: string,
    page: number,
    limit: number,
  ): Promise<ReviewPage> {
    return this.repo.findByRelease(repoId, releaseId, page, limit);
  }

  async getById(id: string): Promise<Review> {
    const review = await this.repo.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }
    return review;
  }

  // Batch-resolves authorIds to display names via the contributor collection.
  async resolveAuthorNames(reviews: Review[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(reviews.map((r) => r.authorId))];
    const contributors = await this.contributorRepo.findByUserIds(uniqueIds);

    const nameMap = new Map<string, string>();
    for (const c of contributors) {
      nameMap.set(c.userId, c.contrInfo.username);
    }
    return nameMap;
  }
}
