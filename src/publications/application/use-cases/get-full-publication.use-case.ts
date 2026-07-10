import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Publication } from '../../domain/entities/publication.entity';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '../../domain/repositories/publication.repository.interface';
import { PublicationDetails } from '@/publication-details/domain/entities/publication-details.entity';
import {
  type IPublicationDetailsRepository,
  PUBLICATION_DETAILS_REPOSITORY,
} from '@/publication-details/domain/repositories/publication-details.repository.interface';

export interface FullPublicationResult {
  publication: Publication;
  details: PublicationDetails | null;
}

@Injectable()
export class GetFullPublicationUseCase {
  constructor(
    @Inject(PUBLICATION_REPOSITORY)
    private readonly pubRepo: IPublicationRepository,
    @Inject(PUBLICATION_DETAILS_REPOSITORY)
    private readonly detailsRepo: IPublicationDetailsRepository,
  ) {}

  async execute(repoId: string): Promise<FullPublicationResult> {
    const publication = await this.pubRepo.findByRepoId(repoId);
    if (!publication) {
      throw new NotFoundException(
        `Publication with repoId ${repoId} not found`,
      );
    }

    const details = await this.detailsRepo.findByRepoId(repoId);
    return { publication, details };
  }
}
