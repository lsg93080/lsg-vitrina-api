import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PublicationDetails } from '../../domain/entities/publication-details.entity';
import {
  type IPublicationDetailsRepository,
  PUBLICATION_DETAILS_REPOSITORY,
} from '../../domain/repositories/publication-details.repository.interface';
import {
  type IReleasesRepository,
  RELEASE_REPOSITORY,
  type UpdateReleaseRatingPayload,
} from '../../domain/repositories/release.repository.interface';

export interface UpdatePublicationDetailsInput {
  longDescription?: string;
  repoUrl?: string;
  license?: string;
  defaultBranch?: string;
  repoDoc?: string;
  images?: string[];
}

@Injectable()
export class UpdatePublicationDetailsUseCase {
  constructor(
    @Inject(PUBLICATION_DETAILS_REPOSITORY)
    private readonly repo: IPublicationDetailsRepository,
    @Inject(RELEASE_REPOSITORY)
    private readonly releasesRepo: IReleasesRepository,
  ) {}

  async update(
    repoId: string,
    input: UpdatePublicationDetailsInput,
  ): Promise<PublicationDetails> {
    const updated = await this.repo.update(repoId, input);
    if (!updated)
      throw new NotFoundException(
        `Publication details for repoId ${repoId} not found`,
      );
    return updated;
  }

  async updateReleaseRating(
    releaseId: string,
    payload: UpdateReleaseRatingPayload,
  ): Promise<void> {
    await this.releasesRepo.updateRating(releaseId, payload);
  }
}
