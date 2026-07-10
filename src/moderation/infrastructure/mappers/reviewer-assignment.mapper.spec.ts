import { ReviewerAssignmentMapper } from './reviewer-assignment.mapper';
import { ReviewerAssignment } from '../../domain/entities/reviewer-assignment.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.vo';
import type { ReviewerAssignmentDocument } from '../schemas/reviewer-assignment.schema';

const assignedAt = new Date('2025-03-01T10:00:00.000Z');

const pendingDoc = {
  _id: { toString: () => 'assignment-id-001' },
  publicationRepoId: 'repo-42',
  reviewerId: 'reviewer-uid-abc',
  reviewerEmail: 'gandalf@theshire.me',
  status: 'pending',
  verdict: null,
  assignedAt,
  reviewedAt: null,
} as unknown as ReviewerAssignmentDocument;

const doneDoc = {
  _id: { toString: () => 'assignment-id-002' },
  publicationRepoId: 'repo-99',
  reviewerId: 'reviewer-uid-xyz',
  reviewerEmail: 'frodo@theshire.me',
  status: 'done',
  verdict: { isSafe: true, comment: 'looks good' },
  assignedAt,
  reviewedAt: new Date('2025-03-02T15:30:00.000Z'),
} as unknown as ReviewerAssignmentDocument;

describe('ReviewerAssignmentMapper', () => {
  describe('toDomain', () => {
    it('maps a pending document with null verdict to a ReviewerAssignment entity', () => {
      const result = ReviewerAssignmentMapper.toDomain(pendingDoc);

      expect(result).toBeInstanceOf(ReviewerAssignment);
      expect(result.id).toBe('assignment-id-001');
      expect(result.publicationRepoId).toBe('repo-42');
      expect(result.reviewerId).toBe('reviewer-uid-abc');
      expect(result.reviewerEmail).toBe('gandalf@theshire.me');
      expect(result.status).toBe(AssignmentStatus.PENDING);
      expect(result.verdict).toBeNull();
      expect(result.assignedAt).toBe(assignedAt);
      expect(result.reviewedAt).toBeNull();
    });

    it('maps a done document with verdict to a ReviewerAssignment entity', () => {
      const result = ReviewerAssignmentMapper.toDomain(doneDoc);

      expect(result).toBeInstanceOf(ReviewerAssignment);
      expect(result.id).toBe('assignment-id-002');
      expect(result.status).toBe(AssignmentStatus.DONE);
      expect(result.verdict).not.toBeNull();
      expect(result.verdict!.isSafe).toBe(true);
      expect(result.verdict!.comment).toBe('looks good');
      expect(result.reviewedAt).toEqual(new Date('2025-03-02T15:30:00.000Z'));
    });
  });

  describe('toPersistence', () => {
    it('maps a ReviewerAssignment entity back to a plain persistence object', () => {
      const entity = ReviewerAssignmentMapper.toDomain(pendingDoc);
      const result = ReviewerAssignmentMapper.toPersistence(entity);

      expect(result['publicationRepoId']).toBe('repo-42');
      expect(result['reviewerId']).toBe('reviewer-uid-abc');
      expect(result['reviewerEmail']).toBe('gandalf@theshire.me');
      expect(result['status']).toBe('pending');
      expect(result['verdict']).toBeNull();
      expect(result['assignedAt']).toBe(assignedAt);
      expect(result['reviewedAt']).toBeNull();
    });

    it('round-trips a done entity preserving all fields', () => {
      const entity = ReviewerAssignmentMapper.toDomain(doneDoc);
      const result = ReviewerAssignmentMapper.toPersistence(entity);

      expect(result['publicationRepoId']).toBe('repo-99');
      expect(result['status']).toBe('done');
      expect(
        (result['verdict'] as { isSafe: boolean; comment: string | null })
          .isSafe,
      ).toBe(true);
      expect(
        (result['verdict'] as { isSafe: boolean; comment: string | null })
          .comment,
      ).toBe('looks good');
      expect(result['reviewedAt']).toEqual(
        new Date('2025-03-02T15:30:00.000Z'),
      );
    });
  });
});
