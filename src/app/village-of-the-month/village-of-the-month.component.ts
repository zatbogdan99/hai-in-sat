import { Component } from '@angular/core';
import {DataDto} from "../dto/data.dto";
import {VgApiService, VgMediaDirective} from "@videogular/ngx-videogular/core";
import {PhotoService} from "../service/photo-service";
import {DataService} from "../service/data-service";
import {gsap, Power2} from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {LoadingService} from "../service/loading-service/loading-service.service";

@Component({
  selector: 'app-village-of-the-month',
  templateUrl: './village-of-the-month.component.html',
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

  data: DataDto[] = [];

  villageId: number = 0;

  preload: string = 'auto';
  api: VgApiService = new VgApiService;

  responsiveOptions: any[] | undefined;


  constructor(private photoService: PhotoService,
              private service: DataService,
              public loadingService: LoadingService) {
    this.villageId = 0;

    this.photoService.getHorezuImages().then((images) => {
      this.horezuImages = images;
    });
    this.photoService.getCostestiImages().then((images) => (this.costestiImages = images));
    this.photoService.getPolovragiImages().then((images) => (this.polovragiImages = images));
    this.photoService.getSlatioaraImages().then((images) => (this.slatioaraImages = images));
    this.photoService.getBaiaImages().then((images) => (this.baiaImages = images));
    this.photoService.getBarbatestiImages().then((images) => (this.barbatestiImages = images));
    this.photoService.getVaideeniImages().then((images) => (this.vaideeniImages = images));

    let dataDto = new DataDto(
      0, //satul lunii
      "Râpa",
      "",
      "",
      null,
      null,
      ""
    );
    this.data.push(dataDto);
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
}
