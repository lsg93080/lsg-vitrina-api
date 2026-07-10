import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Release, ReleaseStatus } from '../../domain/value-objects/release.vo';
import {
  type IReleasesRepository,
  type ReleasePage,
  type UpdateReleasePayload,
  RELEASE_REPOSITORY,
} from '../../domain/repositories/release.repository.interface';

export interface CreateReleaseInput {
  repoId: string;
  version: string;
  title: string;
  shortDescription: string;
  releaseNotes: string;
  releaseDate: Date;
  downloadUrl?: string;
}

@Injectable()
export class ReleasesUseCase {
  constructor(
    @Inject(RELEASE_REPOSITORY)
    private readonly repo: IReleasesRepository,
  ) {}

  async getByRepoId(
    repoId: string,
    page: number,
    limit: number,
  ): Promise<ReleasePage> {
    return this.repo.findByRepoId(repoId, page, limit);
  }

  async getById(id: string): Promise<Release> {
    const release = await this.repo.findById(id);
    if (!release) throw new NotFoundException(`Release ${id} not found`);
    return release;
  }

  async update(id: string, data: UpdateReleasePayload): Promise<Release> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Release ${id} not found`);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new NotFoundException(`Release ${id} not found`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const release = await this.repo.findById(id);
    if (!release) throw new NotFoundException(`Release ${id} not found`);
    await this.repo.deleteById(id);
  }

  async create(input: CreateReleaseInput): Promise<Release> {
    const now = new Date();
    const release = new Release(
      undefined,
      input.repoId,
      input.version,
      input.title,
      input.shortDescription,
      input.releaseNotes,
      input.releaseDate,
      input.downloadUrl,
      ReleaseStatus.PENDING,
      0,
      0,
      now,
      now,
    );
    return this.repo.create(release);
  }
}
