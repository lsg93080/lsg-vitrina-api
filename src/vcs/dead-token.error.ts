// Thrown by a VCS client on a 401 from the provider API; the service layer reacts by deleting the dead connection upstream and asking the user to reconnect.
export class DeadTokenError extends Error {
  constructor(public readonly provider: 'gitlab' | 'github') {
    super(`${provider} access token is expired or revoked`);
    this.name = 'DeadTokenError';
  }
}
