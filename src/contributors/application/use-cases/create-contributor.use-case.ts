import { Inject, Injectable } from '@nestjs/common';
import { Contributor } from '../../domain/entities/contributor.entity';
import {
  type IContributorRepository,
  CONTRIBUTOR_REPOSITORY,
} from '../../domain/repositories/contributor.repository.interface';

export interface CreateContributorInput {
  userId: string;
  email: string;
  username?: string;
  imgUrl?: string;
}

@Injectable()
export class CreateContributorUseCase {
  constructor(
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly repo: IContributorRepository,
  ) {}

  async execute(input: CreateContributorInput): Promise<Contributor> {
    const existing = await this.repo.findByUserId(input.userId);
    if (existing) return existing;

    const now = new Date();
    const contributor = new Contributor(
      undefined,
      input.userId,
      input.email,
      false,
      [],
      {
        username: input.username ?? '',
        imgUrl: input.imgUrl ?? '',
        bio: '',
        postsQty: 0,
        videogamesQty: 0,
        extensionsQty: 0,
        lastPost: null,
        totalComments: 0,
        totalRating: 0,
        downloads: 0,
        socials: {},
      },
      now,
      now,
    );

    return this.repo.create(contributor);
  }
}
