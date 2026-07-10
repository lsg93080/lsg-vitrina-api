import { Inject, Injectable } from '@nestjs/common';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
  PublicationFilter,
  PublicationFilterResult,
} from '../../domain/repositories/publication.repository.interface';

@Injectable()
export class FilterPublicationsUseCase {
  constructor(
    @Inject(PUBLICATION_REPOSITORY)
    private readonly repo: IPublicationRepository,
  ) {}

  async execute(params: PublicationFilter): Promise<PublicationFilterResult> {
    return this.repo.filter(params);
  }
}
