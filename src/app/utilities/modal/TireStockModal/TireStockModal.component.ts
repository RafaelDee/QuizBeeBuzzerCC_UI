import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormComponent } from '../../../templates/form/form.component';
import { Constraint, DateField, InputField } from 'src/values/input-field.values';
import { FormFieldComponent } from '../../../templates/form/form-field/form-field.component';
import { Stock, TireStock } from 'src/values/data.model';
import { SimpleModalFooterComponent } from '../modal-footer/simple-modal-footer.component';
import { SimpleModalHeaderComponent } from '../modal-header/simple-header.component';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../services/modal.service';
import { dateOrTimestamptoDate } from '../../common-utils';

@Component({
  selector: 'app-tire-stock-modal',
  standalone: true,
  imports: [CommonModule, FormComponent, FormFieldComponent, SimpleModalFooterComponent, SimpleModalHeaderComponent],
  templateUrl: './TireStockModal.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TireStockModalComponent extends ModalComponent implements OnInit {
  /* @ViewChild(SimpleModalFooterComponent, { static: true })
  footer: SimpleModalFooterComponent; */
  @ViewChild(SimpleModalHeaderComponent, { static: true })
  header: SimpleModalHeaderComponent;
  tireStockForm: InputField[];
  stock: Partial<Stock> = {};
  @ViewChildren('field', { read: FormFieldComponent })
  fields: QueryList<FormFieldComponent>;
  @Output() onAddStock = new EventEmitter<Stock>();
  constructor() {
    super();
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 7);
    this.tireStockForm = [
      new DateField('date', 'Date', true, { md: 6 }, { minDate: { value: minDate }, maxDate: { value: 'now' } }),
      new InputField('quantity', 'Quantity', 'number', true, { md: 6 }, { minNumber: 1 }),
      new DateField('manufacturingDate', 'Production Date', true, { md: 6 }, { minDate: { value: minDate } }),
      new DateField('expiryDate', 'Expiry Date', true, { md: 6 }, { minDate: [{ value: 'now' }] }),
    ];
  }
  ngOnInit(): void {
    const formattedDate = new Date().toISOString().split('T')[0];
    this.setData('date', formattedDate);
  }
  public setData(id: string, value: unknown) {
    if (id == null || value == null) return;
    if (this.stock == null) this.stock = {};
    this.stock[id] = value;
  }
  public onSubmit() {
    const fields = this.fields.toArray();
    if (!fields) return;
    const expDateField = fields?.find((f) => f.inputField.id == 'expiryDate');
    if (expDateField)
      if ((expDateField.inputField as DateField).data.minDate == null) (expDateField.inputField as DateField).data.minDate = [];
    ((expDateField.inputField as DateField).data.minDate as Constraint<Date | 'now'>[]).push({
      value: dateOrTimestamptoDate(this.stock?.manufacturingDate),
      reason: 'past Prod. Date',
    });
    if (!FormFieldComponent.validateListFields(fields)) return;
    this.onAddStock?.emit(this.stock as Stock);
    this.modal.close();
  }
  onCancel() {}
}
