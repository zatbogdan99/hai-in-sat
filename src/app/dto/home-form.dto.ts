import { PropertyType } from './property-type.enum';

export class HomeFormDto {
  name: string = '';
  surname: string = '';
  phone: string = '';
  mail: string = '';
  details: string = '';
  propertyType: PropertyType = PropertyType.HOUSE;

  constructor() {}
}
