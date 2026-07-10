import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { PublicationDetails } from '../../domain/entities/publication-details.entity';
import { IPublicationDetailsRepository } from '../../domain/repositories/publication-details.repository.interface';
import { PublicationDetailsMapper } from '../mappers/publication-details.mapper';
import {
  PublicationDetailsDocument,
  PublicationDetailsSchemaClass,
} from '../schemas/publication-details.schema';

@Injectable()
export class MongoPublicationDetailsRepository implements IPublicationDetailsRepository {
  constructor(
    @InjectModel(PublicationDetailsSchemaClass.name)
    private readonly model: Model<PublicationDetailsDocument>,
  ) {}

  async findAll(): Promise<PublicationDetails[]> {
    const docs = await this.model.find().exec();
    return docs.map((doc) => PublicationDetailsMapper.toDomain(doc));
  }

  async findByRepoId(repoId: string): Promise<PublicationDetails | null> {
    const doc = await this.model.findOne({ repoId }).exec();
    return doc ? PublicationDetailsMapper.toDomain(doc) : null;
  }

  async create(details: PublicationDetails): Promise<PublicationDetails> {
    const doc = await this.model.create(
      PublicationDetailsMapper.toPersistence(details),
    );
    return PublicationDetailsMapper.toDomain(doc);
  }

  async update(
    repoId: string,
    data: Partial<PublicationDetails>,
  ): Promise<PublicationDetails | null> {
    const doc = await this.model
      .findOneAndUpdate({ repoId }, { $set: data }, { returnDocument: 'after' })
      .exec();
    return doc ? PublicationDetailsMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
