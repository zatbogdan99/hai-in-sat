import { ImageLoadTracker } from './image-load-tracker';

describe('ImageLoadTracker', () => {
  it('reports a photo as loaded only after markLoaded, ignoring empty sources', () => {
    const tracker = new ImageLoadTracker();
    expect(tracker.isLoaded('assets/a.avif')).toBeFalse();
    tracker.markLoaded('assets/a.avif');
    tracker.markLoaded(undefined);
    expect(tracker.isLoaded('assets/a.avif')).toBeTrue();
    expect(tracker.isLoaded('assets/b.avif')).toBeFalse();
    expect(tracker.isLoaded(null)).toBeFalse();
  });

  it('picks up photos that finished before hydration, including broken ones, but not pending ones', () => {
    const root = document.createElement('div');
    const done = document.createElement('img');
    const broken = document.createElement('img');
    const pending = document.createElement('img');
    done.setAttribute('src', 'assets/gata.avif');
    broken.setAttribute('src', 'assets/stricata.avif');
    pending.setAttribute('src', 'assets/in-curs.avif');
    Object.defineProperty(done, 'complete', { value: true });
    Object.defineProperty(broken, 'complete', { value: true });
    Object.defineProperty(pending, 'complete', { value: false });
    root.append(done, broken, pending);

    const tracker = new ImageLoadTracker();
    tracker.syncFrom(root);

    expect(tracker.isLoaded('assets/gata.avif')).toBeTrue();
    expect(tracker.isLoaded('assets/stricata.avif')).toBeTrue();
    expect(tracker.isLoaded('assets/in-curs.avif')).toBeFalse();
  });
});
