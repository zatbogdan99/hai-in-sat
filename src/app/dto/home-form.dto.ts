export class HomeFormDto {
  name: string = '';
  surname: string = '';
  phone: string = '';
  mail: string = '';
  price: string = '';
  distance: string = '';
  mentions: string = '';
  nearRiver: boolean = false;
  withNeighbours: boolean = false;

  constructor() {
  }
}
