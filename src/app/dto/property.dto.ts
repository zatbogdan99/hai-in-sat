import { PropertyType } from './property-type.enum';

export interface PropertyDTO {
  id?: string;
  name: string;
  description: string;
  type: PropertyType;
  thumbnail: string; // base64 string or URL
  photos?: string[]; // base64 strings for gallery images
  sortOrder?: number;
  videoUrl?: string | null; // public URL pentru tur video; populat de backend din GCS bucket
}
