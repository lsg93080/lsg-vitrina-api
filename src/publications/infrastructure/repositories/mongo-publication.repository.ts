import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Publication } from '../../domain/entities/publication.entity';
import {
  IPublicationRepository,
  PublicationFilter,
  PublicationFilterResult,
  TopPublicationsFilter,
  UpdateRatingPayload,
} from '../../domain/repositories/publication.repository.interface';
import { PubType } from '../../domain/value-objects/publication.vo';
import { PublicationMapper } from '../mappers/publication.mapper';
import {
  PublicationDocument,
  PublicationSchemaClass,
} from '../schemas/publication.schema';

@Injectable()
export class MongoPublicationRepository implements IPublicationRepository {
  constructor(
    @InjectModel(PublicationSchemaClass.name)
    private readonly model: Model<PublicationDocument>,
  ) {}

  async create(publication: Publication): Promise<Publication> {
    const doc = await this.model.create(
      PublicationMapper.toPersistence(publication),
    );
    return PublicationMapper.toDomain(doc);
  }

  async findById(id: string): Promise<Publication | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? PublicationMapper.toDomain(doc) : null;
  }

  async findByRepoId(repoId: string): Promise<Publication | null> {
    const doc = await this.model.findOne({ repoId }).exec();
    return doc ? PublicationMapper.toDomain(doc) : null;
  }

  async findByAuthor(authorId: string): Promise<Publication[]> {
    const docs = await this.model.find({ authorId }).exec();
    return docs.map((doc) => PublicationMapper.toDomain(doc));
  }

  async filter(params: PublicationFilter): Promise<PublicationFilterResult> {
    const match: Record<string, unknown> = { status: 'active' };

    if (params.search) {
      const escapedSearch = params.search.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      const regex = new RegExp(escapedSearch, 'i');
      match['$or'] = [{ title: regex }, { shortDescription: regex }];
    }
    if (params.types?.length) match['type'] = { $in: params.types };
    if (params.esrbRatings?.length)
      match['esrbRating'] = { $in: params.esrbRatings };
    if (params.platforms?.length)
      match['platforms'] = { $in: params.platforms };
    if (params.tags?.length) match['tags'] = { $all: params.tags };

    if (params.yearFrom || params.yearTo) {
      const yearRange: Record<string, number> = {};
      if (params.yearFrom) yearRange['$gte'] = params.yearFrom;
      if (params.yearTo) yearRange['$lte'] = params.yearTo;
      match['releaseYear'] = yearRange;
    }

    const skip = (params.page - 1) * params.limit;

    type FacetResult = {
      data: PublicationDocument[];
      total: { count: number }[];
    };
    const results = await this.model.aggregate<FacetResult>([
      { $match: match },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: params.limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);
    const result = results[0];

    const data = (result?.data ?? []).map((doc) =>
      PublicationMapper.toDomain(doc as unknown as PublicationDocument),
    );
    const total = result?.total[0]?.count ?? 0;

    return { data, total };
  }

  async findTops(filter: TopPublicationsFilter): Promise<Publication[]> {
    const sortDir = filter.orderMode === 'asc' ? 1 : -1;
    const match: Record<string, unknown> = { status: 'active' };
    if (filter.type) match['type'] = filter.type;
    const docs = await this.model
      .find(match)
      .sort({ [filter.orderBy]: sortDir })
      .limit(filter.limit)
      .exec();
    return docs.map((doc) => PublicationMapper.toDomain(doc));
  }

  async findTopRated(
    threshold: number,
    type?: PubType,
  ): Promise<Publication[]> {
    const match: Record<string, unknown> = { status: 'active' };
    if (type) match['type'] = type;
    const docs = await this.model.aggregate<PublicationDocument>([
      { $match: match },
      {
        $addFields: {
          sortField: {
            $cond: [
              { $gte: ['$totalReviews', threshold] },
              { $divide: ['$totalRating', '$totalReviews'] },
              0,
            ],
          },
        },
      },
      { $sort: { sortField: -1 } },
    ]);
    return docs.map((doc) => PublicationMapper.toDomain(doc));
  }

  async update(
    repoId: string,
    data: Partial<Publication>,
  ): Promise<Publication | null> {
    const doc = await this.model
      .findOneAndUpdate({ repoId }, { $set: data }, { returnDocument: 'after' })
      .exec();
    return doc ? PublicationMapper.toDomain(doc) : null;
  }

  async updateRating(
    repoId: string,
    payload: UpdateRatingPayload,
  ): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { repoId },
        {
          $inc: {
            totalRating: payload.ratingDelta,
            totalReviews: payload.reviewsDelta,
          },
        },
      )
      .exec();
  }

  async incrementDownloads(repoId: string): Promise<void> {
    await this.model
      .findOneAndUpdate({ repoId }, { $inc: { downloads: 1 } })
      .exec();
  }

  async updateRepoDetailsId(repoId: string, detailsId: string): Promise<void> {
    await this.model
      .findOneAndUpdate({ repoId }, { $set: { repoDetailsId: detailsId } })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async pushReportsHistoryEntry(
    repoId: string,
    entry: {
      action: string;
      message: string;
      authorId: string;
      authorName: string;
    },
  ): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { repoId },
        {
          $push: {
            reportsHistory: { ...entry, createdAt: new Date() },
          },
        },
      )
      .exec();
  }

  async getReportsHistory(repoId: string): Promise<
    {
      id: string;
      action: string;
      message: string;
      authorId: string;
      authorName: string;
      createdAt: Date;
    }[]
  > {
    const doc = await this.model
      .findOne({ repoId })
      .select('reportsHistory')
      .exec();
    if (!doc) return [];
    return (doc.reportsHistory ?? []).map((e) => ({
      id: e._id?.toString() ?? '',
      action: e.action,
      message: e.message,
      authorId: e.authorId,
      authorName: e.authorName,
      createdAt: e.createdAt,
    }));
  }
}
