import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReviewerAssignmentSchemaClass,
  ReviewerAssignmentSchema,
} from './infrastructure/schemas/reviewer-assignment.schema';
import { REVIEWER_ASSIGNMENT_REPOSITORY } from './domain/repositories/reviewer-assignment.repository.interface';
import { MongoReviewerAssignmentRepository } from './infrastructure/repositories/mongo-reviewer-assignment.repository';
import { DrawReviewersUseCase } from './application/use-cases/draw-reviewers.use-case';
import { SubmitVerdictUseCase } from './application/use-cases/submit-verdict.use-case';
import { EvaluateModerationUseCase } from './application/use-cases/evaluate-moderation.use-case';
import { GetAssignmentsUseCase } from './application/use-cases/get-assignments.use-case';
import { ModerationController } from './presentation/controllers/moderation.controller';
import { PublicationsModule } from '../publications/publications.module';
import { ContributorsModule } from '../contributors/contributors.module';
import { PublicationDetailsModule } from '../publication-details/publication-details.module';
import { ReportsModule } from '../reports/reports.module';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ReviewerAssignmentSchemaClass.name,
        schema: ReviewerAssignmentSchema,
      },
    ]),
    forwardRef(() => PublicationsModule),
    ContributorsModule,
    PublicationDetailsModule,
    ReportsModule,
    MailModule,
  ],
  providers: [
    {
      provide: REVIEWER_ASSIGNMENT_REPOSITORY,
      useClass: MongoReviewerAssignmentRepository,
    },
    DrawReviewersUseCase,
    SubmitVerdictUseCase,
    EvaluateModerationUseCase,
    GetAssignmentsUseCase,
  ],
  controllers: [ModerationController],
  exports: [REVIEWER_ASSIGNMENT_REPOSITORY, DrawReviewersUseCase],
})
export class ModerationModule {}
