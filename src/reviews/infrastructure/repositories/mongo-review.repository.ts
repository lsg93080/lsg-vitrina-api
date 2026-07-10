import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  type IReviewRepository,
  type ReviewPage,
  type UpdateReviewPayload,
} from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import {
  ReviewSchemaClass,
  type ReviewDocument,
} from '../schemas/review.schema';
import { ReviewMapper } from '../mappers/review.mapper';

@Injectable()
export class MongoReviewRepository implements IReviewRepository {
  constructor(
    @InjectModel(ReviewSchemaClass.name)
    private readonly model: Model<ReviewDocument>,
  ) {}

  async create(review: Review): Promise<Review> {
    const doc = await this.model.create(ReviewMapper.toPersistence(review));
    return ReviewMapper.toDomain(doc);
  }

  async findAll(page: number, limit: number): Promise<ReviewPage> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments().exec(),
    ]);
    return { data: data.map((doc) => ReviewMapper.toDomain(doc)), total };
  }

  async findByAuthor(authorId: string): Promise<Review[]> {
    const docs = await this.model
      .find({ authorId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => ReviewMapper.toDomain(doc));
  }

  async findByAuthorAndRelease(
    authorId: string,
    releaseId: string,
  ): Promise<Review | null> {
    const doc = await this.model.findOne({ authorId, releaseId }).exec();
    return doc ? ReviewMapper.toDomain(doc) : null;
  }

  async findByRelease(
    repoId: string,
    releaseId: string,
    page: number,
    limit: number,
  ): Promise<ReviewPage> {
    const skip = (page - 1) * limit;
    const filter = { repoId, releaseId };
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { data: data.map((doc) => ReviewMapper.toDomain(doc)), total };
  }

  async findById(id: string): Promise<Review | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? ReviewMapper.toDomain(doc) : null;
  }

  async update(id: string, data: UpdateReviewPayload): Promise<Review | null> {
    if (!isValidObjectId(id)) return null;
    const fields: Record<string, unknown> = {};
    if (data.title !== undefined) fields.title = data.title;
    if (data.comment !== undefined) fields.comment = data.comment;
    if (data.rating !== undefined) fields.rating = data.rating;
    if (Object.keys(fields).length === 0) {
      const existing = await this.model.findById(id).exec();
      return existing ? ReviewMapper.toDomain(existing) : null;
    }
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: fields }, { returnDocument: 'after' })
      .exec();
    return doc ? ReviewMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async deleteByRepoId(repoId: string): Promise<void> {
    await this.model.deleteMany({ repoId }).exec();
  }
}
