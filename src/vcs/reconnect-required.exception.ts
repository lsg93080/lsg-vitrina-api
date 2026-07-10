import { ConflictException } from '@nestjs/common';

// Signals a dead OAuth connection removed upstream; mapped to 409 (not 401, which triggers a full logout in the frontend interceptor; not 404, which means no connection at all) so the UI can show a targeted reconnect prompt.
export class ReconnectRequiredException extends ConflictException {
  constructor(provider: string) {
    super({
      message: `Your ${provider} connection is no longer valid. Please reconnect your account.`,
      error: 'reconnect_required',
      provider,
    });
  }
}
