import { Release, ReleaseStatus } from '../../domain/value-objects/release.vo';
import type { ReleaseDocument } from '../schemas/release.schema';

interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export class ReleaseMapper {
  static toDomain(doc: ReleaseDocument): Release {
    const timestamps = doc as unknown as WithTimestamps;

    return new Release(
      doc._id.toString(),
      doc.repoId,
      doc.version,
      doc.title,
      doc.shortDescription,
      doc.releaseNotes ?? '',
      doc.releaseDate,
      doc.downloadUrl ?? undefined,
      doc.status ?? ReleaseStatus.PENDING,
      doc.totalRating ?? 0,
      doc.totalReviews ?? 0,
      timestamps.createdAt ?? new Date(),
      timestamps.updatedAt ?? new Date(),
    );
  }

  static toPersistence(release: Release): Record<string, unknown> {
    return {
      repoId: release.repoId,
      version: release.version,
      title: release.title,
      shortDescription: release.shortDescription,
      releaseNotes: release.releaseNotes,
      releaseDate: release.releaseDate,
      downloadUrl: release.downloadUrl ?? null,
      status: release.status,
      totalRating: release.totalRating,
      totalReviews: release.totalReviews,
    };
  }
}
