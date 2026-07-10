import { ContributorMapper } from './contributor.mapper';
import { Contributor } from '../../domain/entities/contributor.entity';
import type { ContributorDocument } from '../schemas/contributor.schema';

const legolasDoc = {
  _id: { toString: () => 'mongo-id-legolas-01' },
  userId: '7f3b9c1e-d4a8-4e2b-9f1a-3c5d6e7f8b9c',
  email: 'legolas@mirkwood.me',
  isReviewer: true,
  platforms: ['windows', 'linux'],
  contrInfo: {
    username: 'legolas',
    imgUrl: 'https://cdn.example.com/legolas.png',
    postsQty: 3,
    videogamesQty: 2,
    extensionsQty: 1,
    lastPost: new Date('2025-01-01'),
    totalComments: 10,
    totalRating: 42,
    downloads: 150,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2025-01-01'),
} as unknown as ContributorDocument;

const eowyDoc = {
  _id: { toString: () => 'mongo-id-eowyn-01' },
  userId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  email: 'eowyn@rohan.me',
  isReviewer: false,
  platforms: ['windows', 'android'],
  contrInfo: {
    username: 'eowyn',
    imgUrl: 'https://cdn.example.com/eowyn.png',
    postsQty: 1,
    videogamesQty: 1,
    extensionsQty: 0,
    lastPost: new Date('2025-02-01'),
    totalComments: 3,
    totalRating: 15,
    downloads: 40,
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-02-01'),
} as unknown as ContributorDocument;

describe('ContributorMapper', () => {
  describe('toDomain', () => {
    it('maps a Mongoose document to a Contributor entity', () => {
      const result = ContributorMapper.toDomain(legolasDoc);

      expect(result).toBeInstanceOf(Contributor);
      expect(result.id).toBe('mongo-id-legolas-01');
      expect(result.userId).toBe('7f3b9c1e-d4a8-4e2b-9f1a-3c5d6e7f8b9c');
      expect(result.email).toBe('legolas@mirkwood.me');
      expect(result.isReviewer).toBe(true);
      expect(result.platforms).toEqual(['windows', 'linux']);
      expect(result.contrInfo.username).toBe('legolas');
      expect(result.contrInfo.postsQty).toBe(3);
      expect(result.contrInfo.totalRating).toBe(42);
      expect(result.isActive).toBe(true);
    });

    it('uses safe defaults when contrInfo fields are missing', () => {
      const sparse = {
        ...legolasDoc,
        contrInfo: {},
        isReviewer: undefined,
        platforms: undefined,
      } as unknown as ContributorDocument;

      const result = ContributorMapper.toDomain(sparse);

      expect(result.isReviewer).toBe(false);
      expect(result.platforms).toEqual([]);
      expect(result.contrInfo.username).toBe('');
      expect(result.contrInfo.postsQty).toBe(0);
      expect(result.isActive).toBe(false);
    });
  });

  describe('toPersistence', () => {
    it('maps a Contributor entity back to a plain persistence object', () => {
      const contributor = ContributorMapper.toDomain(legolasDoc);
      const result = ContributorMapper.toPersistence(contributor);
      const info = result['contrInfo'] as Record<string, unknown>;

      expect(result['userId']).toBe('7f3b9c1e-d4a8-4e2b-9f1a-3c5d6e7f8b9c');
      expect(result['email']).toBe('legolas@mirkwood.me');
      expect(result['isReviewer']).toBe(true);
      expect(info['username']).toBe('legolas');
      expect(info['postsQty']).toBe(3);
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence preserves all data', () => {
      const domain = ContributorMapper.toDomain(eowyDoc);
      const persistence = ContributorMapper.toPersistence(domain);
      const info = persistence['contrInfo'] as Record<string, unknown>;

      expect(persistence['userId']).toBe(eowyDoc.userId);
      expect(info['totalComments']).toBe(3);
      expect(info['totalRating']).toBe(15);
      expect(info['downloads']).toBe(40);
    });
  });

  describe('socials and bio', () => {
    it('maps socials from document to domain', () => {
      const docWithSocials = {
        ...legolasDoc,
        contrInfo: {
          ...legolasDoc.contrInfo,
          bio: 'Elf archer from Mirkwood',
          socials: {
            discord: 'legolas#9999',
            github: 'legolas-mirkwood',
            steam: '',
          },
        },
      } as unknown as ContributorDocument;

      const result = ContributorMapper.toDomain(docWithSocials);

      expect(result.contrInfo.bio).toBe('Elf archer from Mirkwood');
      expect(result.contrInfo.socials['discord']).toBe('legolas#9999');
      expect(result.contrInfo.socials['github']).toBe('legolas-mirkwood');
      // Empty string values are filtered out
      expect(result.contrInfo.socials['steam']).toBeUndefined();
    });

    it('defaults bio to empty string and socials to {} when absent', () => {
      const sparse = {
        ...legolasDoc,
        contrInfo: {},
      } as unknown as ContributorDocument;

      const result = ContributorMapper.toDomain(sparse);

      expect(result.contrInfo.bio).toBe('');
      expect(result.contrInfo.socials).toEqual({});
    });

    it('filters out invalid social platform keys', () => {
      const docWithInvalid = {
        ...legolasDoc,
        contrInfo: {
          ...legolasDoc.contrInfo,
          socials: { discord: 'legolas#9999', invalidKey: 'should-be-removed' },
        },
      } as unknown as ContributorDocument;

      const result = ContributorMapper.toDomain(docWithInvalid);

      expect(result.contrInfo.socials['discord']).toBe('legolas#9999');
      expect(
        (result.contrInfo.socials as Record<string, unknown>)['invalidKey'],
      ).toBeUndefined();
    });
  });
});
