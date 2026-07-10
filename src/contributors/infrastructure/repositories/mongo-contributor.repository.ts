import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Contributor,
  ContrInfo,
} from '../../domain/entities/contributor.entity';
import {
  IContributorRepository,
  TopContributorsFilter,
  UpdateStatsPayload,
} from '../../domain/repositories/contributor.repository.interface';
import { ContributorMapper } from '../mappers/contributor.mapper';
import {
  ContributorSchemaClass,
  ContributorDocument,
} from '../schemas/contributor.schema';

@Injectable()
export class MongoContributorRepository implements IContributorRepository {
  constructor(
    @InjectModel(ContributorSchemaClass.name)
    private readonly model: Model<ContributorDocument>,
  ) {}

  async findAll(): Promise<Contributor[]> {
    const docs = await this.model.find().exec();
    return docs.map((doc) => ContributorMapper.toDomain(doc));
  }

  async findAllActive(): Promise<Contributor[]> {
    const docs = await this.model
      .find({ 'contrInfo.postsQty': { $gt: 0 } })
      .exec();
    return docs.map((doc) => ContributorMapper.toDomain(doc));
  }

  async findById(id: string): Promise<Contributor | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? ContributorMapper.toDomain(doc) : null;
  }

  async findByUserId(userId: string): Promise<Contributor | null> {
    const doc = await this.model.findOne({ userId }).exec();
    return doc ? ContributorMapper.toDomain(doc) : null;
  }

  async findByUserIds(userIds: string[]): Promise<Contributor[]> {
    if (userIds.length === 0) return [];
    const docs = await this.model.find({ userId: { $in: userIds } }).exec();
    return docs.map((doc) => ContributorMapper.toDomain(doc));
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.model.countDocuments({ userId }).exec();
    return count > 0;
  }

  async findTops(filter: TopContributorsFilter): Promise<Contributor[]> {
    const sortField = `contrInfo.${filter.orderBy}`;
    const sortDir = filter.orderMode === 'asc' ? 1 : -1;

    const docs = await this.model
      .find({ 'contrInfo.postsQty': { $gt: 0 } })
      .sort({ [sortField]: sortDir })
      .limit(filter.limit)
      .exec();

    return docs.map((doc) => ContributorMapper.toDomain(doc));
  }

  // Bayesian-style top rated: only ranks contributors with totalComments >= threshold.
  async findTopRated(threshold: number): Promise<Contributor[]> {
    const docs = await this.model.aggregate<ContributorDocument>([
      { $match: { 'contrInfo.postsQty': { $gt: 0 } } },
      {
        $addFields: {
          sortField: {
            $cond: [
              { $gte: ['$contrInfo.totalComments', threshold] },
              {
                $divide: ['$contrInfo.totalRating', '$contrInfo.totalComments'],
              },
              0,
            ],
          },
        },
      },
      { $sort: { sortField: -1 } },
    ]);

    return docs.map((doc) => ContributorMapper.toDomain(doc));
  }

  async searchByUsername(search: string): Promise<Contributor[]> {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearch, 'i');
    const docs = await this.model
      .find({ 'contrInfo.username': regex, 'contrInfo.postsQty': { $gt: 0 } })
      .exec();
    return docs.map((doc) => ContributorMapper.toDomain(doc));
  }

  async findReviewerPool(excludeUserId: string): Promise<Contributor[]> {
    const docs = await this.model
      .find({ isReviewer: true, userId: { $ne: excludeUserId } })
      .exec();
    return docs.map((doc) => ContributorMapper.toDomain(doc));
  }

  async create(contributor: Contributor): Promise<Contributor> {
    const doc = await this.model.create(
      ContributorMapper.toPersistence(contributor),
    );
    return ContributorMapper.toDomain(doc);
  }

  async update(
    userId: string,
    data: Partial<Contributor>,
  ): Promise<Contributor | null> {
    const doc = await this.model
      .findOneAndUpdate({ userId }, { $set: data }, { returnDocument: 'after' })
      .exec();
    return doc ? ContributorMapper.toDomain(doc) : null;
  }

  async updateStats(
    userId: string,
    payload: UpdateStatsPayload,
  ): Promise<Contributor | null> {
    const doc = await this.model
      .findOneAndUpdate(
        { userId },
        {
          $inc: {
            'contrInfo.totalComments': payload.commentsDelta,
            'contrInfo.totalRating': payload.ratingDelta,
            'contrInfo.downloads': payload.downloadsDelta,
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
    return doc ? ContributorMapper.toDomain(doc) : null;
  }

  async updateContrInfo(
    userId: string,
    contrInfo: Partial<ContrInfo>,
  ): Promise<Contributor | null> {
    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(contrInfo)) {
      update[`contrInfo.${key}`] = value;
    }

    const doc = await this.model
      .findOneAndUpdate(
        { userId },
        { $set: update },
        { returnDocument: 'after' },
      )
      .exec();

    return doc ? ContributorMapper.toDomain(doc) : null;
  }
}
