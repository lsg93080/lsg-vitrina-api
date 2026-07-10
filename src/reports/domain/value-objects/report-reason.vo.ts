export enum ReportReason {
  NSFW = 'nsfw',
  INAPPROPRIATE = 'inappropriate',
  MALWARE = 'malware',
  COPYRIGHT = 'copyright',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  DISMISSED = 'dismissed',
  WARNED = 'warned',
  SUSPENDED = 'suspended',
}
