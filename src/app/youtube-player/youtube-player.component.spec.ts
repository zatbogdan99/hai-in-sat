import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubePlayerComponent } from './youtube-player.component';

describe('YoutubePlayerComponent', () => {
  let component: YoutubePlayerComponent;
  let fixture: ComponentFixture<YoutubePlayerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [YoutubePlayerComponent]
    });
    fixture = TestBed.createComponent(YoutubePlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('embeds the video as a lazy youtube-nocookie iframe, without the IFrame API script', () => {
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
    fixture.componentRef.setInput('videoId', 'rI43JSfG188');
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement).src).toContain('/embed/rI43JSfG188');

    fixture.componentRef.setInput('videoId', '"><script>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });
});
