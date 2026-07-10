import { Review } from '../entities/review.entity';

export const REVIEW_REPOSITORY = 'REVIEW_REPOSITORY';

export interface ReviewPage {
  data: Review[];
  total: number;
}

export interface UpdateReviewPayload {
  title?: string;
  comment?: string;
  rating?: number;
}

export interface IReviewRepository {
  create(review: Review): Promise<Review>;
  findAll(page: number, limit: number): Promise<ReviewPage>;
  findByAuthor(authorId: string): Promise<Review[]>;
  findByAuthorAndRelease(
    authorId: string,
    releaseId: string,
  ): Promise<Review | null>;
  findByRelease(
    repoId: string,
    releaseId: string,
    page: number,
    limit: number,
  ): Promise<ReviewPage>;
  findById(id: string): Promise<Review | null>;
  update(id: string, data: UpdateReviewPayload): Promise<Review | null>;
  delete(id: string): Promise<boolean>;
  deleteByRepoId(repoId: string): Promise<void>;
}
