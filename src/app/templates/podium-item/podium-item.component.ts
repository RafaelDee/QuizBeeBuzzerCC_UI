import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  DnrSeverity,
  LEDState,
  Podium,
  podiumStatusColor,
} from '../../values/podium.values';
import { bsColor } from '../../bootstrap_plus/ts/bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { AdvancedImgDirective } from '../../utilities/directives/advanced-img.directive';
import { FileManagerModalComponent } from '../../utilities/modal/modal-component/file-manager/file-managerModal.component';
import { ModalService } from '../../utilities/services/modal.service';
export const ordinalIndicators: { [num: number]: string } = {
  1: 'st',
  2: 'nd',
  3: 'rd',
  4: 'th',
};
const standByColorUI: `bg-${bsColor}` = 'bg-warning';
const ledStateToUI: Partial<{
  [state in LEDState]: `#${string}` | `bg-${bsColor}` | string;
}> = {
  [LEDState.OFF]: 'bg-secondary',
  [LEDState.SpotLight]: 'bg-warning',
  [LEDState.CorrectAnswer]: 'bg-success',
  [LEDState.WrongAnswer]: 'bg-danger',
  [LEDState.SuspenseAnswer]: 'moving-gradient',
  [LEDState.StandBy]: standByColorUI,
};
@Component({
  selector: 'app-podium-item',
  imports: [CommonModule, FormsModule, CdkDragHandle, AdvancedImgDirective],
  templateUrl: './podium-item.component.html',
  styleUrls: ['./podium-item.component.scss'],
})
export class PodiumItemComponent implements OnInit {
  ordinalIndicators = ordinalIndicators;
  @Input() debug: boolean = false;
  @Input() headlessMode: boolean = false;
  @Input() disableBtnSafety: boolean = true;
  @Input() editPoints: boolean = false;
  @Input() disableSpotlightBtn: boolean = false;
  @Input() allowNegativePoints: boolean = false;
  @Input() podium: Podium;
  @Input() edit: boolean = false;
  @Input() defaultTitle: string = 'PODIUM';
  @Input() index: number = 0;
  @Input() podiumPlacement: number = null;
  get podiumTitle() {
    return (this.podium?.title?.trim()?.length ?? 0) > 0
      ? this.podium?.title?.trim()
      : `${this.defaultTitle} ${this.readableIndex}`;
  }
  get podiumPlacementBase1() {
    return this.podiumPlacement + 1;
  }
  constructor(private modal: ModalService) {}
  ngOnInit(): void {
    /* const image = localStorage.getItem(this.podium.macAddr + '-img');
    console.warn(image);
    this.podium.photo = image; */
  }
  @Output() onSpotlight = new EventEmitter<void>();
  @Output() onPodiumChange = new EventEmitter<Podium>();
  @Output() onPodiumRemove = new EventEmitter<void>();
  @Output() onPointsChange = new EventEmitter<number>();
  @Output() onBtnPress = new EventEmitter<void>();
  get readableIndex() {
    return this.index + 1;
  }
  get namePlateColor() {
    const color =
      ledStateToUI[this.podium?.ledState ?? LEDState.OFF] ?? 'bg-secondary';
    return { isClass: !color.charAt(0).match('#'), color };
  }
  uploadImage() {
    const modalRef = this.modal.open(FileManagerModalComponent, {
      backdrop: 'static',
    });
    const compInstance = modalRef.componentInstance;
    compInstance.accept = 'image/*';
    compInstance.multiple = false;
    compInstance.onFileDrop.subscribe((f) => {
      const file = f[0];
      if (file == null) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener(
        'load',
        () => {
          const base64String = reader.result as string;
          // convert image file to base64 string and save to localStorage
          this.podium.photo = base64String;
          this.podiumChanged();
        },
        false
      );
      modalRef.close();
    });
  }
  pointsChange(event: Event) {
    const value = event.target['value'] ?? 0;
    this.onPointsChange.emit(+value);
  }
  titleChange(event: Event) {
    const value = event?.target?.['value'] as string;
    const title = (value.length ?? 0) <= 0 ? null : value.trim();
    this.podium.title = title;
    this.podiumChanged();
  }
  get status() {
    return {
      color: podiumStatusColor[this.podium.dnr] ?? 'danger',
      title: this.podium?.dnr ?? 'disconnected',
    };
  }
  podiumChanged() {
    this.onPodiumChange.emit(this.podium);
  }
}
