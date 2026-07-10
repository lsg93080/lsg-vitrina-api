import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthServiceClientModule } from '@/auth-service-client/auth-service-client.module';
import { ContributorsModule } from '@/contributors/contributors.module';
import { PublicationDetailsModule } from '@/publication-details/publication-details.module';
import { ReviewsModule } from '@/reviews/reviews.module';
import { ReportsModule } from '@/reports/reports.module';
import { ModerationModule } from '../moderation/moderation.module';
import {
  PublicationSchemaClass,
  PublicationSchema,
} from './infrastructure/schemas/publication.schema';
import { MongoPublicationRepository } from './infrastructure/repositories/mongo-publication.repository';
import { PUBLICATION_REPOSITORY } from './domain/repositories/publication.repository.interface';
import { CreatePublicationUseCase } from './application/use-cases/create-publication.use-case';
import { FilterPublicationsUseCase } from './application/use-cases/filter-publications.use-case';
import { GetPublicationUseCase } from './application/use-cases/get-publication.use-case';
import { UpdatePublicationUseCase } from './application/use-cases/update-publication.use-case';
import { DeletePublicationUseCase } from './application/use-cases/delete-publication.use-case';
import { VerifyRepoOwnershipUseCase } from './application/use-cases/verify-repo-ownership.use-case';
import { GetFullPublicationUseCase } from './application/use-cases/get-full-publication.use-case';
import { PublicationsController } from './presentation/controllers/publications.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicationSchemaClass.name, schema: PublicationSchema },
    ]),
    AuthServiceClientModule,
    ContributorsModule,
    forwardRef(() => PublicationDetailsModule),
    forwardRef(() => ReviewsModule),
    forwardRef(() => ReportsModule),
    forwardRef(() => ModerationModule),
  ],
  controllers: [PublicationsController],
  providers: [
    { provide: PUBLICATION_REPOSITORY, useClass: MongoPublicationRepository },
    CreatePublicationUseCase,
    FilterPublicationsUseCase,
    GetPublicationUseCase,
    UpdatePublicationUseCase,
    DeletePublicationUseCase,
    VerifyRepoOwnershipUseCase,
    GetFullPublicationUseCase,
  ],
  exports: [
    PUBLICATION_REPOSITORY,
    GetPublicationUseCase,
    UpdatePublicationUseCase,
    DeletePublicationUseCase,
  ],
})
export class PublicationsModule {}
