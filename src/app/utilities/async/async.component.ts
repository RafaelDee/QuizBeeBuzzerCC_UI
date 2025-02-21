import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  EmbeddedViewRef,
  Input,
  OnInit,
  TemplateRef,
  Type,
  ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncDirective } from './acync.directive';
import { LoadingViews } from './async-views';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../../templates/async/loading/loading.component';
import { EmptyContentComponent } from '../../templates/async/empty/empty/empty-content.component';
import { NotFoundComponent } from '../../pages/not-found/not-found.component';
export type asyncStatus = 'loaded' | 'loading' | 'error' | 'notFound' | 'empty';

export interface AsyncViews {
  loading?: Type<LoadingViews> | TemplateRef<LoadingViews>|asyncStatus;
  notFound?: Type<any> | TemplateRef<any>|asyncStatus;
  error?: Type<any> | TemplateRef<any>|asyncStatus;
  empty?: Type<any> | TemplateRef<any>|asyncStatus;
}

/**
 * `@Input() status` the state of the async
 *
 * `@Input() data` automatically determines state by providing an `observable` that is in these states
 *
 *  - null - Not Found
 *  - undefined - Loading
 *  - not null - Loaded
 *
 * `@Input() views` views to show when in a state
 */
@Component({
  selector: 'async',
  templateUrl: './async.component.html',
  standalone: true,

  imports: [
    CommonModule,
    LoadingComponent,
    AsyncDirective,
    EmptyContentComponent,
    NotFoundComponent,
  ],
  styleUrls: ['./async.component.scss'],
})
export class AsyncComponent implements OnInit {
  @Input() overlay: string | boolean = false;
  //set to loading to get events where theres no data yet
  _status: asyncStatus = 'loading';
  @Input() set progress(value: number) {
    console.log(value + '%');
    if (!this.componentInstance) return;
    if (this.status == 'loading') {
      (this.componentInstance as unknown as LoadingViews).percentage = value;
    }
  }
  @Input() set status(value: asyncStatus) {
    this._status = value;
    this.cdr.detectChanges()
    this.loadComponent();
  }
  get status(): asyncStatus | number {
    return this._status;
  }
  hasContent = false;
  constructor(private cdr: ChangeDetectorRef){

  }
  @Input() set data(value: Promise<any> | Observable<any>) {
    if (!value) {
      this.checkStatus(value);
      //this.status = this.edit? 'loaded': value === null?'empty':'loading';
      return;
    }
    if (value instanceof Promise) {
      value.then((value) => {
        this.checkStatus(value);
      });
    } else {
      value.subscribe((value) => {
        this.checkStatus(value);
      });
    }
  }
  /**previous status prior to editing */
  _prevStatus: asyncStatus;
  _edit: boolean = false;

  @Input() set edit(value: boolean) {
    if (value) this._prevStatus = Object(this._status);
    this._edit = value ?? false;
    this._edit ? (this.status = 'loaded') : (this.status = this._prevStatus);
  }
  get edit() {
    return this._edit;
  }
  defaultViews: AsyncViews = {
    loading: LoadingComponent,
    notFound: NotFoundComponent,
    empty: EmptyContentComponent,
  };
  /**views to show when in a state */
  @Input() views: AsyncViews = this.defaultViews;
  //defaultViews = new Map<asyncStatus,Type<any>>([['loading',LoadingComponent],['empty',EmptyContentComponent]])
  @ViewChild(AsyncDirective, { static: true }) asyncHost!: AsyncDirective;
  checkStatus(data: any) {
    //always return loaded status when editing (the doc might be new!)
    if (this.edit) {
      this.status = 'loaded';
      return;
    }
    this.status =
      data === undefined
        ? 'loading'
        : data
        ? Object.keys(data)?.length > 0 || this._edit
          ? 'loaded'
          : 'empty'
        : 'notFound';
  }
  componentLoaded = false;
  componentInstance: AsyncDirective;
  ngOnInit(): void {
    /*  */
    this.componentLoaded = true;
    this.views = { ...this.defaultViews, ...this.views };
    this.loadComponent();
  }
  loadComponent() {
    //check if the component is loaded
    if (!this.componentLoaded) return;
    console.log(`status ${this.status}`);
    const viewContainerRef = this.asyncHost.viewContainerRef;
    if (!viewContainerRef) {
      console.error('no viewcontainer found!');
      return;
    }
    viewContainerRef.clear();
    if (this.status == 'loaded') return;
    if (!this.views[this.status]) {
      console.error('no view specified to be displayed!');
      return;
    }
    let containerRef = (() => {
      if (this.views[this.status] instanceof TemplateRef) {
        return viewContainerRef.createEmbeddedView<AsyncDirective>(
          this.views[this.status]
        );
      } else if (this.views[this.status] instanceof Type) {
        return viewContainerRef.createComponent<AsyncDirective>(
          this.views[this.status]
        );
      }
      return null;
    })();
    this.componentInstance = (() => {
      if (containerRef instanceof EmbeddedViewRef) {
        return containerRef.context;
      } else if (containerRef instanceof ComponentRef) {
        return containerRef.instance;
      }
      return null;
    })();
  }
}
