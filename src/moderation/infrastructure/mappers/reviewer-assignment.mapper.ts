import { ReviewerAssignment } from '../../domain/entities/reviewer-assignment.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.vo';
import type { ReviewerAssignmentDocument } from '../schemas/reviewer-assignment.schema';

export class ReviewerAssignmentMapper {
  static toDomain(doc: ReviewerAssignmentDocument): ReviewerAssignment {
    return new ReviewerAssignment(
      doc._id.toString(),
      doc.publicationRepoId,
      doc.reviewerId,
      doc.reviewerEmail,
      doc.status as AssignmentStatus,
      doc.verdict ?? null,
      doc.assignedAt,
      doc.reviewedAt ?? null,
    );
  }

  static toPersistence(
    entity: ReviewerAssignment,
  ): Partial<ReviewerAssignmentDocument> {
    return {
      publicationRepoId: entity.publicationRepoId,
      reviewerId: entity.reviewerId,
      reviewerEmail: entity.reviewerEmail,
      status: entity.status,
      verdict: entity.verdict,
      assignedAt: entity.assignedAt,
      reviewedAt: entity.reviewedAt,
    } as Partial<ReviewerAssignmentDocument>;
  }
}
