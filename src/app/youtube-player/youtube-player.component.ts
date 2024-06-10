import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

declare var YT: any;

@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss']
})
export class YoutubePlayerComponent implements AfterViewInit{
  @ViewChild('player') playerElementRef: ElementRef | undefined;
  player: any;

  ngAfterViewInit(): void {
    if (this.playerElementRef != undefined) {
      this.player = new YT.Player(this.playerElementRef.nativeElement, {
        height: '390',
        width: '640',
        videoId: 'CKiPdxYl0MA',
        events: {
          'onReady': this.onPlayerReady,
          'onStateChange': this.onPlayerStateChange
        }
      });
    } else {
      console.error('Eroare la initializarea playerului de youtube');
    }
  }

  onPlayerReady(event: { target: { playVideo: () => void; }; }) {
    event.target.playVideo();
  }

  onPlayerStateChange(event: { data: any; }) {
    if (event.data == YT.PlayerState.PAUSED) {
      // Handle PAUSED state
    }
  }

  ngOnDestroy() {
    this.player.destroy();
  }

}
