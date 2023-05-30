import { ApostilleMetadata } from './ApostilleMetadata';

export interface ApostilleOption {
  metadata?: {
    [key: string]: string;
  };
  isOwner?: boolean;
}
