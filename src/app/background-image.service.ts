import { Injectable } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BackgroundImageService {
  private backgroundImageSubject = new Subject<string>();

  backgroundImage$ = this.backgroundImageSubject.asObservable();

  changeBackgroundImage(imageUrl: string) {
    this.backgroundImageSubject.next(imageUrl);
  }

  constructor() { }
}
