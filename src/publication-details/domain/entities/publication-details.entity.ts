export class PublicationDetails {
  constructor(
    readonly id: string | undefined,
    readonly repoId: string,
    readonly authorId: string,
    readonly longDescription: string,
    readonly repoUrl: string,
    readonly license: string,
    readonly defaultBranch: string,
    readonly repoDoc: string,
    readonly images: string[],
    readonly reviewers: string[],
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
