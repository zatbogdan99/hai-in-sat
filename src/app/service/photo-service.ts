import {Injectable} from "@angular/core";

@Injectable()
export class PhotoService {
  getHorezuData() {
    return [
      {
        itemImageSrc: 'assets/horezu1.jpeg',
        thumbnailImageSrc: 'assets/horezu1thumb.jpeg',
        alt: 'Horezu',
        title: 'Horezu 1'
      },
      {
        itemImageSrc: 'assets/horezu2.jpeg',
        thumbnailImageSrc: 'assets/horezu2thumb.jpeg',
        alt: 'Horezu',
        title: 'Horezu 2'
      },
      {
        itemImageSrc: 'assets/horezu3.jpeg',
        thumbnailImageSrc: 'assets/horezu3thumb.jpeg',
        alt: 'Horezu',
        title: 'Horezu 3'
      },
      {
        itemImageSrc: 'assets/horezu4.jpeg',
        thumbnailImageSrc: 'assets/horezu4thumb.jpeg',
        alt: 'Horezu',
        title: 'Horezu 4'
      },
      {
        itemImageSrc: 'assets/horezu5.jpeg',
        thumbnailImageSrc: 'assets/horezu5thumb.jpeg',
        alt: 'Horezu',
        title: 'Horezu 5'
      },
      {
        itemImageSrc: 'assets/horezu6.jpeg',
        thumbnailImageSrc: 'assets/horezu6thumb.jpeg',
        alt: 'Horezu',
        title: 'Horezu 6'
      },
      {
        itemImageSrc: 'assets/horezu7.jpeg',
        thumbnailImageSrc: 'assets/horezu7thumb.jpeg',
        alt: 'Horezu',
        title: 'Horezu 7'
      },
    ];
  }

  private getCostestiData() {
    return [
      {
        itemImageSrc: 'assets/costesti1.jpeg',
        thumbnailImageSrc: 'assets/costesti1thumb.jpeg',
        alt: 'Costesti',
        title: 'Costesti 1'
      },
      {
        itemImageSrc: 'assets/costesti2.jpeg',
        thumbnailImageSrc: 'assets/costesti2thumb.jpeg',
        alt: 'Costesti',
        title: 'Costesti 2'
      },
      {
        itemImageSrc: 'assets/costesti3.jpeg',
        thumbnailImageSrc: 'assets/costesti3thumb.jpeg',
        alt: 'Costesti',
        title: 'Costesti 3'
      },
      {
        itemImageSrc: 'assets/costesti4.jpeg',
        thumbnailImageSrc: 'assets/costesti4thumb.jpeg',
        alt: 'Costesti',
        title: 'Costesti 4'
      },
      {
        itemImageSrc: 'assets/costesti5.jpeg',
        thumbnailImageSrc: 'assets/costesti5thumb.jpeg',
        alt: 'Costesti',
        title: 'Costesti 5'
      },
      {
        itemImageSrc: 'assets/costesti6.jpeg',
        thumbnailImageSrc: 'assets/costesti6thumb.jpeg',
        alt: 'Costesti',
        title: 'Costesti 6'
      },
      {
        itemImageSrc: 'assets/costesti7.jpeg',
        thumbnailImageSrc: 'assets/costesti7humb.jpeg',
        alt: 'Costesti',
        title: 'Costesti 7'
      },
      {
        itemImageSrc: 'assets/costesti8.jpeg',
        thumbnailImageSrc: 'assets/costesti8thumb.jpeg',
        alt: 'Costesti',
        title: 'Costesti 8'
      },
    ];
  }

  private getSlatioaraData() {
    return undefined;
  }

  private getPolovragiData() {
    return undefined;
  }

  private getBaiaData() {
    return undefined;
  }

  private getVaideeniData() {
    return undefined;
  }

  private getBatbatestiData() {
    return undefined;
  }

  getHorezuImages() {
    return Promise.resolve(this.getHorezuData());
  }

  getCostestiImages() {
    return Promise.resolve(this.getCostestiData());
  }

  getSlatioaraImages() {
    return Promise.resolve(this.getSlatioaraData());
  }

  getPolovragiImages() {
    return Promise.resolve(this.getPolovragiData());
  }

  getBaiaImages() {
    return Promise.resolve(this.getBaiaData());
  }

  getVaideeniImages() {
    return Promise.resolve(this.getVaideeniData());
  }

  getBarbatestiImages() {
    return Promise.resolve(this.getBatbatestiData());
  }
}
