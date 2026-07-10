import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicationsModule } from '@/publications/publications.module';
import {
  PublicationDetailsSchemaClass,
  PublicationDetailsSchema,
} from './infrastructure/schemas/publication-details.schema';
import {
  ReleaseSchemaClass,
  ReleaseSchema,
} from './infrastructure/schemas/release.schema';
import { MongoPublicationDetailsRepository } from './infrastructure/repositories/mongo-publication-details.repository';
import { MongoReleasesRepository } from './infrastructure/repositories/mongo-releases.repository';
import { PUBLICATION_DETAILS_REPOSITORY } from './domain/repositories/publication-details.repository.interface';
import { RELEASE_REPOSITORY } from './domain/repositories/release.repository.interface';
import { GetPublicationDetailsUseCase } from './application/use-cases/get-publication-details.use-case';
import { CreatePublicationDetailsUseCase } from './application/use-cases/create-publication-details.use-case';
import { UpdatePublicationDetailsUseCase } from './application/use-cases/update-publication-details.use-case';
import { DeletePublicationDetailsUseCase } from './application/use-cases/delete-publication-details.use-case';
import { ReleasesUseCase } from './application/use-cases/releases.use-case';
import { PublicationDetailsController } from './presentation/controllers/publication-details.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PublicationDetailsSchemaClass.name,
        schema: PublicationDetailsSchema,
      },
      { name: ReleaseSchemaClass.name, schema: ReleaseSchema },
    ]),
    forwardRef(() => PublicationsModule),
  ],
  providers: [
    {
      provide: PUBLICATION_DETAILS_REPOSITORY,
      useClass: MongoPublicationDetailsRepository,
    },
    { provide: RELEASE_REPOSITORY, useClass: MongoReleasesRepository },
    GetPublicationDetailsUseCase,
    CreatePublicationDetailsUseCase,
    UpdatePublicationDetailsUseCase,
    DeletePublicationDetailsUseCase,
    ReleasesUseCase,
  ],
  controllers: [PublicationDetailsController],
  exports: [
    PUBLICATION_DETAILS_REPOSITORY,
    RELEASE_REPOSITORY,
    ReleasesUseCase,
  ],
})
export class PublicationDetailsModule {}
