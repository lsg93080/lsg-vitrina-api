import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Publication } from '../../domain/entities/publication.entity';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
  type TopPublicationsFilter,
} from '../../domain/repositories/publication.repository.interface';
import { PubType } from '../../domain/value-objects/publication.vo';

@Injectable()
export class GetPublicationUseCase {
  constructor(
    @Inject(PUBLICATION_REPOSITORY)
    private readonly repo: IPublicationRepository,
  ) {}

  async getById(id: string): Promise<Publication> {
    const publication = await this.repo.findById(id);
    if (!publication)
      throw new NotFoundException(`Publication ${id} not found`);
    return publication;
  }

  async getByRepoId(repoId: string): Promise<Publication> {
    const publication = await this.repo.findByRepoId(repoId);
    if (!publication)
      throw new NotFoundException(
        `Publication with repoId ${repoId} not found`,
      );
    return publication;
  }

  async getByAuthor(authorId: string): Promise<Publication[]> {
    return this.repo.findByAuthor(authorId);
  }

  async getTops(filter: TopPublicationsFilter): Promise<Publication[]> {
    return this.repo.findTops(filter);
  }

  async getTopRated(threshold: number, type?: PubType): Promise<Publication[]> {
    return this.repo.findTopRated(threshold, type);
  }
}
