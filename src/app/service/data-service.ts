import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  village$ = new BehaviorSubject<number>(0);
  reload$ = new BehaviorSubject<boolean>(false);
}
