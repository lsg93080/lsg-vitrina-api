import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PublicationDetails } from '../../domain/entities/publication-details.entity';
import {
  type IPublicationDetailsRepository,
  PUBLICATION_DETAILS_REPOSITORY,
} from '../../domain/repositories/publication-details.repository.interface';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '@/publications/domain/repositories/publication.repository.interface';

export interface CreatePublicationDetailsInput {
  repoId: string;
  authorId: string;
  longDescription: string;
  repoUrl: string;
  license: string;
  defaultBranch: string;
  repoDoc: string;
  images: string[];
}

@Injectable()
export class CreatePublicationDetailsUseCase {
  constructor(
    @Inject(PUBLICATION_DETAILS_REPOSITORY)
    private readonly repo: IPublicationDetailsRepository,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly pubRepo: IPublicationRepository,
  ) {}

  async execute(
    input: CreatePublicationDetailsInput,
  ): Promise<PublicationDetails> {
    const existing = await this.repo.findByRepoId(input.repoId);
    if (existing)
      throw new ConflictException(
        `Publication details for repoId ${input.repoId} already exist`,
      );

    const now = new Date();
    const details = new PublicationDetails(
      undefined,
      input.repoId,
      input.authorId,
      input.longDescription,
      input.repoUrl,
      input.license,
      input.defaultBranch,
      input.repoDoc,
      input.images,
      [],
      now,
      now,
    );

    const created = await this.repo.create(details);

    if (created.id) {
      await this.pubRepo.updateRepoDetailsId(input.repoId, created.id);
    }

    return created;
  }
}
