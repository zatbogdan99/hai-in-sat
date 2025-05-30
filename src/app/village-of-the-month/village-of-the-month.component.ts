import {Component, HostListener} from '@angular/core';
import {DataDto} from "../dto/data.dto";
import {VgApiService, VgCoreModule, VgMediaDirective} from "@videogular/ngx-videogular/core";
import {PhotoService} from "../service/photo-service";
import {DataService} from "../service/data-service";
import {gsap, Power2} from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {LoadingService} from "../service/loading-service/loading-service.service";
import {Card} from "primeng/card";
import {YoutubePlayerComponent} from "../youtube-player/youtube-player.component";
import {Button} from "primeng/button";
import {VgControlsModule} from "@videogular/ngx-videogular/controls";
import {VgBufferingModule} from "@videogular/ngx-videogular/buffering";
import {VgOverlayPlayModule} from "@videogular/ngx-videogular/overlay-play";
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
  selector: 'app-village-of-the-month',
  templateUrl: './village-of-the-month.component.html',
  imports: [
    Card,
    YoutubePlayerComponent,
    Button,
    VgControlsModule,
    VgBufferingModule,
    VgOverlayPlayModule,
    VgCoreModule,
    ProgressSpinner
  ],
  styleUrls: ['./village-of-the-month.component.scss']
})
export class VillageOfTheMonthComponent {
  horezuImages: any[] | undefined;
  costestiImages: any[] | undefined;
  slatioaraImages: any[] | undefined;
  polovragiImages: any[] | undefined;
  baiaImages: any[] | undefined;
  vaideeniImages: any[] | undefined;
  barbatestiImages: any[] | undefined;

  satulRapa1 = 'https://storage.googleapis.com/hai-in-sat-assets/videos/satul_rapa1.mp4';
  satulRapa2 = 'https://storage.googleapis.com/hai-in-sat-assets/videos/satul_rapa2.mp4';
  satulRacovita = 'https://storage.googleapis.com/hai-in-sat-assets/videos/satul_racovita.mp4';
  lectieSpiritualitate = 'https://storage.googleapis.com/hai-in-sat-assets/videos/lectie%20spiritualitate.mov';

  data: DataDto[] = [];

  villageId: number = 2;

  preload: string = 'auto';
  api: VgApiService = new VgApiService;

  responsiveOptions: any[] | undefined;

  isMobile: boolean | undefined;


  constructor(private photoService: PhotoService,
              private service: DataService,
              public loadingService: LoadingService) {
    this.checkScreenSize();

    this.photoService.getHorezuImages().then((images) => {
      this.horezuImages = images;
    });
    this.photoService.getCostestiImages().then((images) => (this.costestiImages = images));
    this.photoService.getPolovragiImages().then((images) => (this.polovragiImages = images));
    this.photoService.getSlatioaraImages().then((images) => (this.slatioaraImages = images));
    this.photoService.getBaiaImages().then((images) => (this.baiaImages = images));
    this.photoService.getBarbatestiImages().then((images) => (this.barbatestiImages = images));
    this.photoService.getVaideeniImages().then((images) => (this.vaideeniImages = images));

    let dataDto;

    dataDto = new DataDto(
      1,
      "Racovița",
      "",
      "",
      null,
      null,
      ""
    );
    this.data.push(dataDto);

    dataDto = new DataDto(
      0,
      "Râpa",
      "",
      "",
      null,
      null,
      ""
    );
    this.data.push(dataDto);

    dataDto = new DataDto(
      2, //satul lunii
      "Olari",
      "",
      "",
      null,
      null,
      ""
    );
    this.data.push(dataDto);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 500;
  }

  ngOnInit(): void {
    this.loadingService.loadingOn();
    gsap.registerPlugin(ScrollTrigger);

    let revealContainers = document.querySelectorAll(".reveal");
    revealContainers.forEach((container) => {
      let image = container.querySelector("img");
      let t1 = gsap.timeline({
        scrollTrigger: {
          trigger: container,
        }
      });
      t1.set(container, {autoAlpha: 1});
      t1.from(container, 1.5, {
        xPercent: -100,
        ease: Power2.easeOut
      });
      t1.from(image, 1.5, {
        xPercent: 100,
        scale: 1.3,
        delay: -1.5,
        ease: Power2.easeOut
      });
    })

    this.responsiveOptions = [
      {
        breakpoint: '1024px',
        numVisible: 5
      },
      {
        breakpoint: '768px',
        numVisible: 3
      },
      {
        breakpoint: '560px',
        numVisible: 1
      }
    ];

  }

  onPlayerReady(source: VgApiService) {
    this.api = source;

    this.api.getDefaultMedia().subscriptions.loadedMetadata.subscribe(() => {
      this.loadingService.loadingOff();
    });

    this.api.getDefaultMedia().subscriptions.error.subscribe(() => {
      this.loadingService.loadingOff();
      console.error('Error loading video');
    });
  }

  checkBuffering(): void {

  }

  autoplay() {
    this.api.play();
  }

  changeVillage(villageId: number) {
    this.villageId = villageId;
  }

  //deprecated
  getSrcByVillageId() {
    if (this.villageId === 0) {
      return this.satulRacovita;
    } else {
      return this.satulRapa1;
    }
  }

  getYoutubeIdByVillage() {
    if (this.villageId === 0) {
      return '39ZT4sLPxs4';
    } else if (this.villageId === 1) {
      return 'rI43JSfG188';
    } else {
      return 'Ly4Gp7sRKBE';
    }
  }
}
