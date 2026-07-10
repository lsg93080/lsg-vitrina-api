import { Release } from '../value-objects/release.vo';

export const RELEASE_REPOSITORY = 'RELEASE_REPOSITORY';

export interface ReleasePage {
  data: Release[];
  total: number;
}

export interface UpdateReleaseRatingPayload {
  ratingDelta: number;
  reviewsDelta: number;
}

export interface UpdateReleasePayload {
  version?: string;
  title?: string;
  shortDescription?: string;
  releaseNotes?: string;
  releaseDate?: Date;
  downloadUrl?: string;
}

export interface IReleasesRepository {
  findByRepoId(
    repoId: string,
    page: number,
    limit: number,
  ): Promise<ReleasePage>;
  findById(id: string): Promise<Release | null>;
  create(release: Release): Promise<Release>;
  update(id: string, payload: UpdateReleasePayload): Promise<Release | null>;
  updateRating(id: string, payload: UpdateReleaseRatingPayload): Promise<void>;
  deleteById(id: string): Promise<boolean>;
  deleteByRepoId(repoId: string): Promise<void>;
}
