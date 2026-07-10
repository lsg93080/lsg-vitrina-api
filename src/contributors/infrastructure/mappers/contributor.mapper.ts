import {
  Contributor,
  ContrInfo,
} from '../../domain/entities/contributor.entity';
import type { ContributorDocument } from '../schemas/contributor.schema';
import { SocialPlatform } from '../../domain/value-objects/social-platform.enum';

// Mongoose timestamps: true adds these fields but they are not declared in the schema class
interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export class ContributorMapper {
  static toDomain(doc: ContributorDocument): Contributor {
    const info = doc.contrInfo ?? {};
    const timestamps = doc as unknown as WithTimestamps;

    // Filter out keys that are not valid SocialPlatform values (defensive, in case of legacy data)
    const validSocialKeys = new Set<string>(Object.values(SocialPlatform));
    const rawSocials = (info.socials ?? {}) as Record<string, string>;
    const socials: Partial<Record<SocialPlatform, string>> = {};
    for (const [k, v] of Object.entries(rawSocials)) {
      if (validSocialKeys.has(k) && v) {
        socials[k as SocialPlatform] = v;
      }
    }

    const contrInfo: ContrInfo = {
      username: info.username ?? '',
      imgUrl: info.imgUrl ?? '',
      bio: info.bio ?? '',
      postsQty: info.postsQty ?? 0,
      videogamesQty: info.videogamesQty ?? 0,
      extensionsQty: info.extensionsQty ?? 0,
      lastPost: info.lastPost ?? null,
      totalComments: info.totalComments ?? 0,
      totalRating: info.totalRating ?? 0,
      downloads: info.downloads ?? 0,
      socials,
    };

    return new Contributor(
      doc._id.toString(),
      doc.userId,
      doc.email,
      doc.isReviewer ?? false,
      doc.platforms ?? [],
      contrInfo,
      timestamps.createdAt ?? new Date(),
      timestamps.updatedAt ?? new Date(),
    );
  }

  static toPersistence(contributor: Contributor): Record<string, unknown> {
    return {
      userId: contributor.userId,
      email: contributor.email,
      isReviewer: contributor.isReviewer,
      platforms: contributor.platforms,
      contrInfo: { ...contributor.contrInfo },
    };
  }
}
