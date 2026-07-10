import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { ReviewerAssignment } from '../../domain/entities/reviewer-assignment.entity';
import { ReviewerVerdict } from '../../domain/value-objects/assignment-status.vo';
import {
  AssignmentFilter,
  IReviewerAssignmentRepository,
} from '../../domain/repositories/reviewer-assignment.repository.interface';
import {
  ReviewerAssignmentDocument,
  ReviewerAssignmentSchemaClass,
} from '../schemas/reviewer-assignment.schema';
import { ReviewerAssignmentMapper } from '../mappers/reviewer-assignment.mapper';

@Injectable()
export class MongoReviewerAssignmentRepository implements IReviewerAssignmentRepository {
  constructor(
    @InjectModel(ReviewerAssignmentSchemaClass.name)
    private readonly model: Model<ReviewerAssignmentDocument>,
  ) {}

  async create(assignment: ReviewerAssignment): Promise<ReviewerAssignment> {
    const doc = await this.model.create(
      ReviewerAssignmentMapper.toPersistence(assignment),
    );
    return ReviewerAssignmentMapper.toDomain(doc);
  }

  async findById(id: string): Promise<ReviewerAssignment | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? ReviewerAssignmentMapper.toDomain(doc) : null;
  }

  async findFiltered(
    filter: AssignmentFilter,
  ): Promise<{ data: ReviewerAssignment[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filter.reviewerId) query['reviewerId'] = filter.reviewerId;
    if (filter.publicationRepoId)
      query['publicationRepoId'] = filter.publicationRepoId;
    if (filter.status) query['status'] = filter.status;

    const skip = (filter.page - 1) * filter.limit;

    const [docs, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(filter.limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      data: docs.map((doc) => ReviewerAssignmentMapper.toDomain(doc)),
      total,
    };
  }

  async findByPublicationRepoId(repoId: string): Promise<ReviewerAssignment[]> {
    const docs = await this.model.find({ publicationRepoId: repoId }).exec();
    return docs.map((doc) => ReviewerAssignmentMapper.toDomain(doc));
  }

  async submitVerdict(
    id: string,
    verdict: ReviewerVerdict,
    reviewedAt: Date,
  ): Promise<ReviewerAssignment | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { $set: { verdict, status: 'done', reviewedAt } },
        { new: true },
      )
      .exec();
    return doc ? ReviewerAssignmentMapper.toDomain(doc) : null;
  }

  async deleteByRepoId(repoId: string): Promise<void> {
    await this.model.deleteMany({ publicationRepoId: repoId }).exec();
  }
}
