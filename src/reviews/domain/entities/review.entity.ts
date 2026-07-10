export class Review {
  constructor(
    readonly id: string | undefined,
    readonly repoId: string,
    readonly releaseId: string,
    readonly authorId: string,
    readonly rating: number,
    readonly title: string,
    readonly comment: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
