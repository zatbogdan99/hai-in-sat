import { Component, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, ElementRef, ViewChild, OnInit, signal } from '@angular/core';
import {RouterLink} from "@angular/router";
import {gsap} from "gsap";
import {DataDto} from "../dto/data.dto";
import {YoutubePlayerComponent} from "../youtube-player/youtube-player.component";
import { NgFor } from '@angular/common';
import { register } from 'swiper/element/bundle';
import { SeoService } from "../service/seo.service";
import { LoggerService } from "../service/logger.service";
import { villagePath } from "../utils/villages";
import { ImageLoadTracker } from "../utils/image-load-tracker";
import { villageImageSize, villageImageSrc, villageImageSrcset } from "../utils/village-image";

@Component({
  selector: 'app-under-the-mountain',
  templateUrl: './under-the-mountain.component.html',
  imports: [
    YoutubePlayerComponent,
    NgFor,
    RouterLink
  ],
  styleUrls: ['./under-the-mountain.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UnderTheMountainComponent implements AfterViewInit, OnInit {

  currentNum: number = 0;
  maxNum: number = 7;
  data: DataDto[] = [];

  @ViewChild('villageSwiper') villageSwiper?: ElementRef<HTMLElement>;
  @ViewChild('prevNav') prevNav?: ElementRef<HTMLElement>;
  @ViewChild('nextNav') nextNav?: ElementRef<HTMLElement>;


  readonly villagePath = villagePath;

  /** Pozele cardurilor: scheletul de încărcare stă pe ele până se descarcă (pe internet slab durează). */
  readonly photos = new ImageLoadTracker();
  /** Cardurile au ~400 px: varianta de 800 px ca src, iar srcset până la 1280 px pentru ecranele dense. */
  readonly cardPhoto = (src: string) => villageImageSrc(src, 800);
  readonly cardSrcset = (src: string) => villageImageSrcset(src, 1280);
  readonly photoSize = villageImageSize;
  /**
   * Swiper a pornit. Până atunci, cardurile stau din CSS pe un rând, ca în carusel (fără listă verticală).
   * `swiper-container` se definește (register) abia chiar înainte de initialize(): un element definit, dar
   * neinițializat, are shadow DOM gol și nu arată nimic, iar pe un telefon lent asta ținea până la hidratare.
   */
  readonly swiperReady = signal(false);
  /** Caruselul de sate derulează singur la 5 s; după o săgeată sau o glisare rămâne oprit până la o nouă intrare pe pagină. */
  private swiperEl?: HTMLElement & { swiper?: any };
  private cardsHovered = false;
  private cardsFocused = false;
  /** Oprit doar cât timp mouse-ul sau focusul e pe carusel (ca un card să nu fugă de sub cursor). */
  private pausedTemporarily = false;

  constructor(
    private seo: SeoService,
    private logger: LoggerService,
    private host: ElementRef<HTMLElement>
  ) {
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

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Oltenia de sub Munte – Sate autentice, tradiții și natură',
      description: 'Descoperă Oltenia de sub Munte: Horezu, Polovragi, Baia de Fier, Vaideeni, Costești, Slătioara, Bărbătești. Sate pitorești, tradiții ancestrale și peisaje montane spectaculoase.',
      ogImage: 'https://hai-în-sat.ro/assets/poza1_oltenia.avif',
      canonicalPath: '/oltenia-de-sub-munte'
    });
    this.seo.setBreadcrumbs([
      { name: 'Acasă', path: '/' },
      { name: 'Oltenia de sub Munte', path: '/oltenia-de-sub-munte' }
    ]);
  }

  nextButton() {
    this.nextCard();
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
        this.logger.log('on complete pe playReverse');
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

  ngAfterViewInit(): void {
    const swiperEl = this.villageSwiper?.nativeElement as any;
    const prevEl = this.prevNav?.nativeElement as HTMLElement | undefined;
    const nextEl = this.nextNav?.nativeElement as HTMLElement | undefined;

    if (!swiperEl) {
      return;
    }

    const params: any = {
      loop: true,
      grabCursor: true,
      centeredSlides: true,
      centeredSlidesBounds: true,
      spaceBetween: 16,
      initialSlide: 1,
      slidesPerView: 3,
      autoHeight: true,
      watchSlidesProgress: true,
      allowTouchMove: true,
      speed: 450,
      breakpoints: {
        0: { slidesPerView: 1, centeredSlides: true },
        641: { slidesPerView: 3, centeredSlides: true }
      },
      navigation: {
        prevEl,
        nextEl
      },
      // Spre dreapta la 5 s, la nesfârșit (loop). Săgețile sau glisarea o opresc până la o nouă intrare pe pagină.
      autoplay: {
        delay: 5000,
        disableOnInteraction: true
      },
      // Etichetele Swiper în română (în Safari se citeau „Previous slide” / „Next slide”).
      a11y: {
        prevSlideMessage: 'Satul anterior',
        nextSlideMessage: 'Satul următor',
        firstSlideMessage: 'Primul sat',
        lastSlideMessage: 'Ultimul sat',
        slideLabelMessage: '{{index}} din {{slidesLength}}',
        containerRoleDescriptionMessage: 'carusel',
        itemRoleDescriptionMessage: 'sat'
      }
    };

    this.photos.syncFrom(this.host.nativeElement);
    // Inițializare după ce vederea e gata; definirea elementului, parametrii și pornirea, în același pas (fără cadru gol).
    setTimeout(() => {
      register();
      Object.assign(swiperEl, params);
      if (typeof swiperEl.initialize === 'function') {
        // Regulile de rând pre-init (pe telefon ascund primul card) trebuie scoase înainte ca Swiper să măsoare cardurile.
        swiperEl.closest('.discover__cards')?.classList.add('is-ready');
        swiperEl.initialize();
        this.swiperReady.set(true);
        this.syncSlideFocus(swiperEl, [prevEl, nextEl]);
        swiperEl.swiper?.on('slideChangeTransitionEnd', () => this.syncSlideFocus(swiperEl));
        swiperEl.swiper?.on('resize', () => this.syncSlideFocus(swiperEl));
        this.swiperEl = swiperEl;
        // Cine a cerut mișcare redusă vede caruselul oprit.
        if (this.prefersReducedMotion()) {
          swiperEl.swiper?.autoplay?.stop();
        }
        swiperEl.swiper?.on('autoplayStart', () => this.syncAutoplay());
        swiperEl.swiper?.on('autoplayStop', () => this.syncAutoplay());
        // În pauza temporară caruselul stă pe loc: orice schimbare de slide e a utilizatorului, deci oprire definitivă.
        swiperEl.swiper?.on('slideChange', () => {
          if (this.pausedTemporarily) {
            this.pausedTemporarily = false;
            this.syncAutoplay();
          }
        });
        this.syncAutoplay();
      }
    });
  }

  /** Pauză cât timp mouse-ul e pe carusel; atingerea pe telefon e glisare, care oprește oricum derularea. */
  onCardsPointer(event: PointerEvent, inside: boolean): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    this.cardsHovered = inside;
    this.updateAutoplayPause();
  }

  /** Pauză cât timp focusul de tastatură e pe un card sau pe o săgeată. */
  onCardsFocus(event: FocusEvent, inside: boolean): void {
    const cards = event.currentTarget as HTMLElement;
    this.cardsFocused = inside || cards.contains(event.relatedTarget as Node | null);
    this.updateAutoplayPause();
  }

  /**
   * Pauza temporară folosește stop()/start(): autoplay.pause() din Swiper e gândit pentru tranziții și se reia
   * singur la următorul transitionend, deci nu ține cât timp mouse-ul stă pe carusel.
   */
  private updateAutoplayPause(): void {
    const autoplay = this.swiperEl?.swiper?.autoplay;
    if (!autoplay) {
      return;
    }
    const hold = this.cardsHovered || this.cardsFocused;
    if (hold && autoplay.running) {
      this.pausedTemporarily = true;
      autoplay.stop();
    } else if (!hold && this.pausedTemporarily) {
      this.pausedTemporarily = false;
      autoplay.start();
    }
  }

  /** aria-live: cât timp derulează singur, schimbările de slide nu se anunță; oprit, se anunță din nou. */
  private syncAutoplay(): void {
    const swiper = this.swiperEl?.swiper;
    const running = !!swiper?.autoplay?.running || this.pausedTemporarily;
    swiper?.wrapperEl?.setAttribute('aria-live', running ? 'off' : 'polite');
  }

  private prefersReducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Doar cardurile vizibile rămân în ordinea de Tab: celelalte stau sub stratul semitransparent, iar focusul ajungea
   * pe ele nevăzut. Swiper pune pe săgeți aria-controls spre un id din shadow DOM, deci invalid din pagină: îl scoatem.
   */
  private syncSlideFocus(swiperEl: HTMLElement & { swiper?: { slides?: HTMLElement[] } }, navButtons: (HTMLElement | undefined)[] = []): void {
    for (const slide of swiperEl.swiper?.slides ?? []) {
      const link = slide.querySelector('a');
      if (slide.classList.contains('swiper-slide-visible')) {
        link?.removeAttribute('tabindex');
      } else {
        link?.setAttribute('tabindex', '-1');
      }
    }
    navButtons.forEach(button => button?.removeAttribute('aria-controls'));
  }
}
