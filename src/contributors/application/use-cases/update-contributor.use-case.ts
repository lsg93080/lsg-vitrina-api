import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  Contributor,
  ContrInfo,
} from '../../domain/entities/contributor.entity';
import {
  type IContributorRepository,
  CONTRIBUTOR_REPOSITORY,
  UpdateStatsPayload,
} from '../../domain/repositories/contributor.repository.interface';

@Injectable()
export class UpdateContributorUseCase {
  constructor(
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly repo: IContributorRepository,
  ) {}

  async update(
    userId: string,
    data: Partial<Contributor>,
  ): Promise<Contributor> {
    const result = await this.repo.update(userId, data);
    if (!result)
      throw new NotFoundException(
        `Contributor with userId ${userId} not found`,
      );
    return result;
  }

  async updateStats(
    userId: string,
    payload: UpdateStatsPayload,
  ): Promise<Contributor> {
    const result = await this.repo.updateStats(userId, payload);
    if (!result)
      throw new NotFoundException(
        `Contributor with userId ${userId} not found`,
      );
    return result;
  }

  async updateContrInfo(
    userId: string,
    contrInfo: Partial<ContrInfo>,
  ): Promise<Contributor> {
    const result = await this.repo.updateContrInfo(userId, contrInfo);
    if (!result)
      throw new NotFoundException(
        `Contributor with userId ${userId} not found`,
      );
    return result;
  }
}
