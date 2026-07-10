import { EvaluateModerationUseCase } from './evaluate-moderation.use-case';
import { IReviewerAssignmentRepository } from '../../domain/repositories/reviewer-assignment.repository.interface';
import { IPublicationRepository } from '../../../publications/domain/repositories/publication.repository.interface';
import { CreateReportUseCase } from '../../../reports/application/use-cases/create-report.use-case';
import { ReviewerAssignment } from '../../domain/entities/reviewer-assignment.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.vo';
import { PublicationStatus } from '../../../publications/domain/value-objects/publication.vo';
import { ReportReason } from '../../../reports/domain/value-objects/report-reason.vo';

const makeAssignment = (
  isSafe: boolean | null,
  status: AssignmentStatus,
): ReviewerAssignment =>
  new ReviewerAssignment(
    'assignment-id',
    'pub-repo-id',
    'reviewer-user-id',
    'reviewer@example.com',
    status,
    isSafe !== null ? { isSafe, comment: null } : null,
    new Date(),
    status === AssignmentStatus.DONE ? new Date() : null,
  );

describe('EvaluateModerationUseCase', () => {
  let useCase: EvaluateModerationUseCase;
  let assignmentRepo: jest.Mocked<IReviewerAssignmentRepository>;
  let publicationRepo: jest.Mocked<IPublicationRepository>;
  let createReport: jest.Mocked<CreateReportUseCase>;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MODERATION_UNSAFE_THRESHOLD: '0.5',
      MODERATION_AUTO_SUSPEND: 'false',
    };

    assignmentRepo = {
      findByPublicationRepoId: jest.fn(),
    } as unknown as jest.Mocked<IReviewerAssignmentRepository>;

    publicationRepo = {
      update: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IPublicationRepository>;

    createReport = {
      execute: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<CreateReportUseCase>;

    useCase = new EvaluateModerationUseCase(
      assignmentRepo,
      publicationRepo,
      createReport,
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does nothing when there are no done verdicts', async () => {
    assignmentRepo.findByPublicationRepoId.mockResolvedValue([
      makeAssignment(null, AssignmentStatus.PENDING),
    ]);

    await useCase.execute('pub-repo-id');

    expect(publicationRepo.update).not.toHaveBeenCalled();
    expect(createReport.execute).not.toHaveBeenCalled();
  });

  it('does nothing when unsafe ratio is below threshold (0.25 < 0.5)', async () => {
    assignmentRepo.findByPublicationRepoId.mockResolvedValue([
      makeAssignment(true, AssignmentStatus.DONE),
      makeAssignment(true, AssignmentStatus.DONE),
      makeAssignment(true, AssignmentStatus.DONE),
      makeAssignment(false, AssignmentStatus.DONE),
    ]);

    await useCase.execute('pub-repo-id');

    expect(publicationRepo.update).not.toHaveBeenCalled();
    expect(createReport.execute).not.toHaveBeenCalled();
  });

  it('calls createReport when unsafe ratio exactly equals threshold (0.5) and autoSuspend is false', async () => {
    process.env.MODERATION_AUTO_SUSPEND = 'false';
    assignmentRepo.findByPublicationRepoId.mockResolvedValue([
      makeAssignment(false, AssignmentStatus.DONE),
      makeAssignment(true, AssignmentStatus.DONE),
    ]);

    await useCase.execute('pub-repo-id');

    expect(createReport.execute).toHaveBeenCalledWith({
      publicationId: 'pub-repo-id',
      reporterId: 'SYSTEM',
      reason: ReportReason.OTHER,
      description: 'Auto-moderation: unsafe ratio 0.50 reached threshold 0.5',
    });
    expect(publicationRepo.update).not.toHaveBeenCalled();
  });

  it('calls createReport when unsafe ratio is above threshold (0.75 > 0.5) and autoSuspend is false', async () => {
    process.env.MODERATION_AUTO_SUSPEND = 'false';
    assignmentRepo.findByPublicationRepoId.mockResolvedValue([
      makeAssignment(false, AssignmentStatus.DONE),
      makeAssignment(false, AssignmentStatus.DONE),
      makeAssignment(false, AssignmentStatus.DONE),
      makeAssignment(true, AssignmentStatus.DONE),
    ]);

    await useCase.execute('pub-repo-id');

    expect(createReport.execute).toHaveBeenCalled();
    expect(publicationRepo.update).not.toHaveBeenCalled();
  });

  it('calls publicationRepo.update with SUSPENDED when unsafe ratio equals threshold and autoSuspend is true', async () => {
    process.env.MODERATION_AUTO_SUSPEND = 'true';
    assignmentRepo.findByPublicationRepoId.mockResolvedValue([
      makeAssignment(false, AssignmentStatus.DONE),
      makeAssignment(true, AssignmentStatus.DONE),
    ]);

    await useCase.execute('pub-repo-id');

    expect(publicationRepo.update).toHaveBeenCalledWith('pub-repo-id', {
      status: PublicationStatus.SUSPENDED,
    });
    expect(createReport.execute).not.toHaveBeenCalled();
  });

  it('does nothing when assignments array is empty', async () => {
    assignmentRepo.findByPublicationRepoId.mockResolvedValue([]);

    await useCase.execute('pub-repo-id');

    expect(publicationRepo.update).not.toHaveBeenCalled();
    expect(createReport.execute).not.toHaveBeenCalled();
  });
});
