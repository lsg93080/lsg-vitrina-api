import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReconnectRequiredException } from '@/vcs/reconnect-required.exception';

export interface OAuthTokenResult {
  accessToken: string;
  providerUserId: string;
}

@Injectable()
export class AuthServiceClient {
  private readonly logger = new Logger(AuthServiceClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('AUTH_SERVICE_URL');
    this.apiKey = this.configService.getOrThrow<string>('AUTH_SERVICE_API_KEY');
  }

  // Fire-and-forget: grants developer role on first publication, errors are logged but never propagate.
  async grantDeveloperRole(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/grant-developer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        this.logger.warn(
          `grant-developer returned ${response.status} for userId=${userId}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to reach Auth Service for grant-developer (userId=${userId}): ${String(err)}`,
      );
    }
  }

  // Returns null only on 404 (no connection); throws ReconnectRequiredException on 409 (dead connection); re-throws other failures so callers don't mistake them for "no connection".
  async getOAuthToken(
    userId: string,
    provider: 'gitlab' | 'github',
  ): Promise<OAuthTokenResult | null> {
    let response: Response;
    try {
      response = await fetch(
        `${this.baseUrl}/internal/oauth/token?userId=${userId}&provider=${provider}`,
        { headers: { 'x-api-key': this.apiKey } },
      );
    } catch (err) {
      this.logger.error(
        `Failed to reach Auth Service for oauth/token (userId=${userId}, provider=${provider}): ${String(err)}`,
      );
      throw err;
    }

    // 409: connection is unrecoverable and was deleted upstream, reconnect required.
    if (response.status === 409) {
      throw new ReconnectRequiredException(provider);
    }

    // 404: no connection exists for this provider.
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      // Transient upstream failure: do not collapse into "no connection".
      this.logger.warn(
        `oauth/token returned ${response.status} for userId=${userId}, provider=${provider}`,
      );
      throw new Error(
        `Auth Service oauth/token failed: ${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as {
      accessToken?: string;
      providerUserId?: string;
    };
    if (!body.accessToken || !body.providerUserId) return null;
    return {
      accessToken: body.accessToken,
      providerUserId: body.providerUserId,
    };
  }

  // Best-effort: used when Vitrina detects a dead token directly (e.g. a 401 from the provider API); failures are logged but never propagate.
  async deleteOAuthConnection(
    userId: string,
    provider: 'gitlab' | 'github',
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/internal/oauth/connection`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          body: JSON.stringify({ userId, provider }),
        },
      );

      if (!response.ok) {
        this.logger.warn(
          `oauth/connection delete returned ${response.status} for userId=${userId}, provider=${provider}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to reach Auth Service for oauth/connection delete (userId=${userId}, provider=${provider}): ${String(err)}`,
      );
    }
  }

  // Verifies maintainer/owner access (access_level >= 40) on the GitLab project; returns false on any error or insufficient access.
  async verifyGitLabOwnership(
    accessToken: string,
    repoId: string,
  ): Promise<boolean> {
    try {
      const encoded = encodeURIComponent(repoId);
      const response = await fetch(
        `https://gitlab.com/api/v4/projects/${encoded}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!response.ok) return false;

      const body = (await response.json()) as {
        permissions?: {
          project_access?: { access_level?: number } | null;
          group_access?: { access_level?: number } | null;
        };
      };
      const projectLevel = body.permissions?.project_access?.access_level ?? 0;
      const groupLevel = body.permissions?.group_access?.access_level ?? 0;
      return Math.max(projectLevel, groupLevel) >= 40;
    } catch (err) {
      this.logger.error(
        `Failed to verify GitLab ownership for repoId=${repoId}: ${String(err)}`,
      );
      return false;
    }
  }
}
