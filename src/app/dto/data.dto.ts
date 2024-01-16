export class DataDto {
  id: number;
  title: string;
  desc: string;
  photo: string;


  constructor(id: number, title: string, desc: string, photo: string) {
    this.id = id;
    this.title = title;
    this.desc = desc;
    this.photo = photo;
  }
}
