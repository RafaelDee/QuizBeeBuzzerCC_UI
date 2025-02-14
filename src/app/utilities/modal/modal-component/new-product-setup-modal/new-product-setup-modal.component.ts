import { ChangeDetectionStrategy, Component, EventEmitter, ViewChild } from '@angular/core';
import { ModalComponent, ModalService } from 'src/app/utilities/services/modal.service';
import { ButtonParams, SimpleModalFooterComponent } from '../../modal-footer/simple-modal-footer.component';
import { SimpleModalHeaderComponent } from '../../modal-header/simple-header.component';
import { FormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../../templates/form/form-field/form-field.component';
import { environment } from 'src/environments/environment.prod';
import { encodeProductPath, Tire } from 'src/values/data.model';
import { BehaviorSubject, filter, firstValueFrom, map, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AsyncComponent } from '../../../async/async.component';
import { CommonModule } from '@angular/common';
import { VarDirective } from 'src/app/utilities/directives/ngVar.directive';
import { TagsComponent } from 'src/app/templates/tags/tags.component';
import { AdvancedImgDirective } from 'src/app/utilities/directives/advanced-img.directive';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from 'src/app/utilities/services/toast.service';
import { TireSpecs } from 'src/values/tire-specs.values';
import { TireProductSpecs, TireStock } from 'src/values/data.model';
import { FormComponent } from '../../../../templates/form/form.component';
import { FilterProductMenuComponent } from '../../../../templates/filter-product-menu/filter-product-menu.component';
import { TireMasterList } from 'src/app/utilities/services/master-list-product.service';



@Component({
  selector: 'app-new-product-setup-modal',
  standalone: true,
  imports: [
    CommonModule,
    SimpleModalHeaderComponent,
    VarDirective,
    SimpleModalFooterComponent,
    FormsModule,
    FormFieldComponent,
    AdvancedImgDirective,
    AsyncComponent,
    FormComponent,
    FilterProductMenuComponent,
  ],
  templateUrl: './new-product-setup-modal.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class NewProductSetupModalComponent extends ModalComponent {
  skuId: string;
  branchId: string;
  loading = false;
  filterStr: string;
  filterCount: number = 0;
  tire: Partial<TireProductSpecs> = {};
  updateFilter() {
    console.log('updating filtrer');
    const filterArr = Object.entries(this.tire).filter(
      ([_, value]) => value !== null && value !== undefined && value !== 'null' && value !== 'undefined'
    );
    this.filterCount = filterArr?.length ?? 0;
    if (!filterArr) return;
    this.filterStr = filterArr
      .map((fa) => {
        return `${fa[0]}:'${fa[1]}'`;
      })
      .join('AND ');
    this.searchFn();
  }
  tireSpecs = TireSpecs;
  productMasterList: Observable<TireMasterList>;
  private _search: string;
  public get search(): string {
    return this._search;
  }
  public set search(value: string) {
    this._search = value;
    this.searchFn();
  }
  searchMode = false;
  prodMLSearch = new BehaviorSubject<TireMasterList>(null);
  public async searchFn() {
    console.log('FILTRED');
    const value = this.search?.toLowerCase();
    const masterList = await firstValueFrom(this.productMasterList);
    const hasText = (value?.trim()?.length ?? 0) > 0;
    const tireF = Object.fromEntries(
      Object.entries(this.tire).filter(([_, value]) => value !== null && value !== undefined && value !== 'null' && value !== 'undefined')
    );
    const hasFilter = (Object.keys(tireF)?.length ?? 0) > 0;
    this.searchMode = hasText || hasFilter;

    const test = Object.fromEntries(
      Object.entries(masterList).filter((ml) => {
        const tire = ml[1].tire;
        const includeTxt = hasText ? JSON.stringify(tire).toLowerCase().includes(value) : true;
        const inclideSpc = hasFilter
          ? (Object.entries(tireF).filter(([key, value]) => {
              return value == tire[key];
            })?.length ?? 0) >= (Object.keys(tireF)?.length ?? 0)
          : true;
        return includeTxt && inclideSpc;
      })
    );
    this.prodMLSearch.next(test);
  }
  selectedTireId: string;
  invalid = false;
  getSpecList = Tire.getSpecList;
  @ViewChild('skuField') skuField: FormFieldComponent;
  regexUid = environment.regexValidation.name;
  @ViewChild(SimpleModalFooterComponent, { static: true })
  footer: SimpleModalFooterComponent;
  @ViewChild(SimpleModalHeaderComponent, { static: true })
  header: SimpleModalHeaderComponent;
  constructor(private afs: AngularFirestore, private router: Router, private route: ActivatedRoute, private toast: ToastService) {
    super();
    this.productMasterList = afs
      .doc<TireMasterList>(environment.collectionDB.system.productMasterList)
      .valueChanges()
      .pipe(
        map((p) => {
          return p ?? {};
        })
      );
  }
  async tireSelect(tire: Tire) {
    this.loading = true;
    let docId = encodeProductPath(this.branchId, tire.sku);
    let afsDoc = this.afs.doc([environment.collectionDB.products, docId].join('/'));
    let existingDoc = await firstValueFrom(afsDoc.get({ source: 'server' }));
    if (existingDoc.exists) {
      this.toast.showSimple('Already Exists', 'Tire Already Exists, Redirecting...', 'warning');
      this.router.navigate(['inventory', existingDoc.id], { replaceUrl: true });
      this.modal.close();
      return;
    }
    const newTire = { ...(tire as TireStock), branchId: this.branchId };
    await afsDoc.set(newTire);
    this.router.navigate(['inventory', docId], { replaceUrl: true });
    this.modal.close();
  }
  static show(modal: ModalService, branchId: string) {
    return new Promise<Tire | null>((resolve, reject) => {
      const modalRef = modal.open(NewProductSetupModalComponent, { backdrop: 'static',size:'lg' });
      const comp = modalRef.componentInstance;
      comp.branchId = branchId;
      comp.header.title = 'Create Product';
      /* comp.onTireSelect.subscribe((tire) => {
        resolve(tire);
      }); */
      comp.footer.setPositiveButton('Create New', { color: 'success', dismiss: true }, async () => {
        resolve(null);
      });
      comp.footer.setNegativeButton('Close', { dismiss: true }, () => {});
      let disSub = modalRef.dismissed.subscribe(() => {
        reject('user dismissed the operation');
        disSub.unsubscribe();
      });
    });
  }
  validate() {
    try {
      this.skuId = this.skuId?.toLowerCase();
      this.skuField.validate();
    } catch (err) {
      return false;
    }
    return true;
  }
}
