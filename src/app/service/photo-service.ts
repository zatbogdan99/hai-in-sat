import {Injectable} from "@angular/core";

@Injectable()
export class PhotoService {
  private static getHorezuData() {
    return [
      {
        itemImageSrc: 'assets/horezu1.jpg',
        alt: 'Horezu',
        title: 'Horezu 1'
      },
      {
        itemImageSrc: 'assets/horezu2.jpg',
        alt: 'Horezu',
        title: 'Horezu 2'
      },
      {
        itemImageSrc: 'assets/horezu3.jpg',
        alt: 'Horezu',
        title: 'Horezu 3'
      },
      {
        itemImageSrc: 'assets/horezu4.jpg',
        alt: 'Horezu',
        title: 'Horezu 4'
      },
      {
        itemImageSrc: 'assets/horezu5.jpg',
        alt: 'Horezu',
        title: 'Horezu 5'
      },
    ];
  }

  private static getCostestiData() {
    return [
      {
        itemImageSrc: 'assets/costesti1.jpg',
        alt: 'Costesti',
        title: 'Costesti 1'
      },
      {
        itemImageSrc: 'assets/costesti2.jpg',
        alt: 'Costesti',
        title: 'Costesti 2'
      },
      {
        itemImageSrc: 'assets/costesti3.jpg',
        alt: 'Costesti',
        title: 'Costesti 3'
      },
      {
        itemImageSrc: 'assets/costesti4.jpg',
        alt: 'Costesti',
        title: 'Costesti 4'
      },
      {
        itemImageSrc: 'assets/costesti5.jpg',
        alt: 'Costesti',
        title: 'Costesti 5'
      },
      {
        itemImageSrc: 'assets/costesti6.jpg',
        alt: 'Costesti',
        title: 'Costesti 6'
      },
    ];
  }

  private static getSlatioaraData() {
    return [
      {
        itemImageSrc: 'assets/slatioara1.jpg',
        alt: 'Slatioara',
        title: 'Slatioara 1'
      }
    ];
  }

  private static getPolovragiData() {
    return [
      {
        itemImageSrc: 'assets/polovragi1.jpg',
        alt: 'Polovragi',
        title: 'Polovragi 1'
      },
      {
        itemImageSrc: 'assets/polovragi2.jpg',
        alt: 'Polovragi',
        title: 'Polovragi 2'
      }
    ];
  }

  private static getBaiaData() {
    return [
      {
        itemImageSrc: 'assets/baia1.jpg',
        alt: 'Baia',
        title: 'Baia 1'
      },
      {
        itemImageSrc: 'assets/baia2.jpg',
        alt: 'Baia',
        title: 'Baia 2'
      },
      {
        itemImageSrc: 'assets/baia3.jpg',
        alt: 'Baia',
        title: 'Baia 3'
      },
      {
        itemImageSrc: 'assets/baia4.jpg',
        alt: 'Baia',
        title: 'Baia 4'
      }
    ];
  }

  private static getVaideeniData() {
    return [
      {
        itemImageSrc: 'assets/vaideeni1.jpg',
        alt: 'Vaideeni',
        title: 'Vaideeni 1'
      },
      {
        itemImageSrc: 'assets/vaideeni2.jpg',
        alt: 'Vaideeni',
        title: 'Vaideeni 2'
      },
      {
        itemImageSrc: 'assets/vaideeni3.jpg',
        alt: 'Vaideeni',
        title: 'Vaideeni 3'
      }
    ];
  }

  private static getBatbatestiData() {
    return [
      {
        itemImageSrc: 'assets/barbatesti1.JPEG',
        alt: 'Barbatesti',
        title: 'Barbatesti 1'
      },
      {
        itemImageSrc: 'assets/barbatesti2.JPEG',
        alt: 'Barbatesti',
        title: 'Barbatesti 2'
      },
      {
        itemImageSrc: 'assets/barbatesti3.JPEG',
        alt: 'Barbatesti',
        title: 'Barbatesti 3'
      }
    ];
  }

  getHorezuImages() {
    return Promise.resolve(PhotoService.getHorezuData());
  }

  getCostestiImages() {
    return Promise.resolve(PhotoService.getCostestiData());
  }

  getSlatioaraImages() {
    return Promise.resolve(PhotoService.getSlatioaraData());
  }

  getPolovragiImages() {
    return Promise.resolve(PhotoService.getPolovragiData());
  }

  getBaiaImages() {
    return Promise.resolve(PhotoService.getBaiaData());
  }

  getVaideeniImages() {
    return Promise.resolve(PhotoService.getVaideeniData());
  }

  getBarbatestiImages() {
    return Promise.resolve(PhotoService.getBatbatestiData());
  }
}
