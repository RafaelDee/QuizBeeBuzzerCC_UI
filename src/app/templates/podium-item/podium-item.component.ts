import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
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
export const ordinalIndicators: { [num: number]: string } = {
  1: 'st',
  2: 'nd',
  3: 'rd',
  4: 'th',
};
const standByColorUI: `bg-${bsColor}` = 'bg-warning';
const ledStateToUI: Partial<{
  [state in LEDState]: `#${string}` | `bg-${bsColor}`|string;
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
  imports: [CommonModule, FormsModule, CdkDragHandle],
  templateUrl: './podium-item.component.html',
  styleUrls: ['./podium-item.component.scss'],
})
export class PodiumItemComponent {
  ordinalIndicators = ordinalIndicators;
  @Input() debug: boolean = false;
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
  @Output() onSpotlight = new EventEmitter<void>();
  @Output() onPodiumChange = new EventEmitter<Podium>();
  @Output() onPointsChange = new EventEmitter<number>();
  get readableIndex() {
    return this.index + 1;
  }
  get namePlateColor() {
    const color =
      ledStateToUI[this.podium?.ledState ?? LEDState.OFF] ?? 'bg-secondary';
    return { isClass: !color.charAt(0).match('#'), color };
  }
  pointsChange(event: Event) {
    const value = event.target['value'] ?? 0;
    this.onPointsChange.emit(+value);
  }
  get status() {
    return {
      color: podiumStatusColor[this.podium.dnr] ?? 'danger',
      title: this.podium?.dnr ?? 'disconnected',
    };
  }
  onTitleChange() {
    this.onPodiumChange.emit(this.podium);
  }
}
