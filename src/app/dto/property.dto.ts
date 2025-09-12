import { PropertyType } from './property-type.enum';

export interface PropertyDTO {
  id?: string;
  name: string;
  description: string;
  type: PropertyType;
  thumbnail: string; // base64 string or URL
}
