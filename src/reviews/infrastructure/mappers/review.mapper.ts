import { Review } from '../../domain/entities/review.entity';
import type { ReviewDocument } from '../schemas/review.schema';

interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewMapper {
  static toDomain(doc: ReviewDocument): Review {
    const timestamps = doc as unknown as WithTimestamps;

    return new Review(
      doc._id.toString(),
      doc.repoId,
      doc.releaseId,
      doc.authorId,
      doc.rating,
      doc.title,
      doc.comment,
      timestamps.createdAt ?? new Date(),
      timestamps.updatedAt ?? new Date(),
    );
  }

  static toPersistence(review: Review): Record<string, unknown> {
    return {
      repoId: review.repoId,
      releaseId: review.releaseId,
      authorId: review.authorId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
    };
  }
}
