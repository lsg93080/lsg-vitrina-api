import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DeadTokenError } from './dead-token.error';

const GITLAB_API = 'https://gitlab.com/api/v4';

@Injectable()
export class GitLabClient {
  private readonly logger = new Logger(GitLabClient.name);

  // Lists repositories where the user is a member with at least Developer access (level 30).
  async getUserRepos(accessToken: string): Promise<unknown[]> {
    const url = `${GITLAB_API}/projects?membership=true&min_access_level=30&per_page=100`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      this.handleGitLabError(response.status, 'getUserRepos');
    }

    return (await response.json()) as unknown[];
  }

  // Retrieves a single project by ID. Throws NotFoundException if not found or inaccessible.
  async getRepoById(accessToken: string, repoId: number): Promise<unknown> {
    const url = `${GITLAB_API}/projects/${repoId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      this.handleGitLabError(response.status, `getRepoById(${repoId})`);
    }

    return (await response.json()) as unknown;
  }

  // Retrieves the raw README.md content for a project. Returns null if no README exists.
  async getReadme(
    accessToken: string,
    repoId: number,
    defaultBranch: string,
  ): Promise<string | null> {
    const encodedBranch = encodeURIComponent(defaultBranch);
    const url = `${GITLAB_API}/projects/${repoId}/repository/files/README.md/raw?ref=${encodedBranch}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
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

    return await response.text();
  }

  private handleGitLabError(status: number, context: string): never {
    if (status === 401) {
      this.logger.warn(`GitLab 401 in ${context} — token expired or invalid`);
      throw new DeadTokenError('gitlab');
    }
    if (status === 403) {
      this.logger.warn(`GitLab 403 in ${context} — insufficient permissions`);
      throw new ForbiddenException(
        'Insufficient permissions for this GitLab resource',
      );
    }
    if (status === 404) {
      throw new NotFoundException(
        'GitLab repository not found or not accessible',
      );
    }
    this.logger.error(`GitLab unexpected status ${status} in ${context}`);
    throw new NotFoundException('GitLab request failed');
  }
}
