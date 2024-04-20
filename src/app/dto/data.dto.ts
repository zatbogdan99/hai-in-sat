export class DataDto {
  id: number;
  title: string;
  desc: string;
  secondDesc1: string;
  secondDesc2: string;
  secondDesc3: string;
  photo: string;
  images: any[] | undefined;


  constructor(id: number, title: string, desc: string, secondDesc1: string, secondDesc2: string, secondDesc3: string, photo: string, images: any[] | undefined) {
    this.id = id;
    this.title = title;
    this.desc = desc;
    this.secondDesc1 = secondDesc1;
    this.secondDesc2 = secondDesc2;
    this.secondDesc3 = secondDesc3;
    this.photo = photo;
    this.images = images;
  }
}
