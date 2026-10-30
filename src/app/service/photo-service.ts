import {Injectable} from "@angular/core";

@Injectable()
export class PhotoService {
  private static getHorezuData() {
    return [
      {
        itemImageSrc: 'assets/horezu1.avif',
        width: 4000,
        height: 6000,
        alt: 'Horezu',
        title: 'Horezu 1'
      },
      {
        itemImageSrc: 'assets/horezu2.avif',
        width: 6000,
        height: 4000,
        alt: 'Horezu',
        title: 'Horezu 2'
      },
      {
        itemImageSrc: 'assets/horezu3.avif',
        width: 4000,
        height: 6000,
        alt: 'Horezu',
        title: 'Horezu 3'
      },
      // {
      //   itemImageSrc: 'assets/horezu4.avif',
      //   alt: 'Horezu',
      //   title: 'Horezu 4'
      // },
      // {
      //   itemImageSrc: 'assets/horezu5.avif',
      //   alt: 'Horezu',
      //   title: 'Horezu 5'
      // },
    ];
  }

  private static getCostestiData() {
    return [
      {
        itemImageSrc: 'assets/costesti1.avif',
        width: 4000,
        height: 6000,
        alt: 'Costesti',
        title: 'Costesti 1'
      },
      {
        itemImageSrc: 'assets/costesti2.avif',
        width: 6000,
        height: 4000,
        alt: 'Costesti',
        title: 'Costesti 2'
      },
      {
        itemImageSrc: 'assets/costesti3.avif',
        width: 4000,
        height: 6000,
        alt: 'Costesti',
        title: 'Costesti 3'
      },
      // {
      //   itemImageSrc: 'assets/costesti4 - old.avif',
      //   alt: 'Costesti',
      //   title: 'Costesti 4'
      // },
      // {
      //   itemImageSrc: 'assets/costesti5 - old.avif',
      //   alt: 'Costesti',
      //   title: 'Costesti 5'
      // },
      // {
      //   itemImageSrc: 'assets/costesti6 - old.avif',
      //   alt: 'Costesti',
      //   title: 'Costesti 6'
      // },
      // {
      //   itemImageSrc: 'assets/costesti7 - old.avif',
      //   alt: 'Costesti',
      //   title: 'Costesti 7'
      // },
      // {
      //   itemImageSrc: 'assets/costesti8.avif',
      //   alt: 'Costesti',
      //   title: 'Costesti 8'
      // },
    ];
  }

  private static getSlatioaraData() {
    return [
      {
        itemImageSrc: 'assets/slatioara1.avif',
        width: 6000,
        height: 4000,
        alt: 'Slatioara',
        title: 'Slatioara 1'
      }
    ];
  }

  private static getPolovragiData() {
    return [
      {
        itemImageSrc: 'assets/polovragi1.avif',
        width: 4000,
        height: 6000,
        alt: 'Polovragi',
        title: 'Polovragi 1'
      },
      {
        itemImageSrc: 'assets/polovragi2.avif',
        width: 4000,
        height: 6000,
        alt: 'Polovragi',
        title: 'Polovragi 2'
      },
      {
        itemImageSrc: 'assets/polovragi3.avif',
        width: 4000,
        height: 6000,
        alt: 'Polovragi',
        title: 'Polovragi 3'
      }
    ];
  }

  private static getBaiaData() {
    return [
      {
        itemImageSrc: 'assets/baia1.avif',
        width: 4000,
        height: 6000,
        alt: 'Baia',
        title: 'Baia 1'
      },
      {
        itemImageSrc: 'assets/baia2.avif',
        width: 4000,
        height: 6000,
        alt: 'Baia',
        title: 'Baia 2'
      },
      {
        itemImageSrc: 'assets/baia3.avif',
        width: 4000,
        height: 6000,
        alt: 'Baia',
        title: 'Baia 3'
      }
    ];
  }

  private static getVaideeniData() {
    return [
      {
        itemImageSrc: 'assets/vaideeni1.avif',
        width: 1140,
        height: 670,
        alt: 'Vaideeni',
        title: 'Vaideeni 1'
      },
      {
        itemImageSrc: 'assets/vaideeni2.avif',
        width: 4000,
        height: 6000,
        alt: 'Vaideeni',
        title: 'Vaideeni 2'
      },
      {
        itemImageSrc: 'assets/vaideeni3.avif',
        width: 4000,
        height: 6000,
        alt: 'Vaideeni',
        title: 'Vaideeni 3'
      },
      // {
      //   itemImageSrc: 'assets/vaideeni4.avif',
      //   alt: 'Vaideeni',
      //   title: 'Vaideeni 4'
      // }
    ];
  }

  private static getBatbatestiData() {
    return [
      {
        itemImageSrc: 'assets/barbatesti1.avif',
        width: 1536,
        height: 2048,
        alt: 'Barbatesti',
        title: 'Barbatesti 1'
      },
      {
        itemImageSrc: 'assets/barbatesti2.avif',
        width: 1536,
        height: 2048,
        alt: 'Barbatesti',
        title: 'Barbatesti 2'
      },
      {
        itemImageSrc: 'assets/barbatesti3.avif',
        width: 1536,
        height: 2048,
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
