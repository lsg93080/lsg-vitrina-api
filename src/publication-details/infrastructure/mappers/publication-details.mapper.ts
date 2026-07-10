import { PublicationDetails } from '../../domain/entities/publication-details.entity';
import type { PublicationDetailsDocument } from '../schemas/publication-details.schema';

interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export class PublicationDetailsMapper {
  static toDomain(doc: PublicationDetailsDocument): PublicationDetails {
    const timestamps = doc as unknown as WithTimestamps;

    return new PublicationDetails(
      doc._id.toString(),
      doc.repoId,
      doc.authorId,
      doc.longDescription,
      doc.repoUrl,
      doc.license ?? '',
      doc.defaultBranch,
      doc.repoDoc ?? '',
      doc.images ?? [],
      doc.reviewers ?? [],
      timestamps.createdAt ?? new Date(),
      timestamps.updatedAt ?? new Date(),
    );
  }

  static toPersistence(details: PublicationDetails): Record<string, unknown> {
    return {
      repoId: details.repoId,
      authorId: details.authorId,
      longDescription: details.longDescription,
      repoUrl: details.repoUrl,
      license: details.license,
      defaultBranch: details.defaultBranch,
      repoDoc: details.repoDoc,
      images: details.images,
      reviewers: details.reviewers,
    };
  }
}
