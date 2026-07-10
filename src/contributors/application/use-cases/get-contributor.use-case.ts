import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Contributor } from '../../domain/entities/contributor.entity';
import {
  type IContributorRepository,
  CONTRIBUTOR_REPOSITORY,
  TopContributorsFilter,
} from '../../domain/repositories/contributor.repository.interface';

@Injectable()
export class GetContributorUseCase {
  constructor(
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly repo: IContributorRepository,
  ) {}

  async getAll(): Promise<Contributor[]> {
    return this.repo.findAll();
  }

  async getAllActive(): Promise<Contributor[]> {
    return this.repo.findAllActive();
  }

  async getById(id: string): Promise<Contributor> {
    const contributor = await this.repo.findById(id);
    if (!contributor)
      throw new NotFoundException(`Contributor ${id} not found`);
    return contributor;
  }

  async getByUserId(userId: string): Promise<Contributor> {
    const contributor = await this.repo.findByUserId(userId);
    if (!contributor)
      throw new NotFoundException(
        `Contributor with userId ${userId} not found`,
      );
    return contributor;
  }

  async checkExists(userId: string): Promise<{ exists: boolean }> {
    const exists = await this.repo.existsByUserId(userId);
    return { exists };
  }

  async getTops(filter: TopContributorsFilter): Promise<Contributor[]> {
    return this.repo.findTops(filter);
  }

  // Bayesian top-rated: contributors with fewer reviews than the threshold get score 0.
  async getTopRated(threshold: number): Promise<Contributor[]> {
    return this.repo.findTopRated(threshold);
  }

  async search(query: string): Promise<Contributor[]> {
    return this.repo.searchByUsername(query);
  }
}
