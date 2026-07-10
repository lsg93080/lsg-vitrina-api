import { Publication } from '../../domain/entities/publication.entity';
import type { PublicationDocument } from '../schemas/publication.schema';

interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export class PublicationMapper {
  static toDomain(doc: PublicationDocument): Publication {
    const timestamps = doc as unknown as WithTimestamps;

    return new Publication(
      doc._id.toString(),
      doc.repoId,
      doc.authorId,
      doc.title,
      doc.shortDescription,
      doc.type,
      doc.esrbRating,
      doc.platforms ?? [],
      doc.tags ?? [],
      doc.releaseYear,
      doc.status,
      doc.totalRating ?? 0,
      doc.totalReviews ?? 0,
      doc.downloads ?? 0,
      doc.thumbnailUrl ?? undefined,
      doc.repoDetailsId ?? null,
      doc.vcsProvider ?? null,
      timestamps.createdAt ?? new Date(),
      timestamps.updatedAt ?? new Date(),
    );
  }

  static toPersistence(publication: Publication): Record<string, unknown> {
    return {
      repoId: publication.repoId,
      authorId: publication.authorId,
      title: publication.title,
      shortDescription: publication.shortDescription,
      type: publication.type,
      esrbRating: publication.esrbRating,
      platforms: publication.platforms,
      tags: publication.tags,
      releaseYear: publication.releaseYear,
      status: publication.status,
      totalRating: publication.totalRating,
      totalReviews: publication.totalReviews,
      downloads: publication.downloads,
      thumbnailUrl: publication.thumbnailUrl ?? null,
      repoDetailsId: publication.repoDetailsId ?? null,
      vcsProvider: publication.vcsProvider ?? null,
    };
  }
}
