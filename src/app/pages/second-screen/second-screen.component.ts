import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { QuizManagerService } from '../../utilities/services/quiz-manager.service';
import {
  PodiumScore,
  ScoringService,
} from '../../utilities/services/scoring.service';
import { CommonModule } from '@angular/common';
import { OrderModule, OrderPipe } from 'ngx-order-pipe';
import { AdvancedImgDirective } from '../../utilities/directives/advanced-img.directive';
import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AnimateDirective } from '../../utilities/directives/Animate.directive';
import { Podium } from '../../values/podium.values';
import { BehaviorSubject, debounceTime, fromEvent, Subscription } from 'rxjs';
import { ScrollingNumbersDirective } from '../../utilities/directives/scrolling-numbers.directive';
import { ScrollingNumberComponent } from '../../templates/scrolling-number/scrolling-number.component';
import { asyncDelay } from '../../utilities/common-utils';

declare global {
  interface Window {
    Electron?: {
      ipcRenderer: {
        send(channel: string, ...args: any[]): void;
      };
    };
  }
}
@Component({
  selector: 'app-second-screen',
  imports: [
    CommonModule,
    OrderModule,
    AdvancedImgDirective,
    AnimateDirective,
    ScrollingNumbersDirective,
    ScrollingNumberComponent,
  ],
  templateUrl: './second-screen.component.html',
  styleUrls: ['./second-screen.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: '0' }),
        animate('.5s ease-out', style({ opacity: '1' })),
      ]),
    ]),
  ],
})
export class SecondScreenComponent implements OnInit {
  @Input() previewMode: boolean = false;
  @ViewChildren(AnimateDirective) items: QueryList<AnimateDirective>;
  podiums: { key: number; value: Podium }[] = [];
  //podiumsCache: { key: number; value: Podium }[] = [];
  private resizeSubscription!: Subscription;
  constructor(public score: ScoringService, private cdr: ChangeDetectorRef) {
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(500)) // Adjust debounce time as needed
      .subscribe(() => {
        this.items.forEach((x) => x.animateGo());
        this.resizing = false;
      });
    this.score.onRefresh.asObservable().subscribe(() => this.reload());
  }
  closeWindow() {
    window.close();
  }
  reload() {
    if(this.previewMode)return;
    location.reload();
  }
  async ngOnInit(): Promise<void> {
    this.score.init();
    if (!this.previewMode)
      document.documentElement.removeAttribute('data-bs-theme');
    this.score.podiums.subscribe((x) => {
      if (!x) return;
      const test = Array.from(x.entries()) // Convert Map to an array
        .map(([key, value]) => {
          if (value) {
            const podI = this.podiums.findIndex((x) => x.key == key);
            if (podI != -1) {
              this.podiums[podI].value ||= {} as any;
              this.podiums[podI].value.scoring ||= {} as any;
              this.podiums[podI].value.scoring = value.scoring;
              this.podiums[podI].value.title = value.title;
              this.podiums[podI].value.photo = value.photo;
            }
          }
          return { key: key, value: value as Podium };
        }); // Convert number to string // Sort in descending order
      this.click(test);
    });
  }
  resizing = false;
  @HostListener('window:resize', ['$event'])
  sizeChange(event) {
    this.resizing = true;
  }
  /* click() {
    this.podiums = this.podiums.sort(
      (a, b) => (b.value.scoring?.points ?? 0) - (a.value.scoring?.points ?? 0)
    );
    this.items.forEach((x) => x.animateGo());
  } */
  async click(
    asd: {
      key: number;
      value: Podium;
    }[]
  ) {
    if ((this.podiums?.length ?? 0) == 0) {
      this.podiums = asd;
      this.cdr.detectChanges();
    }
    console.log(this.podiums);
    this.podiums = this.podiums
      .map((x) => {
        return {
          item: x,
          score: this.score.podiums.value.get(x.key)?.scoring?.points ?? 0,
        };
      })
      .sort((a, b) => (b.score == a.score ? 0 : b.score - a.score))
      .map((x) => x.item);

    this.cdr.detectChanges();
    await asyncDelay(100);
    //this.podiumsSub.next(this.podiums);
    this.items.forEach((x) => x.animateGo());
  }
  fullscreen() {
    if (window.Electron) {
      window.Electron.ipcRenderer.send('maximize');
    } else {
      document.documentElement.requestFullscreen();
    }
  }
  identify(index, item: Podium) {
    return item.macAddr;
  }
  ngOnDestroy() {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}
