import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthServiceClient } from '@/auth-service-client/auth-service.client';
import { Role } from '@/presentation/http/decorators/role.enum';
import { Platform } from '@/contributors/domain/value-objects/platform.enum';
import { Publication } from '../../domain/entities/publication.entity';
import {
  EsrbRating,
  PubType,
  PublicationStatus,
  VcsProvider,
} from '../../domain/value-objects/publication.vo';
import {
  type IPublicationRepository,
  PUBLICATION_REPOSITORY,
} from '../../domain/repositories/publication.repository.interface';
import { VerifyRepoOwnershipUseCase } from './verify-repo-ownership.use-case';
import { DrawReviewersUseCase } from '@/moderation/application/use-cases/draw-reviewers.use-case';

export interface CreatePublicationInput {
  repoId: string;
  authorId: string;
  title: string;
  shortDescription: string;
  type: PubType;
  esrbRating: EsrbRating;
  platforms: Platform[];
  tags: string[];
  releaseYear: number;
  thumbnailUrl?: string;
  vcsProvider?: VcsProvider;
  userRoles: string[];
}

@Injectable()
export class CreatePublicationUseCase {
  constructor(
    @Inject(PUBLICATION_REPOSITORY)
    private readonly repo: IPublicationRepository,
    private readonly authClient: AuthServiceClient,
    private readonly verifyOwnership: VerifyRepoOwnershipUseCase,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => DrawReviewersUseCase))
    private readonly drawReviewers: DrawReviewersUseCase,
  ) {}

  async execute(input: CreatePublicationInput): Promise<Publication> {
    const existing = await this.repo.findByRepoId(input.repoId);
    if (existing)
      throw new ConflictException(
        `Publication with repoId ${input.repoId} already exists`,
      );

    const requireCheck =
      this.configService.get<string>('REQUIRE_REPO_OWNERSHIP_CHECK') === 'true';
    if (requireCheck) {
      await this.verifyOwnership.execute(input.authorId, input.repoId);
    }

    const now = new Date();
    const publication = new Publication(
      undefined,
      input.repoId,
      input.authorId,
      input.title,
      input.shortDescription,
      input.type,
      input.esrbRating,
      input.platforms,
      input.tags,
      input.releaseYear,
      PublicationStatus.ACTIVE,
      0,
      0,
      0,
      input.thumbnailUrl,
      null,
      input.vcsProvider ?? null,
      now,
      now,
    );

    const created = await this.repo.create(publication);

    void this.drawReviewers.execute({
      publicationRepoId: created.repoId,
      publicationTitle: created.title,
      authorUserId: input.authorId,
      hasReleases: false,
    });

    if (!input.userRoles.includes(Role.DEVELOPER)) {
      void this.authClient.grantDeveloperRole(input.authorId);
    }

    return created;
  }
}
