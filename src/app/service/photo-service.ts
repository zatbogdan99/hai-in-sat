import {Injectable} from "@angular/core";

@Injectable()
export class PhotoService {
  private static getHorezuData() {
    return [
      {
        itemImageSrc: 'assets/horezu1.avif',
        alt: 'Horezu',
        title: 'Horezu 1'
      },
      {
        itemImageSrc: 'assets/horezu2.avif',
        alt: 'Horezu',
        title: 'Horezu 2'
      },
      {
        itemImageSrc: 'assets/horezu3.avif',
        alt: 'Horezu',
        title: 'Horezu 3'
      },
      {
        itemImageSrc: 'assets/horezu4.avif',
        alt: 'Horezu',
        title: 'Horezu 4'
      },
      {
        itemImageSrc: 'assets/horezu5.avif',
        alt: 'Horezu',
        title: 'Horezu 5'
      },
    ];
  }

  private static getCostestiData() {
    return [
      {
        itemImageSrc: 'assets/costesti1.avif',
        alt: 'Costesti',
        title: 'Costesti 1'
      },
      {
        itemImageSrc: 'assets/costesti2.avif',
        alt: 'Costesti',
        title: 'Costesti 2'
      },
      {
        itemImageSrc: 'assets/costesti3.avif',
        alt: 'Costesti',
        title: 'Costesti 3'
      },
      {
        itemImageSrc: 'assets/costesti4.avif',
        alt: 'Costesti',
        title: 'Costesti 4'
      },
      {
        itemImageSrc: 'assets/costesti5.avif',
        alt: 'Costesti',
        title: 'Costesti 5'
      },
      {
        itemImageSrc: 'assets/costesti6.avif',
        alt: 'Costesti',
        title: 'Costesti 6'
      },
      {
        itemImageSrc: 'assets/costesti7.avif',
        alt: 'Costesti',
        title: 'Costesti 7'
      },
      {
        itemImageSrc: 'assets/costesti8.avif',
        alt: 'Costesti',
        title: 'Costesti 8'
      },
    ];
  }

  private static getSlatioaraData() {
    return [
      {
        itemImageSrc: 'assets/slatioara1.avif',
        alt: 'Slatioara',
        title: 'Slatioara 1'
      }
    ];
  }

  private static getPolovragiData() {
    return [
      {
        itemImageSrc: 'assets/polovragi1.avif',
        alt: 'Polovragi',
        title: 'Polovragi 1'
      },
      {
        itemImageSrc: 'assets/polovragi2.avif',
        alt: 'Polovragi',
        title: 'Polovragi 2'
      },
      {
        itemImageSrc: 'assets/polovragi3.avif',
        alt: 'Polovragi',
        title: 'Polovragi 3'
      }
    ];
  }

  private static getBaiaData() {
    return [
      {
        itemImageSrc: 'assets/baia1.avif',
        alt: 'Baia',
        title: 'Baia 1'
      },
      {
        itemImageSrc: 'assets/baia2.avif',
        alt: 'Baia',
        title: 'Baia 2'
      },
      {
        itemImageSrc: 'assets/baia3.avif',
        alt: 'Baia',
        title: 'Baia 3'
      }
    ];
  }

  private static getVaideeniData() {
    return [
      {
        itemImageSrc: 'assets/vaideeni1.avif',
        alt: 'Vaideeni',
        title: 'Vaideeni 1'
      },
      {
        itemImageSrc: 'assets/vaideeni2.avif',
        alt: 'Vaideeni',
        title: 'Vaideeni 2'
      },
      {
        itemImageSrc: 'assets/vaideeni3.avif',
        alt: 'Vaideeni',
        title: 'Vaideeni 3'
      },
      {
        itemImageSrc: 'assets/vaideeni4.avif',
        alt: 'Vaideeni',
        title: 'Vaideeni 4'
      }
    ];
  }

  private static getBatbatestiData() {
    return [
      {
        itemImageSrc: 'assets/barbatesti1.avif',
        alt: 'Barbatesti',
        title: 'Barbatesti 1'
      },
      {
        itemImageSrc: 'assets/barbatesti2.avif',
        alt: 'Barbatesti',
        title: 'Barbatesti 2'
      },
      {
        itemImageSrc: 'assets/barbatesti3.avif',
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
