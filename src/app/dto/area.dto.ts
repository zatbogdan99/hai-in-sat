export class AreaDto {
  id: number;
  name: string;
  description: string;
  productType: string;
  price: number;
  photo: any;
  stock: number;


  constructor(id: number, name: string, description: string, productType: string, price: number, photo: any, stock: number) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.productType = productType;
    this.price = price;
    this.photo = photo;
    this.stock = stock;
  }
}


