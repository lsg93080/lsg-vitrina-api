import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ContributorSchemaClass,
  ContributorSchema,
} from './infrastructure/schemas/contributor.schema';
import { MongoContributorRepository } from './infrastructure/repositories/mongo-contributor.repository';
import { CONTRIBUTOR_REPOSITORY } from './domain/repositories/contributor.repository.interface';
import { CreateContributorUseCase } from './application/use-cases/create-contributor.use-case';
import { GetContributorUseCase } from './application/use-cases/get-contributor.use-case';
import { UpdateContributorUseCase } from './application/use-cases/update-contributor.use-case';
import { ContributorsController } from './presentation/controllers/contributors.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContributorSchemaClass.name, schema: ContributorSchema },
    ]),
  ],
  controllers: [ContributorsController],
  providers: [
    { provide: CONTRIBUTOR_REPOSITORY, useClass: MongoContributorRepository },
    CreateContributorUseCase,
    GetContributorUseCase,
    UpdateContributorUseCase,
  ],
  exports: [
    CONTRIBUTOR_REPOSITORY,
    GetContributorUseCase,
    UpdateContributorUseCase,
  ],
})
export class ContributorsModule {}
