import { Platform } from '@/contributors/domain/value-objects/platform.enum';
import { Publication } from '../entities/publication.entity';
import { EsrbRating, PubType } from '../value-objects/publication.vo';

export const PUBLICATION_REPOSITORY = 'PUBLICATION_REPOSITORY';

export interface PublicationFilter {
  search?: string;
  types?: PubType[];
  esrbRatings?: EsrbRating[];
  platforms?: Platform[];
  tags?: string[];
  yearFrom?: number;
  yearTo?: number;
  page: number;
  limit: number;
}

export interface PublicationFilterResult {
  data: Publication[];
  total: number;
}

export interface TopPublicationsFilter {
  orderBy: 'totalRating' | 'downloads' | 'totalReviews';
  orderMode: 'asc' | 'desc';
  limit: number;
  type?: PubType;
}

export interface UpdateRatingPayload {
  ratingDelta: number;
  reviewsDelta: number;
}

export interface IPublicationRepository {
  create(publication: Publication): Promise<Publication>;
  findById(id: string): Promise<Publication | null>;
  findByRepoId(repoId: string): Promise<Publication | null>;
  findByAuthor(authorId: string): Promise<Publication[]>;
  filter(params: PublicationFilter): Promise<PublicationFilterResult>;
  findTops(filter: TopPublicationsFilter): Promise<Publication[]>;
  findTopRated(threshold: number, type?: PubType): Promise<Publication[]>;
  update(
    repoId: string,
    data: Partial<Publication>,
  ): Promise<Publication | null>;
  updateRating(repoId: string, payload: UpdateRatingPayload): Promise<void>;
  incrementDownloads(repoId: string): Promise<void>;
  updateRepoDetailsId(repoId: string, detailsId: string): Promise<void>;
  delete(id: string): Promise<boolean>;
  pushReportsHistoryEntry(
    repoId: string,
    entry: {
      action: string;
      message: string;
      authorId: string;
      authorName: string;
    },
  ): Promise<void>;
  getReportsHistory(repoId: string): Promise<
    {
      id: string;
      action: string;
      message: string;
      authorId: string;
      authorName: string;
      createdAt: Date;
    }[]
  >;
}
