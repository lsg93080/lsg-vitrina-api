import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  REVIEWER_ASSIGNMENT_REPOSITORY,
  type IReviewerAssignmentRepository,
} from '../../domain/repositories/reviewer-assignment.repository.interface';
import { ReviewerAssignment } from '../../domain/entities/reviewer-assignment.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.vo';
import { EvaluateModerationUseCase } from './evaluate-moderation.use-case';

export class SubmitVerdictInput {
  assignmentId: string;
  reviewerId: string;
  isSafe: boolean;
  comment: string | null;
}

@Injectable()
export class SubmitVerdictUseCase {
  constructor(
    @Inject(REVIEWER_ASSIGNMENT_REPOSITORY)
    private readonly repo: IReviewerAssignmentRepository,
    private readonly evaluateModeration: EvaluateModerationUseCase,
  ) {}

  async execute(input: SubmitVerdictInput): Promise<ReviewerAssignment> {
    const assignment = await this.repo.findById(input.assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');

    if (assignment.reviewerId !== input.reviewerId)
      throw new ForbiddenException('Not your assignment');

    if (assignment.status === AssignmentStatus.DONE)
      throw new ConflictException('Verdict already submitted');

    const updated = await this.repo.submitVerdict(
      input.assignmentId,
      { isSafe: input.isSafe, comment: input.comment },
      new Date(),
    );
    if (updated === null)
      throw new NotFoundException('Assignment not found after update');

    void this.evaluateModeration.execute(assignment.publicationRepoId);

    return updated;
  }
}
