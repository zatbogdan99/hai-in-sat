export class DataDto {
  id: number;
  title: string;
  desc: string;
  photo: string;
  images: any[] | undefined;


  constructor(id: number, title: string, desc: string, photo: string, images: any[] | undefined) {
    this.id = id;
    this.title = title;
    this.desc = desc;
    this.photo = photo;
    this.images = images;
  }
}
