import { PublicationDetails } from '../entities/publication-details.entity';

export const PUBLICATION_DETAILS_REPOSITORY = 'PUBLICATION_DETAILS_REPOSITORY';

export interface IPublicationDetailsRepository {
  findAll(): Promise<PublicationDetails[]>;
  findByRepoId(repoId: string): Promise<PublicationDetails | null>;
  create(details: PublicationDetails): Promise<PublicationDetails>;
  update(
    repoId: string,
    data: Partial<PublicationDetails>,
  ): Promise<PublicationDetails | null>;
  delete(id: string): Promise<boolean>;
}
