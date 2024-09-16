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

  private static getBaiaTeren() {
    return [
      {
        itemImageSrc: 'assets/teren_baia1.jpg',
        alt: 'Teren Baia',
        title: 'Teren Baia 1'
      },
      {
        itemImageSrc: 'assets/teren_baia2.jpg',
        alt: 'Teren Baia',
        title: 'Teren Baia2 2'
      }
    ];
  }

  private static getMilosteaPensionData() {
    return [
      {
        itemImageSrc: 'assets/pensiune1.avif',
        alt: 'Pensiune Milostea',
        title: 'Pensiune Milostea 1'
      },
      {
        itemImageSrc: 'assets/pensiune2.avif',
        alt: 'Pensiune Milostea',
        title: 'Pensiune Milostea 2'
      },
      {
        itemImageSrc: 'assets/pensiune3.avif',
        alt: 'Pensiune Milostea',
        title: 'Pensiune Milostea 3'
      },
      {
        "itemImageSrc": "assets/pensiune4.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 4"
      },
      // {
      //   "itemImageSrc": "assets/pensiune5.avif",
      //   "alt": "Pensiune Milostea",
      //   "title": "Pensiune Milostea 5"
      // },
      {
        "itemImageSrc": "assets/pensiune6.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 6"
      },
      {
        "itemImageSrc": "assets/pensiune7.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 7"
      },
      {
        "itemImageSrc": "assets/pensiune8.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 8"
      },
      {
        "itemImageSrc": "assets/pensiune9.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 9"
      },
      {
        "itemImageSrc": "assets/pensiune10.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 10"
      },
      {
        "itemImageSrc": "assets/pensiune11.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 11"
      },
      {
        "itemImageSrc": "assets/pensiune12.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 12"
      },
      {
        "itemImageSrc": "assets/pensiune13.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 13"
      },
      {
        "itemImageSrc": "assets/pensiune14.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 14"
      },
      {
        "itemImageSrc": "assets/pensiune15.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 15"
      },
      {
        "itemImageSrc": "assets/pensiune16.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 16"
      },
      {
        "itemImageSrc": "assets/pensiune17.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 17"
      },
      {
        "itemImageSrc": "assets/pensiune18.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 18"
      },
      {
        "itemImageSrc": "assets/pensiune19.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 19"
      },
      {
        "itemImageSrc": "assets/pensiune20.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 20"
      },
      {
        "itemImageSrc": "assets/pensiune21.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 21"
      },
      {
        "itemImageSrc": "assets/pensiune22.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 22"
      },
      {
        "itemImageSrc": "assets/pensiune23.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 23"
      },
      {
        "itemImageSrc": "assets/pensiune24.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 24"
      },
      {
        "itemImageSrc": "assets/pensiune25.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 25"
      },
      {
        "itemImageSrc": "assets/pensiune26.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 26"
      },
      {
        "itemImageSrc": "assets/pensiune27.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 27"
      },
      {
        "itemImageSrc": "assets/pensiune28.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 28"
      },
      {
        "itemImageSrc": "assets/pensiune29.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 29"
      },
      {
        "itemImageSrc": "assets/pensiune30.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 30"
      },
      {
        "itemImageSrc": "assets/pensiune31.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 31"
      },
      {
        "itemImageSrc": "assets/pensiune32.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 32"
      },
      {
        "itemImageSrc": "assets/pensiune33.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 33"
      },
      {
        "itemImageSrc": "assets/pensiune34.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 34"
      },
      {
        "itemImageSrc": "assets/pensiune35.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 35"
      },
      {
        "itemImageSrc": "assets/pensiune36.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 36"
      },
      {
        "itemImageSrc": "assets/pensiune37.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 37"
      },
      {
        "itemImageSrc": "assets/pensiune38.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 38"
      },
      {
        "itemImageSrc": "assets/pensiune40.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 40"
      },
      {
        "itemImageSrc": "assets/pensiune41.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 41"
      },
      {
        "itemImageSrc": "assets/pensiune42.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 42"
      },
      {
        "itemImageSrc": "assets/pensiune43.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 43"
      },
      {
        "itemImageSrc": "assets/pensiune44.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 44"
      },
      {
        "itemImageSrc": "assets/pensiune45.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 45"
      },
      {
        "itemImageSrc": "assets/pensiune46.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 46"
      },
      {
        "itemImageSrc": "assets/pensiune47.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 47"
      },
      {
        "itemImageSrc": "assets/pensiune48.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 48"
      },
      {
        "itemImageSrc": "assets/pensiune49.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 49"
      },
      {
        "itemImageSrc": "assets/pensiune50.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 50"
      },
      {
        "itemImageSrc": "assets/pensiune51.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 51"
      },
      {
        "itemImageSrc": "assets/pensiune52.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 52"
      },
      {
        "itemImageSrc": "assets/pensiune53.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 53"
      },
      {
        "itemImageSrc": "assets/pensiune54.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 54"
      },
      {
        "itemImageSrc": "assets/pensiune55.avif",
        "alt": "Pensiune Milostea",
        "title": "Pensiune Milostea 55"
      }

    ];
  }

  private static getTerenPolovragi() {
    return [
      {
        itemImageSrc: 'assets/teren_polovragi1.avif',
        alt: 'Teren Polovragi',
        title: 'Teren Polovragi 1'
      },
      {
        itemImageSrc: 'assets/teren_polovragi2.avif',
        alt: 'Teren Polovragi',
        title: 'Teren Polovragi 2'
      },
      {
        itemImageSrc: 'assets/teren_polovragi3.avif',
        alt: 'Teren Polovragi',
        title: 'Teren Polovragi 3'
      },
      {
        itemImageSrc: 'assets/teren_polovragi4.avif',
        alt: 'Teren Polovragi',
        title: 'Teren Polovragi 4'
      },
      {
        itemImageSrc: 'assets/teren_polovragi5.avif',
        alt: 'Teren Polovragi',
        title: 'Teren Polovragi 5'
      }
    ];
  }

  getHorezuImages() {
    return Promise.resolve(PhotoService.getHorezuData());
  }

  getMilosteaPension() {
    return Promise.resolve(PhotoService.getMilosteaPensionData());
  }

  getBaiaTeren() {
    return Promise.resolve(PhotoService.getBaiaTeren());
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

  getTerenPolovragi() {
    return Promise.resolve(PhotoService.getTerenPolovragi());
  }
}
