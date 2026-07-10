import { Inject, Injectable } from '@nestjs/common';
import {
  REVIEWER_ASSIGNMENT_REPOSITORY,
  type IReviewerAssignmentRepository,
} from '../../domain/repositories/reviewer-assignment.repository.interface';
import { ReviewerAssignment } from '../../domain/entities/reviewer-assignment.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.vo';

export interface GetAssignmentsInput {
  reviewerId?: string;
  publicationRepoId?: string;
  status?: AssignmentStatus;
  page: number;
  limit: number;
}

export interface GetAssignmentsOutput {
  data: ReviewerAssignment[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetAssignmentsUseCase {
  constructor(
    @Inject(REVIEWER_ASSIGNMENT_REPOSITORY)
    private readonly repo: IReviewerAssignmentRepository,
  ) {}

  async execute(input: GetAssignmentsInput): Promise<GetAssignmentsOutput> {
    const result = await this.repo.findFiltered(input);
    return { ...result, page: input.page, limit: input.limit };
  }
}
