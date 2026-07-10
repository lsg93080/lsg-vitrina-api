import {
  AssignmentStatus,
  ReviewerVerdict,
} from '../value-objects/assignment-status.vo';

export class ReviewerAssignment {
  constructor(
    readonly id: string | undefined,
    readonly publicationRepoId: string,
    readonly reviewerId: string,
    readonly reviewerEmail: string,
    readonly status: AssignmentStatus,
    readonly verdict: ReviewerVerdict | null,
    readonly assignedAt: Date,
    readonly reviewedAt: Date | null,
  ) {}
}
