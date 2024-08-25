import {AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';

declare var YT: any;

@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss']
})
export class YoutubePlayerComponent implements AfterViewInit, OnChanges{
  @ViewChild('player') playerElementRef: ElementRef | undefined;

  player: any;

  @Input() videoId: string = 'CKiPdxYl0MA';
  @Input() height: string = '60%';
  @Input() width: string = '100%';

  ngAfterViewInit(): void {
    this.initPlayer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['videoId'] && !changes['videoId'].isFirstChange()) {
      this.updateVideo(changes['videoId'].currentValue);
    }
  }

  initPlayer(): void {
    if (this.playerElementRef != undefined) {
      this.player = new YT.Player(this.playerElementRef.nativeElement, {
        height: this.height,
        width: this.width,
        videoId: this.videoId,
        events: {
          'onReady': this.onPlayerReady,
          'onStateChange': this.onPlayerStateChange
        }
      });
    } else {
      console.error('Eroare la initializarea playerului de youtube');
    }
  }

  updateVideo(newVideoId: string): void {
    if (this.player && this.player.loadVideoById) {
      this.player.cueVideoById(newVideoId);
    } else {
      this.initPlayer();
    }
  }

  onPlayerReady(event: { target: { playVideo: () => void; }; }) {
    // event.target.playVideo();
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
