import { Injectable } from '@angular/core';
import { bsColor } from '../../../bootstrap_plus/ts/bootstrap';
export interface ToastParams {
  delay?: number;
  color?: bsColor;
}
export interface Toast extends ToastParams {
  /* template: TemplateRef<any>; */
  header: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: Toast[] = [];

  showSimple(header: string, body: string, color?: bsColor, params?: ToastParams) {
    this.toasts.push({ header, body, color, ...params });
  }
  showDanger(header: string, body: string, err?: Error | unknown, params?: ToastParams) {
    this.showSimple(header, body, 'danger', params);
    if (err) console.error(err);
  }
  remove(toast: Toast) {
    this.toasts = this.toasts.filter((t) => t != toast);
  }
  clear() {
    this.toasts.splice(0, this.toasts.length);
  }
  showErrorOperation(err?: Error | unknown) {
    const errorMsg = err?.['message'];
    const isStr = typeof err == 'string';
    this.showDanger('Operation Failed', `${isStr ? err : Object(errorMsg).length <= 0 ? err ?? 'Unknown Error' : errorMsg}`);
    if (err) {console.error(err);}

  }
}
