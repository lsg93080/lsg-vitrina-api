import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type IPublicationDetailsRepository,
  PUBLICATION_DETAILS_REPOSITORY,
} from '../../domain/repositories/publication-details.repository.interface';
import {
  type IReleasesRepository,
  RELEASE_REPOSITORY,
} from '../../domain/repositories/release.repository.interface';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '@/publications/domain/repositories/publication.repository.interface';

@Injectable()
export class DeletePublicationDetailsUseCase {
  constructor(
    @Inject(PUBLICATION_DETAILS_REPOSITORY)
    private readonly repo: IPublicationDetailsRepository,
    @Inject(RELEASE_REPOSITORY)
    private readonly releasesRepo: IReleasesRepository,
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: IPublicationRepository,
  ) {}

  async execute(id: string, repoId: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted)
      throw new NotFoundException(
        `Publication details with id ${id} not found`,
      );
    void this.releasesRepo.deleteByRepoId(repoId);
    void this.publicationRepo.update(repoId, { repoDetailsId: null });
  }
}
