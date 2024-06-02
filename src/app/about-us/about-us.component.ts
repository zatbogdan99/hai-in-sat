import {AfterViewInit, Component, OnInit} from '@angular/core';
import {gsap} from "gsap";
import { faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faSquareFacebook } from "@fortawesome/free-brands-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent implements OnInit, AfterViewInit{

  faTiktok = faTiktok;
  faSquareFacebook = faSquareFacebook;
  faInstagram = faInstagram;

  ngOnInit() {

  }

  ngAfterViewInit(): void {
    gsap.from(".left-container", 2, {
      width: "0",
      ease: Expo.easeInOut
    });
    gsap.from(".right-container", 2, {
      delay: 1.5,
      width: "0",
      opacity: "0",
      ease: Expo.easeInOut
    });
    gsap.from(".center-container", 2, {
      delay: 3,
      width: "0",
      x: -20,
      ease: Expo.easeInOut
    });
    gsap.from(".logo", 2, {
      delay: 1.5,
      y: 20,
      opacity: 0,
      ease: Expo.easeInOut
    });
    gsap.from(".info", 2, {
      delay: 1.5,
      y: 50,
      opacity: 0,
      scale: 2.5,
      ease: Expo.easeInOut
    });
    gsap.from(".story", 2, {
      delay: 2.5,
      y: 20,
      opacity: 0,
      ease: Expo.easeInOut
    });
    gsap.from(".menu", 2, {
      delay: 3.5,
      y: 20,
      opacity: 0,
      rotation: 90,
      ease: Expo.easeInOut
    });
  }

  getSecondText() {
    return 'Noi nu facem din asta o afacere. Ne bucurăm pentru fiecare casă care își \ngăsește un suflet curat. ' +
      'Noi nu îți percepem comision înainte. După ce tu, suflet frumos \nți-ai ales casa pereche, ' +
      'poți să donezipentru ca alte suflete curate, asemănătoare ție, \nsă se bucure cum te bucuri tu.'
  }

  getFirstText() {
    return 'Ți-ai pus vreodată întrebarea dacă în România există și oameni serioși? \n ' +
      'Noi suntem supărați că nu ne-am născut în Germania... \n ' +
      'Nu, nu suntem rigizi, suntem chiar simpatici! \n ' +
      'Ești curios, nu ești curios? Nu contează, dacă ești inteligent și vrei să evadezi din matrice sigur ne vei contacta!'
  }
}
