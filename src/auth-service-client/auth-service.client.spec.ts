import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { AuthServiceClient } from './auth-service.client';
import { ReconnectRequiredException } from '@/vcs/reconnect-required.exception';

const mockFetchResponse = (
  body: unknown,
  options: { ok?: boolean; status?: number; statusText?: string } = {},
): Response => {
  const { ok = true, status = 200, statusText = 'OK' } = options;
  return {
    ok,
    status,
    statusText,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
};

describe('AuthServiceClient', () => {
  let client: AuthServiceClient;
  let fetchSpy: jest.SpyInstance;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          AUTH_SERVICE_URL: 'http://auth:3000/api/v1',
          AUTH_SERVICE_API_KEY: 'test-api-key',
        };
        return config[key];
      }),
    } as unknown as ConfigService;

    client = new AuthServiceClient(configService);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  describe('getOAuthToken', () => {
    it('should return the token on success', async () => {
      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          accessToken: 'glpat-token',
          providerUserId: '12345678',
        }),
      );

      const result = await client.getOAuthToken(userId, 'gitlab');

      expect(result).toEqual({
        accessToken: 'glpat-token',
        providerUserId: '12345678',
      });
    });

    it('should return null on 404 (no connection)', async () => {
      fetchSpy.mockResolvedValue(
        mockFetchResponse(
          { message: 'No gitlab connection' },
          { ok: false, status: 404, statusText: 'Not Found' },
        ),
      );

      await expect(client.getOAuthToken(userId, 'gitlab')).resolves.toBeNull();
    });

    it('should throw ReconnectRequiredException on 409', async () => {
      fetchSpy.mockResolvedValue(
        mockFetchResponse(
          { error: 'reconnect_required' },
          { ok: false, status: 409, statusText: 'Conflict' },
        ),
      );

      await expect(client.getOAuthToken(userId, 'gitlab')).rejects.toThrow(
        ReconnectRequiredException,
      );
      await expect(client.getOAuthToken(userId, 'gitlab')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw (not return null) on a transient 5xx', async () => {
      fetchSpy.mockResolvedValue(
        mockFetchResponse(
          {},
          { ok: false, status: 503, statusText: 'Service Unavailable' },
        ),
      );

      await expect(client.getOAuthToken(userId, 'gitlab')).rejects.toThrow(
        'Auth Service oauth/token failed: 503',
      );
    });

    it('should rethrow on network failure', async () => {
      fetchSpy.mockRejectedValue(new TypeError('fetch failed'));

      await expect(client.getOAuthToken(userId, 'gitlab')).rejects.toThrow(
        'fetch failed',
      );
    });
  });

  describe('deleteOAuthConnection', () => {
    it('should issue a DELETE and swallow non-OK responses', async () => {
      fetchSpy.mockResolvedValue(
        mockFetchResponse({}, { ok: false, status: 500 }),
      );

      await expect(
        client.deleteOAuthConnection(userId, 'github'),
      ).resolves.toBeUndefined();

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://auth:3000/api/v1/internal/oauth/connection',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
