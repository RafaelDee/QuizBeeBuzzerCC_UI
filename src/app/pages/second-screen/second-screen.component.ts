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
@Component({
  selector: 'app-second-screen',
  imports: [CommonModule, OrderModule, AdvancedImgDirective, AnimateDirective],
  templateUrl: './second-screen.component.html',
  styles: `
    :host {
      display: block;
      height:100vh;
    }
  .row-cols-5 > .col-sp {
    flex: 0 0 auto;
    width: 20%;
  }
  .text-shadow{
    text-shadow: 3px 1px 10px rgba(0,0,0,0.77);
  }
  `,
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
  podiumsCache: { key: number; value: Podium }[] = [];
  private resizeSubscription!: Subscription;
  constructor(public score: ScoringService, private cdr: ChangeDetectorRef) {
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(500)) // Adjust debounce time as needed
      .subscribe(() => {
        this.items.forEach((x) => x.animateGo());
        this.resizing = false;
      });
  }
  async ngOnInit(): Promise<void> {
    await this.score.init()
    if (!this.previewMode)
      document.documentElement.removeAttribute('data-bs-theme');
    this.score.podiums.subscribe((x) => {
      if (!x) return;
      this.podiumsCache = Array.from(x.entries()) // Convert Map to an array
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
      this.click();
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
  click() {
    if ((this.podiums?.length ?? 0) == 0) {
      this.podiums = this.podiumsCache;
      this.cdr.detectChanges();
    }
    this.podiums = this.podiums
      .map((x) => {
        console.log(this.score._podiums.get(x.key)?.scoring?.points);
        return {
          item: x,
          score: this.score._podiums.get(x.key)?.scoring?.points ?? 0,
        };
      })
      .sort((a, b) => (b.score == a.score ? 0 : b.score - a.score))
      .map((x) => x.item);

    console.log(this.podiums);
    this.cdr.detectChanges();
    //this.podiumsSub.next(this.podiums);
    this.items.forEach((x) => x.animateGo());
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
