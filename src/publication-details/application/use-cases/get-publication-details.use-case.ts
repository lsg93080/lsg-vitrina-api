import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PublicationDetails } from '../../domain/entities/publication-details.entity';
import {
  type IPublicationDetailsRepository,
  PUBLICATION_DETAILS_REPOSITORY,
} from '../../domain/repositories/publication-details.repository.interface';

@Injectable()
export class GetPublicationDetailsUseCase {
  constructor(
    @Inject(PUBLICATION_DETAILS_REPOSITORY)
    private readonly repo: IPublicationDetailsRepository,
  ) {}

  async getAll(): Promise<PublicationDetails[]> {
    return this.repo.findAll();
  }

  async getByRepoId(repoId: string): Promise<PublicationDetails> {
    const details = await this.repo.findByRepoId(repoId);
    if (!details)
      throw new NotFoundException(
        `Publication details for repoId ${repoId} not found`,
      );
    return details;
  }
}
