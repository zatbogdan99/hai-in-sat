export class DataDto {
  id: number;
  title: string;
  desc: string;
  secondDesc1: string | null;
  secondDesc2: string | null;
  secondDesc3: string | null;
  photo: string;


  constructor(id: number, title: string, desc: string, secondDesc1: string | null, secondDesc2: string | null, secondDesc3: string | null, photo: string) {
    this.id = id;
    this.title = title;
    this.desc = desc;
    this.secondDesc1 = secondDesc1;
    this.secondDesc2 = secondDesc2;
    this.secondDesc3 = secondDesc3;
    this.photo = photo;
  }
}
