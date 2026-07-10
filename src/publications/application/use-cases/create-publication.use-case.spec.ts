import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreatePublicationUseCase,
  CreatePublicationInput,
} from './create-publication.use-case';
import { IPublicationRepository } from '../../domain/repositories/publication.repository.interface';
import { AuthServiceClient } from '@/auth-service-client/auth-service.client';
import { VerifyRepoOwnershipUseCase } from './verify-repo-ownership.use-case';
import { DrawReviewersUseCase } from '@/moderation/application/use-cases/draw-reviewers.use-case';
import { Publication } from '../../domain/entities/publication.entity';
import {
  EsrbRating,
  PubType,
  PublicationStatus,
} from '../../domain/value-objects/publication.vo';
import { Platform } from '@/contributors/domain/value-objects/platform.enum';

// Legolas: already a developer, author of Mirkwood Chronicles (stealth/archery game)
const legolasPublication = new Publication(
  'mongo-id-legolas-01',
  'gitlab-legolas-mirkwood-01',
  '7f3b9c1e-d4a8-4e2b-9f1a-3c5d6e7f8b9c',
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

// Faramir: player only, publishes his first game and receives the developer role
const faramirPublication = new Publication(
  'mongo-id-faramir-01',
  'gitlab-faramir-rangers-01',
  'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f',
  'Rangers of Ithilien',
  'A tactical stealth game following the rangers of South Gondor.',
  PubType.VIDEOGAME,
  EsrbRating.TEEN,
  [Platform.WINDOWS],
  ['stealth', 'strategy', 'tactical'],
  2023,
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

const legolasInput: CreatePublicationInput = {
  repoId: 'gitlab-legolas-mirkwood-01',
  authorId: '7f3b9c1e-d4a8-4e2b-9f1a-3c5d6e7f8b9c',
  title: 'Mirkwood Chronicles',
  shortDescription:
    'A stealth archer adventure set in the forests of Eryn Lasgalen.',
  type: PubType.VIDEOGAME,
  esrbRating: EsrbRating.TEEN,
  platforms: [Platform.WINDOWS, Platform.LINUX],
  tags: ['stealth', 'archery', 'adventure'],
  releaseYear: 2024,
  userRoles: ['player', 'developer'],
};

const faramirInput: CreatePublicationInput = {
  repoId: 'gitlab-faramir-rangers-01',
  authorId: 'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f',
  title: 'Rangers of Ithilien',
  shortDescription:
    'A tactical stealth game following the rangers of South Gondor.',
  type: PubType.VIDEOGAME,
  esrbRating: EsrbRating.TEEN,
  platforms: [Platform.WINDOWS],
  tags: ['stealth', 'strategy', 'tactical'],
  releaseYear: 2023,
  userRoles: ['player'],
};

describe('CreatePublicationUseCase', () => {
  let useCase: CreatePublicationUseCase;
  let repo: jest.Mocked<IPublicationRepository>;
  let authClient: jest.Mocked<AuthServiceClient>;
  let verifyOwnership: jest.Mocked<VerifyRepoOwnershipUseCase>;
  let configService: jest.Mocked<ConfigService>;
  let drawReviewers: jest.Mocked<DrawReviewersUseCase>;

  beforeEach(() => {
    repo = {
      findByRepoId: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<IPublicationRepository>;

    authClient = {
      grantDeveloperRole: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuthServiceClient>;

    verifyOwnership = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<VerifyRepoOwnershipUseCase>;

    configService = {
      get: jest.fn().mockReturnValue('false'),
    } as unknown as jest.Mocked<ConfigService>;

    drawReviewers = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DrawReviewersUseCase>;

    useCase = new CreatePublicationUseCase(
      repo,
      authClient,
      verifyOwnership,
      configService,
      drawReviewers,
    );
  });

  it('throws ConflictException when repoId already exists', async () => {
    repo.findByRepoId.mockResolvedValue(legolasPublication);

    await expect(useCase.execute(legolasInput)).rejects.toThrow(
      ConflictException,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('calls grantDeveloperRole when user does not have developer role', async () => {
    repo.findByRepoId.mockResolvedValue(null);
    repo.create.mockResolvedValue(faramirPublication);

    await useCase.execute(faramirInput);

    expect(authClient.grantDeveloperRole).toHaveBeenCalledWith(
      'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f',
    );
  });

  it('does not call grantDeveloperRole when user already has developer role', async () => {
    repo.findByRepoId.mockResolvedValue(null);
    repo.create.mockResolvedValue(legolasPublication);

    await useCase.execute(legolasInput);

    expect(authClient.grantDeveloperRole).not.toHaveBeenCalled();
  });

  it('returns the created publication', async () => {
    repo.findByRepoId.mockResolvedValue(null);
    repo.create.mockResolvedValue(legolasPublication);

    const result = await useCase.execute(legolasInput);

    expect(result).toBe(legolasPublication);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('skips ownership check when REQUIRE_REPO_OWNERSHIP_CHECK is false', async () => {
    configService.get.mockReturnValue('false');
    repo.findByRepoId.mockResolvedValue(null);
    repo.create.mockResolvedValue(legolasPublication);

    await useCase.execute(legolasInput);

    expect(verifyOwnership.execute).not.toHaveBeenCalled();
  });

  it('runs ownership check when REQUIRE_REPO_OWNERSHIP_CHECK is true', async () => {
    configService.get.mockReturnValue('true');
    repo.findByRepoId.mockResolvedValue(null);
    repo.create.mockResolvedValue(legolasPublication);

    await useCase.execute(legolasInput);

    expect(verifyOwnership.execute).toHaveBeenCalledWith(
      legolasInput.authorId,
      legolasInput.repoId,
    );
  });
});
