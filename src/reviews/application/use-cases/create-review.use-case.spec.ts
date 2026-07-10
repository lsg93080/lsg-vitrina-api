import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  CreateReviewUseCase,
  CreateReviewInput,
} from './create-review.use-case';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { IPublicationRepository } from '@/publications/domain/repositories/publication.repository.interface';
import { IReleasesRepository } from '@/publication-details/domain/repositories/release.repository.interface';
import { IContributorRepository } from '@/contributors/domain/repositories/contributor.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import { Publication } from '@/publications/domain/entities/publication.entity';
import {
  EsrbRating,
  PubType,
  PublicationStatus,
} from '@/publications/domain/value-objects/publication.vo';
import { Platform } from '@/contributors/domain/value-objects/platform.enum';

// Legolas: publication author of Mirkwood Chronicles
const LEGOLAS_AUTHOR_ID = '7f3b9c1e-d4a8-4e2b-9f1a-3c5d6e7f8b9c';

// Samwise Gamgee: reviewer
const SAM_AUTHOR_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

// Peregrin Took: second reviewer
const PIPPIN_AUTHOR_ID = 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b';

const REPO_ID = 'gitlab-legolas-mirkwood-01';
const RELEASE_ID = 'mongo-id-release-mirkwood-01';

const mirkwoodPublication = new Publication(
  'mongo-id-legolas-01',
  REPO_ID,
  LEGOLAS_AUTHOR_ID,
  'Mirkwood Chronicles',
  'A stealth archer adventure set in the forests of Eryn Lasgalen.',
  PubType.VIDEOGAME,
  EsrbRating.TEEN,
  [Platform.WINDOWS, Platform.LINUX],
  ['stealth', 'archery', 'adventure'],
  2024,
  PublicationStatus.ACTIVE,
  0,
  0,
  0,
  undefined,
  null,
  null,
  new Date(),
  new Date(),
);

const samReview = new Review(
  'mongo-id-review-sam-01',
  REPO_ID,
  RELEASE_ID,
  SAM_AUTHOR_ID,
  4,
  'A masterful stealth experience',
  'An excellent stealth game. The Mirkwood atmosphere is spot on.',
  new Date(),
  new Date(),
);

const pippinReview = new Review(
  'mongo-id-review-pippin-01',
  REPO_ID,
  RELEASE_ID,
  PIPPIN_AUTHOR_ID,
  5,
  'Top-tier archery game',
  'Best archery mechanics in Middle-earth. Five stars.',
  new Date(),
  new Date(),
);

const samInput: CreateReviewInput = {
  repoId: REPO_ID,
  releaseId: RELEASE_ID,
  authorId: SAM_AUTHOR_ID,
  rating: 4,
  title: 'A masterful stealth experience',
  comment: 'An excellent stealth game. The Mirkwood atmosphere is spot on.',
};

const pippinInput: CreateReviewInput = {
  repoId: REPO_ID,
  releaseId: RELEASE_ID,
  authorId: PIPPIN_AUTHOR_ID,
  rating: 5,
  title: 'Top-tier archery game',
  comment: 'Best archery mechanics in Middle-earth. Five stars.',
};

describe('CreateReviewUseCase', () => {
  let useCase: CreateReviewUseCase;
  let reviewRepo: jest.Mocked<IReviewRepository>;
  let publicationRepo: jest.Mocked<IPublicationRepository>;
  let releasesRepo: jest.Mocked<IReleasesRepository>;
  let contributorRepo: jest.Mocked<IContributorRepository>;

  beforeEach(() => {
    reviewRepo = {
      create: jest.fn(),
      findByAuthorAndRelease: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IReviewRepository>;

    publicationRepo = {
      findByRepoId: jest.fn(),
      updateRating: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IPublicationRepository>;

    releasesRepo = {
      updateRating: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IReleasesRepository>;

    contributorRepo = {
      updateStats: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IContributorRepository>;

    useCase = new CreateReviewUseCase(
      reviewRepo,
      publicationRepo,
      releasesRepo,
      contributorRepo,
    );
  });

  it('creates the review and returns it', async () => {
    reviewRepo.create.mockResolvedValue(samReview);
    publicationRepo.findByRepoId.mockResolvedValue(mirkwoodPublication);

    const result = await useCase.execute(samInput);

    expect(reviewRepo.create).toHaveBeenCalledTimes(1);
    const callArg = reviewRepo.create.mock.calls[0][0];
    expect(callArg.repoId).toBe(REPO_ID);
    expect(callArg.releaseId).toBe(RELEASE_ID);
    expect(callArg.authorId).toBe(SAM_AUTHOR_ID);
    expect(callArg.rating).toBe(4);
    expect(callArg.comment).toBe(
      'An excellent stealth game. The Mirkwood atmosphere is spot on.',
    );
    expect(result).toBe(samReview);
  });

  it('cascades rating updates when publication is found', async () => {
    reviewRepo.create.mockResolvedValue(samReview);
    publicationRepo.findByRepoId.mockResolvedValue(mirkwoodPublication);

    await useCase.execute(samInput);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(publicationRepo.updateRating).toHaveBeenCalledWith(REPO_ID, {
      ratingDelta: 4,
      reviewsDelta: 1,
    });
    expect(releasesRepo.updateRating).toHaveBeenCalledWith(RELEASE_ID, {
      ratingDelta: 4,
      reviewsDelta: 1,
    });
    expect(contributorRepo.updateStats).toHaveBeenCalledWith(
      LEGOLAS_AUTHOR_ID,
      { commentsDelta: 1, ratingDelta: 4, downloadsDelta: 0 },
    );
  });

  it('skips contributorRepo.updateStats when publication is not found', async () => {
    reviewRepo.create.mockResolvedValue(pippinReview);
    publicationRepo.findByRepoId.mockResolvedValue(null);

    await useCase.execute(pippinInput);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(contributorRepo.updateStats).not.toHaveBeenCalled();
  });

  it('rejects self-review (author reviewing their own publication)', async () => {
    publicationRepo.findByRepoId.mockResolvedValue(mirkwoodPublication);

    const selfReviewInput: CreateReviewInput = {
      repoId: REPO_ID,
      releaseId: RELEASE_ID,
      authorId: LEGOLAS_AUTHOR_ID, // same as publication author
      rating: 5,
      title: 'Self-praise',
      comment: 'My own game is great!',
    };

    await expect(useCase.execute(selfReviewInput)).rejects.toThrow(
      ForbiddenException,
    );
    expect(reviewRepo.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate review (same author + same release)', async () => {
    publicationRepo.findByRepoId.mockResolvedValue(mirkwoodPublication);
    reviewRepo.findByAuthorAndRelease.mockResolvedValue(samReview);

    await expect(useCase.execute(samInput)).rejects.toThrow(ConflictException);
    expect(reviewRepo.create).not.toHaveBeenCalled();
  });
});
