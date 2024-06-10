import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {gsap} from "gsap";
import {DataDto} from "../dto/data.dto";
import {DataService} from "../service/data-service";
import { NgOptimizedImage } from '@angular/common'

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
      "Acest loc fermecător este adesea numit \"capitala\" ceramicii românești, iar motivele pentru această distincție sunt cât se poate de clare.\n" +
      "Călătorind în trecutul său îndepărtat, descoperim că istoria dezvoltării așezărilor din Horezu este strâns legată de traseele de transhumanță, de drumurile bătute de haiduci în vremuri străvechi și de celebrul drum al sării. Acest drum ancestral începea la Ocnele Mari, trecea prin Pietrarii de Jos și continua prin Horezu, apoi către Slătioara și, în cele din urmă, ajungea la Cernești. Aceste elemente au contribuit la formarea și dezvoltarea comunității Horezu, întărindu-i statutul ca un centru vital pentru tradițiile etnografice și pentru arta ceramică populară din România.",
      "Orașul este un adevărat tezaur al tradițiilor autentice și un loc în care arta ceramică prinde viață, purtând în ea amintiri și povești străvechi, și continuând să inspire generațiile viitoare. În anul 2012, ceramica de Horezu a fost inclusă în prestigioasa Listă Reprezentativă a Patrimoniului Cultural Imaterial al Umanității UNESCO, marcând oficial recunoașterea valorii artistice și tradiționale a acestui meșteșug. Această distincție a avut un impact semnificativ asupra promovării și conservării patrimoniului cultural al ceramicii horezene, consolidând în același timp sprijinul acordat comunității locale angajate în păstrarea acestei tradiții meșteșugărești.",
      "Mănăstirea Hurezi este un complex monastic reprezentativ pentru arhitectura brâncovenească, inclus în Patrimoniul Mondial UNESCO. Construită în perioada 1690-1693, la inițiativa domnitorului Constantin Brâncoveanu, mănăstirea este cunoscută pentru frumoasa sa biserică cu hramul \"Adormirea Maicii Domnului\".\n" +
      "Arhitectura mănăstirii Hurezi se remarcă prin detaliile sculptate în piatră, icoanele murale impresionante și frescele vii care ilustrează scene biblice și motive tradiționale românești. Curtea interioară este înconjurată de clădiri anexe, precum chiliile, turnul clopotniță și casa domnească, oferind o atmosferă de liniște și spiritualitate.\n",
      "assets/horezu1.avif"
    );
    this.data.push(dataDto);

    dataDto = new DataDto(
      2,
      "Polovragi",
      "Polovragi, o bijuterie istorică a județului Gorj, strălucește ca o comoară păstrată în sânul muntelui. Cu o istorie străveche dovedită de numeroase cercetări arheologice, această locație adânc încărcată de istorie își deschide porțile către trecutul său fascinant.",
      "În adâncurile timpului, în secolele II - I î.Hr., Polovragi găzduia o așezare dacică unică, cu două nivele diferite. Unul dintre ele, precum o cetate de refugiu, se înălța mândru pe Platoul Padeșului și al Crucii lui Ursache, străjuit de misterul istoriei, în timp ce celălalt nivel se ascundea în adâncurile zonei cunoscute ca \"Gura Pietrei,\" respirând aerul unei comunități civile înfloritoare. Aici, istoria se întrepătrundea cu natura într-un dans veșnic. Dar ceea ce încântă ochiul și inima călătorului în căutarea istoriei este Peștera Polovragi. Aflată în partea de nord-est a Gorjului, această peșteră, cu o lungime impresionantă de aproximativ 11.000 de metri, ascunde povestea timpurilor antice în galeriile sale întunecate. O galerie orizontală, cu mici ramificații laterale, dezvăluie secretele sale cu măreție.",
      "În urmă cu aproape un secol, temerarii speologi care au explorat această peșteră au dat peste dovezi uluitoare ale prezenței daco-geților. Dar ce a captivat inima cercetătorilor au fost urmele lăsate de picioare umane încălțate, semne de viață străveche în urmă cu aproape 2.000 de ani. Aceste urme ne dezvăluie cum strămoșii acestei regiuni foloseau peștera, și probabil, cum venerau locurile sacre.\n" +
      "Mănăstirea Polovragi este un lăcaș monastic cu hramul \"Adormirea Maicii Domnului\". Cunoscută pentru frumusețea naturală din jur și pentru icoana Maicii Domnului, mănăstirea atrage turiști dornici să exploreze atât aspectele spirituale, cât și peisajele spectaculoase ale Cheilor Oltețului.\n",
      "Locuitorii practică tradițional oieritul, având grijă de oi pe pășune și producând brânzeturi de calitate. Această activitate, transmisă din generație în generație, nu doar că susține economia locală, ci și contribuie la identitatea culturală distinctivă a regiunii.\n" +
      "\n" +
      "\n" +
      "\n" +
      "\n" +
      "Polovragi, cu bogata sa istorie și peștera sa misterioasă, reprezintă o fereastră în timp care ne permite să contemplăm și să onorăm strămoșii noștri și istoria acestui loc. Este un altar al trecutului și o mărturie a perenității vieții umane în inima naturii.\n",
      "assets/polovragi1.avif"
    );
    this.data.push(dataDto);

    dataDto = new DataDto(
      3,
      "Baia de Fier",
      "Numele său, Baia de Fier, evocă vremuri îndepărtate, când minereul de fier era prelucrat în adâncul pamântului, folosindu-se apa canalizată pentru a purifica acest dar al naturii. În inima acestor adâncuri, se găsea inestimabila mină de grafit, unică în România, care a contribuit la faima acestui loc.",
      "Baia de Fier este nu doar o comoară arheologică, ci și un loc binecuvântat de natură. În această \"Oltenie de sub munte,\" se pot găsi chei fermecătoare și peșteri misterioase, iar satele din apropiere păstrează cu sfințenie tradițiile românești.",
      "Mănăstirile și biserici vechi îmbină arhitectura și istoria, transformând acest loc într-un adevărat monument al patrimoniului național.",
      "HAI ÎN SAT",
      "assets/baia1.avif"
    );
    this.data.push(dataDto);

    dataDto = new DataDto(
      4,
      "Vaideeni",
      "Într-un colț pitoresc al Vâlcii, se ascunde cu mândrie satul Vaideeni, o perlă străveche cu o istorie fascinantă ce își dezvăluie tainele încă din secolul al XVI-lea. Pe atunci, el purta denumirea enigmatică de \"Vai de Ei\", un nume ce părea să strige disperarea unei comunități ce își găsise refugiul aici.",
      "Această comunitate s-a născut din străvechea tradiție a transhumanței, o odisee de miile de kilometri pe cărări montane, străjuite de ciobani dăruiți păstoritului și conectați cu natura. Aici, în Vaideeni, s-au așezat mai multe familii de oieri venite din Ardeal, în special din pitoresca Mărginime a Sibiului",
      "Casele din Vaideeni prezintă unele elemente arhitecturale similare cu cele din Ardeal, ceea ce conferă localității un farmec aparte. Aceste case sunt adesea construite din lemn și piatră, având acoperișuri înclinate și ferestre mari, încadrate de ornamente și decorațiuni tradiționale.\n" +
      "Arhitectura caselor din Vaideeni reflectă tradițiile și cultura locului, iar unele dintre ele păstrează elemente specifice stilului sătesc românesc, precum porticele largi și balcoanele decorate. Casele sunt integrate armonios în peisajul montan, iar atmosfera rurală și autentică atrage turiști în căutare de experiențe autentice și de liniște.\n",
      "Astfel, satul Vaideeni este mai mult decât un simplu punct pe harta geografică a României - este un sanctuar al tradițiilor, al înfruntării cu vremurile și al poveștilor ce se împletesc cu natura. Transhumanța devine o simfonie ancestrală care răsuna în inimile locuitorilor, iar istoria lor, întemeiată pe credință și perseverență, reprezintă o comoară vie, prețuită și iubită din generație în generație. Vaideeni rămâne astfel un loc în care trecutul și prezentul se întâlnesc sub cerul senin al Vâlcii.",
      "assets/vaideeni1.avif"
    );
    this.data.push(dataDto);

    dataDto = new DataDto(
      5,
      "Slătioara",
      "În inima Vâlcii se ascunde un colț de rai numit Slătioara. Acest sat idilic, înconjurat de munți acoperiți de păduri dese și râuri limpezi ce șuieră în adierea vântului, este o comoară ascunsă a României.",
      "În centrul sătucului se înalță cu mândrie Biserica Potecașilor, o bijuterie arhitecturală cu o istorie bogată și adânc înrădăcinată în tradiția locului. Cu turla sa elegantă și frescele pictate cu măiestrie, biserica emană o atmosferă de liniște și smerenie. Picturile vechi, ce îmbracă pereții interiori, înfățișează scene din viața lui Isus și a sfinților, aducând la viață credința și spiritualitatea comunității locale.",
      "În jurul bisericii, peisajul rural se desfășoară într-o paletă variată de culori. Casele tradiționale din lemn se întind pe ulițele liniștite, iar grădinile pline de flori adaugă un farmec aparte acestui loc. În timpul primăverii și al verii, Slătioara se transformă într-o explozie de culoare, iar parfumul florilor înmiresmează aerul.",
      "Slătioara din Vâlcea nu este doar un loc geografic, ci și un loc al inimilor călduroase și o comunitate ce împărtășește tradiții și valori. Biserica Potecașilor, cu trecutul său venerabil și frumusețea sa sublimă, este punctul de convergență al acestui mic colț de paradis, unde trecutul și prezentul se împletesc într-o armonie perfectă.",
      "assets/slatioara1.avif"
    );
    this.data.push(dataDto);

    dataDto = new DataDto(
      6,
      "Costești",
      "Comuna Costești, aflată în inima Carpaților și binecuvântată de soarele blând al acestora, este o adevărată comoară naturală și culturală. Unul dintre punctele sale de atracție principale este Muzeul Trovanților, unde vizitatorii sunt întâmpinați de o colecție fascinantă de pietre cioplite în forme uimitoare, care dezvăluie trecerea misterioasă a timpului și povestea tainică a naturii.",
      "În acest sanctuar al pietrelor, liniștea și misterul vremurilor îndepărtate îi însoțesc pe cei ce pășesc printre trovanți, oferindu-le o experiență unică și memorabilă. În plus, muzeul adăpostește o colecție impresionantă de artefacte arheologice și exponate ce ilustrează viața tradițională din regiune, completând astfel povestea bogată a patrimoniului cultural vâlcean.",
      "În împrejurimile comunei Costești se găsesc și alte atracții naturale deosebite, cum ar fi Cheile Bistriței și Peștera Bistrița, care încântă privirile cu peisaje pitorești și formațiuni carstice spectaculoase. Aceste locuri sunt ideale pentru iubitorii de natură și aventură, oferind ocazia de a explora frumusețea sălbatică a Carpaților și de a descoperi misterele ascunse ale regiunii.",
      "În concluzie, Costești este o destinație fascinantă și diversificată, care îmbină armonios frumusețea naturală cu patrimoniul cultural și spiritual al zonei. O vizită în această comună este o călătorie în trecut și în prezent, ce oferă o experiență autentică și memorabilă pentru toți cei ce îi trec pragul.",
      "assets/costesti1.avif"
    );
    this.data.push(dataDto);

    dataDto = new DataDto(
      7,
      "Bărbătești",
      "Acest colț binecuvântat al României, străbătut de râurile limpezi și împădurite, păstrează tradițiile și istoria cu sfințenie. Cu oameni harnici și ospitalieri, Bărbăteștiul este un loc în care timpul pare să se fi oprit pentru a lăsa frumusețea naturii și a tradițiilor să strălucească în toată splendoarea sa.",
      "Unul dintre comorile ce definesc această localitate este Schitul Pătrunsa, un adevărat simbol de spiritualitate și liniște. Schitul, situat în mijlocul pădurii, se înalță ca o comoară a credinței și meditației. Aici, pelerinii și credincioșii se adună în căutarea păcii interioare și a armoniei cu natura. Picturile murale care împodobesc biserica schitului spun povești de credință și smerenie, amintindu-ne de rădăcinile noastre religioase și de înțelepciunea celor care au trăit și au slujit aici de-a lungul secolelor.",
      "",
      "",
      "assets/barbatesti1.avif"
    );
    this.data.push(dataDto);
  }

  nextButton() {
    this.nextCard();
  }

  showMore() {
    this.service.village$.next(this.currentNum + 1);
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

  getCardInfoDesc() {
    return this.data[this.currentNum].desc;
  }
}
