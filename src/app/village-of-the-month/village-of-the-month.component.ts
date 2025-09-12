import {Component, HostListener, OnInit} from '@angular/core';
import {DataDto} from "../dto/data.dto";
import {VgApiService, VgCoreModule} from "@videogular/ngx-videogular/core";
import {PhotoService} from "../service/photo-service";
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
import {AsyncPipe, NgIf, NgStyle} from "@angular/common";
import {Divider} from "primeng/divider";

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
    ProgressSpinner,
    NgIf,
    NgStyle,
    AsyncPipe,
    Divider
  ],
  styleUrls: ['./village-of-the-month.component.scss']
})
export class VillageOfTheMonthComponent implements OnInit {
  horezuImages: any[] | undefined;
  costestiImages: any[] | undefined;
  slatioaraImages: any[] | undefined;
  polovragiImages: any[] | undefined;
  baiaImages: any[] | undefined;
  vaideeniImages: any[] | undefined;
  barbatestiImages: any[] | undefined;

  data: DataDto[] = [];

  // Index in the data array for the currently selected village
  villageId: number = 2;

  // Computed navigation order and neighbors
  order: number[] = [];
  prevId: number | null = null;
  nextId: number | null = null;

  preload: string = 'auto';
  api: VgApiService = new VgApiService;

  responsiveOptions: any[] | undefined;

  isMobile: boolean | undefined;


  constructor(private photoService: PhotoService,
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

    // Establish chronological order by months: iulie(0) -> august(2) -> septembrie(1)
    this.order = [0, 2, 1].filter((idx) => idx >= 0 && idx < this.data.length);
    this.updateNeighbors();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 500;
  }

  ngOnInit(): void {
    // this.loadingService.loadingOn();
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

    // Ensure neighbors are in sync on init
    this.updateNeighbors();
  }

  private updateNeighbors() {
    if (!this.order || this.order.length === 0) {
      this.prevId = null;
      this.nextId = null;
      return;
    }
    const currentIndexInOrder = this.order.indexOf(this.villageId);
    if (currentIndexInOrder === -1) {
      this.prevId = null;
      this.nextId = null;
      return;
    }
    this.prevId = currentIndexInOrder > 0 ? this.order[currentIndexInOrder - 1] : null;
    this.nextId = currentIndexInOrder < this.order.length - 1 ? this.order[currentIndexInOrder + 1] : null;
  }

  changeVillage(villageId: number) {
    this.villageId = villageId;
    this.updateNeighbors();
  }

  goPrev() {
    if (this.prevId !== null) {
      this.changeVillage(this.prevId);
    }
  }

  goNext() {
    if (this.nextId !== null) {
      this.changeVillage(this.nextId);
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

  getMonthLabelByVillage(id: number | null): string {
    if (id === 0) return 'iulie';
    if (id === 2) return 'august';
    if (id === 1) return 'septembrie';
    if (id === null || id === undefined) return '';
    // Fallback to village title if an unexpected id appears
    return this.data[id]?.title ?? '';
  }
}
