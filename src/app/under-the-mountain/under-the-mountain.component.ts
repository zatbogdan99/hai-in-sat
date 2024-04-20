import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {gsap} from "gsap";
import {DataDto} from "../dto/data.dto";
import {DataService} from "../service/data-service";

@Component({
  selector: 'app-under-the-mountain',
  templateUrl: './under-the-mountain.component.html',
  styleUrls: ['./under-the-mountain.component.scss']
})
export class UnderTheMountainComponent {

  currentNum: number = 0;
  maxNum: number = 7;
  data: DataDto[] = [];


  constructor(private router: Router, private service: DataService) {
    let dataDto = new DataDto(
      1,
      "Horezu",
      "Horezu, situat în apropierea punctului de mijloc dintre Râmnicu Vâlcea și Târgu Jiu, a fost binecuvântat cu o moștenire etnografică și folclorică impresionantă. Însăși numele orașului, Horezu, își trage originile din trecutul său pitoresc, de la ciuhurez, o pasăre asemănătoare bufniței, care populează pădurile înconjurătoare.",
      "descriere horezu 1",
      "descriere horezu 2",
      "descriere horezu 3",
      "assets/horezu1.jpeg",
      []
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
      []
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
      []
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
      []
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
      []
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
      []
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
      []
    );
    this.data.push(dataDto);
  }

  nextButton() {
    this.nextCard();
  }

  showMore() {
    this.service.village$.next(this.currentNum);
    this.router.navigateByUrl("/info-page");
  }

  playForward() {
    let tl = gsap.timeline({
      defaults: {
        duration: 0.4,
        ease: "sine.out"
      },
      onComplete: () => {
        this.currentNum++;
        if (this.currentNum >= this.maxNum) {
          this.currentNum = 0;
          this.playReverse();
        } else {
          this.playReverse();
        }
      }
    });
    tl
      .to(
        "#mask",
        {
          yPercent: -150,
          scaleY: 1.4
        },
        "<"
      )
      .to(
        "#mask-mobile",
        {
          yPercent: -200,
          scaleY: 1.4
        },
        "<"
      )
      .fromTo(
        "#card-info-title",
        {
          clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`
        },
        {
          clipPath: `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)`
        },
        "<0.2"
      )
      .fromTo(
        "#card-info-desc",
        {
          clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`
        },
        {
          clipPath: `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)`
        },
        "<0.3"
      );
  }

  nextCard() {
    this.playForward();
  }

  playReverse() {
    let tl = gsap.timeline({
      defaults: {
        duration: 0.4,
        ease: "sine.in"
      },
      onComplete: () => {
        console.log('on complete pe playReverse');
      }
    });

    tl
      .to(
        "#mask",
        {
          yPercent: 0,
          scaleY: 1
        },
        "<"
      )
      .to(
        "#mask-mobile",
        {
          yPercent: 0,
          scaleY: 1
        },
        "<"
      )
      .fromTo(
      "#card-info-title",
      {
        clipPath: `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)`
      },
      {
        clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`
      },
      "<0.2"
    )
      .fromTo(
        "#card-info-desc",
        {
          clipPath: `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)`
        },
        {
          clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`
        },
        "<0.3"
      );
  }

}
