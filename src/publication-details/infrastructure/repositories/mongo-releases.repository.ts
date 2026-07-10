import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Release } from '../../domain/value-objects/release.vo';
import {
  IReleasesRepository,
  ReleasePage,
  UpdateReleasePayload,
  UpdateReleaseRatingPayload,
} from '../../domain/repositories/release.repository.interface';
import { ReleaseMapper } from '../mappers/release.mapper';
import { ReleaseDocument, ReleaseSchemaClass } from '../schemas/release.schema';

@Injectable()
export class MongoReleasesRepository implements IReleasesRepository {
  constructor(
    @InjectModel(ReleaseSchemaClass.name)
    private readonly model: Model<ReleaseDocument>,
  ) {}

  async findByRepoId(
    repoId: string,
    page: number,
    limit: number,
  ): Promise<ReleasePage> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find({ repoId })
        .sort({ releaseDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments({ repoId }).exec(),
    ]);
    return { data: docs.map((doc) => ReleaseMapper.toDomain(doc)), total };
  }

  async findById(id: string): Promise<Release | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? ReleaseMapper.toDomain(doc) : null;
  }

  async create(release: Release): Promise<Release> {
    const doc = await this.model.create(ReleaseMapper.toPersistence(release));
    return ReleaseMapper.toDomain(doc);
  }

  async update(
    id: string,
    payload: UpdateReleasePayload,
  ): Promise<Release | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: payload }, { new: true })
      .exec();
    return doc ? ReleaseMapper.toDomain(doc) : null;
  }

  async updateRating(
    id: string,
    payload: UpdateReleaseRatingPayload,
  ): Promise<void> {
    if (!isValidObjectId(id)) return;
    await this.model
      .findByIdAndUpdate(id, {
        $inc: {
          totalRating: payload.ratingDelta,
          totalReviews: payload.reviewsDelta,
        },
      })
      .exec();
  }

  async deleteById(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteByRepoId(repoId: string): Promise<void> {
    await this.model.deleteMany({ repoId }).exec();
  }
}
