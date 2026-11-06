import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentService } from '../cookie-consent/consent.service';
import { YoutubePlayerComponent } from './youtube-player.component';

describe('YoutubePlayerComponent', () => {
  let component: YoutubePlayerComponent;
  let fixture: ComponentFixture<YoutubePlayerComponent>;
  const video = signal(false);
  const consent = { video, acceptVideo: jasmine.createSpy('acceptVideo').and.callFake(() => video.set(true)) };

  beforeEach(() => {
    video.set(false);
    consent.acceptVideo.calls.reset();
    TestBed.configureTestingModule({
      imports: [YoutubePlayerComponent],
      providers: [{ provide: ConsentService, useValue: consent }]
    });
    fixture = TestBed.createComponent(YoutubePlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the consent box instead of the player until YouTube is accepted, then embeds the video', () => {
    fixture.componentRef.setInput('videoId', 'W10oX2mk_R8');
    fixture.componentRef.setInput('height', '400');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('iframe')).toBeNull();
    const box = root.querySelector('.video-consent') as HTMLElement;
    expect(box.textContent).toContain('e nevoie de acordul tău pentru cookie-urile YouTube');
    // Aceeași mărime ca iframe-ul: înălțimea „400” devine 400 px.
    expect(box.style.getPropertyValue('--video-h')).toBe('400px');
    expect(box.querySelector('a')?.getAttribute('href')).toBe('https://www.youtube.com/watch?v=W10oX2mk_R8');

    (box.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(consent.acceptVideo).toHaveBeenCalledTimes(1);
    expect(root.querySelector('.video-consent')).toBeNull();
    expect(root.querySelector('iframe')).not.toBeNull();
  });

  it('embeds the video as a lazy youtube-nocookie iframe, without the IFrame API script', () => {
    video.set(true);
    fixture.componentRef.setInput('videoId', 'W10oX2mk_R8');
    fixture.componentRef.setInput('height', '400');
    fixture.detectChanges();

    const iframe = fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toBe('https://www.youtube-nocookie.com/embed/W10oX2mk_R8');
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe.getAttribute('height')).toBe('400');
    expect(iframe.title).toBeTruthy();
    expect(document.querySelector('script[src*="youtube.com/iframe_api"]')).toBeNull();
  });

  it('switches the video when the id changes and refuses ids that are not YouTube ids', () => {
    video.set(true);
    fixture.componentRef.setInput('videoId', 'rI43JSfG188');
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement).src).toContain('/embed/rI43JSfG188');

    fixture.componentRef.setInput('videoId', '"><script>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.querySelector('.video-consent')).toBeNull();
  });
});
