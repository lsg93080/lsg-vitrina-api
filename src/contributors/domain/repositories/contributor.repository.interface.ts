import { Contributor } from '../entities/contributor.entity';

export const CONTRIBUTOR_REPOSITORY = 'CONTRIBUTOR_REPOSITORY';

export interface TopContributorsFilter {
  orderBy: 'postsQty' | 'totalRating' | 'downloads';
  orderMode: 'asc' | 'desc';
  limit: number;
}

export interface UpdateStatsPayload {
  commentsDelta: number;
  ratingDelta: number;
  downloadsDelta: number;
}

export interface IContributorRepository {
  findAll(): Promise<Contributor[]>;
  findAllActive(): Promise<Contributor[]>;
  findById(id: string): Promise<Contributor | null>;
  findByUserId(userId: string): Promise<Contributor | null>;
  findByUserIds(userIds: string[]): Promise<Contributor[]>;
  existsByUserId(userId: string): Promise<boolean>;
  findTops(filter: TopContributorsFilter): Promise<Contributor[]>;
  findTopRated(threshold: number): Promise<Contributor[]>;
  searchByUsername(search: string): Promise<Contributor[]>;
  // Finds all contributors with isReviewer=true, excluding a specific userId (for moderation draws).
  findReviewerPool(excludeUserId: string): Promise<Contributor[]>;
  create(contributor: Contributor): Promise<Contributor>;
  update(
    userId: string,
    data: Partial<Contributor>,
  ): Promise<Contributor | null>;
  updateStats(
    userId: string,
    payload: UpdateStatsPayload,
  ): Promise<Contributor | null>;
  updateContrInfo(
    userId: string,
    contrInfo: Partial<import('../entities/contributor.entity').ContrInfo>,
  ): Promise<Contributor | null>;
}
