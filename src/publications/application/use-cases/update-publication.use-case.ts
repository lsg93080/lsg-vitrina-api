import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Publication } from '../../domain/entities/publication.entity';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
  UpdateRatingPayload,
} from '../../domain/repositories/publication.repository.interface';

@Injectable()
export class UpdatePublicationUseCase {
  constructor(
    @Inject(PUBLICATION_REPOSITORY)
    private readonly repo: IPublicationRepository,
  ) {}

  async update(
    repoId: string,
    data: Partial<Publication>,
  ): Promise<Publication> {
    const result = await this.repo.update(repoId, data);
    if (!result)
      throw new NotFoundException(
        `Publication with repoId ${repoId} not found`,
      );
    return result;
  }

  async updateRating(
    repoId: string,
    payload: UpdateRatingPayload,
  ): Promise<void> {
    return this.repo.updateRating(repoId, payload);
  }

  async incrementDownloads(repoId: string): Promise<void> {
    return this.repo.incrementDownloads(repoId);
  }
}
