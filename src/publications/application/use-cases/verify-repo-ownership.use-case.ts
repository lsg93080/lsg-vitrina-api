import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthServiceClient } from '@/auth-service-client/auth-service.client';

@Injectable()
export class VerifyRepoOwnershipUseCase {
  constructor(private readonly authClient: AuthServiceClient) {}

  // Throws ForbiddenException if no GitLab connection exists or access is insufficient (access_level < 40).
  async execute(userId: string, repoId: string): Promise<void> {
    const token = await this.authClient.getOAuthToken(userId, 'gitlab');
    if (!token) {
      throw new ForbiddenException(
        'No GitLab OAuth connection found for this user',
      );
    }

    const isOwner = await this.authClient.verifyGitLabOwnership(
      token.accessToken,
      repoId,
    );
    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have maintainer or owner access to this repository',
      );
    }
  }
}
