import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthServiceClient } from '@/auth-service-client/auth-service.client';
import {
  PublicationDocument,
  PublicationSchemaClass,
} from '@/publications/infrastructure/schemas/publication.schema';
import { GitLabClient } from './gitlab-client';
import { GitHubClient } from './github-client';
import { CanDisconnectResponseDto } from './dto/can-disconnect.dto';
import { GitLabRepoDto, GitLabRepoMetadataDto } from './dto/gitlab-repo.dto';
import { GitHubRepoDto, GitHubRepoMetadataDto } from './dto/github-repo.dto';
import { DeadTokenError } from './dead-token.error';
import { ReconnectRequiredException } from './reconnect-required.exception';

// Raw shape returned by GitHub /user/repos and /repositories/:id endpoints (subset of fields we use).
interface GitHubRepoRaw {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  visibility: 'public' | 'private';
  default_branch: string;
  topics: string[];
  updated_at: string;
  owner: {
    id: number;
    login: string;
    html_url: string;
    type: 'User' | 'Organization';
  };
}

// Raw shape returned by GitLab /projects endpoint (subset of fields we use).
interface GitLabProjectRaw {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description: string | null;
  web_url: string;
  visibility: 'public' | 'private' | 'internal';
  default_branch: string;
  topics: string[];
  last_activity_at: string;
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: 'user' | 'group';
    web_url: string;
  };
}

@Injectable()
export class VcsService {
  private readonly logger = new Logger(VcsService.name);

  constructor(
    private readonly authServiceClient: AuthServiceClient,
    private readonly gitLabClient: GitLabClient,
    private readonly gitHubClient: GitHubClient,
    @InjectModel(PublicationSchemaClass.name)
    private readonly publicationModel: Model<PublicationDocument>,
  ) {}

  async getGitLabRepos(userId: string): Promise<GitLabRepoDto[]> {
    const token = await this.authServiceClient.getOAuthToken(userId, 'gitlab');
    if (!token) {
      throw new NotFoundException('GitLab account not connected');
    }

    const raw = (await this.callProvider(userId, 'gitlab', () =>
      this.gitLabClient.getUserRepos(token.accessToken),
    )) as GitLabProjectRaw[];

    return raw.map((r) => this.mapToRepoDto(r));
  }

  async getGitLabRepoMetadata(
    userId: string,
    repoId: number,
  ): Promise<GitLabRepoMetadataDto> {
    const token = await this.authServiceClient.getOAuthToken(userId, 'gitlab');
    if (!token) {
      throw new NotFoundException('GitLab account not connected');
    }

    const raw = (await this.callProvider(userId, 'gitlab', () =>
      this.gitLabClient.getRepoById(token.accessToken, repoId),
    )) as GitLabProjectRaw;

    const readme = await this.callProvider(userId, 'gitlab', () =>
      this.gitLabClient.getReadme(
        token.accessToken,
        repoId,
        raw.default_branch,
      ),
    );

    return {
      id: raw.id,
      name: raw.name,
      description: raw.description ?? null,
      readme,
      topics: raw.topics ?? [],
      webUrl: raw.web_url,
      defaultBranch: raw.default_branch,
      visibility: raw.visibility,
    };
  }

  async getGitHubRepos(userId: string): Promise<GitHubRepoDto[]> {
    const token = await this.authServiceClient.getOAuthToken(userId, 'github');
    if (!token) {
      throw new NotFoundException('GitHub account not connected');
    }

    const raw = (await this.callProvider(userId, 'github', () =>
      this.gitHubClient.getUserRepos(token.accessToken),
    )) as GitHubRepoRaw[];

    return raw.map((r) => this.mapToGitHubRepoDto(r));
  }

  async getGitHubRepoMetadata(
    userId: string,
    repoId: number,
  ): Promise<GitHubRepoMetadataDto> {
    const token = await this.authServiceClient.getOAuthToken(userId, 'github');
    if (!token) {
      throw new NotFoundException('GitHub account not connected');
    }

    const raw = (await this.callProvider(userId, 'github', () =>
      this.gitHubClient.getRepoById(token.accessToken, repoId),
    )) as GitHubRepoRaw;

    const readme = await this.callProvider(userId, 'github', () =>
      this.gitHubClient.getReadme(token.accessToken, repoId),
    );

    return {
      id: raw.id,
      name: raw.name,
      description: raw.description ?? null,
      readme,
      topics: raw.topics ?? [],
      webUrl: raw.html_url,
      defaultBranch: raw.default_branch,
      visibility: raw.visibility,
    };
  }

  async canDisconnect(
    userId: string,
    provider: string,
  ): Promise<CanDisconnectResponseDto> {
    if (provider === 'gitlab' || provider === 'github') {
      const count = await this.publicationModel
        .countDocuments({ authorId: userId, vcsProvider: provider })
        .exec();

      return {
        canDisconnect: count === 0,
        publicationCount: count,
      };
    }

    // Unknown provider, no publications can be linked to it
    return { canDisconnect: true, publicationCount: 0 };
  }

  // On DeadTokenError (401 from provider), deletes the dead connection upstream and rethrows as ReconnectRequiredException (409); other errors propagate unchanged.
  private async callProvider<T>(
    userId: string,
    provider: 'gitlab' | 'github',
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof DeadTokenError) {
        await this.authServiceClient.deleteOAuthConnection(userId, provider);
        throw new ReconnectRequiredException(provider);
      }
      throw err;
    }
  }

  private mapToGitHubRepoDto(r: GitHubRepoRaw): GitHubRepoDto {
    const ownerLogin = r.owner.login;
    return {
      id: r.id,
      name: r.name,
      nameWithNamespace: r.full_name,
      path: r.name,
      pathWithNamespace: r.full_name,
      description: r.description ?? null,
      webUrl: r.html_url,
      visibility: r.visibility,
      defaultBranch: r.default_branch,
      topics: r.topics ?? [],
      lastActivityAt: r.updated_at,
      namespace: {
        id: r.owner.id,
        name: ownerLogin,
        path: ownerLogin,
        kind: r.owner.type === 'Organization' ? 'organization' : 'user',
        webUrl: r.owner.html_url,
      },
    };
  }

  private mapToRepoDto(r: GitLabProjectRaw): GitLabRepoDto {
    return {
      id: r.id,
      name: r.name,
      nameWithNamespace: r.name_with_namespace,
      path: r.path,
      pathWithNamespace: r.path_with_namespace,
      description: r.description ?? null,
      webUrl: r.web_url,
      visibility: r.visibility,
      defaultBranch: r.default_branch,
      topics: r.topics ?? [],
      lastActivityAt: r.last_activity_at,
      namespace: {
        id: r.namespace.id,
        name: r.namespace.name,
        path: r.namespace.path,
        kind: r.namespace.kind,
        webUrl: r.namespace.web_url,
      },
    };
  }
}
