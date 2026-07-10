export enum ReleaseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
}

export class Release {
  constructor(
    readonly id: string | undefined,
    readonly repoId: string,
    readonly version: string,
    readonly title: string,
    readonly shortDescription: string,
    readonly releaseNotes: string,
    readonly releaseDate: Date,
    readonly downloadUrl: string | undefined,
    readonly status: ReleaseStatus,
    readonly totalRating: number,
    readonly totalReviews: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  get averageRating(): number {
    if (this.totalReviews === 0) return 0;
    return this.totalRating / this.totalReviews;
  }
}
