import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContributorsModule } from '@/contributors/contributors.module';
import { PublicationsModule } from '@/publications/publications.module';
import { PublicationDetailsModule } from '@/publication-details/publication-details.module';
import {
  ReviewSchemaClass,
  ReviewSchema,
} from './infrastructure/schemas/review.schema';
import { MongoReviewRepository } from './infrastructure/repositories/mongo-review.repository';
import { REVIEW_REPOSITORY } from './domain/repositories/review.repository.interface';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { GetReviewUseCase } from './application/use-cases/get-review.use-case';
import { UpdateReviewUseCase } from './application/use-cases/update-review.use-case';
import { DeleteReviewUseCase } from './application/use-cases/delete-review.use-case';
import { ReviewsController } from './presentation/controllers/reviews.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReviewSchemaClass.name, schema: ReviewSchema },
    ]),
    ContributorsModule,
    forwardRef(() => PublicationsModule),
    PublicationDetailsModule,
  ],
  controllers: [ReviewsController],
  providers: [
    { provide: REVIEW_REPOSITORY, useClass: MongoReviewRepository },
    CreateReviewUseCase,
    GetReviewUseCase,
    UpdateReviewUseCase,
    DeleteReviewUseCase,
  ],
  exports: [REVIEW_REPOSITORY, GetReviewUseCase],
})
export class ReviewsModule {}
