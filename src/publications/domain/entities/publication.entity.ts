import { Platform } from '@/contributors/domain/value-objects/platform.enum';
import {
  EsrbRating,
  PubType,
  PublicationStatus,
  VcsProvider,
} from '../value-objects/publication.vo';

export class Publication {
  constructor(
    readonly id: string | undefined,
    readonly repoId: string,
    readonly authorId: string,
    readonly title: string,
    readonly shortDescription: string,
    readonly type: PubType,
    readonly esrbRating: EsrbRating,
    readonly platforms: Platform[],
    readonly tags: string[],
    readonly releaseYear: number,
    readonly status: PublicationStatus,
    readonly totalRating: number,
    readonly totalReviews: number,
    readonly downloads: number,
    readonly thumbnailUrl: string | undefined,
    readonly repoDetailsId: string | null,
    readonly vcsProvider: VcsProvider | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  get averageRating(): number {
    if (this.totalReviews === 0) return 0;
    return this.totalRating / this.totalReviews;
  }
}
