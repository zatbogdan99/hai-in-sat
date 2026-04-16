import {AfterViewInit, Component, OnInit} from '@angular/core';
import {gsap} from "gsap";
import { faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faSquareFacebook } from "@fortawesome/free-brands-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { Divider } from 'primeng/divider';
import { SeoService } from '../service/seo.service';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss'],
  imports: [Divider]
})
export class AboutUsComponent implements OnInit, AfterViewInit{

  faTiktok = faTiktok;
  faSquareFacebook = faSquareFacebook;
  faInstagram = faInstagram;

  constructor(private seo: SeoService) {}

  ngOnInit() {
    this.seo.updatePageMeta({
      title: 'Despre noi – Hai în Sat. Misiunea noastră pentru satul românesc',
      description: 'Hai în Sat conectează oamenii cu viața autentică din Oltenia de sub Munte. Descoperă povestea noastră și cum te putem ajuta să găsești locul ideal la sat.',
      ogImage: 'https://hai-în-sat.ro/assets/contact.avif',
      canonicalPath: '/about-us'
    });
    this.seo.setBreadcrumbs([
      { name: 'Acasă', path: '/' },
      { name: 'Despre noi', path: '/about-us' }
    ]);
  }

  ngAfterViewInit(): void {
    gsap.from(".left-container", 2, {
      width: "0",
      ease: "Expo.easeInOut"
    });
    gsap.from(".right-container", 2, {
      delay: 1,
      width: "0",
      opacity: "0",
      ease: "Expo.easeInOut"
    });
    gsap.from(".center-container", 2, {
      delay: 2,
      width: "0",
      x: -20,
      ease: "Expo.easeInOut"
    });
    gsap.from(".logo", 2, {
      delay: 1,
      y: 20,
      opacity: 0,
      ease: "Expo.easeInOut"
    });
    gsap.from(".info", 2, {
      delay: 1,
      y: 50,
      opacity: 0,
      scale: 2.5,
      ease: "Expo.easeInOut"
    });
    gsap.from(".story", 2, {
      delay: 2,
      y: 20,
      opacity: 0,
      ease: "Expo.easeInOut"
    });
    gsap.from(".menu", 2, {
      delay: 2.5,
      y: 20,
      opacity: 0,
      rotation: 90,
      ease: "Expo.easeInOut"
    });
  }

  getSecondText() {
    return 'Noi nu facem din asta o afacere. Ne bucurăm pentru fiecare casă care își \ngăsește un suflet curat. ' +
      'Noi nu îți percepem comision înainte. După ce tu, suflet frumos \nți-ai ales casa pereche, ' +
      'poți să impărtășești experiența ta pentru ca alte suflete curate, asemănătoare ție, \nsă se bucure cum te bucuri tu.'
  }

  getFirstText() {
    return 'Ți-ai pus vreodată întrebarea dacă în România există și \n oameni serioși? ' +
      'Noi suntem supărați că nu ne-am născut în \nGermania... ' +
      'Nu, nu suntem rigizi, suntem chiar simpatici! \n ' +
      'Ești curios, nu ești curios? Nu contează, dacă ești inteligent \n și vrei să evadezi din matrice sigur ne vei contacta!'
  }
}
