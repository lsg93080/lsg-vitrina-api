import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DeadTokenError } from './dead-token.error';

const GITHUB_API = 'https://api.github.com';

@Injectable()
export class GitHubClient {
  private readonly logger = new Logger(GitHubClient.name);

  private buildHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'LifeSyncGames',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  // Lists public repositories owned by the authenticated user, sorted by last update.
  async getUserRepos(accessToken: string): Promise<unknown[]> {
    const url = `${GITHUB_API}/user/repos?affiliation=owner&sort=updated&per_page=100&visibility=public`;
    const response = await fetch(url, {
      headers: this.buildHeaders(accessToken),
    });

    if (!response.ok) {
      this.handleGitHubError(response.status, 'getUserRepos');
    }

    return (await response.json()) as unknown[];
  }

  // Retrieves a single repository by numeric ID. Throws NotFoundException if not found or inaccessible.
  async getRepoById(accessToken: string, repoId: number): Promise<unknown> {
    const url = `${GITHUB_API}/repositories/${repoId}`;
    const response = await fetch(url, {
      headers: this.buildHeaders(accessToken),
    });

    if (!response.ok) {
      this.handleGitHubError(response.status, `getRepoById(${repoId})`);
    }

    return (await response.json()) as unknown;
  }

  // Retrieves the raw README content for a repository. Returns null if no README exists.
  async getReadme(accessToken: string, repoId: number): Promise<string | null> {
    // GitHub's /readme endpoint returns the preferred README file at the root of the repo.
    // We use /repositories/:id/readme to stay consistent with the numeric ID approach.
    const url = `${GITHUB_API}/repositories/${repoId}/readme`;
    const response = await fetch(url, {
      headers: this.buildHeaders(accessToken),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      this.logger.warn(
        `getReadme(${repoId}) returned ${response.status} — treating as no README`,
      );
      return null;
    }

    const data = (await response.json()) as { content?: string };

    if (!data.content) {
      return null;
    }

    // GitHub returns README content base64-encoded (with newlines every 60 chars)
    return Buffer.from(data.content, 'base64').toString('utf8');
  }

  private handleGitHubError(status: number, context: string): never {
    if (status === 401) {
      this.logger.warn(`GitHub 401 in ${context} — token expired or invalid`);
      throw new DeadTokenError('github');
    }
    if (status === 403) {
      this.logger.warn(`GitHub 403 in ${context} — insufficient permissions`);
      throw new ForbiddenException(
        'Insufficient permissions for this GitHub resource',
      );
    }
    if (status === 404) {
      throw new NotFoundException(
        'GitHub repository not found or not accessible',
      );
    }
    this.logger.error(`GitHub unexpected status ${status} in ${context}`);
    throw new NotFoundException('GitHub request failed');
  }
}
