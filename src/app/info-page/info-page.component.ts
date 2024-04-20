import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {gsap, Power2} from "gsap";
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitType from "split-type";
import {PhotoService} from "../service/photo-service";
import {TextDataModel} from "../dto/text-data.model";
import {DataDto} from "../dto/data.dto";
import {DataService} from "../service/data-service";
import {VgApiService} from "@videogular/ngx-videogular/core";

@Component({
  selector: 'app-info-page',
  templateUrl: './info-page.component.html',
  styleUrls: ['./info-page.component.scss']
})
export class InfoPageComponent implements OnInit, AfterViewInit{
  horezuImages: any[] | undefined;
  costestiImages: any[] | undefined;
  slatioaraImages: any[] | undefined;
  polovragiImages: any[] | undefined;
  baiaImages: any[] | undefined;
  vaideeniImages: any[] | undefined;
  barbatestiImages: any[] | undefined;

  data: DataDto[] = [];

  villageId: number = 0;

  preload: string = 'auto';
  api: VgApiService = new VgApiService;

  constructor(private photoService: PhotoService, private service: DataService) {
    this.service.village$.subscribe(value => {
      console.log('vine valoarea: ', value);
      this.villageId = value;
    });
  }

  ngOnInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    let revealContainers = document.querySelectorAll(".reveal");
    revealContainers.forEach((container) => {
      let image = container.querySelector("img");
      let t1 = gsap.timeline({
        scrollTrigger: {
          trigger: container,
        }
      });
      t1.set(container, { autoAlpha: 1 });
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

    this.photoService.getHorezuImages().then((images) => {
      this.horezuImages = images;
      this.baiaImages = images;
      this.barbatestiImages = images;
      this.polovragiImages = images;
      this.slatioaraImages = images;
      this.vaideeniImages = images;

      let dataDto = new DataDto(
        1,
        "Horezu",
        "Horezu, situat în apropierea punctului de mijloc dintre Râmnicu Vâlcea și Târgu Jiu, a fost binecuvântat cu o moștenire etnografică și folclorică impresionantă. Însăși numele orașului, Horezu, își trage originile din trecutul său pitoresc, de la ciuhurez, o pasăre asemănătoare bufniței, care populează pădurile înconjurătoare.",
        "descriere horezu 1",
        "descriere horezu 2",
        "descriere horezu 3",
        "assets/horezu1.jpeg",
        this.horezuImages
      );
      this.data.push(dataDto);

      dataDto = new DataDto(
        2,
        "Costești",
        "Costești, o comună binecuvântată de soarele blând al Carpaților, găzduiește în sânul său o colecție de trovanți, pietre cioplite de mâna timpului în forme uimitoare, de la creaturi misterioase până la obiecte cu forme imposibil de reprodus. Acești trovanți, alcătuind o adevărată galerie de artă a naturii, constituie nucleul atracției Muzeului Trovanților.",
        "descriere costesti 1",
        "descriere costesti 2",
        "descriere costesti 3",
        "assets/costesti1.jpeg",
        this.costestiImages
      );
      this.data.push(dataDto);

      dataDto = new DataDto(
        3,
        "Baia de Fier",
        "Numele său, Baia de Fier, evocă vremuri îndepărtate, când minereul de fier era prelucrat în adâncituri pământești, folosindu-se apa canalizată pentru a purifica acest dar al naturii. În inima acestor adâncituri, se găsea inestimabila mină de grafit, unică în România, care a contribuit la faima acestui loc.",
        "descriere baia 1",
        "descriere baia 2",
        "descriere baia 3",
        "assets/baia-de-fier.jpg",
        this.baiaImages
      );
      this.data.push(dataDto);

      dataDto = new DataDto(
        4,
        "Polovragi",
        "Polovragi, o bijuterie istorică a județului Târgul Jiu, strălucește ca o comoară păstrată în sânul muntelui. Cu o istorie străveche dovedită de numeroase cercetări arheologice, această locație adânc încărcată de trecut își deschide porțile către trecutul său fascinant.",
        "descriere polovragi 1",
        "descriere polovragi 2",
        "descriere polovragi 3",
        "assets/satul-polovragi.jpg",
        this.polovragiImages
      );
      this.data.push(dataDto);

      dataDto = new DataDto(
        5,
        "Vaideeni",
        "Într-un colț pitoresc al Vâlcii, se ascunde cu mândrie satul Vaideeni, o perlă străveche cu o istorie fascinantă ce își dezvăluie tainele încă din secolul al XVI-lea. Pe atunci, el purta denumirea enigmatică de \"Vai de Ei\", un nume ce părea să strige disperarea unei comunități ce își găsise refugiul aici.",
        "descriere vaideeni 1",
        "descriere vaideeni 2",
        "descriere vaideeni 3",
        "assets/vaideeni.png",
        this.vaideeniImages
      );
      this.data.push(dataDto);

      dataDto = new DataDto(
        6,
        "Slătioara",
        "În inima Vâlcii se ascunde un colț de rai numit Slătioara. Acest sătuc idilic, înconjurat de munți acoperiți de păduri dese și râuri limpezi ce șuieră în adierea vântului, este o comoară ascunsă a României.\n" +
        "În centrul sătucului se înalță cu mândrie Biserica Potecașilor, o bijuterie arhitecturală cu o istorie bogată și adânc înrădăcinată în tradiția locului. Cu turla sa elegantă și frescele pictate cu măiestrie, biserica emană o atmosferă de liniște și smerenie. Picturile vechi, ce îmbracă pereții interiori, înfățișează scene din viața lui Isus și a sfinților, aducând la viață credința și spiritualitatea comunității locale.",
        "descriere slatioara 1",
        "descriere slatioara 2",
        "descriere slatioara 3",
        "assets/satul-slatioara.jpg",
        this.slatioaraImages
      );
      this.data.push(dataDto);

      dataDto = new DataDto(
        7,
        "Bărbătești",
        "Acest colț binecuvântat al României, străbătut de râurile limpezi și împădurite, păstrează tradițiile și istoria cu sfințenie. Cu oameni harnici și ospitalieri, Bărbăteștiul este un loc în care timpul pare să se fi oprit pentru a lăsa frumusețea naturii și a tradițiilor să strălucească în toată splendoarea sa.",
        "descriere barbatesti 1",
        "descriere barbatesti 2",
        "descriere barbatesti 3",
        "assets/trafic.jpg",
        this.barbatestiImages
      );
      this.data.push(dataDto);

    });
    this.photoService.getCostestiImages().then((images) => (this.costestiImages = images));

  }

  ngAfterViewInit() {
    // const firstText1 = new SplitType('#first-text1');
    //
    // gsap.to('.char', {
    //   y: 0,
    //   stagger: 0.05,
    //   delay: 0.2,
    //   duration: .1
    // })
  }

  isHorezu() {
    return this.villageId === 0;
  }

  onPlayerReady(source: VgApiService) {
    this.api = source;
    // this.api.getDefaultMedia().subscriptions.loadedMetadata.subscribe(
    //   this.autoplay.bind(this)
    // )
  }

  autoplay() {
    this.api.play();
  }
}
