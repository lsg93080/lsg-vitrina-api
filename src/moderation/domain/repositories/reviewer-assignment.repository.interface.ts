import {
  AssignmentStatus,
  ReviewerVerdict,
} from '../value-objects/assignment-status.vo';
import { ReviewerAssignment } from '../entities/reviewer-assignment.entity';

export const REVIEWER_ASSIGNMENT_REPOSITORY = 'REVIEWER_ASSIGNMENT_REPOSITORY';

export interface AssignmentFilter {
  reviewerId?: string;
  publicationRepoId?: string;
  status?: AssignmentStatus;
  page: number;
  limit: number;
}

export interface IReviewerAssignmentRepository {
  create(assignment: ReviewerAssignment): Promise<ReviewerAssignment>;
  findById(id: string): Promise<ReviewerAssignment | null>;
  findFiltered(
    filter: AssignmentFilter,
  ): Promise<{ data: ReviewerAssignment[]; total: number }>;
  findByPublicationRepoId(repoId: string): Promise<ReviewerAssignment[]>;
  submitVerdict(
    id: string,
    verdict: ReviewerVerdict,
    reviewedAt: Date,
  ): Promise<ReviewerAssignment | null>;
  deleteByRepoId(repoId: string): Promise<void>;
}
