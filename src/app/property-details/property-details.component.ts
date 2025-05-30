import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PhotoService } from '../service/photo-service';
import { BuyEnum } from '../dto/buy.enum';
import { LoadingService } from '../service/loading-service/loading-service.service';

@Component({
  selector: 'app-property-details',
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit {
  propertyId: string;
  propertyType: BuyEnum;
  propertyName: string = '';
  propertyDescription: string = '';
  images: any[] | undefined;

  responsiveOptions: any[] = [
    {
      breakpoint: '1500px',
      numVisible: 5
    },
    {
      breakpoint: '1024px',
      numVisible: 3
    },
    {
      breakpoint: '768px',
      numVisible: 2
    },
    {
      breakpoint: '560px',
      numVisible: 1
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    public loadingService: LoadingService
  ) {
    this.propertyId = '';
    this.propertyType = BuyEnum.MILOSTEA;
  }

  ngOnInit(): void {
    this.loadingService.loadingOn();
    this.route.params.subscribe(params => {
      this.propertyId = params['id'];
      this.loadPropertyDetails();
    });
  }

  loadPropertyDetails(): void {
    // Convert string ID to enum
    this.propertyType = BuyEnum[this.propertyId as keyof typeof BuyEnum];

    // Load property details based on ID
    switch (this.propertyType) {
      case BuyEnum.MILOSTEA:
        this.propertyName = 'Pensiune în Milostea';
        this.propertyDescription = 'Pensiune cu 16 camere. Utilități: Gratar/Restaurant/Terasa/Sala de evenimente. Afacere la cheie.';
        this.photoService.getMilosteaPension().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.BAIA_TEREN:
        this.propertyName = 'Teren în Baia de Fier';
        this.propertyDescription = 'Teren la drum asfaltat. Utilități la 200 de metri. Suprafață intravilan: 1948 mp. Suprafață extravilan: 5840 mp';
        this.photoService.getBaiaTeren().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.POLOVRAGI_TEREN:
        this.propertyName = 'Teren în Polovragi';
        this.propertyDescription = 'Teren cu utilități. Suprafață: 8000 mp. Situat într-o zonă pitorească';
        this.photoService.getTerenPolovragi().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.HOREZU:
        this.propertyName = 'Casă în Horezu';
        this.propertyDescription = 'Casă tradițională în Horezu, zonă renumită pentru ceramica sa. Aproape de mănăstirea Horezu, patrimoniu UNESCO.';
        this.photoService.getHorezuImages().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.COSTESTI:
        this.propertyName = 'Casă în Costești';
        this.propertyDescription = 'Proprietate în Costești, aproape de Cheile Oltețului și Peștera Polovragi. Zonă cu peisaje spectaculoase.';
        this.photoService.getCostestiImages().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.SLATIOARA:
        this.propertyName = 'Casă în Slătioara';
        this.propertyDescription = 'Casă în Slătioara, într-o zonă liniștită cu acces la natură și aer curat. Perfectă pentru relaxare.';
        this.photoService.getSlatioaraImages().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.POLOVRAGI:
        this.propertyName = 'Casă în Polovragi';
        this.propertyDescription = 'Casă în Polovragi, aproape de mănăstire și de intrarea în Cheile Oltețului. Zonă turistică în plină dezvoltare.';
        this.photoService.getPolovragiImages().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.BAIA:
        this.propertyName = 'Casă în Baia de Fier';
        this.propertyDescription = 'Casă în Baia de Fier, aproape de Peștera Muierilor. Zonă cu tradiții și peisaje montane.';
        this.photoService.getBaiaImages().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.VAIDEENI:
        this.propertyName = 'Casă în Vaideeni';
        this.propertyDescription = 'Proprietate în Vaideeni, zonă pastorală cu tradiții puternice și peisaje montane spectaculoase.';
        this.photoService.getVaideeniImages().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      case BuyEnum.BARBATESTI:
        this.propertyName = 'Casă în Bărbătești';
        this.propertyDescription = 'Casă în Bărbătești, într-o zonă liniștită cu acces la natură și aer curat. Perfectă pentru relaxare.';
        this.photoService.getBarbatestiImages().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
        });
        break;
      default:
        // If property not found, navigate back to properties list
        this.router.navigate(['/properties']);
        break;
    }
  }

  goBackToProperties(): void {
    this.router.navigate(['/properties']);
  }
}
